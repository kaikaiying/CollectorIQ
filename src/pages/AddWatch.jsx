import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCollection, setCollection } from '../App'

function parseSpec(s) {
  if (!s || typeof s !== 'string') return null
  const n = parseFloat(s.replace(/[^0-9.+-]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export default function AddWatch() {
  const [specs, setSpecs] = useState([])
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/watchspecs.json')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setSpecs(Array.isArray(data) ? data : [])
        if (data?.length && !brand) {
          const brands = [...new Set(data.map((w) => w.brand))].sort()
          setBrand(brands[0] || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const brands = [...new Set(specs.map((w) => w.brand))].sort()
  const models = brand ? [...new Set(specs.filter((w) => w.brand === brand).map((w) => w.model))].sort() : []
  const refs = brand && model
    ? specs.filter((w) => w.brand === brand && w.model === model)
    : []

  const currentSpec = refs.find((r) => r.reference === reference) || refs[0]

  const handleAdd = () => {
    if (!currentSpec) return
    const collection = getCollection()
    if (collection.some((w) => w.reference === currentSpec.reference)) {
      navigate('/')
      return
    }
    setCollection([
      ...collection,
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

  if (loading) {
    return <p className="page-title">Loading watches…</p>
  }

  if (specs.length === 0) {
    return (
      <div className="card">
        <p>Watch database could not be loaded. Add <code>watchspecs.json</code> to the <code>public</code> folder.</p>
        <button type="button" className="btn" onClick={() => navigate('/')}>Back to collection</button>
      </div>
    )
  }

  return (
    <>
      <h1 className="page-title">Add watch</h1>

      <div className="card">
        <label className="label">Brand</label>
        <select
          className="select"
          value={brand}
          onChange={(e) => { setBrand(e.target.value); setModel(''); setReference(''); }}
        >
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <label className="label">Model</label>
        <select
          className="select"
          value={model}
          onChange={(e) => { setModel(e.target.value); setReference(''); }}
        >
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="card">
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
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
            Spec: {currentSpec.spec_low} to {currentSpec.spec_high}
          </p>
        )}
      </div>

      <button type="button" className="btn" style={{ width: '100%' }} onClick={handleAdd} disabled={!currentSpec}>
        Add to collection
      </button>
      <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => navigate('/')}>
        Cancel
      </button>
    </>
  )
}
