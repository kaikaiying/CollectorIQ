import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCollection, setCollection } from '../App'
import {
  MOVEMENT_TYPES,
  CATEGORIES,
  NOTES_MAX,
  validateCustomWatch,
  generateCustomReference,
} from '../lib/watchSpecSchema'
import InfoTip from '../components/InfoTip'
import { CatalogCustomVisual } from '../components/InfoTipFigures'
import FeedbackOptions from '../components/FeedbackOptions'
import DateField from '../components/DateField'
import { todayDateInputValue } from '../lib/watchOwnership'

function parseSpec(s) {
  if (!s || typeof s !== 'string') return null
  const n = parseFloat(s.replace(/[^0-9.+-]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export default function AddWatch() {
  const [mode, setMode] = useState('catalog')
  const [specs, setSpecs] = useState([])
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refFromUrl = searchParams.get('ref')

  const [customBrand, setCustomBrand] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [customReference, setCustomReference] = useState('')
  const [specLow, setSpecLow] = useState('')
  const [specHigh, setSpecHigh] = useState('')
  const [movementType, setMovementType] = useState('')
  const [movementCalibre, setMovementCalibre] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [catalogPurchaseDate, setCatalogPurchaseDate] = useState('')
  const [catalogSerial, setCatalogSerial] = useState('')
  const [catalogNotes, setCatalogNotes] = useState('')
  const [customPurchaseDate, setCustomPurchaseDate] = useState('')
  const [customSerial, setCustomSerial] = useState('')
  const [customErrors, setCustomErrors] = useState({})

  useEffect(() => {
    fetch('/watchspecs.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        setSpecs(Array.isArray(data) ? data : [])
        if (data?.length) {
          if (refFromUrl) {
            const match = data.find((w) => w.reference === refFromUrl)
            if (match) {
              setBrand(match.brand)
              setModel(match.model)
              setReference(match.reference)
            } else {
              const brands = [...new Set(data.map((w) => w.brand))].sort()
              setBrand(brands[0] || '')
            }
          } else if (!brand) {
            const brands = [...new Set(data.map((w) => w.brand))].sort()
            setBrand(brands[0] || '')
          }
        }
        setLoading(false)
      })
  }, [refFromUrl])

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
    const row = {
      brand: currentSpec.brand,
      model: currentSpec.model,
      reference: currentSpec.reference,
      specMin: parseSpec(currentSpec.spec_low),
      specMax: parseSpec(currentSpec.spec_high),
    }
    if (catalogPurchaseDate) row.purchaseDate = catalogPurchaseDate
    if (catalogSerial.trim()) row.serialNumber = catalogSerial.trim()
    const cn = catalogNotes.trim()
    if (cn) row.notes = cn.slice(0, NOTES_MAX)
    setCollection([...col, row])
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
      serialNumber: customSerial || undefined,
      purchaseDate: customPurchaseDate || undefined,
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
    const row = {
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
    }
    if (sanitized.serialNumber) row.serialNumber = sanitized.serialNumber
    if (sanitized.purchaseDate) row.purchaseDate = sanitized.purchaseDate
    setCollection([...col, row])
    navigate('/')
  }

  if (loading && mode === 'catalog') {
    return <p className="page-title">Loading…</p>
  }

  return (
    <>
      <h1 className="page-title">Add watch</h1>
      <div className="label-with-info" style={{ marginBottom: 'var(--space-lg)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          From the catalog or add your own with manufacturer accuracy spec.
        </p>
        <InfoTip label="Catalog vs custom">
          <p>
            <strong>Catalog</strong> pulls specs from the app database. <strong>Custom</strong> is for watches not listed — enter the accuracy range from the manufacturer (e.g. −2 to +2 s/day) so drift tests can show in-spec vs out-of-spec.
          </p>
          <CatalogCustomVisual />
        </InfoTip>
      </div>

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
                <label className="label" htmlFor="add-catalog-purchase" style={{ marginTop: 'var(--space)' }}>Purchase date (optional)</label>
                <DateField
                  id="add-catalog-purchase"
                  value={catalogPurchaseDate}
                  onChange={setCatalogPurchaseDate}
                  max={todayDateInputValue()}
                  allowClear
                  style={{ marginBottom: '0.5rem' }}
                />
                <label className="label">Serial number (optional)</label>
                <input
                  type="text"
                  className="input"
                  value={catalogSerial}
                  onChange={(e) => setCatalogSerial(e.target.value)}
                  placeholder="Case or movement serial"
                  maxLength={50}
                  autoComplete="off"
                  style={{ marginBottom: '0.5rem' }}
                />
                <label className="label" htmlFor="add-catalog-notes">Notes (optional)</label>
                <textarea
                  id="add-catalog-notes"
                  className="input"
                  value={catalogNotes}
                  onChange={(e) => setCatalogNotes(e.target.value)}
                  placeholder="e.g. year, dial variant, provenance"
                  maxLength={NOTES_MAX}
                  rows={3}
                  style={{
                    minHeight: 72,
                    resize: 'vertical',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.45,
                  }}
                />
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

            <label className="label" htmlFor="add-custom-purchase" style={{ marginTop: 'var(--space)' }}>Purchase date (optional)</label>
            <DateField
              id="add-custom-purchase"
              value={customPurchaseDate}
              onChange={setCustomPurchaseDate}
              max={todayDateInputValue()}
              allowClear
              style={{ marginBottom: '0.5rem' }}
            />
            {customErrors.purchaseDate && <p className="error-message" style={{ marginTop: -4 }}>{customErrors.purchaseDate}</p>}

            <label className="label">Serial number (optional)</label>
            <input
              type="text"
              className="input"
              value={customSerial}
              onChange={(e) => setCustomSerial(e.target.value)}
              placeholder="Case or movement serial"
              maxLength={50}
              autoComplete="off"
              style={{ marginBottom: '0.5rem' }}
            />
            {customErrors.serialNumber && <p className="error-message" style={{ marginTop: -4 }}>{customErrors.serialNumber}</p>}

            <label className="label" htmlFor="add-custom-notes">Notes (optional)</label>
            <textarea
              id="add-custom-notes"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. year, dial variant, provenance"
              maxLength={NOTES_MAX}
              rows={3}
              style={{
                minHeight: 72,
                resize: 'vertical',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.45,
              }}
            />
            {customErrors.notes && <p className="error-message" style={{ marginTop: 4 }}>{customErrors.notes}</p>}
          </div>

          <button type="button" className="btn" style={{ width: '100%' }} onClick={handleAddCustom}>
            Add to collection
          </button>
        </>
      )}

      <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => navigate('/')}>
        Cancel
      </button>

      <FeedbackOptions variant="compact" />
    </>
  )
}
