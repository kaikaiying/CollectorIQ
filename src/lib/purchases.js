/**
 * Apple In-App Purchase (StoreKit 2) for iOS.
 * Web uses Stripe. No third-party services.
 */

import { Capacitor } from '@capacitor/core'
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases'

// Product ID from App Store Connect (e.g. collectoriq_pro_monthly)
const SUBSCRIPTION_PRODUCT_ID = 'collectoriq_pro_monthly'

export function isIAPPlatform() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

/**
 * Check if user has active subscription.
 */
export async function hasActiveEntitlement() {
  if (!isIAPPlatform()) return false
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported()
    if (!isBillingSupported) return false
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS })
    return purchases?.some((p) => p.productIdentifier === SUBSCRIPTION_PRODUCT_ID && (p.isActive ?? (p.expirationDate && new Date(p.expirationDate) > new Date())))
  } catch {
    return false
  }
}

/**
 * Purchase subscription. Returns true if successful.
 */
export async function purchaseSubscription() {
  if (!isIAPPlatform()) return false
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported()
    if (!isBillingSupported) throw new Error('Purchases not supported')
    await NativePurchases.purchaseProduct({
      productIdentifier: SUBSCRIPTION_PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
      quantity: 1,
    })
    return await hasActiveEntitlement()
  } catch (e) {
    if (e?.message?.toLowerCase().includes('cancel')) return false
    throw e
  }
}

/**
 * Restore previous purchases. Required by Apple.
 */
export async function restorePurchases() {
  if (!isIAPPlatform()) return false
  try {
    await NativePurchases.restorePurchases()
    return await hasActiveEntitlement()
  } catch {
    return false
  }
}

/**
 * Get product info for display (Apple requires dynamic prices).
 * Returns { priceString, identifier } or null if unavailable.
 */
export async function getSubscriptionProduct() {
  if (!isIAPPlatform()) return null
  try {
    const { product } = await NativePurchases.getProduct({
      productIdentifier: SUBSCRIPTION_PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
    })
    return product
  } catch {
    return null
  }
}
