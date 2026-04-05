/**
 * Export drift readings to Excel (.xlsx)
 * Report types: full (all readings), summary (by watch), minimal
 */

import * as XLSX from 'xlsx'
import { getCollection } from '../App'
import { getDriftReadings } from './driftStorage'
import { getWearEntries } from './wearLogStorage'
import { labelDriftPosition, labelDriftWinding } from './driftReadingContext'

function stdDev(values) {
  if (values.length < 2) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sq = values.reduce((s, v) => s + (v - mean) ** 2, 0)
  return Math.sqrt(sq / (values.length - 1))
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function formatTime(d) {
  return d.toTimeString().slice(0, 8)
}

/**
 * Build rows for Full report: each reading as a row
 */
function buildFullReport(watches) {
  const rows = [['Brand', 'Model', 'Reference', 'Date', 'Time', 'Drift (s)', 'Position', 'Winding', 'Spec Min', 'Spec Max', 'In Spec']]
  for (const w of watches) {
    const readings = getDriftReadings(w.reference).sort((a, b) => a.timestamp - b.timestamp)
    const specMin = w.specMin ?? ''
    const specMax = w.specMax ?? ''
    for (const r of readings) {
      const inSpec = w.specMin != null && w.specMax != null
        ? (r.driftInSeconds >= w.specMin && r.driftInSeconds <= w.specMax ? 'Yes' : 'No')
        : ''
      rows.push([
        w.brand,
        w.model,
        w.reference,
        formatDate(r.timestamp),
        formatTime(r.timestamp),
        r.driftInSeconds,
        labelDriftPosition(r.position),
        labelDriftWinding(r.winding),
        specMin,
        specMax,
        inSpec,
      ])
    }
  }
  return rows
}

/**
 * Build rows for Summary report: one row per watch
 */
function buildSummaryReport(watches) {
  const rows = [['Brand', 'Model', 'Reference', 'Readings', 'Mean Drift (s)', 'Std Dev (s)', 'Min (s)', 'Max (s)', 'Spec Min', 'Spec Max', 'In Spec Count']]
  for (const w of watches) {
    const readings = getDriftReadings(w.reference)
    const drifts = readings.map((r) => r.driftInSeconds)
    const n = drifts.length
    if (n === 0) {
      rows.push([w.brand, w.model, w.reference, 0, '', '', '', '', w.specMin ?? '', w.specMax ?? '', 0])
      continue
    }
    const mean = drifts.reduce((a, b) => a + b, 0) / n
    const std = stdDev(drifts)
    const min = Math.min(...drifts)
    const max = Math.max(...drifts)
    const specMin = w.specMin ?? ''
    const specMax = w.specMax ?? ''
    const inSpecCount = w.specMin != null && w.specMax != null
      ? readings.filter((r) => r.driftInSeconds >= w.specMin && r.driftInSeconds <= w.specMax).length
      : ''
    rows.push([
      w.brand,
      w.model,
      w.reference,
      n,
      Math.round(mean * 100) / 100,
      std != null ? Math.round(std * 100) / 100 : '',
      min,
      max,
      specMin,
      specMax,
      inSpecCount,
    ])
  }
  return rows
}

/**
 * Build rows for Minimal report: Date, Time, Model, Drift
 */
function buildMinimalReport(watches) {
  const rows = [['Date', 'Time', 'Brand', 'Model', 'Drift (s)']]
  const all = []
  for (const w of watches) {
    const readings = getDriftReadings(w.reference)
    for (const r of readings) all.push({ ...r, watch: w })
  }
  all.sort((a, b) => a.timestamp - b.timestamp)
  for (const r of all) {
    rows.push([
      formatDate(r.timestamp),
      formatTime(r.timestamp),
      r.watch.brand,
      r.watch.model,
      r.driftInSeconds,
    ])
  }
  return rows
}

function sortWearEntriesDesc(a, b) {
  if (a.date !== b.date) return b.date.localeCompare(a.date)
  return b.createdAt - a.createdAt
}

/**
 * Wear rows for watches currently in the collection only (one combined list).
 */
function buildWearDetailRowsForCollection(watches) {
  const rows = [['Brand', 'Model', 'Reference', 'Serial', 'Purchase date', 'Wear date', 'Note']]
  if (watches.length === 0) return rows
  const byRef = new Map(watches.map((w) => [w.reference, w]))
  const refs = new Set(watches.map((w) => w.reference))
  const entries = getWearEntries().filter((e) => refs.has(e.reference)).sort(sortWearEntriesDesc)
  for (const e of entries) {
    const w = byRef.get(e.reference)
    if (!w) continue
    rows.push([
      w.brand,
      w.model,
      e.reference,
      w.serialNumber ?? '',
      w.purchaseDate ?? '',
      e.date,
      e.note ?? '',
    ])
  }
  return rows
}

/** One row per collection watch with how many wear rows appear in the export. */
function buildWearOverviewRows(watches, collectionEntries) {
  const rows = [['Brand', 'Model', 'Reference', 'Wear rows in export']]
  const countByRef = new Map(watches.map((w) => [w.reference, 0]))
  for (const e of collectionEntries) {
    countByRef.set(e.reference, (countByRef.get(e.reference) ?? 0) + 1)
  }
  for (const w of watches) {
    rows.push([w.brand, w.model, w.reference, countByRef.get(w.reference) ?? 0])
  }
  return rows
}

const REPORT_BUILDERS = {
  full: { build: buildFullReport, name: 'Full (all readings)', sheet: 'Readings' },
  summary: { build: buildSummaryReport, name: 'Summary (by watch)', sheet: 'Summary' },
  minimal: { build: buildMinimalReport, name: 'Minimal (date, time, model, drift)', sheet: 'Readings' },
  wear: { build: buildWearDetailRowsForCollection, name: 'Wear log (whole collection)', sheet: 'Wear log' },
}

/**
 * Export to Excel
 * @param {('full'|'summary'|'minimal'|'wear')} reportType
 */
export function exportToExcel(reportType) {
  const watches = getCollection()

  if (reportType === 'wear') {
    if (watches.length === 0) return false
    const refs = new Set(watches.map((w) => w.reference))
    const collectionEntries = getWearEntries().filter((e) => refs.has(e.reference))
    const detail = buildWearDetailRowsForCollection(watches)
    const overview = buildWearOverviewRows(watches, collectionEntries)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detail), 'Wear log')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), 'By watch')
    const filename = `WatchCollector_wear_${formatDate(new Date())}.xlsx`
    XLSX.writeFile(wb, filename)
    return true
  }

  const config = REPORT_BUILDERS[reportType]
  if (!config) return
  const rows = config.build(watches)
  if (rows.length <= 1) {
    return false
  }
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, config.sheet)
  const filename = `WatchCollector_${reportType}_${formatDate(new Date())}.xlsx`
  XLSX.writeFile(wb, filename)
  return true
}

export { REPORT_BUILDERS }
