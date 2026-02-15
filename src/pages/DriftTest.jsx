import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCollection } from '../App'
import { addDriftReading } from '../lib/driftStorage'
import { fetchAtomicTime } from '../lib/atomicTime'

function formatTime(d) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export default function DriftTest() {
  const [watches, setWatches] = useState([])
  const [selectedRef, setSelectedRef] = useState('')
  const [selectedTime, setSelectedTime] = useState({ h: 0, m: 0, s: 0 })
  const [liveTime, setLiveTime] = useState(new Date())
  const [message, setMessage] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setWatches(getCollection())
    const ref = getCollection()[0]?.reference
    if (ref) setSelectedRef(ref)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const selectedWatch = watches.find((w) => w.reference === selectedRef)

  const handleTap = async () => {
    if (!selectedWatch) return
    setSyncing(true)
    setMessage(null)
    try {
      const atomicTime = await fetchAtomicTime()
      const { h, m, s } = selectedTime
      const watchShows = new Date()
      watchShows.setHours(h, m, s, 0)
      const drift = (atomicTime - watchShows) / 1000 // seconds
      addDriftReading(selectedWatch.reference, drift, atomicTime)
      const abs = Math.abs(drift).toFixed(1)
      if (drift > 0) setMessage(`Your watch is ${abs}s slow (real time is ahead).`)
      else if (drift < 0) setMessage(`Your watch is ${abs}s fast (ahead of real time).`)
      else setMessage('Spot on!')
    } catch (err) {
      setMessage('Could not sync with server. Check connection and try again.')
    } finally {
      setSyncing(false)
    }
  }

  if (watches.length === 0) {
    return (
      <div className="card">
        <p>Add a watch in Collection first.</p>
        <Link to="/" className="btn">Go to collection</Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="page-title">Drift test</h1>
      <p style={{ color: '#888', marginBottom: '1rem' }}>
        Tap the button when your watch matches the time below. We use server time at tap.
      </p>

      <div className="card">
        <div style={{ fontSize: '2rem', fontVariantNumeric: 'tabular-nums', marginBottom: '0.5rem' }}>
          {formatTime(liveTime)}
        </div>
        <label className="label">Watch to test</label>
        <select className="select" value={selectedRef} onChange={(e) => setSelectedRef(e.target.value)}>
          {watches.map((w) => (
            <option key={w.reference} value={w.reference}>{w.brand} {w.model}</option>
          ))}
        </select>
        <label className="label" style={{ marginTop: '1rem' }}>Time your watch shows (when you tap)</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select className="select" style={{ flex: 1 }} value={selectedTime.h} onChange={(e) => setSelectedTime((t) => ({ ...t, h: +e.target.value }))}>
            {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
          </select>
          <select className="select" style={{ flex: 1 }} value={selectedTime.m} onChange={(e) => setSelectedTime((t) => ({ ...t, m: +e.target.value }))}>
            {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
          </select>
          <select className="select" style={{ flex: 1 }} value={selectedTime.s} onChange={(e) => setSelectedTime((t) => ({ ...t, s: +e.target.value }))}>
            {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
          </select>
        </div>
      </div>

      <button type="button" className="btn" style={{ width: '100%' }} onClick={handleTap} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Tap when your watch matches this time'}
      </button>

      {message && <div className="card" style={{ marginTop: '1rem' }}>{message}</div>}

      {selectedWatch && (
        <Link to={`/watch/${encodeURIComponent(selectedWatch.reference)}`} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
          View history & dashboard
        </Link>
      )}
    </>
  )
}
