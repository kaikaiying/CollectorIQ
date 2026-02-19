/**
 * AI ask: answer questions about the user's watch accuracy using their data.
 * POST, Authorization: Bearer <Firebase ID token>
 * Body: { message, context: { watches: [...], drift: [...] } }
 */

const admin = require('firebase-admin')

function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin env not set')
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
  return admin
}

function buildSystemPrompt(context) {
  const { watches = [], drift = [] } = context || {}
  const lines = [
    'You are a helpful assistant for Collector IQ, a watch accuracy tracking app.',
    'Users run "drift tests" (tap when their watch hits a target time); the app compares to atomic/server time and records the offset in seconds.',
    'Manufacturer specs are often in s/day (seconds per day); drift test results are in seconds at one moment.',
    'Answer only about the user\'s watches and accuracy data. Be concise. If you don\'t have relevant data, say so.',
    '',
    'User\'s watches:',
  ]
  if (watches.length === 0) {
    lines.push('- No watches in collection yet.')
  } else {
    watches.forEach((w) => {
      lines.push(`- ${w.brand} ${w.model} (ref: ${w.reference}), spec ${w.specMin} to +${w.specMax} s/day`)
    })
  }
  lines.push('')
  lines.push('Drift data (readings = drift tests):')
  if (drift.length === 0) {
    lines.push('- No drift readings yet.')
  } else {
    drift.forEach((d) => {
      const meanStr = d.mean != null ? `${d.mean >= 0 ? '+' : ''}${d.mean.toFixed(2)} s` : '—'
      lines.push(`- ${d.brand} ${d.model} (${d.reference}): n=${d.n}, mean offset ${meanStr}, ${d.inSpecPct != null ? d.inSpecPct + '% in spec' : 'no spec'}${d.communityMean != null ? `; community mean ${d.communityMean >= 0 ? '+' : ''}${d.communityMean.toFixed(2)} s` : ''}`)
    })
  }
  return lines.join('\n')
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' })

  let uid
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
    const idToken = authHeader.slice(7)
    getFirebaseAdmin()
    const decoded = await admin.auth().verifyIdToken(idToken)
    uid = decoded.uid
  } catch (e) {
    if (e.code === 'auth/id-token-expired' || e.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    throw e
  }

  const DAILY_LIMIT = 5
  const today = new Date().toISOString().slice(0, 10)
  const db = admin.firestore()
  const usageRef = db.collection('aiUsage').doc(uid)
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(usageRef)
      const data = snap.data()
      const isNewDay = !data || data.date !== today
      const count = isNewDay ? 0 : (data.count || 0)
      if (count >= DAILY_LIMIT) {
        const err = new Error('Daily limit reached')
        err.code = 'DAILY_LIMIT'
        err.remaining = 0
        throw err
      }
      tx.set(usageRef, { date: today, count: count + 1 })
    })
  } catch (e) {
    if (e.code === 'DAILY_LIMIT') {
      return res.status(429).json({ error: 'Daily limit of 5 questions reached. Try again tomorrow.', code: 'DAILY_LIMIT' })
    }
    throw e
  }

  const { message, context } = req.body || {}
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message required' })
  }

  const systemPrompt = buildSystemPrompt(context)
  const userMessage = message.trim().slice(0, 2000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenAI error', response.status, err)
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || 'No reply.'
    return res.status(200).json({ reply })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message || 'Server error' })
  }
}
