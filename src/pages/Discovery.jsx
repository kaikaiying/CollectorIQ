import { useState, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams, Link } from 'react-router-dom'
import { fetchAggregates } from '../lib/driftCloud'
import { getCollection } from '../App'
import PageSeo from '../components/PageSeo'
import { usePageTitle } from '../contexts/PageTitleContext'

/** Mock aggregates for dev/preview. Matches references in watchspecs.json. */
const MOCK_AGGREGATES = [
  { reference: '79000N', brand: 'Tudor', model: 'Black Bay 54', specLow: -2, specHigh: 4, readingCount: 12, sumDrift: 8.4, inSpecCount: 11, median: 0.6, excludedCount: 1 },
  { reference: '126610LN', brand: 'Rolex', model: 'Submariner Date', specLow: -2, specHigh: 2, readingCount: 47, sumDrift: -12.3, inSpecCount: 44, median: -0.2, excludedCount: 2 },
  { reference: '310.30.42.50.01.002', brand: 'Omega', model: 'Speedmaster Professional Moonwatch', specLow: -1, specHigh: 3, readingCount: 28, sumDrift: 18.2, inSpecCount: 25, median: 0.5, excludedCount: 0 },
  { reference: '210.30.42.20.01.001', brand: 'Omega', model: 'Seamaster Diver 300M', specLow: -2, specHigh: 5, readingCount: 5, sumDrift: 22, inSpecCount: 2, median: 4.2, excludedCount: 1 },
  { reference: 'SBGA211', brand: 'Grand Seiko', model: 'Snowflake', specLow: -1, specHigh: 1, readingCount: 8, sumDrift: -0.8, inSpecCount: 8, median: -0.1, excludedCount: 0 },
  { reference: 'SPB121J1', brand: 'Seiko', model: 'Alpinist', specLow: -15, specHigh: 25, readingCount: 2, sumDrift: -8, inSpecCount: 1, median: -4, excludedCount: 0 },
]

