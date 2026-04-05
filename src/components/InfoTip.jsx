import { useState, useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'

/**
 * “i” opens a modal popup (backdrop tap or Escape closes).
 */
export default function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false)
  const closeBtnRef = useRef(null)
  const id = useId()
  const dialogId = `${id}-info-dialog`

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open])

  return (
    <span className="info-tip">
      <button
        type="button"
        className="info-tip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
      >
        <span className="info-tip__mark" aria-hidden>i</span>
      </button>
      {open &&
        createPortal(
          <div
            className="info-tip-backdrop"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              id={dialogId}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="info-tip-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeBtnRef}
                type="button"
                className="info-tip-modal__close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
              <div className="info-tip-modal__body">{children}</div>
            </div>
          </div>,
          document.body
        )}
    </span>
  )
}
