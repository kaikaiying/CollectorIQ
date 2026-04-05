import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toYMDLocal(d) {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseYMDLocal(s) {
  if (!s || typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const y = +m[1]
  const mo = +m[2] - 1
  const day = +m[3]
  const d = new Date(y, mo, day)
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null
  return d
}

function stripTime(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/**
 * Themed date picker (YYYY-MM-DD) — avoids the native OS calendar chrome.
 */
export default function DateField({
  id,
  value,
  onChange,
  max,
  min,
  placeholder = 'Select date…',
  allowClear = false,
  disabled = false,
  style,
  className = '',
}) {
  const wrapRef = useRef(null)
  const popoverRef = useRef(null)
  const [open, setOpen] = useState(false)

  const maxDate = useMemo(() => (max ? parseYMDLocal(max) : null), [max])
  const minDate = useMemo(() => (min ? parseYMDLocal(min) : null), [min])
  const selected = useMemo(() => (value ? parseYMDLocal(value) : null), [value])

  const defaultView = useMemo(() => {
    const today = stripTime(new Date())
    let base = selected || today
    if (maxDate && base > maxDate) base = maxDate
    if (minDate && base < minDate) base = minDate
    return new Date(base.getFullYear(), base.getMonth(), 1)
  }, [selected, maxDate, minDate])

  const [viewMonth, setViewMonth] = useState(defaultView)

  useEffect(() => {
    if (open) setViewMonth(defaultView)
  }, [open, defaultView])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      const t = e.target
      if (wrapRef.current?.contains(t)) return
      if (popoverRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  /** Fixed portal so parent overflow (e.g. .app-scroll) does not clip the calendar. */
  useLayoutEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const wrap = wrapRef.current
      const popEl = popoverRef.current
      if (!wrap || !popEl) return
      const rect = wrap.getBoundingClientRect()
      const gap = 8
      const pad = 10
      const maxW = Math.min(292, window.innerWidth - 2 * pad)
      let left = rect.left
      if (left + maxW > window.innerWidth - pad) left = window.innerWidth - pad - maxW
      if (left < pad) left = pad

      const popH = popEl.offsetHeight || 300
      let top = rect.bottom + gap
      if (top + popH > window.innerHeight - pad && rect.top - gap - popH >= pad) {
        top = rect.top - gap - popH
      }
      if (top < pad) top = pad

      popEl.style.top = `${Math.round(top)}px`
      popEl.style.left = `${Math.round(left)}px`
      popEl.style.width = `${Math.round(maxW)}px`
    }
    updatePosition()
    let rafOuter = 0
    let rafInner = 0
    rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(updatePosition)
    })
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    const ro = new ResizeObserver(updatePosition)
    const popEl = popoverRef.current
    if (popEl) ro.observe(popEl)
    return () => {
      cancelAnimationFrame(rafOuter)
      cancelAnimationFrame(rafInner)
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
      ro.disconnect()
    }
  }, [open, viewMonth, allowClear, value])

  const y = viewMonth.getFullYear()
  const m0 = viewMonth.getMonth()
  const first = new Date(y, m0, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(y, m0 + 1, 0).getDate()
  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const isDayDisabled = (day) => {
    const d = stripTime(new Date(y, m0, day))
    if (maxDate && d > maxDate) return true
    if (minDate && d < minDate) return true
    return false
  }

  const isToday = (day) => {
    const t = stripTime(new Date())
    const d = stripTime(new Date(y, m0, day))
    return t.getTime() === d.getTime()
  }

  const isSelected = (day) => {
    if (!selected) return false
    return (
      selected.getFullYear() === y && selected.getMonth() === m0 && selected.getDate() === day
    )
  }

  const pickDay = (day) => {
    if (isDayDisabled(day)) return
    onChange(toYMDLocal(new Date(y, m0, day)))
    setOpen(false)
  }

  const displayText =
    value && selected ? selected.toLocaleDateString(undefined, { dateStyle: 'long' }) : null

  const cells = []
  for (let i = 0; i < startPad; i++) cells.push({ type: 'pad', key: `p-${i}` })
  for (let day = 1; day <= daysInMonth; day++)
    cells.push({ type: 'day', day, key: `d-${day}` })

  const firstNext = stripTime(new Date(y, m0 + 1, 1))
  const nextMonthDisabled = Boolean(maxDate && firstNext > maxDate)

  const lastPrev = stripTime(new Date(y, m0, 0))
  const prevMonthDisabled = Boolean(minDate && lastPrev < minDate)

  const popoverTree = open ? (
    <div
      ref={popoverRef}
      className="date-field__popover date-field__popover--portal"
      role="dialog"
      aria-label="Choose a date"
    >
      <div className="date-field__popover-surface">
        <div className="date-field__nav">
          <button
            type="button"
            className="date-field__nav-btn"
            onClick={() => setViewMonth(new Date(y, m0 - 1, 1))}
            disabled={prevMonthDisabled}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="date-field__month-label">{monthLabel}</span>
          <button
            type="button"
            className="date-field__nav-btn"
            onClick={() => setViewMonth(new Date(y, m0 + 1, 1))}
            disabled={nextMonthDisabled}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <div className="date-field__weekdays" aria-hidden>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="date-field__grid">
          {cells.map((c) =>
            c.type === 'pad' ? (
              <span key={c.key} className="date-field__cell date-field__cell--empty" />
            ) : (
              <button
                key={c.key}
                type="button"
                className={
                  'date-field__cell' +
                  (isSelected(c.day) ? ' date-field__cell--selected' : '') +
                  (isToday(c.day) && !isSelected(c.day) ? ' date-field__cell--today' : '')
                }
                disabled={isDayDisabled(c.day)}
                onClick={() => pickDay(c.day)}
              >
                {c.day}
              </button>
            ),
          )}
        </div>
        {allowClear && value ? (
          <button
            type="button"
            className="date-field__clear btn-link"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
          >
            Clear date
          </button>
        ) : null}
      </div>
    </div>
  ) : null

  return (
    <div ref={wrapRef} className={`date-field ${className}`.trim()} style={style}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        className={`input date-field__trigger ${displayText ? '' : 'date-field__trigger--placeholder'}`.trim()}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="date-field__trigger-text">{displayText || placeholder}</span>
      </button>
      <span className="date-field__icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </span>
      {popoverTree ? createPortal(popoverTree, document.body) : null}
    </div>
  )
}
