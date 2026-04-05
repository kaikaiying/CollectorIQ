const MIN_READINGS_FOR_COMMUNITY_STATS = 3 // Don't show exact mean below this to protect user privacy

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../contexts/PageTitleContext'
import { getCollection, SYNC_COMPLETE_EVENT } from '../App'
import PageSeo from '../components/PageSeo'
import { getDriftReadings, addDriftReading, startNewRun } from '../lib/driftStorage'
import { pushReadingsToCloud } from '../lib/userDataSync'
import { uploadDriftReading, fetchAggregates } from '../lib/driftCloud'
import { fetchAtomicTimeOrDevice } from '../lib/atomicTime'
import { formatLocalTime, getTimezoneLabel } from '../lib/timezone'
import { rateBasedInSpecCount } from '../lib/driftStats'
import InfoTip from '../components/InfoTip'
import DriftTapDemoIllustration from '../components/DriftTapDemoIllustration'
import {
  DriftContextChipsVisual,
  DriftOverviewCardVisual,
  LastTapResultVisual,
  CollectionEmptyDriftVisual,
  SpecComplianceVisual,
  DiscoveryVisual,
  NewMeasurementRunCardVisual,
  ShareLinkVisual,
} from '../components/InfoTipFigures'
import { DRIFT_POSITION_OPTIONS, DRIFT_WINDING_OPTIONS } from '../lib/driftReadingContext'

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

