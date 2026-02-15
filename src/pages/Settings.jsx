import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user, signOut } = useAuth()
  const displayName = user?.displayName || user?.email || (user?.providerData?.[0]?.email) || '—'

  return (
    <>
      <h1 className="page-title">Settings</h1>

      <div className="card">
        <p style={{ margin: 0 }}>Logged in as <strong>{displayName}</strong></p>
        {user?.email && <p style={{ margin: '0.25rem 0 0', fontSize: 15, color: 'var(--text-secondary)' }}>{user.email}</p>}
      </div>

      <div className="card">
        <Link to="/privacy">Terms &amp; Privacy Policy</Link>
      </div>

      <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={signOut}>
        Sign out
      </button>

      <p className="app-footer">Collector IQ · Watch accuracy tracker</p>
    </>
  )
}
