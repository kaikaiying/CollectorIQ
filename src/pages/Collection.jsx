import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCollection, setCollection } from '../App'
import PageSeo from '../components/PageSeo'
import { useAuth } from '../contexts/AuthContext'
import { getSubscriptionStatus, SUBSCRIPTION_PRICE_DISPLAY } from '../lib/subscription'

export default function Collection() {
  const { user } = useAuth()
  const [watches, setWatches] = useState([])
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [subLoading, setSubLoading] = useState(true)

  useEffect(() => {
    setWatches(getCollection())
  }, [])

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
      <h1 className="page-title">Collection</h1>

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
                Want to track more watches? {SUBSCRIPTION_PRICE_DISPLAY}
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
