/**
 * Simple diagram: watch aligned with target time → tap the Tap button once.
 */
export default function DriftTapDemoIllustration({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 340 128"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="drift-tap-demo-title"
    >
      <title id="drift-tap-demo-title">
        Align the app target with your watch, then press Tap when the second hand reaches it
      </title>
      {/* Watch */}
      <circle cx="64" cy="64" r="44" fill="var(--card-bg, #1a1a1e)" stroke="var(--text-tertiary, #666)" strokeWidth="2" />
      <circle cx="64" cy="64" r="3" fill="var(--text-secondary, #999)" />
      {/* Hour hand (~10) */}
      <line x1="64" y1="64" x2="52" y2="44" stroke="var(--text, #e8e8ea)" strokeWidth="3" strokeLinecap="round" />
      {/* Minute hand (~10) */}
      <line x1="64" y1="64" x2="72" y2="38" stroke="var(--text, #e8e8ea)" strokeWidth="2" strokeLinecap="round" />
      {/* Second hand at 12 */}
      <line x1="64" y1="64" x2="64" y2="26" stroke="var(--accent, #c9a227)" strokeWidth="1.5" strokeLinecap="round" />
      <text x="64" y="118" textAnchor="middle" fill="var(--text-secondary, #999)" fontSize="11" fontFamily="var(--font-sans, system-ui, sans-serif)">
        Your watch
      </text>

      {/* Arrow */}
      <path
        d="M118 64 L148 64 M140 58 L148 64 L140 70"
        fill="none"
        stroke="var(--text-tertiary, #666)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Phone / app */}
      <rect
        x="158"
        y="14"
        width="172"
        height="100"
        rx="14"
        fill="var(--card-bg, #1a1a1e)"
        stroke="var(--text-tertiary, #666)"
        strokeWidth="2"
      />
      <text x="244" y="48" textAnchor="middle" fill="var(--text, #e8e8ea)" fontSize="18" fontWeight="600" fontFamily="var(--font-mono, ui-monospace, monospace)" letterSpacing="0.04em">
        10:10:30
      </text>
      <text x="244" y="66" textAnchor="middle" fill="var(--text-tertiary, #888)" fontSize="10" fontFamily="var(--font-sans, system-ui, sans-serif)">
        Target (same as watch)
      </text>
      {/* Tap button */}
      <rect x="194" y="76" width="100" height="28" rx="8" fill="var(--accent, #c9a227)" opacity="0.9" />
      <text x="244" y="95" textAnchor="middle" fill="var(--bg, #0c0c0e)" fontSize="13" fontWeight="600" fontFamily="var(--font-sans, system-ui, sans-serif)">
        Tap
      </text>
      {/* Finger hint */}
      <path
        d="M262 102 Q268 108 266 114 Q264 118 258 116"
        fill="none"
        stroke="var(--text-secondary, #aaa)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <text x="276" y="112" fill="var(--text-secondary, #999)" fontSize="10" fontFamily="var(--font-sans, system-ui, sans-serif)">
        once
      </text>
    </svg>
  )
}
