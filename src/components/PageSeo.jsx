import { Helmet } from 'react-helmet-async'

const SITE_TITLE = 'Collector IQ — #1 Watch Accuracy Tracker'
const DEFAULT_DESC = 'Collector IQ — track watch accuracy vs atomic clock. Drift test in s/day. Compare to COSC and manufacturer specs. Omega, Rolex, Seiko, Tudor.'

export default function PageSeo({ title, description }) {
  const fullTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE
  const desc = description || DEFAULT_DESC
  const url = typeof window !== 'undefined' ? window.location.origin + (window.location.pathname || '/') + (window.location.hash || '') : 'https://collectoriq.app/'
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
    </Helmet>
  )
}
