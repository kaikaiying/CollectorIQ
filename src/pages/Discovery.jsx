import { useState, useEffect, useMemo } from 'react'
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

export default function Discovery() {
  const [specs, setSpecs] = useState([])
  const [aggregates, setAggregates] = useState([])
  const [loading, setLoading] = useState(true)
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

  const aggByRef = useMemo(() => {
    const map = {}
    aggregates.forEach((a) => { map[a.reference] = a })
    return map
  }, [aggregates])

  const rows = useMemo(() =>
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
      }
    }),
    [withRange, aggByRef]
  )

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

  if (loading) {
    return <p className="page-title">Loading…</p>
  }

  return (
    <>
      <PageSeo title="Discovery" description="Community watch accuracy data vs manufacturer specs (s/day). See how Omega, Rolex, Seiko perform. Watch atomic tracker with real-world data." />
      <h1 className="page-title">Discovery</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space)' }}>
        Community accuracy vs manufacturer specs. Which brands deliver?
      </p>

      <div className="discovery-search-wrap">
        <input
          type="text"
          placeholder="Search brand, model, or reference (e.g. Omega Speedmaster)"
          value={search}
          onChange={(e) => {
            const v = e.target.value
            setSearch(v)
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="discovery-search-input"
          aria-label="Search watches"
        />
      </div>

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
              <div key={`${row.brand}-${row.model}-${row.reference}-${i}`} className="card discovery-card">
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
                      {canShowStats(row.readingCount) && row.avgDrift != null && (
                        <> · {row.avgDrift >= 0 ? '+' : ''}{row.avgDrift.toFixed(1)} s/day avg</>
                      )}
                      {canShowStats(row.readingCount) && row.pctInSpec != null && (
                        <> · {row.pctInSpec}% in spec</>
                      )}
                      {!canShowStats(row.readingCount) && <> · Limited (privacy)</>}
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 'var(--space)' }}>
        Community data is aggregated only. More readings = more reliable. Run drift tests to contribute.
      </p>
    </>
  )
}
