const PREFIX = 'collectoriq_drift_'

export function getDriftReadings(reference) {
  try {
    const raw = localStorage.getItem(PREFIX + reference)
    if (!raw) return []
    const list = JSON.parse(raw)
    return list.map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
  } catch {
    return []
  }
}

export function saveDriftReadings(reference, readings) {
  localStorage.setItem(
    PREFIX + reference,
    JSON.stringify(readings.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() })))
  )
}

export function addDriftReading(reference, driftInSeconds, timestamp = new Date()) {
  const list = getDriftReadings(reference)
  list.push({ id: crypto.randomUUID(), timestamp, driftInSeconds })
  saveDriftReadings(reference, list)
  return list
}
