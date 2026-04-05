import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../contexts/PageTitleContext'
import PageSeo from '../components/PageSeo'
import { exportToExcel, REPORT_BUILDERS } from '../lib/exportReadings'
import InfoTip from '../components/InfoTip'
import { PrivacyDataVisual } from '../components/InfoTipFigures'
import FeedbackOptions from '../components/FeedbackOptions'

function Chevron() {
  return <span className="settings-chevron" aria-hidden>›</span>
}

export default function Settings() {
  usePageTitle('Settings')
  const [exportType, setExportType] = useState('full')
  const [exportMsg, setExportMsg] = useState(null)

  const handleExport = useCallback(() => {
    setExportMsg(null)
    const ok = exportToExcel(exportType)
    if (ok) setExportMsg('Exported successfully.')
    else {
      setExportMsg(
        exportType === 'wear' ? 'Add at least one watch to your collection to export wear.' : 'No readings to export yet.'
      )
    }
  }, [exportType])

  return (
    <>
      <PageSeo title="Settings" description="Watch Collector — export, privacy, review, and contact." />

      <div className="label-with-info settings-intro-wrap" style={{ marginBottom: 'var(--space-lg)' }}>
        <p className="settings-intro" style={{ margin: 0 }}>
          Your watches and drift data stay on this device. Free to use — no account.
        </p>
        <InfoTip label="Privacy and data">
          <p>
            Nothing here requires a login. Optional exports download spreadsheets of your readings. Links open your mail app, browser, or the App Store — we don’t change your data from those screens.
          </p>
          <PrivacyDataVisual />
        </InfoTip>
      </div>

      <section id="feedback" aria-label="Feedback and help" style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 className="section-title" style={{ marginTop: 0, marginBottom: '0.35rem' }}>
          Feedback &amp; help
        </h2>
        <p className="settings-muted" style={{ marginTop: 0, marginBottom: '0.65rem' }}>
          Bug reports, ideas, general email, or an App Store rating.
        </p>
        <FeedbackOptions variant="full" />
      </section>

      <nav className="settings-menu card card--menu" aria-label="Legal">
        <Link to="/privacy" className="settings-row">
          <span className="settings-row-icon" aria-hidden>📄</span>
          <span className="settings-row-label">Terms &amp; privacy</span>
          <Chevron />
        </Link>
        <Link to="/feedback" className="settings-row">
          <span className="settings-row-icon" aria-hidden>📋</span>
          <span className="settings-row-label">Feedback page (bookmark)</span>
          <Chevron />
        </Link>
      </nav>

      <details className="settings-details card card--menu">
        <summary className="settings-row settings-row--summary">
          <span className="settings-row-icon" aria-hidden>📊</span>
          <span className="settings-row-label">Export to Excel</span>
          <span className="settings-chevron settings-chevron--details" aria-hidden>›</span>
        </summary>
        <div className="settings-details-body">
          <p className="settings-muted">
            Drift readings, summaries, or a <strong>wear workbook</strong> for your whole collection: all wear rows on the first sheet, per-watch counts on the second.
          </p>
          <select
            className="select select--compact"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.entries(REPORT_BUILDERS).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary btn--compact" onClick={handleExport}>
            Export to Excel
          </button>
          {exportMsg && <p className="settings-export-msg">{exportMsg}</p>}
        </div>
      </details>

      <p className="app-footer app-footer--center">
        Watch Collector · accuracy tracker
      </p>
    </>
  )
}