function parseSpec(s) {
  if (!s || typeof s !== 'string') return null
  const n = parseFloat(s.replace(/[^0-9.+-]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function formatSpecRange(low, high) {
  const l = low == null ? '?' : low
  const h = high == null ? '?' : high
  return `${l} to +${h} s/day`
}

const MIN_READINGS_FOR_STATS = 3

function matchesSearch(row, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  const tokens = q.split(/\s+/).filter(Boolean)
  const brand = (row.brand ?? '').toLowerCase()
  const model = (row.model ?? '').toLowerCase()
  const reference = (row.reference ?? '').toLowerCase()
  return tokens.every((token) =>
    brand.includes(token) || model.includes(token) || reference.includes(token)
  )
}

function canShowStats(count) {
  return count >= MIN_READINGS_FOR_STATS
}

function loadData(useMock) {
  return Promise.all([
    fetch('/watchspecs.json').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    fetchAggregates().catch(() => []),
  ]).then(([data, aggs]) => {
    if (useMock && Array.isArray(aggs)) {
      const byRef = new Map(aggs.map((a) => [a.reference, a]))
      MOCK_AGGREGATES.forEach((m) => byRef.set(m.reference, m))
      return [data, Array.from(byRef.values())]
    }
    return [data, aggs]
  })
}

export default function Discovery() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [specs, setSpecs] = useState([])
  const [aggregates, setAggregates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const useMock = import.meta.env.DEV || searchParams.get('mock') === '1'

  useEffect(() => {
    setLoading(true)
    loadData(useMock)
      .then(([data, aggs]) => {
        setSpecs(Array.isArray(data) ? data : [])
        setAggregates(Array.isArray(aggs) ? aggs : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [location.pathname, useMock])

  const withRange = useMemo(() =>
    specs
      .map((w) => ({
        ...w,
        low: parseSpec(w.spec_low),
        high: parseSpec(w.spec_high),
      }))
      .filter((w) => w.low != null && w.high != null),
    [specs]
  )

  const specRefs = useMemo(() => new Set(withRange.map((w) => w.reference)), [withRange])

  const aggByRef = useMemo(() => {
    const map = {}
    aggregates.forEach((a) => { map[a.reference] = a })
    return map
  }, [aggregates])

  // Rows from specs (with or without community data)
  const rowsFromSpecs = useMemo(() =>
    withRange.map((w) => {
      const agg = aggByRef[w.reference]
      const count = agg?.readingCount ?? 0
      const avg = count > 0 ? (agg.sumDrift / count) : null
      const inSpecCount = agg?.inSpecCount ?? 0
      const pctInSpec = count > 0 ? Math.round((inSpecCount / count) * 100) : null
      return {
        brand: w.brand,
        model: w.model,
        reference: w.reference,
        specLow: w.low,
        specHigh: w.high,
        readingCount: count,
        avgDrift: avg,
        pctInSpec,
        inSpecCount,
        median: agg?.median ?? null,
        excludedCount: agg?.excludedCount ?? 0,
      }
    }),
    [withRange, aggByRef]
  )

  // Rows from aggregates only (user-added watches with community readings, not in static specs)
  const rowsFromAggregatesOnly = useMemo(() =>
    aggregates
      .filter((a) => !specRefs.has(a.reference) && (a.readingCount ?? 0) > 0)
      .map((a) => {
        const count = a.readingCount ?? 0
        const avg = count > 0 ? a.sumDrift / count : null
        const pctInSpec = count > 0 ? Math.round(((a.inSpecCount ?? 0) / count) * 100) : null
        return {
          brand: a.brand ?? '',
          model: a.model ?? '',
          reference: a.reference ?? '',
          specLow: a.specLow ?? -999,
          specHigh: a.specHigh ?? 999,
          readingCount: count,
          avgDrift: avg,
          pctInSpec,
          inSpecCount: a.inSpecCount ?? 0,
          median: a.median ?? null,
          excludedCount: a.excludedCount ?? 0,
        }
      }),
    [aggregates, specRefs]
  )

  const rows = useMemo(() => [...rowsFromSpecs, ...rowsFromAggregatesOnly], [rowsFromSpecs, rowsFromAggregatesOnly])

  const specWidth = (w) => (w.specHigh - w.specLow)

  const filtered = rows.filter((r) => matchesSearch(r, search))
  const withD = filtered.filter((r) => r.readingCount > 0)
  const withoutD = filtered.filter((r) => r.readingCount === 0)
  const sortedWith = [...withD].sort((a, b) => (b.pctInSpec ?? 0) - (a.pctInSpec ?? 0))
  const sortedWithout = [...withoutD].sort((a, b) => specWidth(a) - specWidth(b))
  const displayRows = [...sortedWith, ...sortedWithout]

  const getVerdict = (row) => {
    if (row.readingCount === 0) return { label: 'No data yet', status: 'none' }
    if (!canShowStats(row.readingCount)) return { label: 'Limited data', status: 'none' }
    const pct = row.pctInSpec ?? 0
    if (pct >= 80) return { label: 'Meets spec', status: 'good' }
    if (pct >= 50) return { label: 'Mixed', status: 'mixed' }
    return { label: 'Below spec', status: 'bad' }
  }

  const selectedRef = searchParams.get('ref')
  const selectedRow = selectedRef ? rows.find((r) => r.reference === selectedRef) : null
  const specDetail = selectedRef ? specs.find((s) => s.reference === selectedRef) : null
  const inCollection = selectedRef ? getCollection().some((w) => w.reference === selectedRef) : false
  const refNotFound = selectedRef && !selectedRow && !loading

  usePageTitle(selectedRef && selectedRow ? selectedRow.model : 'Discovery')

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)', padding: 'var(--space-lg)' }}>Loading…</p>
  }

  if (refNotFound) {
    return (
      <>
        <Link to="/discovery" style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space)', display: 'inline-block' }}>
          ← Back to Discovery
        </Link>
        <div className="card">
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Watch not found. It may not be in our catalog yet.</p>
        </div>
      </>
    )
  }

  // Detail view when a model is selected
  if (selectedRow && selectedRef) {
    const verdict = getVerdict(selectedRow)
    const specWidth = selectedRow.specHigh - selectedRow.specLow
    const avg = selectedRow.avgDrift
    const pctIn = selectedRow.pctInSpec ?? 0
    const inSpecCount = selectedRow.inSpecCount ?? 0
    const totalReadings = selectedRow.readingCount ?? 0
    const avgPos = avg != null && specWidth > 0
      ? Math.max(0, Math.min(100, ((avg - selectedRow.specLow) / specWidth) * 100))
      : null

    return (
      <>
        <PageSeo title={`${selectedRow.model} · Discovery`} description={`Community accuracy data for ${selectedRow.brand} ${selectedRow.model}. ${totalReadings} readings, ${pctIn}% in spec.`} />
        <Link to="/discovery" style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space)', display: 'inline-block' }}>
          ← Back to Discovery
        </Link>
        <div className="card" style={{ marginBottom: 'var(--space)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <span className="discovery-card-brand">{selectedRow.brand}</span>
              <span className="discovery-card-model">{selectedRow.model}</span>
            </div>
            <span className={`verdict verdict--${verdict.status}`}>{verdict.label}</span>
          </div>
          <div className="discovery-card-ref">Ref: {selectedRow.reference}</div>
          {(specDetail?.category || specDetail?.movement_type || specDetail?.movement_number || specDetail?.release_year) && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {[specDetail.category, specDetail.movement_type, specDetail.movement_number, specDetail.release_year && `Released ${specDetail.release_year}`].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 'var(--space)' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}>Manufacturer spec</h3>
          <p style={{ margin: '0 0 0.5rem', fontSize: 15, color: 'var(--text-secondary)' }}>
            {formatSpecRange(selectedRow.specLow, selectedRow.specHigh)}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>
            Typical accuracy range for {selectedRow.brand}.
          </p>
          {avg != null && totalReadings >= MIN_READINGS_FOR_STATS && (
            <div className="discovery-spec-bar-wrap" style={{ marginTop: '1rem' }}>
              <div className="discovery-spec-bar" style={{ position: 'relative', height: 24, background: 'var(--btn-secondary-bg)', borderRadius: 8, overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${avgPos}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 4,
                    height: 16,
                    background: 'var(--accent)',
                    borderRadius: 2,
                    zIndex: 2,
                  }}
                  title={`Community avg: ${avg >= 0 ? '+' : ''}${avg.toFixed(1)} s/day`}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${((0 - selectedRow.specLow) / specWidth) * 100}%`,
                    width: '4px',
                    top: 0,
                    bottom: 0,
                    background: 'var(--text-tertiary)',
                    opacity: 0.6,
                  }}
                  title="0 s/day"
                />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
                Community avg: <strong style={{ color: 'var(--text)' }}>{avg >= 0 ? '+' : ''}{avg.toFixed(1)} s/day</strong>
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
                Marker shows position in spec range.
              </p>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 'var(--space)' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}>Community data</h3>
          {totalReadings === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              No community readings yet. Be the first — run a drift test and contribute.
            </p>
          ) : (
            <>
              {(selectedRow.excludedCount ?? 0) > 0 && (
                <p style={{ margin: '0 0 0.75rem', fontSize: 14, color: 'var(--text-tertiary)' }}>
                  {selectedRow.excludedCount} outlier{selectedRow.excludedCount !== 1 ? 's' : ''} excluded for data quality.
                </p>
              )}
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Readings (cleaned)</span>
                  <strong>{totalReadings}</strong>
                </div>
                {totalReadings >= MIN_READINGS_FOR_STATS && avg != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Mean</span>
                    <strong>{avg >= 0 ? '+' : ''}{avg.toFixed(1)} s/day</strong>
                  </div>
                )}
                {totalReadings >= MIN_READINGS_FOR_STATS && selectedRow.median != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Median</span>
                    <strong>{selectedRow.median >= 0 ? '+' : ''}{selectedRow.median.toFixed(1)} s/day</strong>
                  </div>
                )}
                {totalReadings >= MIN_READINGS_FOR_STATS && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>In spec</span>
                    <strong style={{ color: pctIn >= 80 ? 'var(--success)' : pctIn >= 50 ? '#eab308' : 'var(--danger)' }}>
                      {inSpecCount} of {totalReadings} ({pctIn}%)
                    </strong>
                  </div>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
                {totalReadings >= MIN_READINGS_FOR_STATS
                  ? 'Outliers removed (IQR). Median is robust to bad data. Run drift tests to contribute.'
                  : 'Need 3+ readings for stats. Run drift tests to contribute.'}
              </p>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {inCollection ? (
            <Link to={`/watch/${encodeURIComponent(selectedRef)}`} className="btn" style={{ width: '100%' }}>
              View your readings
            </Link>
          ) : (
            <Link to={`/add-watch?ref=${encodeURIComponent(selectedRef)}`} className="btn" style={{ width: '100%' }}>
              Add to collection
            </Link>
          )}
          <Link to="/drift-test" className="btn btn-secondary" style={{ width: '100%' }}>
            Run drift test
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageSeo title="Discovery" description="Community watch accuracy data vs manufacturer specs (s/day). See how Omega, Rolex, Seiko perform. Watch atomic tracker with real-world data." />
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space)' }}>
        Community accuracy vs manufacturer specs. Which brands deliver?
      </p>

      <input
        type="text"
        placeholder="Search brand, model, or reference (e.g. Omega Speedmaster)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="discovery-search-input"
        style={{ width: '100%', marginBottom: 'var(--space)' }}
        aria-label="Search watches"
      />

      <div className="discovery-cards" key={search}>
        {displayRows.length === 0 ? (
          <div className="card discovery-empty">
            <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {search.trim() ? 'No matches. Try "Rolex", "Omega", "Seiko", or a reference like "126610LN".' : 'No watch specs available yet.'}
            </p>
          </div>
        ) : (
          displayRows.map((row, i) => {
            const verdict = getVerdict(row)
            return (
              <Link
                key={`${row.brand}-${row.model}-${row.reference}-${i}`}
                to={`/discovery?ref=${encodeURIComponent(row.reference)}`}
                className="card discovery-card discovery-card-link"
              >
                <div className="discovery-card-header">
                  <div>
                    <span className="discovery-card-brand">{row.brand}</span>
                    <span className="discovery-card-model">{row.model}</span>
                  </div>
                  <span className={`verdict verdict--${verdict.status}`}>{verdict.label}</span>
                </div>
                <div className="discovery-card-ref">Ref: {row.reference}</div>
                <div className="discovery-card-spec">
                  Spec: {formatSpecRange(row.specLow, row.specHigh)}
                </div>
                <div className="discovery-card-community">
                  {row.readingCount === 0 ? (
                    'No community readings yet'
                  ) : (
                    <>
                      {row.readingCount} reading{row.readingCount !== 1 ? 's' : ''}
                      {row.excludedCount > 0 && <> · {row.excludedCount} excluded</>}
                      {canShowStats(row.readingCount) && row.avgDrift != null && (
                        <> · {row.avgDrift >= 0 ? '+' : ''}{row.avgDrift.toFixed(1)} s/day avg</>
                      )}
                      {canShowStats(row.readingCount) && row.median != null && (
                        <> · {row.median >= 0 ? '+' : ''}{row.median.toFixed(1)} s/day median</>
                      )}
                      {canShowStats(row.readingCount) && row.pctInSpec != null && (
                        <> · {row.pctInSpec}% in spec</>
                      )}
                      {!canShowStats(row.readingCount) && <> · Limited (privacy)</>}
                    </>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 'var(--space)' }}>
        Community data is aggregated only. More readings = more reliable. Run drift tests to contribute.
      </p>
      {useMock && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
          Demo mode: showing sample community data. Remove ?mock=1 or build for production to see real data.
        </p>
      )}
    </>
  )
}
