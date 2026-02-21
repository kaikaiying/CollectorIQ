import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCollection, setCollection } from '../App'
import { useAuth } from '../contexts/AuthContext'
import { getSubscriptionStatus, FIRST_WATCH_FREE, SUBSCRIPTION_PRICE_DISPLAY } from '../lib/subscription'
import {
  MOVEMENT_TYPES,
  CATEGORIES,
  validateCustomWatch,
  generateCustomReference,
} from '../lib/watchSpecSchema'

function parseSpec(s) {
  if (!s || typeof s !== 'string') return null
  const n = parseFloat(s.replace(/[^0-9.+-]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  if (typeof window !== 'undefined') return ''
  return ''
}

export default function AddWatch() {
  const { user } = useAuth()
  const [mode, setMode] = useState('catalog') // 'catalog' | 'custom'
  const [specs, setSpecs] = useState([])
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const navigate = useNavigate()
  const collectionLength = getCollection().length
  const needsSubscription = collectionLength >= FIRST_WATCH_FREE

  useEffect(() => {
    if (!user?.uid || !needsSubscription) {
      setSubLoading(false)
      if (!needsSubscription) setHasActiveSubscription(true)
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
  }, [user?.uid, needsSubscription])

  const startCheckout = useCallback(async (plan = 'monthly') => {
    if (!user || checkoutLoading) return
    setCheckoutLoading(true)
    try {
      const token = await user.getIdToken()
      const base = getApiBase()
      const res = await fetch(`${base}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          successUrl: window.location.origin + '/?subscription=success',
          cancelUrl: window.location.origin + '/add-watch',
          plan,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) window.location.href = data.url
      else throw new Error('No checkout URL')
    } catch (e) {
      setCheckoutLoading(false)
      alert(e.message || 'Something went wrong. Try again.')
    }
  }, [user, checkoutLoading])

  // Custom form state
  const [customBrand, setCustomBrand] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [customReference, setCustomReference] = useState('')
  const [specLow, setSpecLow] = useState('')
  const [specHigh, setSpecHigh] = useState('')
  const [movementType, setMovementType] = useState('')
  const [movementCalibre, setMovementCalibre] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [customErrors, setCustomErrors] = useState({})

  useEffect(() => {
    fetch('/watchspecs.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        setSpecs(Array.isArray(data) ? data : [])
        if (data?.length && !brand) {
          const brands = [...new Set(data.map((w) => w.brand))].sort()
          setBrand(brands[0] || '')
        }
        setLoading(false)
      })
  }, [])

  const brands = [...new Set(specs.map((w) => w.brand))].sort()
  const models = brand ? [...new Set(specs.filter((w) => w.brand === brand).map((w) => w.model))].sort() : []
  const refs = brand && model ? specs.filter((w) => w.brand === brand && w.model === model) : []
  const currentSpec = refs.find((r) => r.reference === reference) || refs[0]

  const handleAddFromCatalog = () => {
    if (!currentSpec) return
    const col = getCollection()
    if (col.some((w) => w.reference === currentSpec.reference)) {
      navigate('/')
      return
    }
    setCollection([
      ...col,
      {
        brand: currentSpec.brand,
        model: currentSpec.model,
        reference: currentSpec.reference,
        specMin: parseSpec(currentSpec.spec_low),
        specMax: parseSpec(currentSpec.spec_high),
      },
    ])
    navigate('/')
  }

  const handleAddCustom = () => {
    setCustomErrors({})
    const { valid, errors, sanitized } = validateCustomWatch({
      brand: customBrand,
      model: customModel,
      reference: customReference,
      specLow: specLow === '' ? NaN : parseFloat(specLow),
      specHigh: specHigh === '' ? NaN : parseFloat(specHigh),
      movementType: movementType || undefined,
      movementCalibre: movementCalibre || undefined,
      category: category || undefined,
      notes: notes || undefined,
    })
    if (!valid) {
      setCustomErrors(errors)
      return
    }
    const col = getCollection()
    const ref = sanitized.reference || generateCustomReference(sanitized.brand, sanitized.model)
    if (col.some((w) => w.reference === ref)) {
      setCustomErrors({ reference: 'This watch is already in your collection.' })
      return
    }
    setCollection([
      ...col,
      {
        brand: sanitized.brand,
        model: sanitized.model,
        reference: ref,
        specMin: sanitized.specMin,
        specMax: sanitized.specMax,
        movementType: sanitized.movementType,
        movementCalibre: sanitized.movementCalibre,
        category: sanitized.category,
        notes: sanitized.notes,
        isCustom: true,
      },
    ])
    navigate('/')
  }

  if (loading && mode === 'catalog') {
    return <p className="page-title">Loading…</p>
  }

  if (needsSubscription && subLoading) {
    return (
      <>
        <h1 className="page-title">Add watch</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      </>
    )
  }

  if (needsSubscription && !hasActiveSubscription) {
    return (
      <>
        <h1 className="page-title">Add watch</h1>
        <div className="card paywall-card">
          <p className="paywall-title">Add more watches</p>
          <p className="paywall-desc">
            Your first watch is free. Add unlimited watches for {SUBSCRIPTION_PRICE_DISPLAY}.
          </p>
          <div className="paywall-buttons">
            <button
              type="button"
              className="btn"
              style={{ width: '100%' }}
              onClick={() => startCheckout('monthly')}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Opening…' : `Subscribe — ${SUBSCRIPTION_PRICE_DISPLAY}`}
            </button>
          </div>
          <p className="paywall-hint">You can cancel anytime. Payment is handled securely by Stripe.</p>
        </div>
        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => navigate('/')}>
          Back to collection
        </button>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">Add watch</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
        From the catalog or add your own with manufacturer accuracy spec.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-lg)' }}>
        <button
          type="button"
          className={mode === 'catalog' ? 'btn' : 'btn btn-secondary'}
          style={{ flex: 1 }}
          onClick={() => setMode('catalog')}
        >
          From catalog
        </button>
        <button
          type="button"
          className={mode === 'custom' ? 'btn' : 'btn btn-secondary'}
          style={{ flex: 1 }}
          onClick={() => setMode('custom')}
        >
          Add custom
        </button>
      </div>

      {mode === 'catalog' && (
        <>
          {specs.length === 0 ? (
            <div className="card">
              <p>Catalog not loaded. Add custom instead, or add <code>watchspecs.json</code> to <code>public</code>.</p>
              <button type="button" className="btn" onClick={() => navigate('/')}>Back</button>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 'var(--space)' }}>
                <label className="label">Brand</label>
                <select
                  className="select"
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); setModel(''); setReference(''); }}
                  style={{ marginBottom: 'var(--space)' }}
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <label className="label">Model</label>
                <select
                  className="select"
                  value={model}
                  onChange={(e) => { setModel(e.target.value); setReference(''); }}
                  style={{ marginBottom: 'var(--space)' }}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <label className="label">Reference</label>
                <select
                  className="select"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                >
                  {refs.map((r) => (
                    <option key={r.reference} value={r.reference}>{r.reference}</option>
                  ))}
                </select>
                {currentSpec && (
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Spec: {currentSpec.spec_low} to {currentSpec.spec_high}
                  </p>
                )}
              </div>
              <button type="button" className="btn" style={{ width: '100%' }} onClick={handleAddFromCatalog} disabled={!currentSpec}>
                Add to collection
              </button>
            </>
          )}
        </>
      )}

      {mode === 'custom' && (
        <>
          <div className="card" style={{ marginBottom: 'var(--space)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 'var(--space)' }}>
              Use the manufacturer’s stated accuracy (e.g. “-2 to +2 s/day”). This is what we compare your drift tests against.
            </p>

            <label className="label">Brand *</label>
            <input
              type="text"
              className="input"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              placeholder="e.g. Rolex, Omega"
              style={{ marginBottom: '0.5rem' }}
            />
            {customErrors.brand && <p className="error-message" style={{ marginTop: -4 }}>{customErrors.brand}</p>}

            <label className="label" style={{ marginTop: 'var(--space)' }}>Model *</label>
            <input
              type="text"
              className="input"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="e.g. Submariner Date, Speedmaster"
              style={{ marginBottom: '0.5rem' }}
            />
            {customErrors.model && <p className="error-message" style={{ marginTop: -4 }}>{customErrors.model}</p>}

            <label className="label" style={{ marginTop: 'var(--space)' }}>Reference (optional)</label>
            <input
              type="text"
              className="input"
              value={customReference}
              onChange={(e) => setCustomReference(e.target.value)}
              placeholder="e.g. 126610LN"
              style={{ marginBottom: '0.5rem' }}
            />
            {customErrors.reference && <p className="error-message" style={{ marginTop: -4 }}>{customErrors.reference}</p>}

            <label className="label" style={{ marginTop: 'var(--space)' }}>Manufacturer accuracy (s/day) *</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input"
                value={specLow}
                onChange={(e) => setSpecLow(e.target.value)}
                placeholder="-2"
                style={{ width: 80 }}
              />
              <span style={{ color: 'var(--text-tertiary)' }}>to</span>
              <input
                type="text"
                className="input"
                value={specHigh}
                onChange={(e) => setSpecHigh(e.target.value)}
                placeholder="+2"
                style={{ width: 80 }}
              />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>s/day</span>
            </div>
            {(customErrors.specLow || customErrors.specHigh) && (
              <p className="error-message" style={{ marginTop: 4 }}>{customErrors.specLow || customErrors.specHigh}</p>
            )}

            <label className="label" style={{ marginTop: 'var(--space)' }}>Movement type</label>
            <select
              className="select"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            >
              <option value="">—</option>
              {MOVEMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <label className="label">Movement calibre (optional)</label>
            <input
              type="text"
              className="input"
              value={movementCalibre}
              onChange={(e) => setMovementCalibre(e.target.value)}
              placeholder="e.g. 3235, 3861"
              style={{ marginBottom: '0.5rem' }}
            />

            <label className="label" style={{ marginTop: 'var(--space)' }}>Category</label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label className="label">Notes (optional)</label>
            <input
              type="text"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. year, variant"
              maxLength={200}
            />
          </div>

          <button type="button" className="btn" style={{ width: '100%' }} onClick={handleAddCustom}>
            Add to collection
          </button>
        </>
      )}

      <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => navigate('/')}>
        Cancel
      </button>
    </>
  )
}
