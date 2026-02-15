import { useState, useEffect } from 'react'
import { fetchAggregates } from '../lib/driftCloud'

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

export default function Discovery() {
  const [specs, setSpecs] = useState([])
  const [aggregates, setAggregates] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('accountability') // 'accountability' | 'strictest'

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

  const getVerdict = (row) => {
    if (row.readingCount === 0) return { label: 'No data yet', status: 'none' }
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
      <h1 className="page-title">Discovery</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
        Collective real-world accuracy vs manufacturer specs. See if brands deliver what they claim.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-lg)' }}>
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

      {view === 'accountability' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="discovery-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Reference</th>
                <th>Manufacturer spec</th>
                <th>Community</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {sortedByAccountability.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--text-secondary)', padding: 'var(--space-lg)', textAlign: 'center' }}>
                    No community data yet. Run drift tests and your readings will show here.
                  </td>
                </tr>
              ) : (
                sortedByAccountability.map((row) => {
                  const verdict = getVerdict(row)
                  return (
                    <tr key={row.reference}>
                      <td data-label="Brand">{row.brand}</td>
                      <td data-label="Model">{row.model}</td>
                      <td data-label="Reference">{row.reference}</td>
                      <td data-label="Manufacturer spec">{formatSpecRange(row.specLow, row.specHigh)}</td>
                      <td data-label="Community">
                        {row.readingCount} reading{row.readingCount !== 1 ? 's' : ''}
                        {row.avgDrift != null && (
                          <> · {row.avgDrift >= 0 ? '+' : ''}{row.avgDrift.toFixed(1)} s/day avg</>
                        )}
                        {row.pctInSpec != null && <> · {row.pctInSpec}% in spec</>}
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
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Strictest manufacturer specs (claimed)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 'var(--space)' }}>
              Smaller range = stricter claim. Community data shows whether they hold up.
            </p>
            <table className="discovery-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Spec</th>
                  <th>Community</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {byStrictness.slice(0, 20).map((w) => {
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
                      <td data-label="Spec">{formatSpecRange(row.specLow, row.specHigh)}</td>
                      <td data-label="Community">
                        {row.readingCount > 0 ? (
                          <>{row.readingCount} readings · {row.avgDrift >= 0 ? '+' : ''}{row.avgDrift?.toFixed(1)} s/day · {row.pctInSpec}% in spec</>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td data-label="Verdict">
                        <span className={`verdict verdict--${verdict.status}`}>{verdict.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 'var(--space)' }}>
        Community data is from all users’ drift tests. More readings = more reliable verdict.
      </p>
    </>
  )
}
