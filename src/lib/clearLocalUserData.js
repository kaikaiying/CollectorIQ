/**
 * Clear all local user data (collection, drift readings, wear log, calibrations).
 * Call on sign-out so the next user never sees previous user's data.
 */

const COLLECTION_KEY = 'collectoriq_collection'
const DRIFT_PREFIX = 'collectoriq_drift_'
const RUN_PREFIX = 'collectoriq_run_'
const DIAL_CALIBRATIONS_KEY = 'collectoriq_dial_calibrations'
const WEAR_LOG_KEY = 'collectoriq_wear_log'
export const LAST_UID_KEY = 'collectoriq_last_uid'

export function clearLocalUserData() {
  try {
    localStorage.removeItem(COLLECTION_KEY)
    localStorage.removeItem(DIAL_CALIBRATIONS_KEY)
    localStorage.removeItem(WEAR_LOG_KEY)
    localStorage.removeItem(LAST_UID_KEY)
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(DRIFT_PREFIX) || key.startsWith(RUN_PREFIX)) localStorage.removeItem(key)
    })
  } catch {
    // ignore
  }
}
