import { Link } from 'react-router-dom'
import { getUser } from '../App'

export default function Settings({ onLogout }) {
  const user = getUser()

  return (
    <>
      <h1 className="page-title">Settings</h1>

      <div className="card">
        <p style={{ margin: 0 }}>Logged in as <strong>{user || '—'}</strong></p>
      </div>

      <div className="card">
        <Link to="/privacy" style={{ color: '#e8e8e8' }}>Terms &amp; Privacy Policy</Link>
      </div>

      <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={onLogout}>
        Sign out
      </button>

      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '2rem' }}>Collector IQ · Watch accuracy tracker</p>
    </>
  )
}
