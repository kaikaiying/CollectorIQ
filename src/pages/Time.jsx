import { useState, useEffect, useMemo, useCallback } from 'react'
import PageSeo from '../components/PageSeo'
import { usePageTitle } from '../contexts/PageTitleContext'
import {
  WORLD_CLOCK_CITIES,
  MARKER_PALETTE,
  getGmtLabel,
  formatTimeInZone,
  getCityById,
} from '../data/worldClockCities'
import WorldTimeMap from './WorldTimeMap'
import InfoTip from '../components/InfoTip'
import { ClockMapVisual, AddCityVisual, CityListVisual } from '../components/InfoTipFigures'
import FeedbackOptions from '../components/FeedbackOptions'

const STORAGE_KEY = 'collectoriq_world_clock_ids'

/** Default world clock: broad regions — Europe, Turkey, US East, South Asia */
const DEFAULT_IDS = ['london', 'istanbul', 'new-york', 'delhi']

/** Previous default (no Istanbul / Delhi) — upgrade once so Istanbul appears for existing users */
const LEGACY_DEFAULT_IDS = ['london', 'new-york', 'tokyo']

function isLegacyDefault(ids) {
  return (
    ids.length === LEGACY_DEFAULT_IDS.length &&
    LEGACY_DEFAULT_IDS.every((id, i) => ids[i] === id)
  )
}

function loadStoredIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return [...DEFAULT_IDS]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_IDS]
    if (isLegacyDefault(parsed)) return [...DEFAULT_IDS]
    return parsed
  } catch {
    return [...DEFAULT_IDS]
  }
}

function saveIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch (_) {}
}

function formatDateInTimeZone(timeZone) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    }).format(new Date())
  } catch {
    return new Date().toDateString()
  }
}

export default function Time() {
  usePageTitle('Clock')
  const [selectedIds, setSelectedIds] = useState(() => loadStoredIds())
  const [, setTick] = useState(0)
  const [clockTab, setClockTab] = useState('local')

  const localTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', [])

  useEffect(() => {
    saveIds(selectedIds)
  }, [selectedIds])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const heroTz = clockTab === 'gmt' ? 'Etc/UTC' : localTz
  const heroTime = formatTimeInZone(heroTz)
  const heroDate = formatDateInTimeZone(heroTz)
  const heroModeLabel =
    clockTab === 'gmt' ? 'UTC · Reference' : `Local · ${getGmtLabel(localTz) || localTz}`

  const selectedCities = useMemo(
    () => selectedIds.map((id) => getCityById(id)).filter(Boolean),
    [selectedIds]
  )

  const addOptions = useMemo(
    () =>
      WORLD_CLOCK_CITIES.filter((c) => !selectedIds.includes(c.id)).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [selectedIds]
  )

  const addCity = useCallback((id) => {
    if (!id || selectedIds.includes(id)) return
    setSelectedIds((prev) => [...prev, id])
  }, [selectedIds])

  const removeCity = useCallback((id) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const moveUp = useCallback((index) => {
    if (index <= 0) return
    setSelectedIds((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }, [])

  return (
    <>
      <PageSeo
        title="Clock"
        description="World clock with local time and GMT, plus cities on the map."
      />

      <div className="time-hero">
        <div className="chrono-segments" role="tablist" aria-label="Clock mode">
          <button
            type="button"
            role="tab"
            aria-selected={clockTab === 'local'}
            className={`chrono-segment ${clockTab === 'local' ? 'chrono-segment--active' : ''}`}
            onClick={() => setClockTab('local')}
          >
            Local
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={clockTab === 'gmt'}
            className={`chrono-segment ${clockTab === 'gmt' ? 'chrono-segment--active' : ''}`}
            onClick={() => setClockTab('gmt')}
          >
            GMT
          </button>
        </div>
        <p className="time-hero-clock">{heroTime}</p>
        <p className="time-hero-date">{heroDate}</p>
        <p className="time-hero-subline">{heroModeLabel}</p>
      </div>

      <div className="label-with-info" style={{ marginBottom: 'var(--space)' }}>
        <p className="time-page-lead">
          Each city uses its real timezone. Map and list colors stay in sync — use ↑ to change order.
        </p>
        <InfoTip label="About the clock and map">
          <p>
            <strong>Local</strong> uses your phone’s timezone for the big clock. <strong>GMT</strong> is UTC. Map pins use the same colors as your city list, in the same order.
          </p>
          <ClockMapVisual />
        </InfoTip>
      </div>

      <WorldTimeMap cities={selectedCities} selectedIds={selectedIds} />

      <div className="time-add-row">
        <div className="label-with-info" style={{ marginBottom: '0.35rem' }}>
          <label htmlFor="time-add-city" className="label" style={{ margin: 0 }}>
            Add city
          </label>
          <InfoTip label="Adding world cities">
            <p>
              Choose from preset cities with correct IANA time zones. You can reorder the list with <strong>↑</strong>; map colors follow that order.
            </p>
          </InfoTip>
        </div>
        <div className="time-add-controls">
          <select
            id="time-add-city"
            className="select"
            value=""
            onChange={(e) => {
              addCity(e.target.value)
              e.target.value = ''
            }}
            disabled={addOptions.length === 0}
          >
            <option value="">Choose a city…</option>
            {addOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.country}
              </option>
            ))}
          </select>
        </div>
        {addOptions.length === 0 && (
          <p className="time-hint">All preset cities are on your list.</p>
        )}
      </div>

      <div className="label-with-info" style={{ marginTop: 'var(--space-lg)', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>Your cities</p>
        <InfoTip label="Your city list">
          <p>
            Each row shows live local time. The colored dot matches the map pin. Use <strong>↑</strong> to move a city up (and change its color slot). <strong>×</strong> removes it from the list only.
          </p>
          <CityListVisual />
        </InfoTip>
      </div>
      <ul className="time-city-list">
        {selectedIds.map((id, index) => {
          const city = getCityById(id)
          if (!city) return null
          const color = MARKER_PALETTE[index % MARKER_PALETTE.length]
          const gmt = getGmtLabel(city.tz)
          const timeStr = formatTimeInZone(city.tz)
          return (
            <li
              key={id}
              className="time-city-card"
              style={{ '--time-dot': color }}
            >
              <span className="time-city-dot" aria-hidden />
              <div className="time-city-body">
                <div className="time-city-top">
                  <strong className="time-city-name">{city.name}</strong>
                  <span className="time-city-gmt">{gmt || city.tz}</span>
                </div>
                <div className="time-city-country">{city.country}</div>
                <div className="time-city-clock">{timeStr}</div>
              </div>
              <div className="time-city-actions">
                <button
                  type="button"
                  className="btn btn-secondary time-city-btn"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  aria-label={`Move ${city.name} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-secondary time-city-btn time-city-btn--danger"
                  onClick={() => removeCity(id)}
                  aria-label={`Remove ${city.name}`}
                >
                  ×
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {selectedIds.length === 0 && (
        <p className="time-hint" style={{ marginTop: '1rem' }}>
          Add at least one city for the map and list.
        </p>
      )}

      <FeedbackOptions variant="compact" />
    </>
  )
}
