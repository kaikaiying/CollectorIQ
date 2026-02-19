import { Helmet } from 'react-helmet-async'

const SITE_TITLE = 'Collector IQ — Watch accuracy tracker'

export default function PageSeo({ title, description }) {
  const fullTitle = title ? `${title} · ${SITE_TITLE}` : SITE_TITLE
  const desc = description || 'Track watch accuracy with drift tests. Compare to COSC and manufacturer specs.'
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
    </Helmet>
  )
}
