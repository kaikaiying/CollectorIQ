const SOURCES = [
  { url: 'https://worldtimeapi.org/api/timezone/Etc/UTC', getDate: (d) => d?.datetime || d?.utc_datetime },
  { url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC', getDate: (d) => d?.dateTime },
]

/** Ensure server datetime is parsed as UTC (APIs often omit 'Z') */
function parseAsUTC(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null
  const hasOffset = /Z$|[-+]\d{2}:?\d{2}$/.test(trimmed)
  const toParse = hasOffset ? trimmed : trimmed.replace(/\.\d+$/, '') + 'Z'
  const date = new Date(toParse)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseResponse(data, getDate) {
  const dateStr = getDate(data)
  return parseAsUTC(dateStr)
}

export async function fetchAtomicTime() {
  let lastError
  for (const { url, getDate } of SOURCES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.text()
      let data = {}
      try {
        data = raw.startsWith('{') ? JSON.parse(raw) : {}
      } catch (_) {}
      const date = parseResponse(data, getDate)
      if (date) return date
      throw new Error('Invalid response')
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error('Could not fetch server time')
}

/**
 * Try to get server time; if all sources fail, return device time so the tap still works.
 * @returns {{ date: Date, fromServer: boolean }}
 */
export async function fetchAtomicTimeOrDevice() {
  let lastError
  for (const { url, getDate } of SOURCES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.text()
      let data = {}
      try {
        data = raw.startsWith('{') ? JSON.parse(raw) : {}
      } catch (_) {}
      const date = parseResponse(data, getDate)
      if (date) return { date, fromServer: true }
      throw new Error('Invalid response')
    } catch (err) {
      lastError = err
    }
  }
  return { date: new Date(), fromServer: false }
}
