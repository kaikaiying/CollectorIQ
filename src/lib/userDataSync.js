/**
 * Cloud sync for user collection and drift readings.
 * Industry-leading: data follows the user across devices.
 */

import { auth, db } from '../firebase'
import { clearLocalUserData, LAST_UID_KEY } from './clearLocalUserData'
import { setCurrentRunId, getCurrentRunId } from './driftStorage'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

const USER_DATA = 'userData'
const READINGS = 'readings'

/** Firestore doc IDs can't contain "/" — encode reference for subcollection path */
function refToDocId(reference) {
  return String(reference ?? '').replace(/\//g, '__')
}

/** Decode back to reference */
function docIdToRef(docId) {
  return String(docId ?? '').replace(/__/g, '/')
}

/**
 * Fetch user's collection from cloud.
 * @returns {{ ok: true, data: array } | { ok: false }} - ok:false means fetch failed (don't overwrite local)
 */
export async function fetchUserCollection(uid) {
  if (!db || !uid) return { ok: false }
  try {
    const ref = doc(db, USER_DATA, uid)
    const snap = await getDoc(ref)
    const data = snap?.data()
    const list = data?.collection
    return { ok: true, data: Array.isArray(list) ? list : [] }
  } catch {
    return { ok: false }
  }
}

/**
 * Save user's collection to cloud. Merges with existing (does not overwrite readings).
 */
export async function saveUserCollection(uid, watches) {
  if (!db || !uid || !Array.isArray(watches)) return false
  try {
    const ref = doc(db, USER_DATA, uid)
    await setDoc(ref, {
      collection: watches,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch {
    return false
  }
}

/**
 * Fetch user's drift readings for a watch from cloud.
 * @returns {{ items, currentRunId } | null}
 */
export async function fetchUserReadings(uid, reference) {
  if (!db || !uid || !reference) return null
  try {
    const ref = doc(db, USER_DATA, uid, READINGS, refToDocId(reference))
    const snap = await getDoc(ref)
    const data = snap?.data()
    const items = data?.items
    const currentRunId = data?.currentRunId ?? 'legacy'
    return Array.isArray(items) ? { items, currentRunId } : null
  } catch {
    return null
  }
}

/**
 * Fetch all user's drift readings from cloud.
 * @returns {{ [ref: string]: { items, currentRunId } }}
 */
export async function fetchAllUserReadings(uid) {
  if (!db || !uid) return {}
  try {
    const { getDocs } = await import('firebase/firestore')
    const ref = collection(db, USER_DATA, uid, READINGS)
    const snap = await getDocs(ref)
    const out = {}
    snap.docs.forEach((d) => {
      const refStr = docIdToRef(d.id)
      const data = d.data()
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : null)
      if (items) {
        out[refStr] = { items, currentRunId: data?.currentRunId ?? 'legacy' }
      }
    })
    return out
  } catch {
    return {}
  }
}

/**
 * Save user's drift readings for a watch to cloud.
 */
export async function saveUserReadings(uid, reference, readings, currentRunId) {
  if (!db || !uid || !reference || !Array.isArray(readings)) return false
  try {
    const ref = doc(db, USER_DATA, uid, READINGS, refToDocId(reference))
    const serialized = readings.map((r) => ({
      id: r.id,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
      driftInSeconds: r.driftInSeconds,
      runId: r.runId ?? 'legacy',
      ...(r.position ? { position: r.position } : {}),
      ...(r.winding ? { winding: r.winding } : {}),
    }))
    const runId = currentRunId ?? getCurrentRunId(reference)
    await setDoc(ref, {
      items: serialized,
      currentRunId: runId,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch {
    return false
  }
}

/**
 * Full sync: load current user's data from cloud on login.
 * Cloud is source of truth. Each user only sees their own collection + readings.
 * - Different user: clear local first, then load their cloud data
 * - Same user: load their cloud data (overwrites local)
 * - Cloud empty + local has data: push local to cloud (first-time sync)
 */
export async function syncFromCloud(uid, getLocalCollection, getLocalReadingsForRef, setLocalCollection, setLocalReadings) {
  if (!uid) return
  const lastUid = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_UID_KEY) : null
  if (lastUid && lastUid !== uid) {
    clearLocalUserData()
  }
  if (typeof localStorage !== 'undefined') localStorage.setItem(LAST_UID_KEY, uid)

  const cloudResult = await fetchUserCollection(uid)
  const cloudReadings = await fetchAllUserReadings(uid)

  if (cloudResult.ok) {
    if (cloudResult.data.length > 0) {
      setLocalCollection(cloudResult.data)
    } else {
      const local = getLocalCollection()
      if (local.length > 0) {
        await saveUserCollection(uid, local)
      } else {
        setLocalCollection([])
      }
    }
  }

  Object.entries(cloudReadings).forEach(([ref, data]) => {
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
    const currentRunId = data?.currentRunId ?? 'legacy'
    const parsed = items.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
      runId: r.runId ?? 'legacy',
    }))
    setLocalReadings(ref, parsed)
    setCurrentRunId(ref, currentRunId)
  })
}

/**
 * Push local collection to cloud. Call after any collection change.
 */
export async function pushCollectionToCloud(watches) {
  const uid = auth?.currentUser?.uid
  if (!uid) return false
  return saveUserCollection(uid, watches)
}

/**
 * Push local readings for one watch to cloud. Call after add/delete/clear/startNewRun/deleteRun.
 */
export async function pushReadingsToCloud(reference, readings) {
  const uid = auth?.currentUser?.uid
  if (!uid) return false
  return saveUserReadings(uid, reference, readings)
}
