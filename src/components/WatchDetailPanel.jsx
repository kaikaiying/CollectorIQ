import { useState, useEffect, useMemo } from 'react'
import { getCollection, SYNC_COMPLETE_EVENT, updateWatchFields } from '../App'
import { getDriftReadings, deleteDriftReading, clearDriftReadings, startNewRun, deleteRun, getReadingsGroupedByRun } from '../lib/driftStorage'
import { pushReadingsToCloud } from '../lib/userDataSync'
import { getOfficialServiceUrl } from '../lib/serviceCenters'
import { rateBasedInSpecCount, getRecentRates, getReadingsWithRates, getRates } from '../lib/driftStats'
import InfoTip from './InfoTip'
import {
  SpecComplianceVisual,
  OwnershipFieldsVisual,
  RunsHistoryVisual,
  WearJournalVisual,
  ConsiderServiceVisual,
  DriftSummaryOffsetVisual,
  ServiceCareLinkVisual,
  MovementDetailsCardVisual,
  NewMeasurementRunCardVisual,
  WatchTabContextVisual,
} from './InfoTipFigures'
import DateField from './DateField'
import WearRollingCalendar from './WearRollingCalendar'
import {
  getWearEntriesForReference,
  WEAR_LOG_CHANGED_EVENT,
  addWearEntry,
  deleteWearEntry,
  groupEntriesByDay,
  formatWearDayHeading,
} from '../lib/wearLogStorage'
import { NOTES_MAX } from '../lib/watchSpecSchema'
import { formatDriftReadingContext } from '../lib/driftReadingContext'
import { getOwnershipSummary, todayDateInputValue, isValidPurchaseDate } from '../lib/watchOwnership'

/** @typedef {'watch' | 'readings' | 'wear' | 'driftFollow'} WatchDetailSection */

/**
 * Per-section content for the selected watch on Collection (tabbed with Drift).
 */
