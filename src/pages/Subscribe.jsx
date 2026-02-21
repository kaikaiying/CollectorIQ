import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageSeo from '../components/PageSeo'
import { useState, useEffect } from 'react'
import { SUBSCRIPTION_PRICE_DISPLAY, SUBSCRIPTION_TERMS_IAP, SUBSCRIPTION_TERMS_STRIPE } from '../lib/subscription'
import { isIAPPlatform, getSubscriptionProduct } from '../lib/purchases'

export default function Subscribe() {
  const { user } = useAuth()
  const [iapPrice, setIapPrice] = useState(null)

  useEffect(() => {
    if (!isIAPPlatform()) return
    getSubscriptionProduct().then((product) => {
      if (product?.priceString) setIapPrice(product.priceString)
    })
  }, [])

  return (
    <div className="app-main" style={{ paddingBottom: '2rem' }}>
      <PageSeo
        title="Subscribe"
        description="First watch free. Add unlimited watches for $6.99/month. Renews until cancelled. Cancel anytime."
      />
      <Link to={user ? '/' : '/login'} style={{ fontSize: 15, color: 'var(--accent)', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to {user ? 'app' : 'sign in'}
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Subscription</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        First watch is free — no card required. Add unlimited watches for {isIAPPlatform() && iapPrice ? `${iapPrice}/month` : SUBSCRIPTION_PRICE_DISPLAY}.
      </p>

      <div className="card paywall-card" style={{ marginBottom: '1rem' }}>
        <p className="paywall-title">Add more watches</p>
        <p className="paywall-desc">
          {(isIAPPlatform() && iapPrice ? `${iapPrice}/month` : SUBSCRIPTION_PRICE_DISPLAY)}. Renews until cancelled.
        </p>
        <ul style={{ margin: '0.75rem 0', paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>Unlimited watches in your collection</li>
          <li>Drift tests and accuracy tracking for each</li>
          <li>Compare with community & manufacturer specs</li>
          <li>Export your data anytime</li>
        </ul>
        {!isIAPPlatform() && (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Price shown in CAD. Stripe may display equivalent in your local currency at checkout.</p>
        )}
        <p className="paywall-hint" style={{ fontSize: 12, marginTop: '0.75rem' }}>
          {isIAPPlatform() ? SUBSCRIPTION_TERMS_IAP : SUBSCRIPTION_TERMS_STRIPE}
        </p>
      </div>

      {user ? (
        <Link to="/add-watch" className="btn" style={{ width: '100%' }}>
          Add a watch
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
