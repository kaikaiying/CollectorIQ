const MIN_READINGS_FOR_COMMUNITY_STATS = 3 // Don't show exact mean below this to protect user privacy

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCollection, SYNC_COMPLETE_EVENT } from '../App'
import PageSeo from '../components/PageSeo'
import { getDriftReadings, addDriftReading } from '../lib/driftStorage'
import { pushReadingsToCloud } from '../lib/userDataSync'
import { uploadDriftReading, fetchAggregates } from '../lib/driftCloud'
import { fetchAtomicTimeOrDevice } from '../lib/atomicTime'
import { formatLocalTime, getTimezoneLabel } from '../lib/timezone'

function getNextTargetMinute() {
  const now = new Date()
  const target = new Date(now)
  target.setSeconds(0, 0)
  target.setMinutes(target.getMinutes() + 1)
  return target
}

function stdDev(values) {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sqDiffs = values.map((v) => (v - mean) ** 2)
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1))
}

function meanRatePerDay(readings) {
  if (readings.length < 2) return null
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
  let sumRate = 0
  let count = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const dt = (sorted[i + 1].timestamp - sorted[i].timestamp) / (1000 * 60 * 60 * 24)
    if (dt > 0) {
      sumRate += (sorted[i + 1].driftInSeconds - sorted[i].driftInSeconds) / dt
      count++
    }
  }
  return count > 0 ? sumRate / count : null
}

function rateStdDevPerDay(readings) {
  if (readings.length < 2) return null
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
  const rates = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const dt = (sorted[i + 1].timestamp - sorted[i].timestamp) / (1000 * 60 * 60 * 24)
    if (dt > 0) rates.push((sorted[i + 1].driftInSeconds - sorted[i].driftInSeconds) / dt)
  }
  return rates.length >= 2 ? stdDev(rates) : null
}

function roundTick(v) {
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 10) return String(Math.round(v))
  if (abs >= 1) return Number(v).toFixed(1)
  return Number(v).toFixed(2)
}

