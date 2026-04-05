import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { colorForWatchReference, MARKER_PALETTE } from '../lib/wearCalendarColors'

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

function buildWornMap(entries, year, referenceFilter) {
  const map = new Map()
  const prefix = `${year}-`
  for (const e of entries) {
    if (!e?.date?.startsWith(prefix)) continue
    if (referenceFilter && e.reference !== referenceFilter) continue
    const key = e.date
    if (!map.has(key)) map.set(key, new Set())
    map.get(key).add(e.reference)
  }
  const out = new Map()
  for (const [k, set] of map) out.set(k, [...set])
  return out
}

/**
 * @param {object} props
 * @param {number} props.year
 * @param {(y: number) => void} props.onYearChange
 * @param {{ date: string, reference: string }[]} props.entries
 * @param {{ reference: string, model?: string, brand?: string }[]} props.watches — full collection order for Clock-matched colors
 * @param {string | null} [props.referenceFilter] — Spec page: only this watch’s days
 */
export default function WearYearCalendar({
  year,
  onYearChange,
  entries,
  watches,
  referenceFilter = null,
}) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate())

  const wornByDate = useMemo(
    () => buildWornMap(entries, year, referenceFilter),
    [entries, year, referenceFilter]
  )

  const multiMode = !referenceFilter

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, mi) => ({
      monthIndex: mi,
      label: new Date(year, mi, 1).toLocaleDateString(undefined, { month: 'short' }),
      cells: monthCells(year, mi),
    }))
  }, [year])

  const dotColor = (ref) => colorForWatchReference(ref, watches)

  const singleSwatch = referenceFilter
    ? colorForWatchReference(referenceFilter, watches)
    : MARKER_PALETTE[0]

  return (
    <div className="wear-year-calendar">
      <div className="wear-year-nav">
        <button
          type="button"
          className="wear-year-nav-btn"
          onClick={() => onYearChange(year - 1)}
          aria-label={`Previous year ${year - 1}`}
        >
          ‹
        </button>
        <span className="wear-year-label">{year}</span>
        <button
          type="button"
          className="wear-year-nav-btn"
          onClick={() => onYearChange(year + 1)}
          disabled={year >= currentYear}
          aria-label={`Next year ${year + 1}`}
        >
          ›
        </button>
      </div>

      {multiMode && watches.length > 0 && (
        <ul className="wear-year-legend" aria-label="Watch colors">
          {watches.map((w) => (
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

      {!multiMode && (
        <p className="wear-year-hint">
          <span
            className="wear-year-legend-swatch wear-year-legend-swatch--inline"
            style={{ background: singleSwatch }}
            aria-hidden
          />
          Days you wore this watch (color matches your slot in the collection / Clock palette)
        </p>
      )}

      <div className="wear-year-months">
        {months.map(({ monthIndex, label, cells }) => (
          <div key={monthIndex} className="wear-month">
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
                const isFuture =
                  dk > todayKey && year >= currentYear
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
                          title={watches.find((w) => w.reference === ref)?.model || ref}
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
