/**
 * Clear all local user data (collection, drift readings, calibrations).
 * Call on sign-out so the next user never sees previous user's data.
 */

const COLLECTION_KEY = 'collectoriq_collection'
const DRIFT_PREFIX = 'collectoriq_drift_'
const DIAL_CALIBRATIONS_KEY = 'collectoriq_dial_calibrations'

export function clearLocalUserData() {
  try {
    localStorage.removeItem(COLLECTION_KEY)
    localStorage.removeItem(DIAL_CALIBRATIONS_KEY)
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(DRIFT_PREFIX)) localStorage.removeItem(key)
    })
  } catch {
    // ignore
  }
}