function DriftChart({ readings, mode = 'drift' }) {
  const sorted = useMemo(() => [...readings].sort((a, b) => a.timestamp - b.timestamp), [readings])
  const values = useMemo(() => {
    if (mode === 'rate') {
      const rates = []
      for (let i = 0; i < sorted.length - 1; i++) {
        const dt = (sorted[i + 1].timestamp - sorted[i].timestamp) / (1000 * 60 * 60 * 24)
        if (dt > 0) rates.push((sorted[i + 1].driftInSeconds - sorted[i].driftInSeconds) / dt)
      }
      return rates
    }
    return sorted.map((r) => r.driftInSeconds)
  }, [sorted, mode])

  if (values.length < (mode === 'rate' ? 1 : 2)) return null

  const w = 400
  const h = 160
  const pad = { top: 20, right: 20, bottom: 28, left: 44 }
  const plotW = w - pad.left - pad.right
  const plotH = h - pad.top - pad.bottom
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const range = max - min || 1
  const xScale = (i) => pad.left + (i / Math.max(1, values.length - 1)) * plotW
  const yScale = (v) => pad.top + (max - v) / range * plotH

  const points = values.map((v, i) => [xScale(i), yScale(v)])
  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const areaD = pathD + ` L ${xScale(values.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`
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

  const title = mode === 'rate' ? 'Rate over time' : 'Drift over time'
  const nLabel = mode === 'rate' ? `${values.length} interval${values.length !== 1 ? 's' : ''}` : `${readings.length} readings`

  return (
    <div className="drift-chart-block">
      <div className="drift-chart-header">
        <span>{title}</span>
        <span className="drift-chart-n">{nLabel}</span>
      </div>
      <div className="drift-chart-svg-wrap">
        <svg className="drift-chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="drift-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(71,85,105,0.12)" />
              <stop offset="100%" stopColor="rgba(71,85,105,0)" />
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

export default function DriftTest({ embed = false, hideStartNewRun = false }) {
  usePageTitle(embed ? 'Collection' : 'Drift test')
  const [searchParams, setSearchParams] = useSearchParams()
  const refFromUrl = searchParams.get('ref')
  const [watches, setWatches] = useState([])
  const [selectedRef, setSelectedRef] = useState('')
  const [targetTime, setTargetTime] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [result, setResult] = useState(null)
  const [readings, setReadings] = useState([])
  const [communityAgg, setCommunityAgg] = useState(null)
  const [referenceTime, setReferenceTime] = useState(null) // { serverDate, deviceAtFetch } for live reference
  const [chartMode, setChartMode] = useState('drift') // 'drift' | 'rate'
  const [, setTick] = useState(0) // force re-render every second so reference time display updates
  const tapLockRef = useRef(false)
  const [tapPosition, setTapPosition] = useState('')
  const [tapWinding, setTapWinding] = useState('')
  const refFromUrlRef = useRef(refFromUrl)
  refFromUrlRef.current = refFromUrl

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
    const { inSpecCount, rateIntervalCount } = rateBasedInSpecCount(readings, specMin, specMax)
    return {
      mean, std, meanRate, rateStd, n, min, max, median,
      inSpecCount,
      rateIntervalCount,
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
      if (next.length === 0) return
      const urlRef = refFromUrlRef.current
      if (embed && urlRef && next.some((w) => w.reference === urlRef)) {
        setSelectedRef(urlRef)
        return
      }
      setSelectedRef((prev) => (next.some((w) => w.reference === prev) ? prev : next[0].reference))
    }
    window.addEventListener(SYNC_COMPLETE_EVENT, onSync)
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, onSync)
  }, [refFromUrl, embed])

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

  // Fetch reference (atomic/server) time; refresh every 20s and when target/countdown changes
  useEffect(() => {
    let cancelled = false
    const fetchRef = () => {
      fetchAtomicTimeOrDevice().then(({ date, fromServer }) => {
        if (!cancelled) setReferenceTime({ serverDate: date, deviceAtFetch: new Date(), fromServer })
      }).catch(() => {})
    }
    fetchRef()
    const id = setInterval(fetchRef, 20000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Refresh when target is set and when countdown hits 20s so tap always has fresh reference
  useEffect(() => {
    if (!targetTime) return
    fetchAtomicTimeOrDevice().then(({ date, fromServer }) => {
      setReferenceTime({ serverDate: date, deviceAtFetch: new Date(), fromServer })
    }).catch(() => {})
  }, [targetTime?.getTime()])

  useEffect(() => {
    if (countdown === 20) {
      fetchAtomicTimeOrDevice().then(({ date, fromServer }) => {
        setReferenceTime({ serverDate: date, deviceAtFetch: new Date(), fromServer })
      }).catch(() => {})
    }
  }, [countdown])

  // Tick every second so reference time display updates continuously
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
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
          text: `My ${selectedWatch?.brand} ${selectedWatch?.model}: ${driftStats?.n} readings, ${driftStats?.mean != null ? (driftStats.mean >= 0 ? '+' : '') + driftStats.mean.toFixed(1) : '—'} s mean. Tracked with Watch Collector.`,
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

  const handleTap = () => {
    if (!selectedWatch || !referenceTime || tapLockRef.current) return
    tapLockRef.current = true
    setResult(null)
    const atomicAtTap = new Date(referenceTime.serverDate.getTime() + (Date.now() - referenceTime.deviceAtFetch.getTime()))
    const driftSeconds = (targetTime - atomicAtTap) / 1000
    addDriftReading(selectedWatch.reference, driftSeconds, atomicAtTap, {
      position: tapPosition || undefined,
      winding: tapWinding || undefined,
    })
    const updated = getDriftReadings(selectedWatch.reference)
    setReadings(updated)
    setResult({ drift: driftSeconds, fromServer: referenceTime.fromServer !== false })
    setNewTarget()
    queueMicrotask(() => {
      pushReadingsToCloud(selectedWatch.reference, updated).catch(() => {})
      uploadDriftReading(
        { reference: selectedWatch.reference, brand: selectedWatch.brand, model: selectedWatch.model, specMin: selectedWatch.specMin, specMax: selectedWatch.specMax },
        driftSeconds,
        atomicAtTap
      ).catch(() => {})
    })
    setTimeout(() => { tapLockRef.current = false }, 80)
  }

  if (watches.length === 0) {
    if (embed) return null
    return (
      <div className="card">
        <div className="label-with-info" style={{ marginBottom: '0.75rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Add a watch in Collection first.</p>
          <InfoTip label="Why this screen is empty">
            <p>
              Drift readings are stored <strong>per reference</strong>. Add a watch on the home screen, then come back here to run taps against atomic time for it.
            </p>
            <CollectionEmptyDriftVisual />
          </InfoTip>
        </div>
        <Link to="/" className="btn">Go to collection</Link>
      </div>
    )
  }

  return (
    <div className={`drift-test-page ${embed ? 'drift-test-page--embed' : ''}`}>
      {!embed && (
        <PageSeo title="Drift test" description="Drift test your watch against atomic time. Tap at the target — measure accuracy in s/day. Watch Collector — Accuracy Tracker." />
      )}
      <div className="drift-test-header">
        <div className="label-with-info" style={{ alignItems: 'flex-start' }}>
          <p className="drift-test-sub" style={{ margin: 0 }}>
            {embed
              ? 'Tap at the target for the selected watch (timing only — not the wear calendar above).'
              : 'Tap when your watch hits the target time. Server-synced accuracy.'}
          </p>
          {embed ? (
            <InfoTip label="Embedded drift tester">
              <p>
                This block only records <strong>timing taps</strong> for the watch you picked in the list above. <strong>Wear</strong> is a separate tab — it never changes when you tap here.
              </p>
            </InfoTip>
          ) : (
            <InfoTip label="This drift screen">
              <p>
                Standalone path to the same tool as <strong>Collection → Drift</strong>. Pick a watch, align the target with your handset, tap when the second hits — we store offset vs network time when available.
              </p>
            </InfoTip>
          )}
        </div>
      </div>

      {!embed && (
        <>
          <div className="label-with-info" style={{ marginBottom: '0.5rem' }}>
            <p className="label" style={{ margin: 0 }}>Watch to test</p>
            <InfoTip label="Choosing a watch here">
              <p>
                Each card is a watch from your collection. The active one receives new taps and shows stats below — same data you’ll see under <strong>Collection → Drift</strong> for that ref.
              </p>
            </InfoTip>
          </div>
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
        </>
      )}

      {selectedRef && !hideStartNewRun && (
        <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          <div className="label-with-info" style={{ marginBottom: '0.4rem' }}>
            <p className="label" style={{ margin: 0 }}>Start a new measurement run</p>
            <InfoTip label="New run on this page">
              <p>
                Same control as <strong>Readings → Start new run</strong>: labels the next taps as a separate group. Older taps stay in the log and still feed overall stats until you delete a run.
              </p>
              <NewMeasurementRunCardVisual />
            </InfoTip>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.65rem 1rem', fontSize: 15 }}
            onClick={() => {
              startNewRun(selectedRef)
              setReadings(getDriftReadings(selectedRef))
              pushReadingsToCloud(selectedRef, getDriftReadings(selectedRef)).catch(() => {})
              window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT))
            }}
          >
            Start new run
          </button>
          <p style={{ margin: '0.35rem 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
            Adjusted your watch? Keeps history. Stats include all runs.
          </p>
        </div>
      )}

      {/* Tap area */}
      <div className="card drift-target-card">
        <div className="label-with-info" style={{ marginBottom: '0.25rem' }}>
          <p className="label" style={{ margin: 0 }}>Tap when your watch shows</p>
          <InfoTip label="How to drift test">
            <p>
              Set the <strong>target</strong> (digits below) to match the time you expect on your watch face. When the second hand reaches that moment, tap <strong>Tap</strong> once — we record the difference vs atomic time. Use the arrows to nudge hours, minutes, and seconds.
              {hideStartNewRun ? (
                <>
                  {' '}To split the log into a new group, open the <strong>Readings</strong> tab and use <strong>Start new run</strong> there; older taps stay until you delete a run.
                </>
              ) : (
                <>
                  {' '}Use <strong>Start new run</strong> above when you want a fresh group in the log; old taps still count in stats until you delete a run.
                </>
              )}
            </p>
            <figure className="drift-tap-demo-figure">
              <DriftTapDemoIllustration className="drift-tap-demo-svg" />
              <figcaption className="drift-tap-demo-caption">
                Same moment on the watch and in the app → then tap <strong>Tap</strong> once (when &quot;Tap now&quot; appears, if you use the countdown).
              </figcaption>
            </figure>
          </InfoTip>
        </div>
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
          <p className="drift-reference-time" style={{ margin: '0.5rem 0 0', fontVariantNumeric: 'tabular-nums' }}>
            Atomic clock: <strong>{pad(nowRef.getHours())}:{pad(nowRef.getMinutes())}:{pad(nowRef.getSeconds())}</strong>
          </p>
        )}
        {countdown !== null && countdown > 0 && <p className="countdown">in {countdown} s</p>}
        {countdown === 0 && <p className="tap-now">Tap now</p>}
      </div>

      <div className="card drift-context-card">
        <div className="label-with-info" style={{ marginBottom: '0.35rem' }}>
          <p className="label" style={{ margin: 0 }}>Position &amp; winding</p>
          <InfoTip label="Optional context">
            <p>
              Choose how the watch is sitting and wound for the <strong>next</strong> tap only. Tap a chip again to clear. We store it with the reading so exports and history stay honest.
            </p>
            <DriftContextChipsVisual />
          </InfoTip>
        </div>
        <p className="label" style={{ marginBottom: '0.35rem' }}>Position</p>
        <div className="drift-context-chips" role="group" aria-label="Watch position for this reading">
          {DRIFT_POSITION_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`drift-context-chip ${tapPosition === o.value ? 'drift-context-chip--on' : ''}`}
              onClick={() => setTapPosition((p) => (p === o.value ? '' : o.value))}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="label" style={{ marginTop: '0.65rem', marginBottom: '0.35rem' }}>Winding</p>
        <div className="drift-context-chips" role="group" aria-label="Winding state for this reading">
          {DRIFT_WINDING_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`drift-context-chip ${tapWinding === o.value ? 'drift-context-chip--on' : ''}`}
              onClick={() => setTapWinding((w) => (w === o.value ? '' : o.value))}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
          Optional. Tap again on a chip to clear. Stored with this reading and export.
        </p>
      </div>

      <button type="button" className="btn" style={{ width: '100%', minHeight: 56, fontSize: '1.1rem' }} onClick={handleTap} disabled={!referenceTime}>
        Tap
      </button>
      <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={setNewTarget}>
        New target time
      </button>

      {/* Stats + chart – full width, vertical, readable */}
      {selectedRef && readings.length > 0 && driftStats && (
        <div className="card drift-overview-card">
          <div className="label-with-info" style={{ marginBottom: '0.35rem', alignItems: 'flex-start' }}>
            <h2 className="drift-overview-title" style={{ margin: 0 }}>Your drift data</h2>
            <InfoTip label="What you’re looking at">
              <p>
                Totals from every tap for this watch: chart flips between <strong>drift</strong> (offset at each tap) and <strong>rate</strong> (s/day between taps). Sharing builds a read-only link with the same headline numbers.
              </p>
              <DriftOverviewCardVisual />
            </InfoTip>
          </div>
          <p className="drift-overview-meta">{driftStats.n} reading{driftStats.n !== 1 ? 's' : ''} · Each tap records seconds fast (+) or slow (−) vs atomic clock</p>

          {readings.length >= 2 && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className={chartMode === 'drift' ? 'btn' : 'btn btn-secondary'}
                  style={{ flex: 1, padding: '0.5rem', fontSize: 14 }}
                  onClick={() => setChartMode('drift')}
                >
                  Drift
                </button>
                <button
                  type="button"
                  className={chartMode === 'rate' ? 'btn' : 'btn btn-secondary'}
                  style={{ flex: 1, padding: '0.5rem', fontSize: 14 }}
                  onClick={() => setChartMode('rate')}
                >
                  Rate
                </button>
              </div>
              <DriftChart readings={readings} mode={chartMode} />
            </>
          )}

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

          {selectedWatch && (selectedWatch.specMin != null || selectedWatch.specMax != null) && driftStats.rateIntervalCount > 0 && (
            <div className="drift-spec-block">
              <div className="label-with-info" style={{ marginBottom: '0.25rem', alignItems: 'center' }}>
                <h3 className="drift-spec-title" style={{ margin: 0 }}>Spec compliance (rate s/day)</h3>
                <InfoTip label="Spec compliance here">
                  <p>
                    Counts how many <strong>intervals</strong> between taps fall inside the factory rate range — same idea as the compliance card on Collection. Green share of intervals, not a warranty verdict.
                  </p>
                  <SpecComplianceVisual />
                </InfoTip>
              </div>
              <p className="drift-spec-range">Manufacturer: {driftStats.specMin} to +{driftStats.specMax} s/day</p>
              <p className="drift-spec-count"><strong>{driftStats.inSpecCount} / {driftStats.rateIntervalCount}</strong> intervals within spec ({Math.round((driftStats.inSpecCount / driftStats.rateIntervalCount) * 100)}%)</p>
            </div>
          )}

          {communityAgg && communityAgg.readingCount > 0 && (
            <div className="drift-community-block">
              <div className="label-with-info" style={{ marginBottom: '0.25rem', alignItems: 'center' }}>
                <h3 className="drift-community-title" style={{ margin: 0 }}>Community</h3>
                <InfoTip label="Community comparison">
                  <p>
                    Optional anonymized aggregate from other app users with this reference. With few contributors we only show counts (limited / privacy) — same rules as Discovery.
                  </p>
                  <DiscoveryVisual />
                </InfoTip>
              </div>
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

          <div className="label-with-info" style={{ marginTop: '1rem', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: '1 1 auto', width: 'min(100%, 20rem)', margin: 0 }} onClick={handleShare} aria-label="Share results">
              {shareCopied ? 'Link copied!' : 'Share results'}
            </button>
            <InfoTip label="Share link">
              <p>
                Builds a simple page with brand, model, ref, and headline stats. Good for forums — anyone with the link sees that snapshot, not live updates.
              </p>
              <ShareLinkVisual />
            </InfoTip>
          </div>
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 'var(--space-lg)', color: 'var(--text)' }}>
          <div className="label-with-info" style={{ marginBottom: '0.4rem' }}>
            <p className="label" style={{ margin: 0 }}>This tap</p>
            <InfoTip label="Reading this result">
              <p>
                Compared your target moment with atomic reference time at button press. Positive = watch <strong>ahead</strong>; negative = <strong>behind</strong>. One data point — trends need several taps.
              </p>
              <LastTapResultVisual />
            </InfoTip>
          </div>
          {result.error ? (
            <p style={{ color: 'var(--danger)', margin: 0 }}>{result.error}</p>
          ) : (
            <>
              <p style={{ margin: 0, color: 'var(--text)' }}>
                {result.drift > 0 && `Watch is +${result.drift.toFixed(1)} s (fast, ahead of real time).`}
                {result.drift < 0 && `Watch is ${result.drift.toFixed(1)} s (slow, behind real time).`}
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
        embed ? (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 'var(--space)' }}
            onClick={() => {
              setSearchParams(
                { ref: selectedWatch.reference, view: 'readings' },
                { replace: false }
              )
              document.getElementById('collection-watch-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            View readings &amp; charts
          </button>
        ) : (
          <Link
            to={`/?ref=${encodeURIComponent(selectedWatch.reference)}`}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 'var(--space)' }}
          >
            View history &amp; spec
          </Link>
        )
      )}

      {embed && (
        <p className="drift-feedback-hint" style={{ margin: '0.75rem 0 0', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          <Link to="/feedback" style={{ color: 'var(--accent)', fontWeight: 600 }}>Feedback</Link>
        </p>
      )}
    </div>
  )
}
