import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '1.25rem', fontFamily: 'system-ui, sans-serif', color: '#0f172a', maxWidth: '28rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem' }}>Something went wrong</h1>
          <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#475569', margin: 0 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: '1rem', marginBottom: 0 }}>
            Open DevTools → Console (⌥⌘J) for the full stack trace.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * HashRouter only reads `location.hash`. Opening http://host:port/time serves index.html but
 * leaves hash empty, so the app stays on "/". Rewrite once so bookmarks and typed URLs work.
 */
function syncHashFromPathname() {
  if (typeof window === 'undefined') return
  const { protocol, pathname, search, hash, origin } = window.location
  if (protocol === 'file:') return
  const h = hash && hash !== '#'
  if (h) return
  if (pathname === '/' || pathname === '') return
  // Dev server and static hosts may serve index for these; avoid hijacking asset paths.
  if (
    pathname.startsWith('/@') ||
    pathname.startsWith('/node_modules') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/assets/') ||
    /\.[a-z0-9]+$/i.test(pathname.replace(/\/$/, ''))
  ) {
    return
  }
  const appRoute =
    /^\/(time|discovery|settings|add-watch|privacy|share|community|subscribe|feedback)(\/|$)/i.test(pathname) ||
    /^\/watch\//i.test(pathname) ||
    /^\/drift-test(\/|$)/i.test(pathname)
  if (!appRoute) return
  const pathInHash = pathname.replace(/^\//, '')
  window.history.replaceState(null, '', `${origin}/#/${pathInHash}${search || ''}`)
}

syncHashFromPathname()

if (Capacitor.getPlatform() === 'ios') {
  document.documentElement.classList.add('platform-ios')
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<p style="padding:1rem;font-family:sans-serif">Missing #root — check index.html.</p>'
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <RootErrorBoundary>
          <HelmetProvider>
            <App />
            <Analytics />
          </HelmetProvider>
        </RootErrorBoundary>
      </React.StrictMode>
    )
  } catch (err) {
    rootEl.textContent = `Failed to start the app: ${err?.message || err}`
  }
}
