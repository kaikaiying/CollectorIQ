import { Link } from 'react-router-dom'
import { usePageTitle } from '../contexts/PageTitleContext'
import PageSeo from '../components/PageSeo'
import FeedbackOptions from '../components/FeedbackOptions'

export default function Feedback() {
  usePageTitle('Feedback')

  return (
    <>
      <PageSeo
        title="Feedback"
        description="Tell us about bugs, ideas, drift tests, wear log — Watch Collector."
      />
      <p style={{ margin: '0 0 var(--space)', fontSize: 14 }}>
        <Link to="/settings" style={{ color: 'var(--accent)' }}>
          ← Back to Settings
        </Link>
      </p>
      <h2 className="section-title" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
        Feedback &amp; help
      </h2>
      <p className="settings-muted" style={{ marginTop: 0, marginBottom: 'var(--space)' }}>
        Bug, Idea, Email us, or Rate app — same as Settings.
      </p>
      <FeedbackOptions variant="full" />
    </>
  )
}
