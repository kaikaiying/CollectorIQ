import { useSearchParams, Link } from 'react-router-dom'
import { useMemo } from 'react'
import PageSeo from '../components/PageSeo'
import InfoTip from '../components/InfoTip'
import { ShareLinkVisual } from '../components/InfoTipFigures'

export default function ShareResults() {
  const [searchParams] = useSearchParams()
  const d = searchParams.get('d')

  const data = useMemo(() => {
    if (!d) return null
    try {
      const json = atob(d)
      const parsed = JSON.parse(json)
      if (parsed && typeof parsed.brand === 'string' && typeof parsed.model === 'string') return parsed
      return null
    } catch {
      return null
    }
  }, [d])

  if (!data) {
    return (
      <>
        <PageSeo title="Share" />
        <div className="card">
          <h1 className="page-title">Share results</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Invalid or missing share link.</p>
          <Link to="/" className="btn">Open Watch Collector</Link>
        </div>
      </>
    )
  }

  const { brand, model, reference, n, mean, pctInSpec } = data

  return (
    <>
      <PageSeo
        title={`${brand} ${model} accuracy`}
        description={`${brand} ${model} (${reference}): ${n} readings, ${mean != null ? (mean >= 0 ? '+' : '') + Number(mean).toFixed(1) : '—'} s mean${pctInSpec != null ? `, ${pctInSpec}% in spec` : ''}. Watch Collector — Accuracy Tracker.`}
      />
      <div className="card share-results-card">
        <div className="label-with-info" style={{ marginBottom: '0.35rem' }}>
          <p className="share-results-label" style={{ margin: 0 }}>Watch accuracy results</p>
          <InfoTip label="About this link">
            <p>
              Someone shared a snapshot of their drift tests from Watch Collector. <strong>Mean</strong> is average error per reading; <strong>in spec</strong> compares their trend to the manufacturer range if we have enough data.
            </p>
            <ShareLinkVisual />
          </InfoTip>
        </div>
        <h1 className="share-results-title">{brand} {model}</h1>
        <p className="share-results-ref">Ref: {reference || '—'}</p>
        <dl className="share-results-dl">
          <dt>Readings</dt>
          <dd>{n ?? '—'}</dd>
          {mean != null && (
            <>
              <dt>Mean offset</dt>
              <dd>{mean >= 0 ? '+' : ''}{Number(mean).toFixed(2)} s</dd>
            </>
          )}
          {pctInSpec != null && (
            <>
              <dt>Within spec</dt>
              <dd>{pctInSpec}%</dd>
            </>
          )}
        </dl>
        <p className="share-results-cta">Tracked with Watch Collector</p>
        <Link to="/" className="btn" style={{ width: '100%' }}>
          Track your watch accuracy →
        </Link>
      </div>
    </>
  )
}