export default function WatchDetailPanel({ reference, section = 'watch' }) {
  const [watch, setWatch] = useState(null)
  const [readings, setReadings] = useState([])
  const [wearTick, setWearTick] = useState(0)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [deleteRunConfirm, setDeleteRunConfirm] = useState(null)
  const [purchaseDraft, setPurchaseDraft] = useState('')
  const [serialDraft, setSerialDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [wearDate, setWearDate] = useState(() => todayDateInputValue())
  const [wearNote, setWearNote] = useState('')
  const [ownershipErr, setOwnershipErr] = useState(null)

  const handleStartNewRun = () => {
    startNewRun(reference)
    setReadings(getDriftReadings(reference))
    pushReadingsToCloud(reference, getDriftReadings(reference)).catch(() => {})
    window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT))
  }

  const handleDeleteRun = (runId) => {
    if (deleteRunConfirm !== runId) {
      setDeleteRunConfirm(runId)
      return
    }
    const updated = deleteRun(reference, runId)
    setReadings(updated)
    pushReadingsToCloud(reference, updated).catch(() => {})
    setDeleteRunConfirm(null)
    window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT))
  }

  const handleClearAll = () => {
    if (!clearConfirm) {
      setClearConfirm(true)
      return
    }
    clearDriftReadings(reference)
    setReadings([])
    pushReadingsToCloud(reference, []).catch(() => {})
    setClearConfirm(false)
  }

  useEffect(() => {
    const refresh = () => {
      const list = getCollection()
      const w = list.find((x) => x.reference === reference)
      setWatch(w || null)
      if (reference) setReadings(getDriftReadings(reference))
    }
    refresh()
    window.addEventListener(SYNC_COMPLETE_EVENT, refresh)
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, refresh)
  }, [reference])

  useEffect(() => {
    const onWear = () => setWearTick((t) => t + 1)
    window.addEventListener(WEAR_LOG_CHANGED_EVENT, onWear)
    return () => window.removeEventListener(WEAR_LOG_CHANGED_EVENT, onWear)
  }, [])

  useEffect(() => {
    if (!watch) return
    setPurchaseDraft(watch.purchaseDate || '')
    setSerialDraft(watch.serialNumber || '')
    setNotesDraft(watch.notes || '')
    setOwnershipErr(null)
  }, [watch])

  useEffect(() => {
    setWearDate(todayDateInputValue())
    setWearNote('')
  }, [reference])

  const wearEntriesAll = useMemo(
    () => (reference ? getWearEntriesForReference(reference) : []),
    [reference, wearTick]
  )
  const wearGrouped = useMemo(() => groupEntriesByDay(wearEntriesAll), [wearEntriesAll])
  const collectionForWearColors = useMemo(() => getCollection(), [watch, wearTick])

  if (!reference || !watch) {
    return null
  }

  const min = watch.specMin ?? -999
  const max = watch.specMax ?? 999
  const { inSpecCount, rateIntervalCount } = rateBasedInSpecCount(readings, min, max)
  const inSpec = inSpecCount
  const outSpec = rateIntervalCount - inSpecCount
  const avg = readings.length ? readings.reduce((a, r) => a + r.driftInSeconds, 0) / readings.length : null
  const sorted = [...readings].sort((a, b) => b.timestamp - a.timestamp)
  const runs = getReadingsGroupedByRun(reference)
  const recentRates = getRecentRates(sorted)
  const recentOut = recentRates.filter((r) => r < min || r > max).length
  const suggestService = (watch.specMin != null || watch.specMax != null) && readings.length >= 2 && recentRates.length >= 2 && recentOut >= 2
  const serviceUrl = getOfficialServiceUrl(watch.brand)

  const sectionTag =
    section === 'watch'
      ? 'Ownership & details'
      : section === 'readings'
        ? 'Drift readings'
        : 'Wear journal'

  const headerStrip = (
    <div className="watch-detail-strip card card--compact" style={{ marginBottom: '0.75rem' }}>
      <div className="collection-panel-heading" style={{ marginBottom: '0.35rem' }}>
        <div className="collection-panel-heading__main">
          <h2 className="collection-panel-title" style={{ fontSize: '1.05rem', margin: 0 }}>{watch.model}</h2>
          <span className="collection-panel-tag">{sectionTag}</span>
        </div>
        <InfoTip label="This header">
          <p>
            Everything on this tab is for <strong>this</strong> model and reference — the same watch as the colored row you selected above.
          </p>
          <WatchTabContextVisual />
        </InfoTip>
      </div>
      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14, lineHeight: 1.4 }}>
        {watch.brand} · Ref: {watch.reference}
        {watch.serialNumber ? <> · S/N: {watch.serialNumber}</> : null}
        {watch.isCustom && <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>(custom)</span>}
      </p>
    </div>
  )

  const driftFollowCards = (
    <>
      {suggestService && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: '1rem' }}>
          <div className="label-with-info" style={{ alignItems: 'center', marginBottom: '0.25rem' }}>
            <strong style={{ color: '#f59e0b', margin: 0 }}>Consider service</strong>
            <InfoTip label="Why you might see this">
              <p>
                Based on recent <strong>rate</strong> intervals vs the factory range — a nudge to think about service if timing has been rough, not medical or financial advice.
              </p>
              <ConsiderServiceVisual />
            </InfoTip>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: 15, color: 'var(--text-secondary)' }}>
            Your watch is often outside the manufacturer’s spec. A service may help.
          </p>
        </div>
      )}

      {(watch.specMin != null || watch.specMax != null) && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="label-with-info" style={{ marginBottom: '0.35rem' }}>
            <h3 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Spec compliance (rate s/day)</h3>
            <InfoTip label="What spec compliance means">
              <p>
                We look at <strong>rate</strong> between consecutive readings — how fast the watch gains or loses versus real time, in seconds per day. Green/red compares each interval to the maker’s stated range ({min} to +{max} s/day).
              </p>
              <SpecComplianceVisual />
            </InfoTip>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 0 }}>Manufacturer range: {min} to +{max} s/day</p>
          {rateIntervalCount > 0 ? (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--success)' }}>In spec: {inSpec}</span>
                <span style={{ color: 'var(--danger)' }}>Out of spec: {outSpec}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>{rateIntervalCount} intervals</p>
            </>
          ) : (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: '0.5rem 0 0' }}>Need at least 2 readings to compute rate.</p>
          )}
        </div>
      )}

      {readings.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="label-with-info" style={{ marginBottom: '0.4rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Quick summary</h3>
            <InfoTip label="These numbers">
              <p>
                <strong>Mean rate</strong> is how fast the watch is running between taps (s/day). <strong>Average drift</strong> is the average error in seconds at each tap vs atomic time — a different lens on the same readings.
              </p>
              <DriftSummaryOffsetVisual />
            </InfoTip>
          </div>
          {readings.length >= 2 && (() => {
            const rates = getRates(readings)
            const meanRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null
            return meanRate != null && <p style={{ margin: 0, fontSize: 15 }}><strong>Mean rate:</strong> {meanRate >= 0 ? '+' : ''}{meanRate.toFixed(1)} s/day</p>
          })()}
          <p style={{ margin: readings.length >= 2 ? '0.25rem 0 0' : 0, fontSize: 15 }}><strong>Average drift</strong> (from {readings.length} reading{readings.length !== 1 ? 's' : ''}): {avg >= 0 ? '+' : ''}{avg.toFixed(1)} s</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
            Tables, charts, and runs live on the <strong>Readings</strong> tab.
          </p>
        </div>
      )}

      <div className="card">
        <div className="label-with-info" style={{ marginBottom: '0.4rem' }}>
          <h3 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Service &amp; care</h3>
          <InfoTip label="This card">
            <p>
              Shortcut to official brand service info. Opens outside the app; we don’t upload your readings with it.
            </p>
            <ServiceCareLinkVisual />
          </InfoTip>
        </div>
        {serviceUrl ? (
          <>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)', fontSize: 15 }}>
              Find official {watch.brand} service centers and support.
            </p>
            <a href={serviceUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ width: '100%' }}>
              Find official service
            </a>
          </>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
            Search for “{watch.brand} official service” to find authorized centers. Closest centers by location and watchmaker listings coming soon.
          </p>
        )}
      </div>
    </>
  )

  return (
    <div className="watch-detail-panel">
      {section !== 'driftFollow' && headerStrip}

      {section === 'driftFollow' && (
        <div className="collection-drift-follow" style={{ marginTop: 'var(--space-lg)' }}>
          {driftFollowCards}
        </div>
      )}

      {section === 'watch' && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="label-with-info" style={{ marginBottom: '0.5rem' }}>
              <h3 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Ownership</h3>
              <InfoTip label="Ownership fields">
                <p>
                  <strong>Purchase date</strong>, then <strong>serial</strong>, then optional <strong>notes</strong> — same order as Add watch. Stays on this device until you save.
                </p>
                <OwnershipFieldsVisual />
              </InfoTip>
            </div>
            <label className="label" htmlFor={`panel-ownership-purchase-${reference}`}>Purchase date</label>
            <DateField
              id={`panel-ownership-purchase-${reference}`}
              value={purchaseDraft}
              max={todayDateInputValue()}
              onChange={(v) => {
                setPurchaseDraft(v)
                setOwnershipErr(null)
              }}
              allowClear
              style={{ marginBottom: '0.5rem' }}
            />
            <label className="label" htmlFor={`panel-ownership-serial-${reference}`}>Serial number (optional)</label>
            <input
              id={`panel-ownership-serial-${reference}`}
              type="text"
              className="input"
              value={serialDraft}
              maxLength={50}
              onChange={(e) => setSerialDraft(e.target.value)}
              placeholder="Case or movement serial"
              style={{ marginBottom: '0.5rem' }}
              autoComplete="off"
            />
            <label className="label" htmlFor={`panel-ownership-notes-${reference}`}>Notes (optional)</label>
            <textarea
              id={`panel-ownership-notes-${reference}`}
              className="input"
              value={notesDraft}
              maxLength={NOTES_MAX}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="e.g. year, dial variant, provenance"
              rows={3}
              style={{
                marginBottom: '0.75rem',
                minHeight: 72,
                resize: 'vertical',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.45,
              }}
            />
            {ownershipErr && <p className="error-message" style={{ margin: '0 0 0.5rem' }}>{ownershipErr}</p>}
            {(() => {
              const sum = getOwnershipSummary(purchaseDraft)
              if (!sum) return null
              return (
                <div className="ownership-stats">
                  <p className="ownership-stats__purchase-line">{sum.purchaseFormatted}</p>
                  <p className="ownership-stats__headline">{sum.headline}</p>
                  <p className="ownership-stats__subline">{sum.subline}</p>
                </div>
              )
            })()}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => {
                if (purchaseDraft && !isValidPurchaseDate(purchaseDraft)) {
                  setOwnershipErr('Pick a valid date (not in the future).')
                  return
                }
                const n = notesDraft.trim()
                if (n.length > NOTES_MAX) {
                  setOwnershipErr(`Notes: max ${NOTES_MAX} characters.`)
                  return
                }
                setOwnershipErr(null)
                updateWatchFields(reference, {
                  purchaseDate: purchaseDraft || null,
                  serialNumber: serialDraft.trim() || null,
                  notes: n || null,
                })
              }}
            >
              Save details
            </button>
          </div>

          {(watch.movementType || watch.movementCalibre || watch.category) && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="label-with-info" style={{ marginBottom: '0.4rem' }}>
                <h3 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Details</h3>
                <InfoTip label="Movement &amp; category">
                  <p>
                    Pulled from the catalog entry or what you typed for a custom watch. Use the <strong>Watch</strong> tab to edit purchase date, serial, and notes.
                  </p>
                  <MovementDetailsCardVisual />
                </InfoTip>
              </div>
              <dl style={{ margin: 0, display: 'grid', gap: '0.35rem 1rem', gridTemplateColumns: 'auto 1fr' }}>
                {(watch.movementType || watch.movementCalibre) && (
                  <>
                    <dt style={{ color: 'var(--text-secondary)', margin: 0 }}>Movement</dt>
                    <dd style={{ margin: 0 }}>
                      {[watch.movementType, watch.movementCalibre].filter(Boolean).join(' · ')}
                    </dd>
                  </>
                )}
                {watch.category && (
                  <>
                    <dt style={{ color: 'var(--text-secondary)', margin: 0 }}>Category</dt>
                    <dd style={{ margin: 0 }}>{watch.category}</dd>
                  </>
                )}
              </dl>
            </div>
          )}
        </>
      )}

      {section === 'readings' && (
        <>
          <div className="card collection-new-run-card" style={{ marginBottom: '1rem' }}>
            <div className="label-with-info" style={{ marginBottom: '0.4rem' }}>
              <h3 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>New measurement run</h3>
              <InfoTip label="Starting a new run">
                <p>
                  Puts the <strong>next</strong> drift taps into a fresh group so you can label a new test period (after a regulation, new position, etc.). Older runs remain until you delete them.
                </p>
                <NewMeasurementRunCardVisual />
              </InfoTip>
            </div>
            <p style={{ margin: '0 0 0.75rem', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Use this when you want the <strong>next taps</strong> in a <strong>new group</strong> — e.g. different position or winding for the test, a new stretch you want labeled separately, or simply a clean break in the log. Nothing is erased: older taps stay put and still count in overall stats until you delete a run or a reading.
            </p>
            <button type="button" className="btn" style={{ width: '100%' }} onClick={handleStartNewRun}>
              Start new run
            </button>
            <p style={{ margin: '0.5rem 0 0', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Your next taps in the <strong>Drift</strong> tab attach to this run. Past runs stay below until you remove them.
            </p>
          </div>

          <p className="time-hint" style={{ margin: '0 0 0.75rem', fontSize: 13 }}>
            Drift charts and the latest offset summary stay on the <strong>Drift</strong> tab under the tap controls.
          </p>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div className="label-with-info" style={{ flex: '1 1 auto', marginBottom: 0 }}>
                <h3 className="section-title" style={{ margin: 0 }}>All readings &amp; runs</h3>
                <InfoTip label="Runs and history">
                  <p>
                    Each <strong>run</strong> is a stretch of testing (often after an adjustment). <strong>Rate</strong> is s/day between taps; <strong>Drift</strong> is seconds vs atomic time at that tap. Delete one reading or an entire run if you need to fix mistakes.
                  </p>
                  <RunsHistoryVisual />
                </InfoTip>
              </div>
              {sorted.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: 14, padding: '0.4rem 0.75rem' }}
                  onClick={handleClearAll}
                  onBlur={() => setTimeout(() => setClearConfirm(false), 200)}
                >
                  {clearConfirm ? 'Tap again to clear all' : 'Clear all readings'}
                </button>
              )}
            </div>
            {sorted.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                No readings yet. Open the <strong>Drift</strong> tab and tap when your watch hits the target.
              </p>
            ) : (
              runs.map(({ runId, label, readings: runReadings }) => (
                <div key={runId} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                    <button
                      type="button"
                      className="drift-history-delete"
                      onClick={() => handleDeleteRun(runId)}
                      onBlur={() => setTimeout(() => setDeleteRunConfirm(null), 200)}
                    >
                      {deleteRunConfirm === runId ? 'Tap again to delete run' : 'Delete run'}
                    </button>
                  </div>
                  <div className="drift-history-table">
                    <div className="drift-history-header">
                      <span>Date</span>
                      <span>Rate (s/day)</span>
                      <span>Drift (s)</span>
                      <span />
                    </div>
                    {getReadingsWithRates(runReadings, min, max).slice(0, 20).map(({ reading: r, rate, inSpec }) => (
                      <div key={r.id} className="drift-history-row">
                        <span className="drift-history-date">
                          <span className="drift-history-datetime">
                            {r.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                            {r.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {(r.position || r.winding) && (
                            <span className="drift-history-context">{formatDriftReadingContext(r)}</span>
                          )}
                        </span>
                        <span
                          className="drift-history-rate"
                          style={{
                            color: rate != null && inSpec === false ? 'var(--danger)' : rate != null && inSpec === true ? 'var(--success)' : 'var(--text-secondary)',
                          }}
                        >
                          {rate != null ? `${rate >= 0 ? '+' : ''}${rate.toFixed(1)} s/day` : '—'}
                        </span>
                        <span className="drift-history-drift">{r.driftInSeconds >= 0 ? '+' : ''}{r.driftInSeconds.toFixed(1)} s</span>
                        <button
                          type="button"
                          className="drift-history-delete"
                          onClick={() => {
                            deleteDriftReading(reference, r.id)
                            const updated = getDriftReadings(reference)
                            setReadings(updated)
                            pushReadingsToCloud(reference, updated).catch(() => {})
                            window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT))
                          }}
                          aria-label="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {section === 'wear' && (
        <div className="card card--compact" style={{ marginBottom: '1rem' }}>
          <div className="label-with-info" style={{ marginBottom: '0.45rem' }}>
            <h3 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Wear journal</h3>
            <InfoTip label="Wear journal">
              <p>
                On-wrist days for this watch — not drift timing. The history list scrolls inside a fixed area so this page doesn’t grow forever. For a full backup of <strong>every watch’s wear entries</strong>, export <strong>Settings → Export → Wear log (whole collection)</strong>.
              </p>
              <WearJournalVisual />
            </InfoTip>
          </div>
          <div style={{ marginBottom: '0.65rem' }}>
            <WearRollingCalendar
              entries={wearEntriesAll}
              watches={collectionForWearColors}
              referenceFilter={reference}
              showLegend={false}
            />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!wearDate) return
              addWearEntry({ reference, date: wearDate, note: wearNote })
              setWearNote('')
              setWearDate(todayDateInputValue())
            }}
            style={{ marginBottom: '1rem' }}
          >
            <label className="label" htmlFor={`panel-wear-date-${reference}`}>Date worn</label>
            <DateField
              id={`panel-wear-date-${reference}`}
              value={wearDate}
              max={todayDateInputValue()}
              onChange={setWearDate}
              style={{ marginBottom: '0.5rem' }}
            />
            <label className="label" htmlFor={`panel-wear-note-${reference}`}>Note (optional)</label>
            <input
              id={`panel-wear-note-${reference}`}
              type="text"
              className="input"
              value={wearNote}
              onChange={(e) => setWearNote(e.target.value)}
              placeholder="e.g. Travel, dinner"
              maxLength={200}
              style={{ marginBottom: '0.75rem' }}
            />
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              Add wear entry
            </button>
          </form>
          {wearGrouped.length === 0 ? (
            <p className="time-hint" style={{ margin: 0 }}>No wear entries for this watch yet.</p>
          ) : (
            <>
              <p className="wear-journal-history-meta">
                {wearGrouped.length} day{wearGrouped.length !== 1 ? 's' : ''} with entries
                {wearGrouped.length > 3 ? (
                  <span className="wear-journal-history-meta__hint"> · scroll for older days</span>
                ) : null}
              </p>
              <div className="wear-log-scroll">
                <ul className="wear-log-list">
                  {wearGrouped.map(([dayKey, dayEntries]) => (
                    <li key={dayKey} className="wear-log-day">
                      <h4 className="wear-log-day-title">{formatWearDayHeading(dayKey)}</h4>
                      <ul className="wear-log-day-entries">
                        {dayEntries.map((e) => (
                          <li key={e.id} className="wear-log-entry card">
                            <div className="wear-log-entry-main">
                              {e.note ? (
                                <p className="wear-log-entry-note" style={{ margin: 0 }}>{e.note}</p>
                              ) : (
                                <span className="wear-log-entry-ref" style={{ color: 'var(--text-secondary)' }}>Worn</span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="wear-log-entry-delete"
                              onClick={() => deleteWearEntry(e.id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
