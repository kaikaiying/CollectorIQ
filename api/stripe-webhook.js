/**
 * Stripe webhook: updates Firestore users/{uid} when subscription is created/updated/deleted.
 * Configure in Stripe Dashboard: Webhooks → Add endpoint → this URL, events:
 *   checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 */

const Stripe = require('stripe')
const admin = require('firebase-admin')

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

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

const config = {
  api: {
    bodyParser: false,
  },
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !sig) {
    console.error('Missing STRIPE_WEBHOOK_SECRET or signature')
    return res.status(400).end()
  }

  let event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (e) {
    console.error('Webhook signature verification failed:', e.message)
    return res.status(400).end()
  }

  const adminApp = getFirebaseAdmin()
  const db = adminApp.firestore()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const uid = session.client_reference_id || session.subscription_data?.metadata?.uid
      if (!uid) {
        console.error('No uid in checkout.session.completed')
        return res.status(200).end()
      }
      await db.collection('users').doc(uid).set({
        subscriptionStatus: 'active',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const status = (sub.status === 'active' || sub.status === 'trialing') ? 'active' : (sub.status === 'past_due' ? 'past_due' : 'canceled')
      const uid = sub.metadata?.uid
      if (!uid) {
        console.error('No uid in subscription metadata', sub.id)
        return res.status(200).end()
      }
      await db.collection('users').doc(uid).set({
        subscriptionStatus: status,
        stripeSubscriptionId: sub.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    }
    return res.status(200).end()
  } catch (e) {
    console.error('Webhook handler error:', e)
    return res.status(500).end()
  }
}

module.exports.config = config
