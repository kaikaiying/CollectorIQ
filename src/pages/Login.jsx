import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageSeo from '../components/PageSeo'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { authReady, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }
    if (mode === 'signup' && !nickname.trim()) {
      setError('Please enter a nickname.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, nickname.trim())
      } else {
        await signInWithEmail(email.trim(), password)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Google sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleApple = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithApple()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Apple sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  const brandBlock = (
    <div className="login-brand">
      <div className="login-logo-wrap">
        <img src="/logo.png" alt="Collector IQ" className="login-logo" />
      </div>
      <h1 className="login-headline">Track your watch accuracy</h1>
      <p className="login-tagline">Why Collector IQ:</p>
      <ul className="login-how">
        <li><strong>Watch accuracy tracker</strong> — drift test vs atomic time, compare to COSC and manufacturer specs (s/day)</li>
        <li><strong>Community data</strong> — see how your watch and brands perform in the real world, not just on paper</li>
        <li><strong>Your data, your control</strong> — export anytime, reset when you correct your watch, first watch free</li>
      </ul>
    </div>
  )

  if (!authReady) {
    return (
      <div className="app-main" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        {brandBlock}
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Firebase is not configured. Add your web app config to <code>.env</code> (see <code>.env.example</code>).</p>
      </div>
    )
  }

  return (
    <div className="app-main" style={{ paddingTop: '1.5rem' }}>
      <PageSeo title="Sign in" description="Track mechanical and automatic watch accuracy with drift tests vs atomic time. Compare to COSC specs. Free for watch collectors — sign in or register." />
      {brandBlock}

      <form onSubmit={handleEmailSubmit} style={{ marginBottom: 'var(--space-lg)', textAlign: 'left' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="btn"
            style={{ flex: 1, opacity: mode === 'signin' ? 1 : 0.5 }}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, opacity: mode === 'signup' ? 1 : 0.5 }}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Register
          </button>
        </div>
        {mode === 'signup' && (
          <>
            <label className="label">Nickname</label>
            <input
              type="text"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Ataberk"
              autoComplete="username"
              style={{ marginBottom: '0.75rem' }}
            />
          </>
        )}
        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          style={{ marginBottom: '0.75rem' }}
        />
        <label className="label">Password</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          style={{ marginBottom: '0.75rem' }}
        />
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Register'}
        </button>
      </form>

      <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: '1rem', textAlign: 'center' }}>or</p>

      <button
        type="button"
        className="btn-google"
        style={{ marginBottom: '0.75rem' }}
        onClick={handleGoogle}
        disabled={busy}
        aria-label="Sign in with Google"
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>

      <button
        type="button"
        className="btn-apple"
        style={{ marginBottom: 'var(--space-xl)' }}
        onClick={handleApple}
        disabled={busy}
        aria-label="Sign in with Apple"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        Sign in with Apple
      </button>

      <p className="app-footer" style={{ textAlign: 'center' }}>
        By continuing you agree to our{' '}
        <Link to="/privacy">Terms and Privacy Policy</Link>.
        {' · '}
        <Link to="/subscribe">Pricing</Link>
        {' · '}
        <Link to="/community">Share with your watch community</Link>
      </p>
    </div>
  )
}
