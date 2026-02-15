import { auth, db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'

const READINGS = 'readings'
const AGGREGATES = 'aggregates'

/**
 * Upload one drift reading and update the per-reference aggregate.
 * @param {{ reference: string, brand: string, model: string, specMin?: number, specMax?: number }} watch
 * @param {number} driftInSeconds
 * @param {Date} timestamp
 */
export async function uploadDriftReading(watch, driftInSeconds, timestamp) {
  if (!db || !auth?.currentUser) return
  const { reference, brand, model, specMin = -999, specMax = 999 } = watch
  const inSpec = driftInSeconds >= specMin && driftInSeconds <= specMax

  await runTransaction(db, async (tx) => {
    const readingRef = doc(collection(db, READINGS))
    tx.set(readingRef, {
      reference,
      brand,
      model,
      specMin,
      specMax,
      driftInSeconds,
      createdAt: timestamp instanceof Date ? timestamp : new Date(timestamp),
    })

    const aggRef = doc(db, AGGREGATES, reference)
    const aggSnap = await tx.get(aggRef)
    const prev = aggSnap.exists() ? aggSnap.data() : null
    const count = (prev?.readingCount ?? 0) + 1
    const sumDrift = (prev?.sumDrift ?? 0) + driftInSeconds
    const inSpecCount = (prev?.inSpecCount ?? 0) + (inSpec ? 1 : 0)

    tx.set(aggRef, {
      reference,
      brand,
      model,
      specLow: specMin,
      specHigh: specMax,
      readingCount: count,
      sumDrift,
      inSpecCount,
      updatedAt: serverTimestamp(),
    })
  })
}

/**
 * Fetch all reference aggregates for Discovery.
 * @returns {Promise<Array<{ reference: string, brand: string, model: string, specLow: number, specHigh: number, readingCount: number, sumDrift: number, inSpecCount: number }>>}
 */
export async function fetchAggregates() {
  if (!db) return []
  try {
    const snap = await getDocs(collection(db, AGGREGATES))
    return snap.docs.map((d) => {
    const x = d.data()
    return {
      reference: x.reference ?? d.id,
      brand: x.brand ?? '',
      model: x.model ?? '',
      specLow: x.specLow ?? -999,
      specHigh: x.specHigh ?? 999,
      readingCount: x.readingCount ?? 0,
      sumDrift: x.sumDrift ?? 0,
      inSpecCount: x.inSpecCount ?? 0,
    }
  })
  } catch {
    return []
  }
}
