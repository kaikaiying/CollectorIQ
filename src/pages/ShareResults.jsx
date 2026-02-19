import { useSearchParams, Link } from 'react-router-dom'
import { useMemo } from 'react'
import PageSeo from '../components/PageSeo'

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
          <Link to="/" className="btn">Go to Collector IQ</Link>
        </div>
      </>
    )
  }

  const { brand, model, reference, n, mean, pctInSpec } = data

  return (
    <>
      <PageSeo
        title={`${brand} ${model} accuracy`}
        description={`${brand} ${model} (${reference}): ${n} readings, ${mean != null ? (mean >= 0 ? '+' : '') + Number(mean).toFixed(1) : '—'} s mean${pctInSpec != null ? `, ${pctInSpec}% in spec` : ''}. Tracked with Collector IQ.`}
      />
      <div className="card share-results-card">
        <p className="share-results-label">Watch accuracy results</p>
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
        <p className="share-results-cta">Tracked with Collector IQ</p>
        <Link to="/login" className="btn" style={{ width: '100%' }}>
          Track your watch accuracy →
        </Link>
      </div>
    </>
  )
}
