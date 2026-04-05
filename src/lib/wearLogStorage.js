const WEAR_LOG_KEY = 'collectoriq_wear_log'

export const WEAR_LOG_CHANGED_EVENT = 'collectoriq-wear-log-changed'

function parseEntries(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e) => e && typeof e.reference === 'string' && typeof e.date === 'string')
    .map((e) => ({
      id: String(e.id),
      reference: e.reference,
      date: e.date,
      note: typeof e.note === 'string' ? e.note : '',
      createdAt: typeof e.createdAt === 'number' ? e.createdAt : 0,
    }))
}

export function getWearEntries() {
  try {
    const raw = JSON.parse(localStorage.getItem(WEAR_LOG_KEY) || '[]')
    return parseEntries(raw).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.createdAt - a.createdAt
    })
  } catch {
    return []
  }
}

export function getWearEntriesForReference(reference) {
  return getWearEntries().filter((e) => e.reference === reference)
}

export function addWearEntry({ reference, date, note }) {
  if (!reference || !date) return
  const list = parseEntries(JSON.parse(localStorage.getItem(WEAR_LOG_KEY) || '[]'))
  const id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  list.push({
    id,
    reference,
    date,
    note: (note || '').trim(),
    createdAt: Date.now(),
  })
  localStorage.setItem(WEAR_LOG_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(WEAR_LOG_CHANGED_EVENT))
}

export function deleteWearEntry(id) {
  const list = parseEntries(JSON.parse(localStorage.getItem(WEAR_LOG_KEY) || '[]'))
  const next = list.filter((e) => e.id !== id)
  localStorage.setItem(WEAR_LOG_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(WEAR_LOG_CHANGED_EVENT))
}

export function formatWearDayHeading(dateKey) {
  const [y, m, day] = String(dateKey).split('-').map(Number)
  if (!y || !m || !day) return dateKey
  return new Date(y, m - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Group sorted entries by YYYY-MM-DD (newest days first). */
export function groupEntriesByDay(entries) {
  const map = new Map()
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date).push(e)
  }
  return Array.from(map.entries()).sort((a, b)=> b[0].localeCompare(a[0]))
}
