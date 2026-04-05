const PREFIX = 'collectoriq_drift_'
const RUN_PREFIX = 'collectoriq_run_'
const LEGACY_RUN = 'legacy'

export function getDriftReadings(reference) {
  try {
    const raw = localStorage.getItem(PREFIX + reference)
    if (!raw) return []
    const list = JSON.parse(raw)
    return list.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
      runId: r.runId ?? LEGACY_RUN,
    }))
  } catch {
    return []
  }
}

export function saveDriftReadings(reference, readings) {
  localStorage.setItem(
    PREFIX + reference,
    JSON.stringify(readings.map((r) => ({
      ...r,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
      runId: r.runId ?? LEGACY_RUN,
    })))
  )
}

export function getCurrentRunId(reference) {
  try {
    const v = localStorage.getItem(RUN_PREFIX + reference)
    return v || LEGACY_RUN
  } catch {
    return LEGACY_RUN
  }
}

export function setCurrentRunId(reference, runId) {
  localStorage.setItem(RUN_PREFIX + reference, runId)
}

/** Start a new timing run. Keeps all previous readings; new readings go to the new run. */
export function startNewRun(reference) {
  const runId = new Date().toISOString()
  setCurrentRunId(reference, runId)
  return runId
}

/** Get readings grouped by run for display. Returns [{ runId, label, readings }] newest first. */
export function getReadingsGroupedByRun(reference) {
  const all = getDriftReadings(reference)
  const byRun = new Map()
  for (const r of all) {
    const rid = r.runId ?? LEGACY_RUN
    if (!byRun.has(rid)) byRun.set(rid, [])
    byRun.get(rid).push(r)
  }
  const current = getCurrentRunId(reference)
  return Array.from(byRun.entries())
    .map(([runId, readings]) => {
      const sorted = [...readings].sort((a, b) => b.timestamp - a.timestamp)
      const first = sorted[sorted.length - 1]?.timestamp
      const last = sorted[0]?.timestamp
      const fmt = (d) => d?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      const dateRange = first && last ? `${fmt(first)} – ${fmt(last)}` : fmt(first ?? last) ?? '—'
      const label = runId === current ? 'Current run' : `Run (${dateRange})`
      return { runId, label, readings: sorted }
    })
    .sort((a, b) => (b.readings[0]?.timestamp ?? 0) - (a.readings[0]?.timestamp ?? 0))
}

/** Delete all readings in a run. */
export function deleteRun(reference, runId) {
  const list = getDriftReadings(reference).filter((r) => r.runId !== runId)
  saveDriftReadings(reference, list)
  if (getCurrentRunId(reference) === runId && list.length > 0) {
    const mostRecent = [...list].sort((a, b) => b.timestamp - a.timestamp)[0]
    if (mostRecent) setCurrentRunId(reference, mostRecent.runId ?? LEGACY_RUN)
  } else if (getCurrentRunId(reference) === runId) {
    setCurrentRunId(reference, LEGACY_RUN)
  }
  return list
}

export function addDriftReading(reference, driftInSeconds, timestamp = new Date(), meta = {}) {
  const list = getDriftReadings(reference)
  const runId = getCurrentRunId(reference)
  const row = { id: crypto.randomUUID(), timestamp, driftInSeconds, runId }
  const pos = typeof meta.position === 'string' ? meta.position.trim() : ''
  const win = typeof meta.winding === 'string' ? meta.winding.trim() : ''
  if (pos) row.position = pos
  if (win) row.winding = win
  list.push(row)
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
  try {
    localStorage.removeItem(RUN_PREFIX + reference)
  } catch {}
  return []
}
