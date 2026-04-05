import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { getCollection, setCollection, SYNC_COMPLETE_EVENT } from '../App'
import PageSeo from '../components/PageSeo'
import { usePageTitle } from '../contexts/PageTitleContext'
import DriftTest from './DriftTest'
import InfoTip from '../components/InfoTip'
import {
  CollectionEmptyVisual,
  CollectionTabsVisual,
  CollectionWatchRowVisual,
  DriftSectionIntroVisual,
} from '../components/InfoTipFigures'
import FeedbackOptions from '../components/FeedbackOptions'
import WatchDetailPanel from '../components/WatchDetailPanel'
import { getOwnershipSummary } from '../lib/watchOwnership'
import { colorForWatchReference } from '../lib/wearCalendarColors'

const VIEWS = /** @type {const} */ (['drift', 'watch', 'readings', 'wear'])

function normalizeView(v) {
  return VIEWS.includes(v) ? v : 'drift'
}

function scrollToWatchDetail() {
  document.getElementById('collection-watch-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Collection() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  usePageTitle('Collection')
  const [watches, setWatches] = useState([])

  const refreshWatches = useCallback(() => setWatches(getCollection()), [])

  useEffect(() => {
    refreshWatches()
    const onSync = () => refreshWatches()
    window.addEventListener(SYNC_COMPLETE_EVENT, onSync)
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshWatches() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener(SYNC_COMPLETE_EVENT, onSync)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshWatches])

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') refreshWatches()
  }, [location.pathname, refreshWatches])

  const refParam = searchParams.get('ref')
  const activeView = normalizeView(searchParams.get('view'))

  const setView = (view) => {
    if (!refParam) return
    setSearchParams({ ref: refParam, view }, { replace: true })
  }

  const selectedWatchLabel = useMemo(() => {
    if (!refParam) return null
    const w = watches.find((x) => x.reference === refParam)
    return w ? `${w.brand} · ${w.model}` : refParam
  }, [refParam, watches])

  useEffect(() => {
    if (watches.length === 0) {
      if (refParam) setSearchParams({}, { replace: true })
      return
    }
    if (!refParam || !watches.some((w) => w.reference === refParam)) {
      setSearchParams({ ref: watches[0].reference, view: 'drift' }, { replace: true })
    }
  }, [watches, setSearchParams, refParam])

  const remove = (reference) => {
    const next = watches.filter((w) => w.reference !== reference)
    setCollection(next)
    setWatches(next)
  }

  const tabItems = useMemo(
    () => [
      { id: 'drift', label: 'Drift' },
      { id: 'watch', label: 'Watch' },
      { id: 'readings', label: 'Readings' },
      { id: 'wear', label: 'Wear' },
    ],
    []
  )

  return (
    <>
      <PageSeo title="Collection" description="Your watch collection, drift tests vs atomic time, and wear calendar. Track accuracy and on-wrist days." />

      {watches.length === 0 ? (
        <div className="card">
          <div className="label-with-info" style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              No watches yet. Add your first timepiece.
            </p>
            <InfoTip label="What you can do here">
              <p>
                Build your collection, then run <strong>drift tests</strong> against atomic time. We compare results to the maker’s stated accuracy (s/day). Data stays on your device.
              </p>
              <CollectionEmptyVisual />
            </InfoTip>
          </div>
          <Link to="/add-watch" className="btn">Add watch</Link>
          <FeedbackOptions variant="compact" />
        </div>
      ) : (
        <>
          <div className="label-with-info" style={{ marginBottom: '0.5rem' }}>
            <p className="label" style={{ margin: 0 }}>
              Your watches — tap one to select it
            </p>
            <InfoTip label="This list">
              <p>
                The <strong>highlighted</strong> card is the watch the tabs below use. <strong>Watch</strong> jumps straight to ownership on that piece. <strong>Remove</strong> deletes it from the app (drift data for that ref goes too).
              </p>
              <CollectionWatchRowVisual />
            </InfoTip>
          </div>
          <ul className="collection-with-drift-list" style={{ listStyle: 'none', padding: 0, margin: '0 0 0.5rem' }}>
            {watches.map((w) => {
              const active = refParam === w.reference
              return (
                <li key={w.reference} className={`card collection-item ${active ? 'collection-item--active' : ''}`}>
                  <Link
                    to={`/?ref=${encodeURIComponent(w.reference)}&view=drift`}
                    className="collection-item-link"
                  >
                    <span className="collection-item-line">
                      <span
                        className="collection-item-wear-dot"
                        style={{ backgroundColor: colorForWatchReference(w.reference, watches) }}
                        aria-hidden
                      />
                      <span className="collection-item-line-body">
                    <strong>{w.model}</strong>
                    <div className="collection-item-meta">{w.brand} · Ref: {w.reference}</div>
                    {w.purchaseDate && getOwnershipSummary(w.purchaseDate) && (
                      <div className="collection-item-owned">
                        Owned {getOwnershipSummary(w.purchaseDate).ownedBadge}
                      </div>
                    )}
                      </span>
                    </span>
                  </Link>
                  <div className="collection-item-actions">
                    <button
                      type="button"
                      className="collection-item-spec"
                      aria-label="Watch details and ownership"
                      onClick={(e) => {
                        e.preventDefault()
                        setSearchParams({ ref: w.reference, view: 'watch' }, { replace: false })
                        window.setTimeout(() => scrollToWatchDetail(), 80)
                      }}
                    >
                      Watch
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary collection-item-remove"
                      onClick={() => remove(w.reference)}
                      aria-label="Remove"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <Link to="/add-watch" className="btn btn-secondary collection-add-watch-after-list" style={{ width: '100%' }}>
            + Add watch
          </Link>

          <div id="collection-watch-detail" className="collection-watch-detail" style={{ scrollMarginTop: '0.75rem' }}>
            <header className="collection-tabs-header" aria-label="Watch sections">
              <div className="collection-tabs-header__titles">
                <h2 className="collection-tabs-header__title">Selected watch</h2>
                <p className="collection-tabs-header__subtitle">
                  Use the tabs for everything about the highlighted watch — one page, no extra routes.
                </p>
              </div>
              <div className="collection-tabs-header__bar">
                <div className="collection-view-tabs" role="tablist" aria-label="Sections for selected watch">
                  {tabItems.map((t) => {
                    const selected = activeView === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        className={`collection-view-tab ${selected ? 'collection-view-tab--on' : ''}`}
                        onClick={() => setView(t.id)}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
                <div className="collection-tabs-header__tip">
                  <InfoTip label="What these tabs do">
                    <p>
                      <strong>Drift</strong> — tap test, spec compliance, averages, service links. <strong>Watch</strong> — ownership and movement details. <strong>Readings</strong> — runs, history, clear data. <strong>Wear</strong> — on-wrist journal. Same page after you pick a watch above.
                    </p>
                    <CollectionTabsVisual />
                  </InfoTip>
                </div>
              </div>
            </header>

            {activeView === 'drift' && refParam && (
              <section className="collection-panel collection-panel--drift collection-drift-section" aria-label="Drift test" style={{ marginTop: 'var(--space)' }}>
                <div className="collection-panel-heading">
                  <div className="collection-panel-heading__main">
                    <h2 className="collection-panel-title collection-panel-title--drift">Drift test</h2>
                    <span className="collection-panel-tag">Accuracy vs atomic time</span>
                  </div>
                  <InfoTip label="What this section is">
                    <p>
                      <strong>Above:</strong> set the target and tap when the watch matches — same as a standalone drift test, scoped to the selected watch. <strong>Below the tap area:</strong> optional position/winding chips, then your rolling stats and chart. <strong>Further down:</strong> spec summary, averages, and service — still this watch only.
                    </p>
                    <DriftSectionIntroVisual />
                  </InfoTip>
                </div>
                <p className="collection-panel-desc">
                  Uses the <strong>highlighted</strong> watch{selectedWatchLabel ? ` (${selectedWatchLabel})` : ''}. Below the controls: compliance summary, drift averages when you have readings, and service. New runs and the full tap log are on the <strong>Readings</strong> tab.
                </p>
                <DriftTest embed hideStartNewRun />
                <WatchDetailPanel reference={refParam} section="driftFollow" />
              </section>
            )}

            {activeView !== 'drift' && refParam && (
              <div style={{ marginTop: 'var(--space)' }}>
                <WatchDetailPanel reference={refParam} section={activeView} />
              </div>
            )}
          </div>

          <FeedbackOptions variant="compact" />
        </>
      )}
    </>
  )
}
