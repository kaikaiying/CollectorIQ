/**
 * Dial time reading – per watch model calibration.
 * Train by marking hands 5 times (1 per day). Data aggregates across users.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { usePageTitle } from '../contexts/PageTitleContext'
import { getCollection, SYNC_COMPLETE_EVENT } from '../App'
import { getCalibrations, canAddCalibration, saveCalibration } from '../lib/dialCalibration'

/** Angle (0–360) from 12 o'clock for point (x, y), given center (cx, cy) as percentage. */
function angleFrom12(x, y, cx, cy) {
  const rad = Math.atan2(x - cx, cy - y)
  let deg = (rad * 180) / Math.PI
  if (deg < 0) deg += 360
  return deg
}

/** Rotation offset: where 12 o'clock is in the image. Top=0, Right=90, Bottom=180, Left=270. */
const ORIENT_OFFSET = { top: 0, right: 90, bottom: 180, left: 270 }

/** Get raw angles (0–360) for debugging. */
function getRawAngles(handPoints, center, orientation = 'top') {
  const cx = center?.x ?? 50
  const cy = center?.y ?? 50
  const { hour, minute, second } = handPoints
  if (!hour || !minute || !second) return null
  const rot = ORIENT_OFFSET[orientation] ?? 0
  const adjust = (angle) => (angle + rot) % 360
  return {
    hour: Math.round(adjust(angleFrom12(hour.x, hour.y, cx, cy))),
    minute: Math.round(adjust(angleFrom12(minute.x, minute.y, cx, cy))),
    second: Math.round(adjust(angleFrom12(second.x, second.y, cx, cy))),
  }
}

