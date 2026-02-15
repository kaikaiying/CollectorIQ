import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCollection, setCollection } from '../App'

export default function Collection() {
  const [watches, setWatches] = useState([])

  useEffect(() => {
    setWatches(getCollection())
  }, [])

  const remove = (reference) => {
    const next = watches.filter((w) => w.reference !== reference)
    setCollection(next)
    setWatches(next)
  }

  return (
    <>
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
              <li key={w.reference} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to={`/watch/${encodeURIComponent(w.reference)}`} style={{ color: 'inherit', textDecoration: 'none', flex: 1 }}>
                  <strong>{w.model}</strong>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{w.brand} · Ref: {w.reference}</div>
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  onClick={() => remove(w.reference)}
                  aria-label="Remove"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <Link to="/add-watch" className="btn" style={{ width: '100%', marginTop: '0.5rem' }}>
            + Add another watch
          </Link>
        </>
      )}
    </>
  )
}
