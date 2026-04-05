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

function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  return ''
}

/** Firestore doc IDs can't contain "/" — encode for aggregate path */
function refToDocId(ref) {
  return String(ref ?? '').replace(/\//g, '__')
}

async function uploadDriftReadingViaFirestore(reference, brand, model, specMin, specMax, driftInSeconds, ts) {
  if (!db) return
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
      createdAt: ts,
    })

    const aggRef = doc(db, AGGREGATES, refToDocId(reference))
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
 * Upload one drift reading and update the per-reference aggregate.
 * Uses API for outlier removal and median when signed in; otherwise Firestore only (same as API fallback).
 * @param {{ reference: string, brand: string, model: string, specMin?: number, specMax?: number }} watch
 * @param {number} driftInSeconds
 * @param {Date} timestamp
 */
export async function uploadDriftReading(watch, driftInSeconds, timestamp) {
  if (!db) return
  const { reference, brand, model, specMin = -999, specMax = 999 } = watch
  const ts = timestamp instanceof Date ? timestamp : new Date(timestamp)

  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken()
      const base = getApiBase()
      const res = await fetch(`${base}/api/upload-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          reference,
          brand,
          model,
          specMin,
          specMax,
          driftInSeconds,
          timestamp: ts.toISOString(),
        }),
      })
      if (res.ok) return
    } catch {
      /* API unavailable, fall through to Firestore */
    }
  }

  await uploadDriftReadingViaFirestore(reference, brand, model, specMin, specMax, driftInSeconds, ts)
}

/**
 * Fetch all reference aggregates for Discovery.
 * @returns {Promise<Array<{ reference, brand, model, specLow, specHigh, readingCount, sumDrift, inSpecCount, median?, excludedCount? }>>}
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
        median: x.median ?? null,
        excludedCount: x.excludedCount ?? 0,
      }
    })
  } catch {
    return []
  }
}
