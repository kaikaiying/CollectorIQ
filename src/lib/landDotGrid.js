import * as topojson from 'topojson-client'
import { geoContains } from 'd3-geo'
import landTopology from 'world-atlas/land-110m.json'

/** Bump when lat bounds / sampling changes so HMR does not reuse a stale grid. */
const GRID_REV = 2

let cacheKey = null
let cachedDots = null

/**
 * Build { cx, cy } in SVG space 0..360 x 0..180 (same as lng+180, 90-lat).
 * Dots only on land — continent silhouettes like a stylized dotted map.
 * ~3.05 keeps shapes readable as Earth; larger = sparser but easier to lose coastlines.
 */
export function getLandDotPositions(step = 3.05) {
  const key = `${GRID_REV}:${step}`
  if (cacheKey === key && cachedDots) return cachedDots
  const landFeature = topojson.feature(landTopology, landTopology.objects.land)
  const dots = []
  for (let lat = -85; lat <= 85; lat += step) {
    for (let lng = -180; lng < 180 - 0.001; lng += step) {
      if (geoContains(landFeature, [lng, lat])) {
        dots.push({ cx: lng + 180, cy: 90 - lat })
      }
    }
  }
  cachedDots = dots
  cacheKey = key
  return cachedDots
}
