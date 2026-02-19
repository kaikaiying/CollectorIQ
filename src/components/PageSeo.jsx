import { Helmet } from 'react-helmet-async'

const SITE_TITLE = 'Collector IQ — #1 Watch Atomic Tracker'

export default function PageSeo({ title, description }) {
  const fullTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE
  const desc = description || 'Collector IQ — the #1 watch atomic tracker. Drift test against atomic clock. Track accuracy in s/day. Compare to COSC specs.'
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
    </Helmet>
  )
}
