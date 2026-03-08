import { Link } from 'react-router-dom'
import PageSeo from '../components/PageSeo'

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://collectoriq.app'

const BLURBS = [
  {
    name: 'Reddit (r/Watches, r/Omega, etc.)',
    text: `I've been using Collector IQ to track my watch accuracy — drift test against atomic time, compare to manufacturer specs and see how your watch stacks up. Worth a look if you're into timing: ${APP_URL}`,
  },
  {
    name: 'WatchCrunch',
    text: `Drift test your watch with atomic time and compare to COSC/specs. Collector IQ: ${APP_URL}`,
  },
  {
    name: 'Watch Canada / Canadian watch groups',
    text: `Track your watch accuracy with atomic-time drift tests. See how you compare to manufacturer specs and the community. Collector IQ — ${APP_URL}`,
  },
  {
    name: 'Facebook — Watch Club, Watch Canada, marketplace',
    text: `Anyone else tracking their watch accuracy? I use Collector IQ — drift test vs atomic time, compare to specs and other collectors. ${APP_URL}`,
  },
  {
    name: 'YouTube (video description / pinned comment)',
    text: `Track your watch accuracy: Collector IQ — drift test against atomic time, compare to manufacturer specs (s/day) and the community. https://collectoriq.app`,
  },
]

export default function Community() {
  return (
    <div className="app-main" style={{ paddingBottom: '2rem' }}>
      <PageSeo
        title="For watch communities"
        description="Share Collector IQ with Reddit, WatchCrunch, Watch Canada, Facebook watch groups. Copy-paste blurbs for watch accuracy and drift test app."
      />
      <Link to="/login" style={{ fontSize: 15, color: 'var(--accent)', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to app
      </Link>
      <h1 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.25rem' }}>Share with your watch community</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Direct fellow enthusiasts here — Reddit, WatchCrunch, Watch Canada, Facebook watch clubs, YouTube. Copy the text below and paste where you post.
      </p>
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
