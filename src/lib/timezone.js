/**
 * User's local timezone for display and for formatting times in their location.
 */

export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

/** e.g. "GMT+1" or "EST" for display */
export function getTimezoneLabel() {
  try {
    const tz = getUserTimezone()
    if (!tz) return 'your local time'
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(new Date())
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')
    if (offsetPart?.value) return offsetPart.value
    return tz.includes('/') ? tz.split('/').pop()?.replace(/_/g, ' ') ?? tz : tz
  } catch {
    return 'your local time'
  }
}

/** Format a Date in the user's local time (already is, but with explicit timeZone for consistency) */
export function formatLocalTime(date, options = {}) {
  const tz = getUserTimezone()
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...(tz && { timeZone: tz }),
    ...options,
  })
}
