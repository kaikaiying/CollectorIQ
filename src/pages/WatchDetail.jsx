import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCollection } from '../App'
import { getDriftReadings } from '../lib/driftStorage'

export default function WatchDetail() {
  const { reference } = useParams()
  const [watch, setWatch] = useState(null)
  const [readings, setReadings] = useState([])

  useEffect(() => {
    const list = getCollection()
    const w = list.find((x) => x.reference === reference)
    setWatch(w || null)
    if (reference) setReadings(getDriftReadings(reference))
  }, [reference])

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
  const inSpec = readings.filter((r) => r.driftInSeconds >= min && r.driftInSeconds <= max).length
  const outSpec = readings.length - inSpec
  const avg = readings.length ? readings.reduce((a, r) => a + r.driftInSeconds, 0) / readings.length : null
  const sorted = [...readings].sort((a, b) => b.timestamp - a.timestamp)
  const recentOut = sorted.slice(0, 3).filter((r) => r.driftInSeconds < min || r.driftInSeconds > max).length
  const suggestService = readings.length >= 2 && recentOut >= 2

  return (
    <>
      <h1 className="page-title">{watch.model}</h1>
      <p style={{ color: '#888', marginTop: '-0.5rem', marginBottom: '1rem' }}>{watch.brand} · Ref: {watch.reference}</p>

      {suggestService && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: '1rem' }}>
          <strong style={{ color: '#f59e0b' }}>Consider service</strong>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: '#aaa' }}>
            Your watch is often outside the manufacturer’s spec. A service may help.
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Spec compliance</h3>
        <p style={{ fontSize: '0.9rem', color: '#888' }}>Manufacturer range: {min} to +{max} s/day</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ color: '#22c55e' }}>In spec: {inSpec}</span>
          <span style={{ color: '#ef4444' }}>Out of spec: {outSpec}</span>
        </div>
      </div>

      {avg !== null && (
        <div className="card">
          <p><strong>Average drift</strong> (from {readings.length} reading{readings.length !== 1 ? 's' : ''}): {avg >= 0 ? '+' : ''}{avg.toFixed(1)} s</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Drift history</h3>
        {sorted.length === 0 ? (
          <p style={{ color: '#888' }}>No readings yet. Run a drift test.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sorted.slice(0, 20).map((r) => (
              <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #2a2c2e' }}>
                <span style={{ fontSize: '0.9rem' }}>{r.timestamp.toLocaleDateString()} {r.timestamp.toLocaleTimeString()}</span>
                <span style={{ color: r.driftInSeconds < min || r.driftInSeconds > max ? '#ef4444' : '#22c55e' }}>
                  {r.driftInSeconds >= 0 ? '+' : ''}{r.driftInSeconds.toFixed(1)} s
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link to="/drift-test" className="btn" style={{ width: '100%' }}>Run drift test</Link>
      <Link to="/" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>Back to collection</Link>
    </>
  )
}
