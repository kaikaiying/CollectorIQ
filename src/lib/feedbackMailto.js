import { SUPPORT_EMAIL } from '../config/appLinks'

/** Build mailto: link with encoded subject/body for support inbox. */
export function mailtoSupport({ subject = '', body = '' }) {
  const parts = []
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`)
  if (body) parts.push(`body=${encodeURIComponent(body)}`)
  const qs = parts.length ? `?${parts.join('&')}` : ''
  return `mailto:${SUPPORT_EMAIL}${qs}`
}

/** One-tap presets — body pre-filled when it helps the user. */
export const FEEDBACK_MAIL = {
  general: () =>
    mailtoSupport({
      subject: 'Watch Collector — feedback',
      body: '',
    }),
  bug: () =>
    mailtoSupport({
      subject: '[Watch Collector] Bug report',
      body: 'What I expected:\n\nWhat happened instead:\n\nSteps to reproduce:\n1.\n2.\n\nDevice / OS / browser:\n\n',
    }),
  feature: () =>
    mailtoSupport({
      subject: '[Watch Collector] Feature idea',
      body: 'I wish the app could...\n\nWhy it would help me:\n\n',
    }),
}
