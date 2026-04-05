import { Helmet } from 'react-helmet-async'

/** Display name / SEO root title */
export const APP_BRAND_FULL = 'Watch Collector — Accuracy Tracker'
export const APP_BRAND_SHORT = 'Watch Collector'

export default function PageSeo({ title, description }) {
  const fullTitle = title ? `${title} | ${APP_BRAND_FULL}` : APP_BRAND_FULL
  const desc = description || `${APP_BRAND_FULL}. Drift tests against atomic time, manufacturer specs, and your watch collection — local-first and free.`
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
    </Helmet>
  )
}
