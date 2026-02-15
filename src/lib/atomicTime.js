const WORLD_TIME_URL = 'https://worldtimeapi.org/api/timezone/Etc/UTC'

export async function fetchAtomicTime() {
  const res = await fetch(WORLD_TIME_URL)
  if (!res.ok) throw new Error('Could not fetch server time')
  const data = await res.json()
  const dateStr = data?.datetime
  if (!dateStr) throw new Error('Invalid response')
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date')
  return date
}
