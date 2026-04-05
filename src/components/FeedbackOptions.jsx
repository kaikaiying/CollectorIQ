import { APP_STORE_REVIEW_URL } from '../config/appLinks'
import { FEEDBACK_MAIL } from '../lib/feedbackMailto'

function Chevron() {
  return <span className="settings-chevron" aria-hidden>›</span>
}

const REVIEW_FALLBACK =
  'https://apps.apple.com/search?term=Watch+Collector+Accuracy'

/**
 * Bug · Idea · Email us · Rate app — full rows (Settings / /feedback) or compact chips.
 */
export default function FeedbackOptions({ variant = 'full' }) {
  const reviewHref = APP_STORE_REVIEW_URL || REVIEW_FALLBACK

  if (variant === 'compact') {
    return (
      <div className="feedback-options feedback-options--compact card card--compact">
        <p className="feedback-options-compact-title">Feedback</p>
        <div className="feedback-options-chips" role="list">
          <a href={FEEDBACK_MAIL.bug()} className="feedback-chip" role="listitem">
            <span className="feedback-chip-emoji" aria-hidden>🐞</span>
            Bug
          </a>
          <a href={FEEDBACK_MAIL.feature()} className="feedback-chip" role="listitem">
            <span className="feedback-chip-emoji" aria-hidden>✨</span>
            Idea
          </a>
          <a href={FEEDBACK_MAIL.general()} className="feedback-chip" role="listitem">
            <span className="feedback-chip-emoji" aria-hidden>✉️</span>
            Email us
          </a>
          <a
            href={reviewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="feedback-chip"
            role="listitem"
          >
            <span className="feedback-chip-emoji" aria-hidden>⭐</span>
            Rate app
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="card card--menu feedback-options feedback-options--full">
      <p className="feedback-options-lead">
        Email opens your mail app with the subject ready — edit the message however you like. Rate app opens the App Store.
      </p>
      <div role="navigation" aria-label="Feedback">
        <a href={FEEDBACK_MAIL.bug()} className="settings-row">
          <span className="settings-row-icon" aria-hidden>🐞</span>
          <span className="settings-row-label">
            <strong>Bug</strong>
            <span className="settings-row-sublabel">Something broke or looks wrong</span>
          </span>
          <Chevron />
        </a>
        <a href={FEEDBACK_MAIL.feature()} className="settings-row">
          <span className="settings-row-icon" aria-hidden>✨</span>
          <span className="settings-row-label">
            <strong>Idea</strong>
            <span className="settings-row-sublabel">What you wish we’d build next</span>
          </span>
          <Chevron />
        </a>
        <a href={FEEDBACK_MAIL.general()} className="settings-row">
          <span className="settings-row-icon" aria-hidden>✉️</span>
          <span className="settings-row-label">
            <strong>Email us</strong>
            <span className="settings-row-sublabel">Anything else — thoughts, timing questions, wear log…</span>
          </span>
          <Chevron />
        </a>
        <a href={reviewHref} target="_blank" rel="noopener noreferrer" className="settings-row">
          <span className="settings-row-icon" aria-hidden>⭐</span>
          <span className="settings-row-label">
            <strong>Rate app</strong>
            <span className="settings-row-sublabel">App Store review — helps others find Watch Collector</span>
          </span>
          <Chevron />
        </a>
      </div>
    </div>
  )
}
