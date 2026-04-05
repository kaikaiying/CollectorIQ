import { HashRouter, Routes, Route, useLocation, Link, Navigate, useSearchParams } from 'react-router-dom'
import { PageTitleProvider, usePageTitleValue } from './contexts/PageTitleContext'
import Collection from './pages/Collection'
import Time from './pages/Time'
import Discovery from './pages/Discovery'
import Settings from './pages/Settings'
import WatchDetail from './pages/WatchDetail'
import Feedback from './pages/Feedback'
import AddWatch from './pages/AddWatch'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ShareResults from './pages/ShareResults'
import Community from './pages/Community'
import Subscribe from './pages/Subscribe'

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

/** Merge fields onto one watch; omit keys by passing '' or null for optional clears. */
export function updateWatchFields(reference, patch) {
  const col = getCollection()
  let found = false
  const next = col.map((w) => {
    if (w.reference !== reference) return w
    found = true
    const merged = { ...w }
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue
      if (v === '' || v === null) delete merged[k]
      else merged[k] = v
    }
    return merged
  })
  if (!found) return false
  setCollection(next)
  window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT))
  return true
}

/** Dispatch when local data changes so components can refresh (kept for future hooks). */
export const SYNC_COMPLETE_EVENT = 'collectoriq-sync-complete'

/** Old bookmarks / links used /drift-test; home includes the full drift test. */
function LegacyDriftRedirect() {
  const [params] = useSearchParams()
  const ref = params.get('ref')
  if (ref) return <Navigate to={`/?ref=${encodeURIComponent(ref)}`} replace />
  return <Navigate to="/" replace />
}

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
  const location = useLocation()

  const isAddWatch = location.pathname === '/add-watch'
  const isPrivacy = location.pathname === '/privacy'
  const isShare = location.pathname === '/share'
  const isCommunity = location.pathname === '/community'
  const isSubscribe = location.pathname === '/subscribe'

  const showNav = !isAddWatch && !isPrivacy && !isShare && !isCommunity && !isSubscribe

  return (
    <PageTitleProvider>
      <div className={`app-layout ${showNav ? 'app-layout--with-nav' : ''}`}>
        <div className="app-status-bar-spacer" aria-hidden="true" />
        {showNav && <AppPageHeader />}
        <main className={showNav ? 'app-scroll' : 'app-main'}>
          <Routes>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/share" element={<ShareResults />} />
            <Route path="/community" element={<Community />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/add-watch" element={<AddWatch />} />
            <Route path="/wear" element={<Navigate to="/" replace />} />
            <Route path="/watch/:reference" element={<WatchDetail />} />
            <Route path="/ask" element={<Navigate to="/feedback" replace />} />
            <Route path="/" element={<Collection />} />
            <Route path="/drift-test" element={<LegacyDriftRedirect />} />
            <Route path="/time" element={<Time />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </main>

        {showNav && (
          <nav className="nav-tabs">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Collection</Link>
            <Link to="/time" className={location.pathname === '/time' ? 'active' : ''}>Clock</Link>
            <Link to="/discovery" className={location.pathname === '/discovery' ? 'active' : ''}>Discovery</Link>
            <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
          </nav>
        )}
      </div>
    </PageTitleProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
