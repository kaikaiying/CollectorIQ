import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePageTitle } from '../contexts/PageTitleContext'
import { getCollection, SYNC_COMPLETE_EVENT } from '../App'
import { getDriftReadings, deleteDriftReading, clearDriftReadings } from '../lib/driftStorage'
import { pushReadingsToCloud } from '../lib/userDataSync'
import { getOfficialServiceUrl } from '../lib/serviceCenters'
import { rateBasedInSpecCount, getRecentRates } from '../lib/driftStats'

export default function WatchDetail() {
  const { reference } = useParams()
  const [watch, setWatch] = useState(null)
  const [readings, setReadings] = useState([])
  const [clearConfirm, setClearConfirm] = useState(false)

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

  usePageTitle(watch?.model ?? '')

  if (!watch) {
    return (
      <div className="card">
        <p>Watch not found.</p>
        <Link to="/" className="btn">Back to collection</Link>
      </div>
    )
  }

  const min = watch.specMin ?? -999
  const max = watch.specMax ?? 999
  const { inSpecCount, rateIntervalCount } = rateBasedInSpecCount(readings, min, max)
  const inSpec = inSpecCount
  const outSpec = rateIntervalCount - inSpecCount
  const avg = readings.length ? readings.reduce((a, r) => a + r.driftInSeconds, 0) / readings.length : null
  const sorted = [...readings].sort((a, b) => b.timestamp - a.timestamp)
  const recentRates = getRecentRates(sorted)
  const recentOut = recentRates.filter((r) => r < min || r > max).length
  const suggestService = (watch.specMin != null || watch.specMax != null) && readings.length >= 2 && recentRates.length >= 2 && recentOut >= 2
  const serviceUrl = getOfficialServiceUrl(watch.brand)

  return (
    <>
      <p style={{ color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
        {watch.brand} · Ref: {watch.reference}
        {watch.isCustom && <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>(custom)</span>}
      </p>

      {(watch.movementType || watch.movementCalibre || watch.category || watch.notes) && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}>Details</h3>
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
            {watch.notes && (
              <>
                <dt style={{ color: 'var(--text-secondary)', margin: 0 }}>Notes</dt>
                <dd style={{ margin: 0 }}>{watch.notes}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {suggestService && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: '1rem' }}>
          <strong style={{ color: '#f59e0b' }}>Consider service</strong>
          <p style={{ margin: '0.35rem 0 0', fontSize: 15, color: 'var(--text-secondary)' }}>
            Your watch is often outside the manufacturer’s spec. A service may help.
          </p>
        </div>
      )}

      {(watch.specMin != null || watch.specMax != null) && (
        <div className="card">
          <h3 className="section-title" style={{ marginTop: 0 }}>Spec compliance (rate s/day)</h3>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Manufacturer range: {min} to +{max} s/day</p>
          {rateIntervalCount > 0 ? (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>In spec: {inSpec}</span>
                <span style={{ color: '#ef4444' }}>Out of spec: {outSpec}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>{rateIntervalCount} intervals</p>
            </>
          ) : (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: '0.5rem 0 0' }}>Need at least 2 readings to compute rate.</p>
          )}
        </div>
      )}

      {avg !== null && (
        <div className="card">
          <p><strong>Average drift</strong> (from {readings.length} reading{readings.length !== 1 ? 's' : ''}): {avg >= 0 ? '+' : ''}{avg.toFixed(1)} s</p>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Drift history</h3>
          {sorted.length > 0 && (
            <button
              type="button"
              className={`btn btn-secondary ${clearConfirm ? '' : ''}`}
              style={{ fontSize: 14, padding: '0.4rem 0.75rem' }}
              onClick={handleClearAll}
              onBlur={() => setTimeout(() => setClearConfirm(false), 200)}
            >
              {clearConfirm ? 'Tap again to clear all' : 'Corrected watch — reset'}
            </button>
          )}
        </div>
        {sorted.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No readings yet. Run a drift test.</p>
        ) : (
          <>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 0.75rem' }}>
            Synced to atomic time or had a service? Use &quot;Corrected watch — reset&quot; to clear old readings and track from your new baseline.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sorted.slice(0, 20).map((r) => (
              <li key={r.id} className="drift-history-row">
                <span className="drift-history-meta">{r.timestamp.toLocaleDateString()} {r.timestamp.toLocaleTimeString()}</span>
                <span className="drift-history-value" style={{ color: r.driftInSeconds < min || r.driftInSeconds > max ? 'var(--danger)' : '#22c55e' }}>
                  {r.driftInSeconds >= 0 ? '+' : ''}{r.driftInSeconds.toFixed(1)} s
                </span>
                <button
                  type="button"
                  className="drift-history-delete"
                  onClick={() => {
                    deleteDriftReading(reference, r.id)
                    const updated = getDriftReadings(reference)
                    setReadings(updated)
                    pushReadingsToCloud(reference, updated).catch(() => {})
                  }}
                  aria-label="Delete this reading"
                  title="Delete reading"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>

      <div className="card">
        <h3 className="section-title" style={{ marginTop: 0 }}>Service &amp; care</h3>
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

      <Link to="/drift-test" className="btn" style={{ width: '100%' }}>Run drift test</Link>
      <Link to="/" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>Back to collection</Link>
    </>
  )
}
