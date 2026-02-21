/**
 * Subscription status from Firestore (users/{uid}).
 * Written by Stripe webhook; read by app to gate adding watches.
 */

import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const USERS = 'users'

/**
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<{ hasActiveSubscription: boolean, status?: string }>}
 */
export async function getSubscriptionStatus(uid) {
  if (!uid || !db) return { hasActiveSubscription: false }
  try {
    const ref = doc(db, USERS, uid)
    const snap = await getDoc(ref)
    const data = snap?.data()
    const status = data?.subscriptionStatus
    const hasActiveSubscription = status === 'active' || status === 'trialing'
    return { hasActiveSubscription, status: status || null }
  } catch {
    return { hasActiveSubscription: false }
  }
}

/** First watch is free; more require subscription. */
export const FIRST_WATCH_FREE = 1
export const SUBSCRIPTION_PRICE_MONTHLY = 6.99
export const SUBSCRIPTION_CURRENCY = 'CAD'
export const SUBSCRIPTION_PRICE_DISPLAY = '$6.99 CAD/mo'
