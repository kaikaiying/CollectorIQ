import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { getCollection, setCollection, SYNC_COMPLETE_EVENT } from '../App'
import PageSeo from '../components/PageSeo'
import { useAuth } from '../contexts/AuthContext'
import { usePageTitle } from '../contexts/PageTitleContext'
import { getSubscriptionStatus, SUBSCRIPTION_PRICE_DISPLAY } from '../lib/subscription'

export default function Collection() {
  const { user } = useAuth()
  const location = useLocation()
  usePageTitle('Collection')
  const [searchParams, setSearchParams] = useSearchParams()
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false)
  const [watches, setWatches] = useState([])
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [subLoading, setSubLoading] = useState(true)

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

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setSubscriptionSuccess(true)
      setSearchParams({}, { replace: true })
      const t = setTimeout(() => setSubscriptionSuccess(false), 5000)
      return () => clearTimeout(t)
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!user?.uid || watches.length < 1) {
      setSubLoading(false)
      if (watches.length < 1) setHasActiveSubscription(false)
      return
    }
    let cancelled = false
    getSubscriptionStatus(user.uid).then(({ hasActiveSubscription: active }) => {
      if (!cancelled) {
        setHasActiveSubscription(active)
        setSubLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [user?.uid, watches.length])

  const remove = (reference) => {
    const next = watches.filter((w) => w.reference !== reference)
    setCollection(next)
    setWatches(next)
  }

  return (
    <>
      <PageSeo title="Collection" description="Your watch collection. Track accuracy for each timepiece with the #1 watch atomic tracker. Drift test vs atomic clock." />

      {subscriptionSuccess && (
        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
          <p style={{ margin: 0, color: 'var(--text)', fontWeight: 500 }}>Subscription active. You can add unlimited watches.</p>
        </div>
      )}

      {watches.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No watches yet. Add your first timepiece.</p>
          <Link to="/add-watch" className="btn">Add watch</Link>
        </div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {watches.map((w) => (
              <li key={w.reference} className="card collection-item">
                <Link to={`/drift-test?ref=${encodeURIComponent(w.reference)}`} className="collection-item-link">
                  <strong>{w.model}</strong>
                  <div className="collection-item-meta">{w.brand} · Ref: {w.reference}</div>
                </Link>
                <div className="collection-item-actions">
                  <Link to={`/watch/${encodeURIComponent(w.reference)}`} className="collection-item-spec" aria-label="View spec & history">Spec</Link>
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
            ))}
          </ul>
          {watches.length === 1 && !subLoading && !hasActiveSubscription && (
            <div className="card upgrade-teaser" style={{ marginTop: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                First watch free. Add more for {SUBSCRIPTION_PRICE_DISPLAY}. Renews until cancelled.
              </p>
            </div>
          )}
          <Link to="/add-watch" className="btn" style={{ width: '100%', marginTop: '0.5rem' }}>
            + Add another watch
          </Link>
        </>
      )}
    </>
  )
}
