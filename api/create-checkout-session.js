/**
 * Creates a Stripe Checkout session for subscription ($6.99 CAD/mo).
 * Requires: Authorization: Bearer <Firebase ID token>
 * Body: { successUrl, cancelUrl }
 */

const Stripe = require('stripe')
const admin = require('firebase-admin')

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin env (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) not set')
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
    const decoded = await adminApp.auth().verifyIdToken(idToken)
    const uid = decoded.uid
    const email = decoded.email || undefined

    const { successUrl, cancelUrl } = req.body || {}
    if (!successUrl || !cancelUrl) return res.status(400).json({ error: 'successUrl and cancelUrl required' })

    const stripe = getStripe()
    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) return res.status(500).json({ error: 'STRIPE_PRICE_ID not set' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: uid,
      customer_email: email,
      subscription_data: { metadata: { uid } },
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    if (e.code === 'auth/id-token-expired' || e.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    console.error(e)
    return res.status(500).json({ error: e.message || 'Server error' })
  }
}
