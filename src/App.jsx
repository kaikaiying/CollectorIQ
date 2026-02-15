import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import Login from './pages/Login'
import Collection from './pages/Collection'
import DriftTest from './pages/DriftTest'
import WatchDetail from './pages/WatchDetail'
import Discovery from './pages/Discovery'
import Settings from './pages/Settings'
import AddWatch from './pages/AddWatch'
import PrivacyPolicy from './pages/PrivacyPolicy'

const COLLECTION_KEY = 'collectoriq_collection'
const USER_KEY = 'collectoriq_user'

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

export function getUser() {
  return localStorage.getItem(USER_KEY)
}

export function setUser(name) {
  if (name) localStorage.setItem(USER_KEY, name)
  else localStorage.removeItem(USER_KEY)
}

function AppContent() {
  const [user, setUserState] = useState(getUser())
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isAddWatch = location.pathname === '/add-watch'
  const isPrivacy = location.pathname === '/privacy'

  useEffect(() => {
    setUserState(getUser())
  }, [location.pathname])

  const handleLogin = (name) => {
    setUser(name)
    setUserState(name)
  }

  const handleLogout = () => {
    setUser(null)
    setUserState(null)
  }

  if (!user && !isLogin && !isPrivacy) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-layout">
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/" element={<Collection />} />
          <Route path="/add-watch" element={<AddWatch />} />
          <Route path="/watch/:reference" element={<WatchDetail />} />
          <Route path="/drift-test" element={<DriftTest />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
        </Routes>
      </main>

      {!isLogin && !isAddWatch && !isPrivacy && (
        <nav className="nav-tabs">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Collection</Link>
          <Link to="/drift-test" className={location.pathname === '/drift-test' ? 'active' : ''}>Drift test</Link>
          <Link to="/discovery" className={location.pathname === '/discovery' ? 'active' : ''}>Discovery</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
