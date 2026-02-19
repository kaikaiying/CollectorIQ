import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageSeo from '../components/PageSeo'
import { SUBSCRIPTION_PRICE_DISPLAY, TRIAL_DAYS } from '../lib/subscription'

export default function Subscribe() {
  const { user } = useAuth()

  return (
    <div className="app-main" style={{ paddingBottom: '2rem' }}>
      <PageSeo
        title="Subscribe"
        description="First watch free. Add unlimited watches with a free trial, then 6.99 CAD/month. Cancel anytime."
      />
      <Link to={user ? '/' : '/login'} style={{ fontSize: 15, color: 'var(--accent)', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to {user ? 'app' : 'sign in'}
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Subscription</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Track as many watches as you want. First one is free — no card required.
      </p>

      <div className="card paywall-card" style={{ marginBottom: '1rem' }}>
        <p className="paywall-title">Add more watches</p>
        <p className="paywall-desc">
          <strong>{TRIAL_DAYS} days free</strong>, then {SUBSCRIPTION_PRICE_DISPLAY}. Cancel anytime.
        </p>
        <ul style={{ margin: '0.75rem 0', paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>Unlimited watches in your collection</li>
          <li>Drift tests and accuracy tracking for each</li>
          <li>Compare with community & manufacturer specs</li>
          <li>Export your data anytime</li>
        </ul>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Price shown in CAD. Stripe may display equivalent in your local currency at checkout.</p>
        <p className="paywall-hint">Payment is secure (Stripe). You can cancel or change plan anytime from Settings.</p>
      </div>

      {user ? (
        <Link to="/add-watch" className="btn" style={{ width: '100%' }}>
          Add a watch to subscribe
        </Link>
      ) : (
        <Link to="/login" className="btn" style={{ width: '100%' }}>
          Sign in to get started
        </Link>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: '1rem', textAlign: 'center' }}>
        Already subscribed? <Link to="/settings">Manage in Settings</Link>
      </p>
    </div>
  )
}
