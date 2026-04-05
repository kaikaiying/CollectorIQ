import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { colorForWatchReference } from '../lib/wearCalendarColors'

const WEEK_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function pad2(n) {
  return String(n).padStart(2, '0')
}

function dateKey(y, monthIndex, day) {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function monthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const startPad = first.getDay()
  const dim = daysInMonth(year, monthIndex)
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push({ type: 'empty' })
  for (let d = 1; d <= dim; d++) cells.push({ type: 'day', day: d })
  return cells
}

function buildWornMapAll(entries, referenceFilter) {
  const map = new Map()
  for (const e of entries) {
    if (!e?.date) continue
    if (referenceFilter && e.reference !== referenceFilter) continue
    if (!map.has(e.date)) map.set(e.date, new Set())
    map.get(e.date).add(e.reference)
  }
  const out = new Map()
  for (const [k, set] of map) out.set(k, [...set])
  return out
}

function monthKey(year, monthIndex) {
  return year * 12 + monthIndex
}

/** Three consecutive calendar months ending at (endYear, endMonthIndex). */
function threeMonthsEnding(endYear, endMonthIndex) {
  return [-2, -1, 0].map((offset) => {
    const d = new Date(endYear, endMonthIndex + offset, 1)
    return { year: d.getFullYear(), monthIndex: d.getMonth() }
  })
}

function formatMonthShort(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Three-month wear grid + optional legend. Navigate with ‹ › to slide the window (newest month is the cap).
 * @param {{ date: string, reference: string }[]} entries
 * @param {{ reference: string, model?: string, brand?: string }[]} watches
 * @param {string | null} [referenceFilter]
 * @param {boolean} [showLegend] — multi-watch color key (default: true when referenceFilter is null)
 * @param {boolean} [showNav] — month window controls (default true)
 */
export default function WearRollingCalendar({
  entries,
  watches,
  referenceFilter = null,
  showLegend = referenceFilter == null,
  showNav = true,
}) {
  const today = new Date()
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())
  const currentYear = today.getFullYear()

  const [endAnchor, setEndAnchor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }))

  useEffect(() => {
    const t = new Date()
    setEndAnchor({ year: t.getFullYear(), monthIndex: t.getMonth() })
  }, [referenceFilter])

  const wornByDate = useMemo(
    () => buildWornMapAll(entries, referenceFilter),
    [entries, referenceFilter]
  )

  const legendWatches = useMemo(() => {
    if (!referenceFilter) return watches
    const w = watches.find((x) => x.reference === referenceFilter)
    return w ? [w] : []
  }, [watches, referenceFilter])

  const segments = useMemo(() => {
    const { year: ey, monthIndex: em } = endAnchor
    return threeMonthsEnding(ey, em).map(({ year, monthIndex }) => ({
      year,
      monthIndex,
      label: formatMonthShort(year, monthIndex),
      cells: monthCells(year, monthIndex),
    }))
  }, [endAnchor])

  const rangeLabel =
    segments.length === 3
      ? `${segments[0].label} – ${segments[2].label}`
      : ''

  const mk = monthKey(endAnchor.year, endAnchor.monthIndex)
  const maxMk = monthKey(today.getFullYear(), today.getMonth())
  const canGoNext = mk < maxMk

  const shiftEnd = (delta) => {
    setEndAnchor((a) => {
      const cap = new Date()
      const max = monthKey(cap.getFullYear(), cap.getMonth())
      const d = new Date(a.year, a.monthIndex + delta, 1)
      const next = { year: d.getFullYear(), monthIndex: d.getMonth() }
      const nMk = monthKey(next.year, next.monthIndex)
      if (delta > 0 && nMk > max) return a
      return next
    })
  }

  const dotColor = (ref) => colorForWatchReference(ref, watches)

  const singleSwatch =
    referenceFilter != null ? colorForWatchReference(referenceFilter, watches) : null

  return (
    <div className="wear-rolling-calendar">
      {showNav && (
        <div className="wear-rolling-nav">
          <button
            type="button"
            className="wear-year-nav-btn wear-rolling-nav-btn"
            onClick={() => shiftEnd(-1)}
            aria-label="Earlier months"
          >
            ‹
          </button>
          <span className="wear-rolling-nav-label" title={rangeLabel}>
            {rangeLabel}
          </span>
          <button
            type="button"
            className="wear-year-nav-btn wear-rolling-nav-btn"
            onClick={() => shiftEnd(1)}
            disabled={!canGoNext}
            aria-label="Later months"
          >
            ›
          </button>
        </div>
      )}

      {showLegend && legendWatches.length > 0 && (
        <ul className="wear-year-legend wear-rolling-legend" aria-label="Watch colors">
          {legendWatches.map((w) => (
            <li key={w.reference} className="wear-year-legend-item">
              <span
                className="wear-year-legend-swatch"
                style={{ background: colorForWatchReference(w.reference, watches) }}
                aria-hidden
              />
              <Link to={`/?ref=${encodeURIComponent(w.reference)}`} className="wear-year-legend-link">
                {w.brand ? `${w.brand} · ` : ''}{w.model || w.reference}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!showLegend && referenceFilter && singleSwatch && (
        <p className="wear-year-hint wear-rolling-hint">
          <span
            className="wear-year-legend-swatch wear-year-legend-swatch--inline"
            style={{ background: singleSwatch }}
            aria-hidden
          />
          Days you wore this watch (color matches your slot in the collection / Clock palette)
        </p>
      )}

      <div className="wear-rolling-months">
        {segments.map(({ year, monthIndex, label, cells }) => (
          <div key={`${year}-${monthIndex}`} className="wear-month wear-month--rolling">
            <div className="wear-month-title">{label}</div>
            <div className="wear-month-weekdays" aria-hidden>
              {WEEK_LETTERS.map((L, i) => (
                <span key={i} className="wear-month-wd">
                  {L}
                </span>
              ))}
            </div>
            <div className="wear-month-grid">
              {cells.map((c, idx) => {
                if (c.type === 'empty') {
                  return <div key={`e-${idx}`} className="wear-day wear-day--pad" aria-hidden />
                }
                const dk = dateKey(year, monthIndex, c.day)
                const refs = wornByDate.get(dk) || []
                const isToday = dk === todayKey
                const isFuture = dk > todayKey && year >= currentYear
                return (
                  <div
                    key={dk}
                    className={`wear-day ${isToday ? 'wear-day--today' : ''} ${isFuture ? 'wear-day--future' : ''}`}
                  >
                    <span className="wear-day-num">{c.day}</span>
                    <div className="wear-day-dots" aria-hidden={refs.length === 0}>
                      {refs.slice(0, 4).map((ref) => (
                        <span
                          key={ref}
                          className="wear-day-dot"
                          style={{ background: dotColor(ref) }}
                          title={watches.find((x) => x.reference === ref)?.model || ref}
                        />
                      ))}
                      {refs.length > 4 && (
                        <span className="wear-day-more">+{refs.length - 4}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