/** Compute time from hand positions, center, and orientation. Returns "HH:MM:SS" or null. */
function computeTimeFromHands(handPoints, center, orientation = 'top') {
  const cx = center?.x ?? 50
  const cy = center?.y ?? 50
  const { hour, minute, second } = handPoints
  if (!hour || !minute || !second) return null
  const rot = ORIENT_OFFSET[orientation] ?? 0
  const adjust = (angle) => (angle + rot) % 360
  const secAngle = adjust(angleFrom12(second.x, second.y, cx, cy))
  const minAngle = adjust(angleFrom12(minute.x, minute.y, cx, cy))
  const hrAngle = adjust(angleFrom12(hour.x, hour.y, cx, cy))
  const sec = Math.round(secAngle / 6) % 60
  const min = Math.round(minAngle / 6) % 60
  let hr = (hrAngle / 30) % 12
  if (hr < 0.5) hr = 12
  else hr = Math.floor(hr) || 12
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(hr)}:${pad(min)}:${pad(sec)}`
}

export default function DialTest() {
  usePageTitle('Dial test')
  const [watches, setWatches] = useState([])
  const [selectedWatch, setSelectedWatch] = useState(null)
  const [calibrationVersion, setCalibrationVersion] = useState(0)
  const [imageUrl, setImageUrl] = useState(null)
  const [handMode, setHandMode] = useState(null) // 'center' | 'hour' | 'minute' | 'second' | null
  const [centerPoint, setCenterPoint] = useState(null)
  const [handPoints, setHandPoints] = useState({ hour: null, minute: null, second: null })
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const [imgSize, setImgSize] = useState(null)
  const [orientation, setOrientation] = useState('top')
  const [rotation, setRotation] = useState(0)
  const transformStateRef = useRef({ scale: 1, positionX: 0, positionY: 0 })
  const [zoomDisplay, setZoomDisplay] = useState(1)
  const transformRef = useRef(null)

  const detectedTime = computeTimeFromHands(handPoints, centerPoint, orientation)
  const rawAngles = getRawAngles(handPoints, centerPoint, orientation)

  useEffect(() => {
    setWatches(getCollection())
    const onSync = () => setWatches(getCollection())
    window.addEventListener(SYNC_COMPLETE_EVENT, onSync)
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, onSync)
  }, [])

  const calibrationStatus = selectedWatch
    ? canAddCalibration(selectedWatch.brand, selectedWatch.model)
    : null
  const calibrationCount = selectedWatch
    ? getCalibrations(selectedWatch.brand, selectedWatch.model).length
    : 0

  const handleSaveCalibration = () => {
    if (!selectedWatch || !centerPoint || !handPoints.hour || !handPoints.minute || !handPoints.second) return
    const ok = saveCalibration(selectedWatch.brand, selectedWatch.model, {
      center: centerPoint,
      hour: handPoints.hour,
      minute: handPoints.minute,
      second: handPoints.second,
    })
    if (ok) {
      clearImage()
      setCalibrationVersion((v) => v + 1)
    }
  }

  const handleCapture = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setImgSize(null)
    setCenterPoint(null)
    setHandPoints({ hour: null, minute: null, second: null })
    setHandMode(null)
    setRotation(0)
    e.target.value = ''
  }

  /** Convert container click to image coords (0-100%). Accounts for transform and rotation. */
  const containerToImageCoords = useCallback((clientX, clientY) => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img?.naturalWidth) return null
    const rect = container.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const baseScale = Math.min(cw / iw, ch / ih)
    const rw = iw * baseScale
    const rh = ih * baseScale
    const { scale, positionX, positionY } = transformStateRef.current
    const cx = rect.left + cw / 2 + positionX
    const cy = rect.top + ch / 2 + positionY
    let px = (clientX - cx) / scale
    let py = (clientY - cy) / scale
    const rad = (-rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const ux = px * cos - py * sin
    const uy = px * sin + py * cos
    const x = ((ux + rw / 2) / rw) * 100
    const y = ((uy + rh / 2) / rh) * 100
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  }, [rotation])

  const handleImageClick = (e) => {
    if (!containerRef.current || !handMode) return
    const pt = containerToImageCoords(e.clientX, e.clientY)
    if (!pt) return
    const { x, y } = pt
    if (handMode === 'center') {
      setCenterPoint({ x, y })
      setHandMode(null)
    } else {
      setHandPoints((prev) => ({ ...prev, [handMode]: { x, y } }))
      if (handMode === 'second') setHandMode(null)
      else setHandMode(handMode === 'hour' ? 'minute' : 'second')
    }
  }

  const clearImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setCenterPoint(null)
    setHandPoints({ hour: null, minute: null, second: null })
    setHandMode(null)
    setRotation(0)
  }


  const canSave = centerPoint && handPoints.hour && handPoints.minute && handPoints.second
  const saveAllowed = calibrationStatus?.ok

  return (
    <>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space)' }}>
        Train the dial reader per watch model. Mark hands 5 times (once per day). Data helps all users with the same model.
      </p>

      <div className="card">
        <p className="label" style={{ marginBottom: '0.5rem' }}>Watch to calibrate</p>
        {watches.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Add a watch in Collection first.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {watches.map((w) => (
              <button
                key={w.reference}
                type="button"
                className={`btn btn-secondary ${selectedWatch?.reference === w.reference ? '' : ''}`}
                style={{
                  textAlign: 'left',
                  background: selectedWatch?.reference === w.reference ? 'rgba(255,255,255,0.12)' : undefined,
                }}
                onClick={() => {
                  setSelectedWatch(w)
                  clearImage()
                }}
              >
                <strong>{w.model}</strong>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400 }}>
                  {w.brand} · {getCalibrations(w.brand, w.model).length}/5 calibrations
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedWatch && (
        <div className="card">
          <p className="label" style={{ marginBottom: '0.5rem' }}>Capture dial · {selectedWatch.brand} {selectedWatch.model}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          style={{ display: 'none' }}
          aria-label="Take or choose photo"
        />
        {!imageUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn"
              style={{ width: '100%' }}
              onClick={() => fileInputRef.current?.click()}
            >
              Take photo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose from gallery
            </button>
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 0.5rem', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Pinch to zoom, drag to pan. Align dial center with the crosshair.
            </p>
            {createPortal(
              <div
                ref={containerRef}
                onClick={handleImageClick}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 99999,
                  background: '#000',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: handMode ? 'crosshair' : 'default',
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                }}
              >
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={0.5}
                maxScale={6}
                centerOnInit
                wrapperClass="dial-transform-wrapper"
                contentClass="dial-transform-content"
                onTransformed={(_, state) => {
                  transformStateRef.current = { scale: state.scale, positionX: state.positionX, positionY: state.positionY }
                  setZoomDisplay(state.scale)
                }}
                panning={{ velocityDisabled: true, disabled: !!handMode, allowLeftClickPan: true }}
                doubleClick={{ disabled: true }}
              >
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%', minHeight: 200 }}
                  contentStyle={{ width: '100%', height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Watch dial"
                  onLoad={(e) => {
                    const img = e.target
                    if (img?.naturalWidth) setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    pointerEvents: 'none',
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
                {imgSize && (
                  <div
                    style={{
                      position: 'absolute',
                      ...(imgSize.w >= imgSize.h
                        ? { left: 0, right: 0, top: '50%', height: `${(imgSize.h / imgSize.w) * 100}%`, transform: `translateY(-50%) rotate(${rotation}deg)` }
                        : { top: 0, bottom: 0, left: '50%', width: `${(imgSize.w / imgSize.h) * 100}%`, transform: `translateX(-50%) rotate(${rotation}deg)` }),
                      pointerEvents: 'none',
                    }}
                  >
                    {centerPoint && (
                      <span
                        style={{
                          position: 'absolute',
                          left: `${centerPoint.x}%`,
                          top: `${centerPoint.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 24,
                          height: 24,
                          border: '2px solid #f59e0b',
                          borderRadius: '50%',
                          background: 'rgba(245,158,11,0.2)',
                          display: 'block',
                        }}
                        title="Center"
                      />
                    )}
                    {Object.entries(handPoints).map(([key, pt]) =>
                      pt ? (
                        <span
                          key={key}
                          style={{
                            position: 'absolute',
                            left: `${pt.x}%`,
                            top: `${pt.y}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: key === 'hour' ? '#ef4444' : key === 'minute' ? '#22c55e' : '#3b82f6',
                            background: 'rgba(255,255,255,0.7)',
                            fontSize: 10,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={key}
                        >
                          {key[0].toUpperCase()}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
                </TransformComponent>
              </TransformWrapper>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: 'min(85vw, 85vh, 360px)',
                    height: 'min(85vw, 85vh, 360px)',
                    border: '5px solid #fff',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 4px #000, 0 0 0 8px rgba(255,255,255,0.4), 0 0 40px rgba(0,0,0,0.7)',
                  }}
                >
                  <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 5, background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 0 8px #000' }} />
                  <span style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 5, background: '#fff', transform: 'translateY(-50%)', boxShadow: '0 0 8px #000' }} />
                  <span style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 800, color: '#fff', textShadow: '0 0 6px #000, 0 0 12px #000, 0 2px 6px #000' }}>12</span>
                </div>
              </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', overflowY: 'auto', maxHeight: '40vh' }}>
            <div style={{ marginTop: '0' }}>
              <p className="label" style={{ marginBottom: '0.25rem', fontSize: 13 }}>12 o'clock is at</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['top', 'right', 'bottom', 'left'].map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={`btn btn-secondary ${orientation === o ? '' : ''}`}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: 13,
                      background: orientation === o ? 'rgba(255,255,255,0.12)' : undefined,
                    }}
                    onClick={() => setOrientation(o)}
                  >
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Rotate:</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', minWidth: 40 }}
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                aria-label="Rotate left"
              >
                ↶
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', minWidth: 40 }}
                onClick={() => setRotation((r) => (r + 90) % 360)}
                aria-label="Rotate right"
              >
                ↷
              </button>
              <span style={{ fontSize: 13, minWidth: 40 }}>{rotation}°</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Zoom:</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', minWidth: 40 }}
                onClick={() => transformRef.current?.zoomOut()}
                aria-label="Zoom out"
              >
                −
              </button>
              <span style={{ fontSize: 13, minWidth: 36, textAlign: 'center' }}>{zoomDisplay.toFixed(1)}×</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', minWidth: 40 }}
                onClick={() => transformRef.current?.zoomIn()}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            <p style={{ margin: '0.5rem 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
              {handMode
                ? `Tap to mark ${handMode === 'center' ? 'dial center' : handMode + ' hand'}`
                : centerPoint && handPoints.hour && handPoints.minute && handPoints.second
                  ? 'All marked · Time shown below'
                  : 'Align dial center with the crosshair. Rotate if needed. 1) Mark center 2) Mark hands.'}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHandMode('center')}
              >
                Mark center
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHandMode('hour')}
              >
                Mark hands
              </button>
              {canSave && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleSaveCalibration}
                  disabled={!saveAllowed}
                  title={!saveAllowed ? (calibrationStatus?.reason === 'max' ? '5 calibrations saved. Model trained.' : `Next calibration in ~${calibrationStatus?.nextInMinutes} min`) : 'Save calibration'}
                >
                  Save calibration
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={clearImage}>
                Clear
              </button>
            </div>
            {calibrationStatus && (
              <p style={{ margin: '0.5rem 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
                {calibrationStatus.ok
                  ? `${calibrationCount}/5 calibrations · 1 per day`
                  : calibrationStatus.reason === 'max'
                    ? '5/5 done. This model is trained.'
                    : `Next in ~${Math.ceil((calibrationStatus.nextInMinutes || 0) / 60)}h`}
              </p>
            )}
                </div>
              </div>,
              document.body
            )}
          </>
        )}
      </div>
      )}

      {imageUrl && selectedWatch && (
        <div className="card">
          <p className="label" style={{ marginBottom: '0.25rem' }}>Read time</p>
          <p style={{ margin: 0, fontSize: '2rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {detectedTime ?? '—'}
          </p>
          {rawAngles && (
            <p style={{ margin: '0.25rem 0 0', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
              Angles: H {rawAngles.hour}° M {rawAngles.minute}° S {rawAngles.second}°
            </p>
          )}
          <p style={{ margin: '0.25rem 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
            {detectedTime
              ? "If wrong, try '12 o'clock is at' → pick where 12 is in your photo (Top/Right/Bottom/Left)."
              : 'Mark center, then all three hands.'}
          </p>
        </div>
      )}

      <p style={{ marginTop: 'var(--space)', fontSize: 12, color: 'var(--text-tertiary)' }}>
        Per watch model · 5 calibrations max, 1 per day · Data aggregates across users
      </p>

    </>
  )
}
