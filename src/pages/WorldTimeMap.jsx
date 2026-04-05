import { useMemo, useState, useEffect } from 'react'
import { getLandDotPositions } from '../lib/landDotGrid'
import { MARKER_PALETTE } from '../data/worldClockCities'

/** Equirectangular: viewBox 0..360 (lng+180), 0..180 (90-lat) */
function project(lng, lat) {
  const cx = Math.min(360, Math.max(0, lng + 180))
  const cy = Math.min(180, Math.max(0, 90 - lat))
  return { cx, cy }
}

/** Land grid dots — uniform. City pins stay larger (ring + shadow in CSS). */
const DOT_R = 0.72
const CITY_DOT_R = 6.5
/** viewBox padding so edge pins / land dots aren’t clipped */
const PAD = 8
const VB = { w: 360 + PAD * 2, h: 180 + PAD * 2 }

export default function WorldTimeMap({ cities = [], selectedIds = [] }) {
  const [landDots, setLandDots] = useState(null)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setLandDots(getLandDotPositions())
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const markers = useMemo(() => {
    const order = new Map(selectedIds.map((id, i) => [id, i]))
    return cities
      .filter((c) => order.has(c.id))
      .map((c) => ({
        ...c,
        color: MARKER_PALETTE[order.get(c.id) % MARKER_PALETTE.length],
      }))
  }, [cities, selectedIds])

  return (
    <div className={`world-map world-map--dotted ${markers.length === 0 ? 'world-map--dotted-empty' : ''}`}>
      <svg
        className="world-map-svg"
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Dotted world map — continents from dot grid; colored pins are your cities"
      >
        <g transform={`translate(${PAD},${PAD})`}>
          <rect width="360" height="180" className="world-map-ocean" />
          {landDots && (
            <g className="world-map-land-dots" aria-hidden>
              {landDots.map((d, i) => (
                <circle key={`l-${i}`} className="world-map-land-dot" cx={d.cx} cy={d.cy} r={DOT_R} />
              ))}
            </g>
          )}
          <rect x="0.5" y="0.5" width="359" height="179" fill="none" className="world-map-frame" rx="2" />
          {markers.map((m) => {
            const { cx, cy } = project(m.lng, m.lat)
            return (
              <g key={m.id} className="world-map-city">
                <circle
                  cx={cx}
                  cy={cy}
                  r={CITY_DOT_R}
                  fill={m.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="world-map-city-dot"
                />
                <title>{`${m.name} · ${m.country}`}</title>
              </g>
            )
          })}
        </g>
      </svg>
      {markers.length === 0 && (
        <div className="world-map-empty-overlay">
          <p>Add cities — colors on the map match your list.</p>
        </div>
      )}
    </div>
  )
}
