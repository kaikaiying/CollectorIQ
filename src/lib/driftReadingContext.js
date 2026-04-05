/**
 * Optional context captured when logging a drift tap — timing position + winding state.
 */

export const DRIFT_POSITION_OPTIONS = [
  { value: 'dial-up', label: 'Face up' },
  { value: 'dial-down', label: 'Face down' },
  { value: '12-up', label: '12 up' },
  { value: '3-up', label: '3 up' },
  { value: '6-up', label: '6 up' },
  { value: '9-up', label: '9 up' },
]

export const DRIFT_WINDING_OPTIONS = [
  { value: 'fully-wound', label: 'Fully wound' },
  { value: 'overnight-rest', label: 'After overnight rest' },
  { value: 'worn-all-day', label: 'Worn all day' },
  { value: 'just-wound', label: 'Just wound' },
  { value: 'low-power', label: 'Low / unwound' },
]

const posMap = Object.fromEntries(DRIFT_POSITION_OPTIONS.map((o) => [o.value, o.label]))
const winMap = Object.fromEntries(DRIFT_WINDING_OPTIONS.map((o) => [o.value, o.label]))

export function labelDriftPosition(value) {
  if (!value || typeof value !== 'string') return ''
  return posMap[value] || value
}

export function labelDriftWinding(value) {
  if (!value || typeof value !== 'string') return ''
  return winMap[value] || value
}

export function formatDriftReadingContext(reading) {
  if (!reading) return ''
  const parts = []
  const p = labelDriftPosition(reading.position)
  const w = labelDriftWinding(reading.winding)
  if (p) parts.push(p)
  if (w) parts.push(w)
  return parts.join(' · ')
}
