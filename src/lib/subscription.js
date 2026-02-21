/**
 * Subscription status: first watch free, more = $6.99/mo.
 * iOS: Apple IAP (StoreKit 2). Web: Stripe.
 */

import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { isIAPPlatform, hasActiveEntitlement } from './purchases'

const USERS = 'users'

/**
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<{ hasActiveSubscription: boolean, status?: string, source?: 'iap'|'stripe' }>}
 */
export async function getSubscriptionStatus(uid) {
  if (!uid) return { hasActiveSubscription: false }

  // iOS: Apple IAP takes precedence (App Store compliance)
  if (isIAPPlatform()) {
    const iapActive = await hasActiveEntitlement()
    if (iapActive) return { hasActiveSubscription: true, status: 'active', source: 'iap' }
  }

  // Web or iOS fallback: Stripe via Firestore
  if (!db) return { hasActiveSubscription: false }
  try {
    const ref = doc(db, USERS, uid)
    const snap = await getDoc(ref)
    const data = snap?.data()
    const status = data?.subscriptionStatus
    const hasActiveSubscription = status === 'active' || status === 'trialing'
    return { hasActiveSubscription, status: status || null, source: 'stripe' }
  } catch {
    return { hasActiveSubscription: false }
  }
}

/** First watch is free; more require subscription. */
export const FIRST_WATCH_FREE = 1
export const SUBSCRIPTION_PRICE_MONTHLY = 6.99
export const SUBSCRIPTION_CURRENCY = 'CAD'
export const SUBSCRIPTION_PRICE_DISPLAY = '$6.99 CAD/mo'

/** Apple/Stripe compliance: auto-renewal and cancellation terms. */
export const SUBSCRIPTION_TERMS_IAP =
  'Subscription automatically renews until cancelled. Payment charged to your Apple ID at confirmation. Cancel anytime in Settings → Apple ID → Subscriptions.'
export const SUBSCRIPTION_TERMS_STRIPE =
  'Subscription automatically renews until cancelled. Cancel anytime from Settings.'
