import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getCollection } from '../App'
import { addDriftReading } from '../lib/driftStorage'
import { uploadDriftReading } from '../lib/driftCloud'
import { fetchAtomicTimeOrDevice } from '../lib/atomicTime'
import { formatLocalTime, getTimezoneLabel } from '../lib/timezone'

function getNextTargetMinute() {
  const now = new Date()
  const target = new Date(now)
  target.setSeconds(0, 0)
  target.setMinutes(target.getMinutes() + 1)
  return target
}

export default function DriftTest() {
  const [watches, setWatches] = useState([])
  const [selectedRef, setSelectedRef] = useState('')
  const [targetTime, setTargetTime] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [result, setResult] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const selectedWatch = watches.find((w) => w.reference === selectedRef)

  const setNewTarget = useCallback(() => {
    setTargetTime(getNextTargetMinute())
    setResult(null)
  }, [])

  useEffect(() => {
    const list = getCollection()
    setWatches(list)
    if (list.length && !selectedRef) setSelectedRef(list[0].reference)
  }, [])

  useEffect(() => {
    if (targetTime === null) setNewTarget()
  }, [targetTime, setNewTarget])

  useEffect(() => {
    if (!targetTime) return
    const tick = () => {
      const now = new Date()
      const secs = Math.max(0, Math.round((targetTime - now) / 1000))
      setCountdown(secs)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetTime])

  const handleTap = async () => {
    if (!selectedWatch || syncing) return
    setSyncing(true)
    setResult(null)
    try {
      const { date: atomicAtTap, fromServer } = await fetchAtomicTimeOrDevice()
      const driftSeconds = (atomicAtTap - targetTime) / 1000
      addDriftReading(selectedWatch.reference, driftSeconds, atomicAtTap)
      uploadDriftReading(
        {
          reference: selectedWatch.reference,
          brand: selectedWatch.brand,
          model: selectedWatch.model,
          specMin: selectedWatch.specMin,
          specMax: selectedWatch.specMax,
        },
        driftSeconds,
        atomicAtTap
      ).catch(() => {})
      setResult({ drift: driftSeconds, fromServer })
      setNewTarget()
    } catch (err) {
      setResult({ error: 'Something went wrong. Try again.' })
    } finally {
      setSyncing(false)
    }
  }

  if (watches.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Add a watch in Collection first.</p>
        <Link to="/" className="btn">Go to collection</Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="page-title">Drift test</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
        Pick a watch, then tap when it shows the target time below (in your timezone). We compare with server time.
      </p>

      {/* Easy watch selection – tappable cards */}
      <p className="label" style={{ marginBottom: '0.5rem' }}>Watch to test</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: 'var(--space-lg)' }}>
        {watches.map((w) => (
          <button
            key={w.reference}
            type="button"
            onClick={() => setSelectedRef(w.reference)}
            className="card"
            style={{
              textAlign: 'left',
              border: '2px solid transparent',
              borderColor: selectedRef === w.reference ? 'var(--accent)' : 'transparent',
              background: selectedRef === w.reference ? 'rgba(235, 182, 12, 0.08)' : 'var(--bg-card)',
              cursor: 'pointer',
            }}
          >
            <strong>{w.model}</strong>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{w.brand} · {w.reference}</div>
          </button>
        ))}
      </div>

      {/* Target time + tap area – always in user's local timezone */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space)' }}>
        <p className="label" style={{ marginBottom: '0.25rem' }}>Tap when your watch shows</p>
        <div style={{ fontSize: '2.5rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600, marginBottom: '0.15rem' }}>
          {targetTime ? formatLocalTime(targetTime) : '—'}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
          {getTimezoneLabel()}
        </p>
        {countdown !== null && countdown > 0 && (
          <p style={{ fontSize: 15, color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>in {countdown} s</p>
        )}
        {countdown === 0 && <p style={{ fontSize: 15, color: 'var(--accent)', marginTop: '0.5rem' }}>Tap now</p>}
      </div>

      <button
        type="button"
        className="btn"
        style={{ width: '100%', minHeight: 56, fontSize: '1.1rem' }}
        onClick={handleTap}
        disabled={syncing}
      >
        {syncing ? 'Syncing…' : 'Tap'}
      </button>

      <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={setNewTarget}>
        New target time
      </button>

      {result && (
        <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
          {result.error ? (
            <p style={{ color: 'var(--danger)', margin: 0 }}>{result.error}</p>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                {result.drift > 0 && `Watch is ${Math.abs(result.drift).toFixed(1)} s slow (behind real time).`}
                {result.drift < 0 && `Watch is ${Math.abs(result.drift).toFixed(1)} s fast (ahead of real time).`}
                {result.drift === 0 && 'Spot on!'}
              </p>
              {result.fromServer === false && (
                <p style={{ margin: '0.5rem 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Used device time (server unavailable). Result is approximate.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {selectedWatch && (
        <Link
          to={`/watch/${encodeURIComponent(selectedWatch.reference)}`}
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 'var(--space)' }}
        >
          View history & spec
        </Link>
      )}
    </>
  )
}
