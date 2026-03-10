/**
 * Dial calibration storage – per watch model (brand|model).
 * Each user contributes up to 5 calibrations, 1 per day.
 * Data can be aggregated across users for the same model.
 */

const STORAGE_KEY = 'collectoriq_dial_calibrations'
const MAX_PER_MODEL = 5
const MIN_HOURS_BETWEEN = 24

function modelKey(brand, model) {
  return `${String(brand || '').trim().toLowerCase()}|${String(model || '').trim().toLowerCase()}`
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Get calibrations for a watch model. */
export function getCalibrations(brand, model) {
  const key = modelKey(brand, model)
  const all = loadAll()
  return all[key] ?? []
}

/** Check if user can add another calibration (rate limit + max). */
export function canAddCalibration(brand, model) {
  const list = getCalibrations(brand, model)
  if (list.length >= MAX_PER_MODEL) return { ok: false, reason: 'max', count: list.length, max: MAX_PER_MODEL }
  const now = Date.now()
  const last = list.length > 0 ? Math.max(...list.map((c) => c.timestamp)) : 0
  const hoursSince = (now - last) / (1000 * 60 * 60)
  if (hoursSince < MIN_HOURS_BETWEEN) {
    const nextIn = Math.ceil((MIN_HOURS_BETWEEN - hoursSince) * 60)
    return { ok: false, reason: 'rate', count: list.length, max: MAX_PER_MODEL, nextInMinutes: nextIn }
  }
  return { ok: true, count: list.length, max: MAX_PER_MODEL }
}

/** Save a calibration. Returns false if rate limit or max hit. */
export function saveCalibration(brand, model, calibration) {
  const check = canAddCalibration(brand, model)
  if (!check.ok) return false
  const key = modelKey(brand, model)
  const all = loadAll()
  const list = all[key] ?? []
  list.push({
    center: calibration.center,
    hour: calibration.hour,
    minute: calibration.minute,
    second: calibration.second,
    timestamp: Date.now(),
  })
  all[key] = list
  saveAll(all)
  return true
}

/** Get aggregated model for a watch (average of all calibrations). For future auto-detect. */
export function getAggregatedModel(brand, model) {
  const list = getCalibrations(brand, model)
  if (list.length === 0) return null
  const n = list.length
  const avg = (key) => {
    const pts = list.map((c) => c[key])
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / n,
      y: pts.reduce((s, p) => s + p.y, 0) / n,
    }
  }
  return {
    center: avg('center'),
    hour: avg('hour'),
    minute: avg('minute'),
    second: avg('second'),
    sampleCount: n,
  }
}
