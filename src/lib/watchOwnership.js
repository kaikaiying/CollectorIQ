/**
 * Purchase date helpers — calendar day in local time (YYYY-MM-DD).
 */

export function todayDateInputValue() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isValidPurchaseDate(dateStr, { allowFuture = false } = {}) {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  if (start.getFullYear() !== y || start.getMonth() !== m - 1 || start.getDate() !== d) return false
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (!allowFuture && start > today) return false
  return true
}

/**
 * @returns {null | { daysOwned: number, years: number, monthsRemainder: number, purchaseFormatted: string, headline: string, subline: string, ownedBadge: string }}
 */
export function getOwnershipSummary(purchaseDateStr) {
  if (!isValidPurchaseDate(purchaseDateStr, { allowFuture: false })) return null
  const [y, m, d] = purchaseDateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const s0 = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const diffMs = t0 - s0
  const daysOwned = Math.floor(diffMs / 86400000)
  if (daysOwned < 0) return null

  let months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth())
  if (today.getDate() < start.getDate()) months -= 1
  const years = Math.floor(months / 12)
  const mo = months % 12

  const purchaseFormatted = start.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  let durationClause
  if (years >= 1) {
    durationClause =
      mo > 0
        ? `${years} year${years !== 1 ? 's' : ''} and ${mo} month${mo !== 1 ? 's' : ''}`
        : `${years} year${years !== 1 ? 's' : ''}`
  } else if (months >= 1) {
    durationClause = `${months} month${months !== 1 ? 's' : ''}`
  } else if (daysOwned === 0) {
    durationClause = null
  } else {
    durationClause = `${daysOwned} day${daysOwned !== 1 ? 's' : ''}`
  }

  let ownedBadge
  if (years >= 1) {
    ownedBadge = mo > 0 ? `${years} year${years !== 1 ? 's' : ''}, ${mo} month${mo !== 1 ? 's' : ''}` : `${years} year${years !== 1 ? 's' : ''}`
  } else if (months >= 1) {
    ownedBadge = `${months} month${months !== 1 ? 's' : ''}`
  } else if (daysOwned === 0) {
    ownedBadge = 'Since today'
  } else {
    ownedBadge = `${daysOwned} day${daysOwned !== 1 ? 's' : ''}`
  }

  const headline =
    daysOwned === 0
      ? 'You logged this purchase date for today.'
      : `${durationClause.charAt(0).toUpperCase() + durationClause.slice(1)} in your collection.`

  const subline =
    daysOwned === 0
      ? `Set to ${purchaseFormatted}. You can change it anytime.`
      : `Purchased ${purchaseFormatted}. That's ${daysOwned.toLocaleString()} day${daysOwned !== 1 ? 's' : ''} on the wrist.`

  return {
    daysOwned,
    years,
    monthsRemainder: mo,
    purchaseFormatted,
    headline,
    subline,
    ownedBadge,
  }
}
