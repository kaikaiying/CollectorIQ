/**
 * Curated world cities with IANA time zones and map coordinates.
 * @type {{ id: string, name: string, country: string, tz: string, lat: number, lng: number }[]}
 */
export const WORLD_CLOCK_CITIES = [
  { id: 'utc', name: 'UTC / GMT', country: 'Reference', tz: 'Etc/UTC', lat: 51.4772, lng: 0.0015 },
  { id: 'london', name: 'London', country: 'UK', tz: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { id: 'paris', name: 'Paris', country: 'France', tz: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', tz: 'Europe/Berlin', lat: 52.52, lng: 13.405 },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland', tz: 'Europe/Zurich', lat: 47.3769, lng: 8.5417 },
  { id: 'dubai', name: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 },
  { id: 'mumbai', name: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', lat: 19.076, lng: 72.8777 },
  { id: 'delhi', name: 'Delhi', country: 'India', tz: 'Asia/Kolkata', lat: 28.6139, lng: 77.209 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { id: 'hong-kong', name: 'Hong Kong', country: 'Hong Kong', tz: 'Asia/Hong_Kong', lat: 22.3193, lng: 114.1694 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', tz: 'Asia/Seoul', lat: 37.5665, lng: 126.978 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland', lat: -36.8509, lng: 174.7645 },
  { id: 'los-angeles', name: 'Los Angeles', country: 'USA', tz: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437 },
  { id: 'denver', name: 'Denver', country: 'USA', tz: 'America/Denver', lat: 39.7392, lng: -104.9903 },
  { id: 'chicago', name: 'Chicago', country: 'USA', tz: 'America/Chicago', lat: 41.8781, lng: -87.6298 },
  { id: 'new-york', name: 'New York', country: 'USA', tz: 'America/New_York', lat: 40.7128, lng: -74.006 },
  { id: 'toronto', name: 'Toronto', country: 'Canada', tz: 'America/Toronto', lat: 43.6532, lng: -79.3832 },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', tz: 'America/Mexico_City', lat: 19.4326, lng: -99.1332 },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo', lat: -23.5505, lng: -46.6333 },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo', lat: 30.0444, lng: 31.2357 },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', tz: 'Africa/Johannesburg', lat: -26.2041, lng: 28.0473 },
  { id: 'moscow', name: 'Moscow', country: 'Russia', tz: 'Europe/Moscow', lat: 55.7558, lng: 37.6173 },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey', tz: 'Europe/Istanbul', lat: 41.0082, lng: 28.9784 },
  { id: 'shanghai', name: 'Shanghai', country: 'China', tz: 'Asia/Shanghai', lat: 31.2304, lng: 121.4737 },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok', lat: 13.7563, lng: 100.5018 },
  { id: 'manila', name: 'Manila', country: 'Philippines', tz: 'Asia/Manila', lat: 14.5995, lng: 120.9842 },
  { id: 'honolulu', name: 'Honolulu', country: 'USA', tz: 'Pacific/Honolulu', lat: 21.3069, lng: -157.8583 },
  { id: 'anchorage', name: 'Anchorage', country: 'USA', tz: 'America/Anchorage', lat: 61.2181, lng: -149.9003 },
  { id: 'vancouver', name: 'Vancouver', country: 'Canada', tz: 'America/Vancouver', lat: 49.2827, lng: -123.1207 },
  { id: 'madrid', name: 'Madrid', country: 'Spain', tz: 'Europe/Madrid', lat: 40.4168, lng: -3.7038 },
  { id: 'rome', name: 'Rome', country: 'Italy', tz: 'Europe/Rome', lat: 41.9028, lng: 12.4964 },
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', tz: 'Europe/Warsaw', lat: 52.2297, lng: 21.0122 },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', tz: 'Africa/Nairobi', lat: -1.2921, lng: 36.8219 },
]

/** City dots — each hue distinct on the dotted map (still restrained, not neon) */
export const MARKER_PALETTE = [
  '#334155',
  '#0f766e',
  '#1d4ed8',
  '#b45309',
  '#be123c',
  '#0369a1',
  '#7c2d12',
  '#0e7490',
  '#4d7c0f',
  '#115e59',
  '#9a3412',
  '#0f172a',
]

/** ISO offset label like GMT+1 or GMT-5 */
export function getGmtLabel(timeZone) {
  try {
    const d = new Date()
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(d)
    const name = parts.find((p) => p.type === 'timeZoneName')?.value
    if (name) return name.replace('GMT', 'GMT').replace(' ', '')
  } catch (_) {}
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    const parts = fmt.formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch (_) {
    return ''
  }
}

export function formatTimeInZone(timeZone, date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }).format(date)
}

export function getCityById(id) {
  return WORLD_CLOCK_CITIES.find((c) => c.id === id) ?? null
}
