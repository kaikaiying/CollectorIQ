/**
 * Cloud sync for user collection and drift readings.
 * Industry-leading: data follows the user across devices.
 */

import { auth, db } from '../firebase'
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
 * Fetch user's collection from cloud. Returns null if not found or error.
 */
export async function fetchUserCollection(uid) {
  if (!db || !uid) return null
  try {
    const ref = doc(db, USER_DATA, uid)
    const snap = await getDoc(ref)
    const data = snap?.data()
    const list = data?.collection
    return Array.isArray(list) ? list : null
  } catch {
    return null
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
 */
export async function fetchUserReadings(uid, reference) {
  if (!db || !uid || !reference) return null
  try {
    const ref = doc(db, USER_DATA, uid, READINGS, refToDocId(reference))
    const snap = await getDoc(ref)
    const data = snap?.data()
    const items = data?.items
    return Array.isArray(items) ? items : null
  } catch {
    return null
  }
}

/**
 * Fetch all user's drift readings from cloud.
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
      const items = d.data()?.items
      if (Array.isArray(items)) out[refStr] = items
    })
    return out
  } catch {
    return {}
  }
}

/**
 * Save user's drift readings for a watch to cloud.
 */
export async function saveUserReadings(uid, reference, readings) {
  if (!db || !uid || !reference || !Array.isArray(readings)) return false
  try {
    const ref = doc(db, USER_DATA, uid, READINGS, refToDocId(reference))
    const serialized = readings.map((r) => ({
      id: r.id,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
      driftInSeconds: r.driftInSeconds,
    }))
    await setDoc(ref, {
      items: serialized,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch {
    return false
  }
}

/**
 * Full sync: pull cloud data and merge with local.
 * Call on login. Cloud wins for collection; merge readings by reference.
 * If cloud has no collection but local does, caller should push local to cloud after.
 */
export async function syncFromCloud(uid, getLocalCollection, getLocalReadingsForRef, setLocalCollection, setLocalReadings) {
  if (!uid) return
  const cloudCollection = await fetchUserCollection(uid)
  const cloudReadings = await fetchAllUserReadings(uid)

  if (cloudCollection && cloudCollection.length > 0) {
    setLocalCollection(cloudCollection)
  }

  Object.entries(cloudReadings).forEach(([ref, items]) => {
    const parsed = items.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }))
    setLocalReadings(ref, parsed)
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
 * Push local readings for one watch to cloud. Call after add/delete/clear.
 */
export async function pushReadingsToCloud(reference, readings) {
  const uid = auth?.currentUser?.uid
  if (!uid) return false
  return saveUserReadings(uid, reference, readings)
}
