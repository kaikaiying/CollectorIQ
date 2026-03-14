/**
 * Upload a drift reading and recompute aggregate with outlier removal.
 * Replaces client-side direct Firestore writes for community data quality.
 *
 * Body: { reference, brand, model, specMin, specMax, driftInSeconds, timestamp }
 * Requires: Authorization: Bearer <Firebase ID token>
 */

const admin = require('firebase-admin')

const READINGS = 'readings'
const AGGREGATES = 'aggregates'

/** IQR multiplier for outlier detection. 1.5 is standard; 2.0 is more lenient */
const IQR_MULTIPLIER = 1.5

/** Min readings to apply IQR outlier removal */
const MIN_FOR_IQR = 4

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

function refToDocId(ref) {
  return String(ref ?? '').replace(/\//g, '__')
}

function percentile(sortedArr, p) {
  if (!sortedArr.length) return null
  const i = (p / 100) * (sortedArr.length - 1)
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  if (lo === hi) return sortedArr[lo]
  return sortedArr[lo] + (i - lo) * (sortedArr[hi] - sortedArr[lo])
}

function median(arr) {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Remove outliers using IQR (relative to the data, not a fixed spec).
 */
function filterOutliers(values) {
  if (values.length < MIN_FOR_IQR) return values

  const sorted = [...values].sort((a, b) => a - b)
  const q1 = percentile(sorted, 25)
  const q3 = percentile(sorted, 75)
  const iqr = q3 - q1
  const lower = q1 - IQR_MULTIPLIER * iqr
  const upper = q3 + IQR_MULTIPLIER * iqr

  return values.filter((v) => v >= lower && v <= upper)
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
    const idToken = authHeader.slice(7)

    const adminApp = getFirebaseAdmin()
    await adminApp.auth().verifyIdToken(idToken)

    const body = req.body || {}
    const { reference, brand, model, driftInSeconds, timestamp } = body
    const specMin = body.specMin ?? -999
    const specMax = body.specMax ?? 999

    if (!reference || !brand || !model || typeof driftInSeconds !== 'number') {
      return res.status(400).json({ error: 'Missing reference, brand, model, or driftInSeconds' })
    }

    const db = adminApp.firestore()

    // 1. Write the new reading (even if it might be an outlier – we filter on aggregate)
    const readingRef = db.collection(READINGS).doc()
    const ts = timestamp ? new Date(timestamp) : new Date()
    await readingRef.set({
      reference,
      brand,
      model,
      specMin,
      specMax,
      driftInSeconds,
      createdAt: ts,
    })

    // 2. Fetch all readings for this reference
    const snap = await db.collection(READINGS).where('reference', '==', reference).get()
    const allDrifts = snap.docs.map((d) => d.data().driftInSeconds)

    // 3. Apply outlier removal
    const cleaned = filterOutliers(allDrifts)
    const excludedCount = allDrifts.length - cleaned.length

    // 4. Compute stats from cleaned data
    const count = cleaned.length
    const sumDrift = cleaned.reduce((a, b) => a + b, 0)
    const med = median(cleaned)
    const inSpecCount = cleaned.filter((v) => v >= specMin && v <= specMax).length

    // 5. Update aggregate
    const aggRef = db.collection(AGGREGATES).doc(refToDocId(reference))
    await aggRef.set({
      reference,
      brand,
      model,
      specLow: specMin,
      specHigh: specMax,
      readingCount: count,
      sumDrift,
      median: med,
      inSpecCount,
      excludedCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({
      ok: true,
      readingCount: count,
      excludedCount,
      median: med,
    })
  } catch (e) {
    if (e.code === 'auth/id-token-expired' || e.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    console.error(e)
    return res.status(500).json({ error: e.message || 'Server error' })
  }
}
