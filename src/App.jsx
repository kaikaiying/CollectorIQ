import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PageTitleProvider, usePageTitleValue } from './contexts/PageTitleContext'
import { db } from './firebase'
import { syncFromCloud, pushCollectionToCloud, pushReadingsToCloud } from './lib/userDataSync'
import { getDriftReadings, saveDriftReadings } from './lib/driftStorage'
import Login from './pages/Login'
import Collection from './pages/Collection'
import DriftTest from './pages/DriftTest'
import Discovery from './pages/Discovery'
import Settings from './pages/Settings'
import WatchDetail from './pages/WatchDetail'
import AddWatch from './pages/AddWatch'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ShareResults from './pages/ShareResults'
import Community from './pages/Community'
import Subscribe from './pages/Subscribe'
import Ask from './pages/Ask'
import DialTest from './pages/DialTest'

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
  pushCollectionToCloud(watches).catch(() => {})
}

/** Dispatch when cloud sync completes so components can refresh. */
export const SYNC_COMPLETE_EVENT = 'collectoriq-sync-complete'

function AppPageHeader() {
  const title = usePageTitleValue()
  if (!title) return null
  return (
    <header className="app-page-header" aria-hidden="false">
      <h1 className="page-title">{title}</h1>
    </header>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!user?.uid || !db) return
    syncFromCloud(
      user.uid,
      getCollection,
      getDriftReadings,
      setCollection,
      (ref, items) => saveDriftReadings(ref, items)
    ).then(() => {
      const local = getCollection()
      if (local.length > 0) {
        pushCollectionToCloud(local).catch(() => {})
        local.forEach((w) => {
          const readings = getDriftReadings(w.reference)
          if (readings.length > 0) pushReadingsToCloud(w.reference, readings).catch(() => {})
        })
      }
      window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT))
    }).catch(() => {})
  }, [user?.uid])

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
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="login-logo" />
      </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Loading…</p>
      </div>
    )
  }

  if (!user && !isLogin && !isPrivacy && !isShare && !isCommunity && !isSubscribe) {
    return <Navigate to="/login" replace />
  }

  const showNav = !isLogin && !isAddWatch && !isPrivacy && !isShare && !isCommunity && !isSubscribe

  return (
    <PageTitleProvider>
      <div className={`app-layout ${showNav ? 'app-layout--with-nav' : ''}`}>
        <div className="app-status-bar-spacer" aria-hidden="true" />
        {showNav && <AppPageHeader />}
        <main className={showNav ? 'app-scroll' : 'app-main'}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/share" element={<ShareResults />} />
            <Route path="/community" element={<Community />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/add-watch" element={<AddWatch />} />
            <Route path="/watch/:reference" element={<WatchDetail />} />
            <Route path="/ask" element={<Ask />} />
            <Route path="/" element={<Collection />} />
            <Route path="/drift-test" element={<DriftTest />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dial-test" element={<DialTest />} />
          </Routes>
        </main>

        {showNav && (
          <nav className="nav-tabs">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Collection</Link>
            <Link to="/drift-test" className={location.pathname === '/drift-test' ? 'active' : ''}>Drift test</Link>
          <Link to="/discovery" className={location.pathname === '/discovery' ? 'active' : ''}>Discovery</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
          <Link to="/dial-test" className={location.pathname === '/dial-test' ? 'active' : ''}>Dial</Link>
          </nav>
        )}
      </div>
    </PageTitleProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  )
}
