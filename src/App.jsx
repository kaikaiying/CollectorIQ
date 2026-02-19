import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Collection from './pages/Collection'
import DriftTest from './pages/DriftTest'
import WatchDetail from './pages/WatchDetail'
import Discovery from './pages/Discovery'
import Settings from './pages/Settings'
import AddWatch from './pages/AddWatch'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ShareResults from './pages/ShareResults'
import Community from './pages/Community'
import Subscribe from './pages/Subscribe'
import Ask from './pages/Ask'

const COLLECTION_KEY = 'collectoriq_collection'

export function getCollection() {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setCollection(watches) {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(watches))
}

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isAddWatch = location.pathname === '/add-watch'
  const isPrivacy = location.pathname === '/privacy'
  const isShare = location.pathname === '/share'
  const isCommunity = location.pathname === '/community'
  const isSubscribe = location.pathname === '/subscribe'

  if (loading && !isShare && !isCommunity && !isSubscribe) {
    return (
      <div className="app-layout" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="login-logo-wrap" style={{ width: 80, height: 80, marginBottom: '1rem' }}>
        <img src="/logo.png" alt="" className="login-logo" />
      </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Loading…</p>
      </div>
    )
  }

  if (!user && !isLogin && !isPrivacy && !isShare && !isCommunity && !isSubscribe) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-layout">
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/share" element={<ShareResults />} />
          <Route path="/community" element={<Community />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/" element={<Collection />} />
          <Route path="/add-watch" element={<AddWatch />} />
          <Route path="/watch/:reference" element={<WatchDetail />} />
          <Route path="/drift-test" element={<DriftTest />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {!isLogin && !isAddWatch && !isPrivacy && !isShare && !isCommunity && !isSubscribe && (
        <nav className="nav-tabs">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Collection</Link>
          <Link to="/drift-test" className={location.pathname === '/drift-test' ? 'active' : ''}>Drift test</Link>
          <Link to="/discovery" className={location.pathname === '/discovery' ? 'active' : ''}>Discovery</Link>
          <Link to="/ask" className={location.pathname === '/ask' ? 'active' : ''}>Ask</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
