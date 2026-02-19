import { useState, useEffect } from 'react'
import { fetchAggregates } from '../lib/driftCloud'
import PageSeo from '../components/PageSeo'

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

const MIN_READINGS_FOR_STATS = 3 // Don't show exact avg/pct below this to protect user privacy

function matchesSearch(row, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const brand = (row.brand ?? '').toLowerCase()
  const model = (row.model ?? '').toLowerCase()
  const ref = (row.reference ?? '').toLowerCase()
  return brand.includes(q) || model.includes(q) || ref.includes(q)
}

/** Whether we can safely show avg/pct without risk of identifying individuals */
function canShowStats(count) {
  return count >= MIN_READINGS_FOR_STATS
}

export default function Discovery() {
  const [specs, setSpecs] = useState([])
  const [aggregates, setAggregates] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('accountability') // 'accountability' | 'strictest'
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/watchspecs.json').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetchAggregates().catch(() => []),
    ])
      .then(([data, aggs]) => {
        setSpecs(Array.isArray(data) ? data : [])
        setAggregates(Array.isArray(aggs) ? aggs : [])
        setLoading(false)
      })
      .catch(() => {
        setSpecs([])
        setAggregates([])
        setLoading(false)
      })
  }, [])

  const withRange = specs
    .map((w) => ({
      ...w,
      low: parseSpec(w.spec_low),
      high: parseSpec(w.spec_high),
    }))
    .filter((w) => w.low != null && w.high != null)

  const aggByRef = {}
  aggregates.forEach((a) => {
    aggByRef[a.reference] = a
  })

  const rows = withRange.map((w) => {
    const agg = aggByRef[w.reference]
    const count = agg?.readingCount ?? 0
    const avg = count > 0 ? (agg.sumDrift / count) : null
    const inSpecCount = agg?.inSpecCount ?? 0
    const pctInSpec = count > 0 ? Math.round((inSpecCount / count) * 100) : null
    const inSpec = avg != null && w.low != null && w.high != null && avg >= w.low && avg <= w.high
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
    }
  })

  const withData = rows.filter((r) => r.readingCount > 0)
  const sortedByAccountability = [...withData].sort((a, b) => (b.pctInSpec ?? 0) - (a.pctInSpec ?? 0))
  const sortedByReadings = [...withData].sort((a, b) => b.readingCount - a.readingCount)
  const specWidth = (w) => (w.specHigh - w.specLow)
  const byStrictness = [...withRange].sort((a, b) => specWidth(a) - specWidth(b))

  const filteredAccountability = sortedByAccountability.filter((r) => matchesSearch(r, search))
  const filteredStrictest = byStrictness.filter((w) => matchesSearch(w, search)).slice(0, 20)

  const getVerdict = (row) => {
    if (row.readingCount === 0) return { label: 'No data yet', status: 'none' }
    if (!canShowStats(row.readingCount)) return { label: 'Limited data', status: 'none' }
    const pct = row.pctInSpec ?? 0
    if (pct >= 80) return { label: 'Meets spec', status: 'good' }
    if (pct >= 50) return { label: 'Mixed', status: 'mixed' }
    return { label: 'Below spec', status: 'bad' }
  }

  if (loading) {
    return <p className="page-title">Loading…</p>
  }

  return (
    <>
      <PageSeo title="Discovery" description="Community watch accuracy data vs manufacturer specs (s/day). See how Omega, Rolex, Seiko and others perform in the real world." />
      <h1 className="page-title">Discovery</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space)' }}>
        Collective real-world accuracy vs manufacturer specs. See if brands deliver what they claim.
      </p>
      <p className="discovery-legend">
        <strong>Claimed spec</strong> = manufacturer’s accuracy range (s/day). <strong>Community</strong> = aggregated readings only — no individual users shown. Stats (avg, % in spec) appear once enough readings exist for privacy.
      </p>

      {/* Tabs */}
      <div className="discovery-tabs">
        <button
          type="button"
          className={view === 'accountability' ? 'btn' : 'btn btn-secondary'}
          style={{ flex: 1 }}
          onClick={() => setView('accountability')}
        >
          By accountability
        </button>
        <button
          type="button"
          className={view === 'strictest' ? 'btn' : 'btn btn-secondary'}
          style={{ flex: 1 }}
          onClick={() => setView('strictest')}
        >
          Strictest specs
        </button>
      </div>
      <p className="discovery-view-desc">
        {view === 'accountability'
          ? 'Sorted by % of readings within claimed spec (best performers first). Which brands actually deliver?'
          : 'Sorted by tightest claimed accuracy range (e.g. ±1 s/day). Boldest claims — do community readings back them up?'}
      </p>

      <div className="discovery-search-wrap">
        <input
          type="search"
          placeholder="Search by brand, model, or reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="discovery-search-input"
          aria-label="Search watches"
        />
      </div>

      {view === 'accountability' && (
        <div className="card discovery-table-card">
          <table className="discovery-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Ref</th>
                <th>Claimed spec</th>
                <th>Community readings</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccountability.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--text-secondary)', padding: 'var(--space-lg)', textAlign: 'center' }}>
                    {search.trim() ? 'No matches for your search. Try a different term.' : 'No community data yet. Run drift tests and your readings will show here.'}
                  </td>
                </tr>
              ) : (
                filteredAccountability.map((row) => {
                  const verdict = getVerdict(row)
                  return (
                    <tr key={row.reference}>
                      <td data-label="Brand">{row.brand}</td>
                      <td data-label="Model">{row.model}</td>
                      <td data-label="Ref">{row.reference}</td>
                      <td data-label="Claimed spec">{formatSpecRange(row.specLow, row.specHigh)}</td>
                      <td data-label="Community readings">
                        {row.readingCount} reading{row.readingCount !== 1 ? 's' : ''}
                        {canShowStats(row.readingCount) && row.avgDrift != null && (
                          <> · {row.avgDrift >= 0 ? '+' : ''}{row.avgDrift.toFixed(1)} s/day avg</>
                        )}
                        {canShowStats(row.readingCount) && row.pctInSpec != null && <> · {row.pctInSpec}% in spec</>}
                        {!canShowStats(row.readingCount) && row.readingCount > 0 && (
                          <> · Limited (privacy)</>
                        )}
                      </td>
                      <td data-label="Verdict">
                        <span className={`verdict verdict--${verdict.status}`}>{verdict.label}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'strictest' && (
        <div className="card discovery-table-card">
          <table className="discovery-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Ref</th>
                <th>Claimed spec</th>
                <th>Community readings</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filteredStrictest.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--text-secondary)', padding: 'var(--space-lg)', textAlign: 'center' }}>
                    {search.trim() ? 'No matches for your search. Try a different term.' : 'No watch specs available.'}
                  </td>
                </tr>
              ) : (
              filteredStrictest.map((w) => {
                const row = rows.find((r) => r.reference === w.reference) ?? {
                  brand: w.brand,
                  model: w.model,
                  reference: w.reference,
                  specLow: w.low,
                  specHigh: w.high,
                  readingCount: 0,
                  avgDrift: null,
                  pctInSpec: null,
                  inSpecCount: 0,
                }
                const verdict = getVerdict(row)
                return (
                  <tr key={w.reference}>
                    <td data-label="Brand">{row.brand}</td>
                    <td data-label="Model">{row.model}</td>
                    <td data-label="Ref">{row.reference}</td>
                    <td data-label="Claimed spec">{formatSpecRange(row.specLow, row.specHigh)}</td>
                    <td data-label="Community readings">
                      {row.readingCount > 0 ? (
                        <>
                          {row.readingCount} readings
                          {canShowStats(row.readingCount) && row.avgDrift != null && (
                            <> · {row.avgDrift >= 0 ? '+' : ''}{row.avgDrift.toFixed(1)} s/day · {row.pctInSpec}% in spec</>
                          )}
                          {!canShowStats(row.readingCount) && <> · Limited (privacy)</>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label="Verdict">
                      <span className={`verdict verdict--${verdict.status}`}>{verdict.label}</span>
                    </td>
                  </tr>
                )
              })
              )}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 'var(--space)' }}>
        Community data is aggregated only — individual users and readings are never shown. More readings = more reliable verdict.
      </p>
    </>
  )
}
