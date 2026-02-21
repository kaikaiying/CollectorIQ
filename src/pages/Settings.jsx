import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageSeo from '../components/PageSeo'
import { getSubscriptionStatus } from '../lib/subscription'
import { isIAPPlatform, restorePurchases } from '../lib/purchases'
import { exportToExcel, REPORT_BUILDERS } from '../lib/exportReadings'

const SUPPORT_EMAIL = 'support@collectoriq.app'

function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  return ''
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const displayName = user?.displayName || user?.email || (user?.providerData?.[0]?.email) || '—'
  const [subStatus, setSubStatus] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [exportType, setExportType] = useState('full')
  const [exportMsg, setExportMsg] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    getSubscriptionStatus(user.uid).then(({ status }) => setSubStatus(status))
  }, [user?.uid])

  const handleRestore = useCallback(async () => {
    if (restoreLoading) return
    setRestoreLoading(true)
    try {
      const ok = await restorePurchases()
      if (ok) {
        setSubStatus('active')
      } else {
        alert('No previous purchases found.')
      }
    } catch (e) {
      alert(e.message || 'Restore failed.')
    } finally {
      setRestoreLoading(false)
    }
  }, [restoreLoading])

  const openPortal = useCallback(async () => {
    if (!user || portalLoading) return
    setPortalLoading(true)
    try {
      const token = await user.getIdToken()
      const base = getApiBase()
      const res = await fetch(`${base}/api/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl: window.location.origin + '/settings' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (data.url) window.location.href = data.url
      else throw new Error('No URL')
    } catch (e) {
      setPortalLoading(false)
      alert(e.message || 'Something went wrong.')
    }
  }, [user, portalLoading])

  const handleExport = useCallback(() => {
    setExportMsg(null)
    const ok = exportToExcel(exportType)
    if (ok) setExportMsg('Exported successfully.')
    else setExportMsg('No readings to export. Add watches and run drift tests first.')
  }, [exportType])

  return (
    <>
      <PageSeo title="Settings" description="Manage subscription, export readings, and account." />
      <h1 className="page-title">Settings</h1>

      <div className="card">
        <p style={{ margin: 0 }}>Logged in as <strong>{displayName}</strong></p>
        {user?.email && <p style={{ margin: '0.25rem 0 0', fontSize: 15, color: 'var(--text-secondary)' }}>{user.email}</p>}
      </div>

      <div className="card">
        <p className="label" style={{ marginBottom: '0.25rem' }}>Subscription &amp; billing</p>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.45 }}>
          {subStatus === 'active' || subStatus === 'trialing'
            ? isIAPPlatform()
              ? 'Active — you can add unlimited watches. Manage or cancel in Settings → Apple ID → Subscriptions.'
              : 'Active — you can add unlimited watches. Use the portal below to update payment, view invoices, or cancel anytime.'
            : subStatus === 'past_due'
              ? 'Payment is past due. Update your payment method to keep your subscription.'
              : subStatus === 'canceled' || subStatus === 'unpaid'
                ? 'Your subscription has ended. Resubscribe to add more watches.'
                : 'First watch is free. Add more watches for $6.99/mo.'}
        </p>
        {isIAPPlatform() ? (
          <>
            {(subStatus === 'active' || subStatus === 'trialing') && (
              <p className="settings-portal-hint" style={{ fontSize: 12 }}>
                Renews until cancelled. To cancel: Settings → [Your Name] → Subscriptions.
              </p>
            )}
            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={handleRestore} disabled={restoreLoading}>
              {restoreLoading ? '…' : 'Restore Purchases'}
            </button>
          </>
        ) : (
          <>
            {(subStatus === 'active' || subStatus === 'trialing' || subStatus === 'past_due') && (
              <button type="button" className="btn" style={{ width: '100%', marginTop: '0.75rem' }} onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? 'Opening…' : 'Manage subscription'}
              </button>
            )}
            <p className="settings-portal-hint">
              In the billing portal you can: update payment method, view invoices, cancel your subscription.
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: 14 }}>
              <Link to="/subscribe">View subscription plans</Link>
            </p>
          </>
        )}
      </div>

      <div className="card">
        <p className="label" style={{ marginBottom: '0.25rem' }}>Subscription &amp; billing help</p>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Questions about your subscription, refunds, or billing? We're here to help.
        </p>
        <ul className="settings-help-list">
          <li><strong>Renews until cancelled</strong> — Subscription auto-renews. Cancel anytime via &quot;Manage subscription&quot; above, or email us.</li>
          <li><strong>Refunds</strong> — We offer refunds for subscription charges within 14 days. See our <Link to="/privacy#refunds">Refunds policy</Link> for details.</li>
          <li><strong>Reach us</strong> — <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
        </ul>
      </div>

      <div className="card">
        <p className="label" style={{ marginBottom: '0.5rem' }}>Export readings</p>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
          Download your drift data as Excel (.xlsx).
        </p>
        <select
          className="select"
          value={exportType}
          onChange={(e) => setExportType(e.target.value)}
          style={{ marginBottom: '0.5rem' }}
        >
          {Object.entries(REPORT_BUILDERS).map(([key, { name }]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
        <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExport}>
          Export to Excel
        </button>
        {exportMsg && (
          <p style={{ margin: '0.5rem 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>{exportMsg}</p>
        )}
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
