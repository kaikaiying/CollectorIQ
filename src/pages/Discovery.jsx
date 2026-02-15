import { useState, useEffect } from 'react'

function parseSpec(s) {
  if (!s || typeof s !== 'string') return null
  const n = parseFloat(s.replace(/[^0-9.+-]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export default function Discovery() {
  const [specs, setSpecs] = useState([])

  useEffect(() => {
    fetch('/watchspecs.json')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSpecs(Array.isArray(data) ? data : []))
      .catch(() => setSpecs([]))
  }, [])

  const withRange = specs
    .map((w) => ({
      ...w,
      low: parseSpec(w.spec_low),
      high: parseSpec(w.spec_high),
    }))
    .filter((w) => w.low != null && w.high != null)

  const specWidth = (w) => (w.high - w.low)
  const byStrictness = [...withRange].sort((a, b) => specWidth(a) - specWidth(b))

  const byBrand = {}
  withRange.forEach((w) => {
    if (!byBrand[w.brand]) byBrand[w.brand] = []
    byBrand[w.brand].push(w)
  })
  const brandAvgStrictness = Object.entries(byBrand).map(([brand, list]) => {
    const avg = list.reduce((a, x) => a + specWidth(x), 0) / list.length
    return { brand, avg, count: list.length }
  }).sort((a, b) => a.avg - b.avg)

  return (
    <>
      <h1 className="page-title">Discovery</h1>
      <p style={{ color: '#888', marginBottom: '1rem' }}>
        Which brands claim the tightest accuracy? (Smaller range = stricter spec.)
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Strictest brands (by average spec range)</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {brandAvgStrictness.slice(0, 12).map(({ brand, avg, count }) => (
            <li key={brand} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #2a2c2e' }}>
              <span>{brand}</span>
              <span style={{ color: '#888' }}>±{avg.toFixed(0)} s/day ({count} models)</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Tightest individual specs</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {byStrictness.slice(0, 15).map((w) => (
            <li key={w.reference} style={{ padding: '0.4rem 0', borderBottom: '1px solid #2a2c2e' }}>
              <strong>{w.brand} {w.model}</strong>
              <div style={{ fontSize: '0.85rem', color: '#888' }}>{w.spec_low} to {w.spec_high}</div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
