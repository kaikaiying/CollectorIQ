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

/** Preset positions for overnight storage (how the watch was left). */
export const STORAGE_POSITIONS = [
  { id: '9up', label: '9 up' },
  { id: '12up', label: '12 up' },
  { id: '3up', label: '3 up' },
  { id: '6up', label: '6 up' },
  { id: 'faceup', label: 'Face up' },
  { id: 'facedown', label: 'Face down' },
]

export function addDriftReading(reference, driftInSeconds, timestamp = new Date(), position = null) {
  const list = getDriftReadings(reference)
  list.push({ id: crypto.randomUUID(), timestamp, driftInSeconds, position: position || null })
  saveDriftReadings(reference, list)
  return list
}

export function deleteDriftReading(reference, id) {
  const list = getDriftReadings(reference).filter((r) => r.id !== id)
  saveDriftReadings(reference, list)
  return list
}

/** Clear all readings for a watch (e.g. after service/reset). */
export function clearDriftReadings(reference) {
  saveDriftReadings(reference, [])
  return []
}
