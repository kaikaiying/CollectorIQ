import { Link } from 'react-router-dom'
import PageSeo from '../components/PageSeo'
import InfoTip from '../components/InfoTip'
import { CommunityShareVisual } from '../components/InfoTipFigures'

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://collectoriq.app'

const BLURBS = [
  {
    name: 'Reddit (r/Watches, r/Omega, etc.)',
    text: `I've been using Watch Collector — Accuracy Tracker for drift tests vs atomic time and manufacturer specs. Worth a look if you're into timing: ${APP_URL}`,
  },
  {
    name: 'WatchCrunch',
    text: `Drift test your watch with atomic time and compare to COSC/specs. Watch Collector: ${APP_URL}`,
  },
  {
    name: 'Watch Canada / Canadian watch groups',
    text: `Track your watch accuracy with atomic-time drift tests. Watch Collector — Accuracy Tracker: ${APP_URL}`,
  },
  {
    name: 'Facebook — Watch Club, Watch Canada, marketplace',
    text: `Anyone else tracking their watch accuracy? I use Watch Collector — drift vs atomic time and specs. ${APP_URL}`,
  },
  {
    name: 'YouTube (video description / pinned comment)',
    text: `Track your watch accuracy: Watch Collector — Accuracy Tracker. Drift vs atomic time & specs (s/day). https://collectoriq.app`,
  },
]

export default function Community() {
  return (
    <div className="app-main" style={{ paddingBottom: '2rem' }}>
      <PageSeo
        title="For watch communities"
        description="Share Watch Collector — Accuracy Tracker with Reddit, WatchCrunch, and watch groups."
      />
      <Link to="/" style={{ fontSize: 15, color: 'var(--accent)', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to app
      </Link>
      <div className="label-with-info" style={{ marginBottom: '1.5rem' }}>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 600, margin: '0 0 0.25rem' }}>Share with your watch community</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Direct fellow enthusiasts here — Reddit, WatchCrunch, Watch Canada, Facebook watch clubs, YouTube. Copy the text below and paste where you post.
          </p>
        </div>
        <InfoTip label="About sharing">
          <p>
            These are starter messages you can paste as-is or edit. Nothing posts automatically — you choose where to share. The link opens Watch Collector in a browser.
          </p>
          <CommunityShareVisual />
        </InfoTip>
      </div>
      {BLURBS.map((b) => (
        <div key={b.name} className="card" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>{b.name}</p>
          <textarea
            readOnly
            value={b.text}
            rows={4}
            className="input"
            style={{ fontFamily: 'var(--font-body)', fontSize: 16, resize: 'vertical', minHeight: 80 }}
            onClick={(e) => e.target.select()}
          />
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '0.5rem', fontSize: 14 }}
            onClick={() => navigator.clipboard?.writeText(b.text)}
          >
            Copy to clipboard
          </button>
        </div>
      ))}
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: '1rem' }}>
        Link to use everywhere: <strong style={{ color: 'var(--text-secondary)' }}>{APP_URL}</strong>
      </p>
    </div>
  )
}
