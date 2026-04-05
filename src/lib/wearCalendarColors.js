/**
 * Watch colors for wear dots — same palette & order idea as Clock / world map (MARKER_PALETTE).
 * Index follows collection array order (first watch = first map color).
 */
import { MARKER_PALETTE } from '../data/worldClockCities'

export { MARKER_PALETTE }

export function watchRefsInCollectionOrder(watches) {
  if (!Array.isArray(watches)) return []
  return watches.map((w) => w.reference).filter(Boolean)
}

/** Stable color for a reference; `watches` should be full collection in display order. */
export function colorForWatchReference(reference, watches) {
  const refs = watchRefsInCollectionOrder(watches)
  const idx = refs.indexOf(reference)
  if (idx >= 0) return MARKER_PALETTE[idx % MARKER_PALETTE.length]
  let h = 0
  for (let i = 0; i < String(reference).length; i++) {
    h = (h << 5) - h + String(reference).charCodeAt(i)
    h |= 0
  }
  return MARKER_PALETTE[Math.abs(h) % MARKER_PALETTE.length]
}