function DriftChart({ readings }) {
  const sorted = useMemo(() => [...readings].sort((a, b) => a.timestamp - b.timestamp), [readings])
  const drifts = sorted.map((r) => r.driftInSeconds)
  if (drifts.length < 2) return null

  const w = 400
  const h = 160
  const pad = { top: 20, right: 20, bottom: 28, left: 44 }
  const plotW = w - pad.left - pad.right
  const plotH = h - pad.top - pad.bottom
  const min = Math.min(0, ...drifts)
  const max = Math.max(0, ...drifts)
  const range = max - min || 1
  const xScale = (i) => pad.left + (i / Math.max(1, drifts.length - 1)) * plotW
  const yScale = (v) => pad.top + (max - v) / range * plotH

  const points = drifts.map((v, i) => [xScale(i), yScale(v)])
  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const areaD = pathD + ` L ${xScale(drifts.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`
  const zeroY = yScale(0)
  const zeroLine = min < 0 && max > 0 ? (
    <line x1={pad.left} y1={zeroY} x2={w - pad.right} y2={zeroY} className="drift-chart-zero" strokeWidth="1" strokeDasharray="4 3" />
  ) : null

  const yTicks = []
  if (max > min) {
    yTicks.push({ v: max, label: roundTick(max), y: pad.top })
    if (min < 0 && max > 0) yTicks.push({ v: 0, label: '0', y: zeroY })
    if (min !== max) yTicks.push({ v: min, label: roundTick(min), y: pad.top + plotH })
  }

  return (
    <div className="drift-chart-block">
      <div className="drift-chart-header">
        <span>Drift over time</span>
        <span className="drift-chart-n">{drifts.length} readings</span>
      </div>
      <div className="drift-chart-svg-wrap">
        <svg className="drift-chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="drift-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {zeroLine}
          <path d={areaD} fill="url(#drift-area)" stroke="none" />
          <path d={pathD} fill="none" className="drift-chart-line" strokeLinecap="round" strokeLinejoin="round" />
          {yTicks.map((t) => (
            <g key={t.label}>
              <line x1={pad.left - 4} y1={t.y} x2={pad.left} y2={t.y} className="drift-chart-tick" />
              <text x={pad.left - 8} y={t.y + 4} textAnchor="end" className="drift-chart-tick-label">{t.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="drift-chart-legend">
        <span>Oldest</span>
        <span>Newest</span>
      </div>
    </div>
  )
}

export default function DriftTest() {
  const [searchParams] = useSearchParams()
  const refFromUrl = searchParams.get('ref')
  const [watches, setWatches] = useState([])
  const [selectedRef, setSelectedRef] = useState('')
  const [targetTime, setTargetTime] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [result, setResult] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [readings, setReadings] = useState([])
  const [communityAgg, setCommunityAgg] = useState(null)
  const [referenceTime, setReferenceTime] = useState(null) // { serverDate, deviceAtFetch } for live reference

  const selectedWatch = watches.find((w) => w.reference === selectedRef)

  useEffect(() => {
    if (selectedRef) setReadings(getDriftReadings(selectedRef))
    const onSync = () => { if (selectedRef) setReadings(getDriftReadings(selectedRef)) }
    window.addEventListener(SYNC_COMPLETE_EVENT, onSync)
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, onSync)
  }, [selectedRef])

  useEffect(() => {
    if (!selectedRef) return
    fetchAggregates()
      .then((aggs) => aggs.find((a) => a.reference === selectedRef) ?? null)
      .then(setCommunityAgg)
      .catch(() => setCommunityAgg(null))
  }, [selectedRef])

  const driftStats = useMemo(() => {
    if (readings.length === 0) return null
    const drifts = [...readings.map((r) => r.driftInSeconds)].sort((a, b) => a - b)
    const n = drifts.length
    const mean = drifts.reduce((a, b) => a + b, 0) / n
    const std = stdDev(drifts)
    const meanRate = meanRatePerDay(readings)
    const rateStd = rateStdDevPerDay(readings)
    const min = drifts[0]
    const max = drifts[n - 1]
    const median = n % 2 === 1 ? drifts[(n - 1) / 2] : (drifts[n / 2 - 1] + drifts[n / 2]) / 2
    const specMin = selectedWatch?.specMin ?? -999
    const specMax = selectedWatch?.specMax ?? 999
    const inSpecCount = readings.filter((r) => r.driftInSeconds >= specMin && r.driftInSeconds <= specMax).length
    return {
      mean, std, meanRate, rateStd, n, min, max, median,
      inSpecCount,
      specMin,
      specMax,
    }
  }, [readings, selectedWatch])

  const setNewTarget = useCallback(() => {
    setTargetTime(getNextTargetMinute())
    setResult(null)
  }, [])

  const adjustTarget = useCallback((deltaSeconds) => {
    if (!targetTime) return
    const next = new Date(targetTime.getTime() + deltaSeconds * 1000)
    setTargetTime(next)
    setResult(null)
  }, [targetTime])

  const targetParts = targetTime
    ? {
        h: targetTime.getHours(),
        m: targetTime.getMinutes(),
        s: targetTime.getSeconds(),
      }
    : null
  const pad = (n) => String(n).padStart(2, '0')

  useEffect(() => {
    const list = getCollection()
    setWatches(list)
    if (list.length === 0) return
    const refToSelect = refFromUrl && list.some((w) => w.reference === refFromUrl)
      ? refFromUrl
      : list[0].reference
    setSelectedRef(refToSelect)
    const onSync = () => {
      const next = getCollection()
      setWatches(next)
      if (next.length > 0) {
        setSelectedRef((prev) => (next.some((w) => w.reference === prev) ? prev : next[0].reference))
      }
    }
    window.addEventListener(SYNC_COMPLETE_EVENT, onSync)
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, onSync)
  }, [refFromUrl])

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

  // Fetch reference (atomic/server) time for display; refresh every 30s
  useEffect(() => {
    let cancelled = false
    const fetchRef = () => {
      fetchAtomicTimeOrDevice().then(({ date }) => {
        if (!cancelled) setReferenceTime({ serverDate: date, deviceAtFetch: new Date() })
      }).catch(() => {})
    }
    fetchRef()
    const id = setInterval(fetchRef, 30000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Live-updating reference time (server time + elapsed since last fetch)
  const nowRef = referenceTime
    ? new Date(referenceTime.serverDate.getTime() + (Date.now() - referenceTime.deviceAtFetch.getTime()))
    : null

  const getShareUrl = useCallback(() => {
    if (!selectedWatch || !driftStats) return ''
    const payload = {
      brand: selectedWatch.brand,
      model: selectedWatch.model,
      reference: selectedWatch.reference,
      n: driftStats.n,
      mean: driftStats.mean,
      pctInSpec: driftStats.n > 0 ? Math.round((driftStats.inSpecCount / driftStats.n) * 100) : null,
    }
    return `${window.location.origin}/share?d=${btoa(JSON.stringify(payload))}`
  }, [selectedWatch, driftStats])

  const [shareCopied, setShareCopied] = useState(false)
  const handleShare = useCallback(async () => {
    const url = getShareUrl()
    if (!url) return
    if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `${selectedWatch?.brand} ${selectedWatch?.model} accuracy`,
          text: `My ${selectedWatch?.brand} ${selectedWatch?.model}: ${driftStats?.n} readings, ${driftStats?.mean != null ? (driftStats.mean >= 0 ? '+' : '') + driftStats.mean.toFixed(1) : '—'} s mean. Tracked with Collector IQ.`,
          url,
        })
      } catch (e) {
        if (e.name !== 'AbortError') copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }, [getShareUrl, selectedWatch, driftStats])

  function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const handleTap = async () => {
    if (!selectedWatch || syncing) return
    setSyncing(true)
    setResult(null)
    try {
      const { date: atomicAtTap, fromServer } = await fetchAtomicTimeOrDevice()
      const driftSeconds = (atomicAtTap - targetTime) / 1000
      addDriftReading(selectedWatch.reference, driftSeconds, atomicAtTap)
      const updated = getDriftReadings(selectedWatch.reference)
      setReadings(updated)
      pushReadingsToCloud(selectedWatch.reference, updated).catch(() => {})
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
    <div className="drift-test-page">
      <PageSeo title="Drift test" description="Drift test your watch against atomic clock. Tap when it hits the target — measure accuracy in s/day. Collector IQ is the #1 watch atomic tracker." />
      <div className="drift-test-header">
        <h1 className="drift-test-title">Drift test</h1>
        <p className="drift-test-sub">Tap when your watch hits the target time. Server-synced accuracy.</p>
      </div>

      <p className="label" style={{ marginBottom: '0.5rem' }}>Watch to test</p>
      <div className="drift-watch-cards">
        {watches.map((w) => (
          <button
            key={w.reference}
            type="button"
            onClick={() => setSelectedRef(w.reference)}
            className={`drift-watch-card ${selectedRef === w.reference ? 'selected' : ''}`}
          >
            <strong>{w.model}</strong>
            <span className="drift-watch-meta">{w.brand} · {w.reference}</span>
          </button>
        ))}
      </div>

      {/* Tap area */}
      <div className="card drift-target-card">
        <p className="label" style={{ marginBottom: '0.25rem' }}>Tap when your watch shows</p>
        {targetParts ? (
          <div className="target-time-editable">
            <div className="target-time-segment">
              <button type="button" className="target-arrow" onClick={() => adjustTarget(3600)} aria-label="Add 1 hour">↑</button>
              <span className="target-digit">{pad(targetParts.h)}</span>
              <button type="button" className="target-arrow" onClick={() => adjustTarget(-3600)} aria-label="Subtract 1 hour">↓</button>
            </div>
            <span className="target-time-colon">:</span>
            <div className="target-time-segment">
              <button type="button" className="target-arrow" onClick={() => adjustTarget(60)} aria-label="Add 1 minute">↑</button>
              <span className="target-digit">{pad(targetParts.m)}</span>
              <button type="button" className="target-arrow" onClick={() => adjustTarget(-60)} aria-label="Subtract 1 minute">↓</button>
            </div>
            <span className="target-time-colon">:</span>
            <div className="target-time-segment">
              <button type="button" className="target-arrow" onClick={() => adjustTarget(10)} aria-label="Add 10 seconds">↑</button>
              <span className="target-digit">{pad(targetParts.s)}</span>
              <button type="button" className="target-arrow" onClick={() => adjustTarget(-10)} aria-label="Subtract 10 seconds">↓</button>
            </div>
          </div>
        ) : (
          <div className="target-time">—</div>
        )}
        <p className="tz-label" style={{ margin: 0 }}>{getTimezoneLabel()}</p>
        {nowRef && (
          <p className="drift-reference-time" style={{ margin: '0.5rem 0 0' }}>
            Reference time: <strong>{pad(nowRef.getHours())}:{pad(nowRef.getMinutes())}:{pad(nowRef.getSeconds())}</strong>
          </p>
        )}
        {countdown !== null && countdown > 0 && <p className="countdown">in {countdown} s</p>}
        {countdown === 0 && <p className="tap-now">Tap now</p>}
      </div>

      <button type="button" className="btn" style={{ width: '100%', minHeight: 56, fontSize: '1.1rem' }} onClick={handleTap} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Tap'}
      </button>
      <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={setNewTarget}>
        New target time
      </button>

      {/* Stats + chart – full width, vertical, readable */}
      {selectedRef && readings.length > 0 && driftStats && (
        <div className="card drift-overview-card">
          <h2 className="drift-overview-title">Your drift data</h2>
          <p className="drift-overview-meta">{driftStats.n} reading{driftStats.n !== 1 ? 's' : ''} · Each tap records seconds fast (+) or slow (−) vs atomic clock</p>

          {readings.length >= 2 && <DriftChart readings={readings} />}

          <table className="drift-stats-table">
            <tbody>
              {driftStats.meanRate != null && (
                <tr>
                  <th>Rate</th>
                  <td>{driftStats.meanRate >= 0 ? '+' : ''}{driftStats.meanRate.toFixed(1)} s/day</td>
                </tr>
              )}
              <tr>
                <th>Mean offset</th>
                <td>{driftStats.mean >= 0 ? '+' : ''}{driftStats.mean.toFixed(2)} s</td>
              </tr>
              {driftStats.n >= 2 && (
                <tr>
                  <th>Consistency (std dev)</th>
                  <td>±{driftStats.std.toFixed(2)} s</td>
                </tr>
              )}
            </tbody>
          </table>

          {selectedWatch && (selectedWatch.specMin != null || selectedWatch.specMax != null) && (
            <div className="drift-spec-block">
              <h3 className="drift-spec-title">Spec compliance</h3>
              <p className="drift-spec-range">Manufacturer: {driftStats.specMin} to +{driftStats.specMax} s/day</p>
              <p className="drift-spec-count"><strong>{driftStats.inSpecCount} / {driftStats.n}</strong> readings within spec ({Math.round((driftStats.inSpecCount / driftStats.n) * 100)}%)</p>
            </div>
          )}

          {communityAgg && communityAgg.readingCount > 0 && (
            <div className="drift-community-block">
              <h3 className="drift-community-title">Community</h3>
              <p className="drift-community-meta">
                {communityAgg.readingCount} reading{communityAgg.readingCount !== 1 ? 's' : ''}
                {communityAgg.readingCount >= MIN_READINGS_FOR_COMMUNITY_STATS ? (
                  <> · mean {(communityAgg.sumDrift / communityAgg.readingCount) >= 0 ? '+' : ''}{(communityAgg.sumDrift / communityAgg.readingCount).toFixed(2)} s</>
                ) : (
                  <> · Limited (privacy)</>
                )}
              </p>
              {communityAgg.readingCount >= MIN_READINGS_FOR_COMMUNITY_STATS && (
                <p className="drift-community-compare">
                  You: <strong>{driftStats.mean >= 0 ? '+' : ''}{driftStats.mean.toFixed(2)} s</strong> · Community: <strong>{(communityAgg.sumDrift / communityAgg.readingCount) >= 0 ? '+' : ''}{(communityAgg.sumDrift / communityAgg.readingCount).toFixed(2)} s</strong>
                </p>
              )}
            </div>
          )}

          <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleShare} aria-label="Share results">
            {shareCopied ? 'Link copied!' : 'Share results'}
          </button>
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 'var(--space-lg)', color: 'var(--text)' }}>
          {result.error ? (
            <p style={{ color: 'var(--danger)', margin: 0 }}>{result.error}</p>
          ) : (
            <>
              <p style={{ margin: 0, color: 'var(--text)' }}>
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
    </div>
  )
}
