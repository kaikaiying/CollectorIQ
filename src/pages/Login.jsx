import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Login({ onLogin }) {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const n = name.trim() || 'Collector'
    onLogin(n)
    navigate('/', { replace: true })
  }

  return (
    <div style={{ paddingTop: '3rem', textAlign: 'center', maxWidth: '320px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Collector IQ</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Track your watch accuracy. Know when it needs care.</p>

      <form onSubmit={handleSubmit}>
        <label className="label" style={{ textAlign: 'left' }}>Your name (so we can say hi)</label>
        <input
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ataberk"
          autoFocus
          style={{ marginBottom: '1rem' }}
        />
        <button type="submit" className="btn" style={{ width: '100%' }}>
          Get started
        </button>
      </form>

      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '2rem' }}>
        By continuing you agree to our{' '}
        <Link to="/privacy" style={{ color: '#ffd43b', textDecoration: 'underline' }}>Terms and Privacy Policy</Link>.
      </p>
    </div>
  )
}
