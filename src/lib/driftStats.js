/**
 * Spec compliance is based on rate (s/day), not raw drift (seconds).
 * Manufacturer specs are in s/day; we compare the rate between consecutive readings.
 */

/** Get rates (s/day) for each consecutive pair. Readings sorted oldest-first. */
export function getRates(readings) {
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
  const rates = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const dt = (sorted[i + 1].timestamp - sorted[i].timestamp) / (1000 * 60 * 60 * 24)
    if (dt > 0) rates.push((sorted[i + 1].driftInSeconds - sorted[i].driftInSeconds) / dt)
  }
  return rates
}

/** Get the most recent N rate intervals. Pass readings sorted newest-first. */
export function getRecentRates(readingsNewestFirst, n = 3) {
  const rev = [...readingsNewestFirst].reverse()
  return getRates(rev).slice(-n)
}

export function rateBasedInSpecCount(readings, specMin, specMax) {
  if (!readings || readings.length < 2) return { inSpecCount: 0, rateIntervalCount: 0 }
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
  let inSpecCount = 0
  let rateIntervalCount = 0
  const min = specMin ?? -999
  const max = specMax ?? 999
  for (let i = 0; i < sorted.length - 1; i++) {
    const dt = (sorted[i + 1].timestamp - sorted[i].timestamp) / (1000 * 60 * 60 * 24)
    if (dt > 0) {
      const rate = (sorted[i + 1].driftInSeconds - sorted[i].driftInSeconds) / dt
      rateIntervalCount++
      if (rate >= min && rate <= max) inSpecCount++
    }
  }
  return { inSpecCount, rateIntervalCount }
}
