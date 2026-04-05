/**
 * Small SVG demos for InfoTip modals — same visual language as drift tap demo.
 * All use theme CSS variables where possible.
 */

function DemoWrap({ title, children }) {
  return (
    <figure className="info-tip-demo-figure">
      {children}
      {title ? <figcaption className="info-tip-demo-caption">{title}</figcaption> : null}
    </figure>
  )
}

export function CollectionEmptyVisual() {
  return (
    <DemoWrap title="Add watches, then measure timing vs atomic time on one screen.">
      <svg className="info-tip-demo-svg" viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="8" y="12" width="100" height="96" rx="10" fill="var(--bg-elevated, #1e293b)" stroke="var(--text-tertiary, #64748b)" strokeWidth="1.5" />
        <text x="58" y="42" textAnchor="middle" fill="var(--text-secondary, #94a3b8)" fontSize="11" fontFamily="system-ui, sans-serif">Add watch</text>
        <circle cx="58" cy="72" r="14" fill="none" stroke="var(--accent, #0d9488)" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M52 72h12M58 66v12" stroke="var(--accent)" strokeWidth="1.5" />
        <path d="M125 60 L165 60 M157 54 L165 60 L157 66" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
        <rect x="178" y="20" width="134" height="78" rx="8" fill="var(--card-bg, #0f172a)" stroke="var(--border, #334155)" strokeWidth="1.5" />
        <text x="245" y="42" textAnchor="middle" fill="var(--text-secondary, #94a3b8)" fontSize="10" fontFamily="system-ui">Drift vs atomic</text>
        <circle cx="210" cy="68" r="8" fill="var(--accent)" opacity="0.35" />
        <circle cx="245" cy="68" r="8" fill="var(--accent)" opacity="0.55" />
        <circle cx="280" cy="68" r="8" fill="var(--accent)" />
      </svg>
    </DemoWrap>
  )
}

export function CollectionTabsVisual() {
  return (
    <DemoWrap title="One watch selected → four tabs for everything else on this page.">
      <svg className="info-tip-demo-svg" viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="10" y="8" width="90" height="36" rx="6" fill="var(--btn-secondary-bg, #334155)" stroke="var(--border)" />
        <text x="55" y="30" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="system-ui">Watch row</text>
        <rect x="115" y="10" width="48" height="28" rx="6" fill="var(--btn-bg, #0d9488)" />
        <text x="139" y="28" textAnchor="middle" fill="var(--btn-color, #fff)" fontSize="9" fontWeight="600" fontFamily="system-ui">Drift</text>
        <rect x="168" y="10" width="46" height="28" rx="6" fill="var(--btn-secondary-bg)" stroke="var(--border)" />
        <text x="191" y="28" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="system-ui">Watch</text>
        <rect x="219" y="10" width="52" height="28" rx="6" fill="var(--btn-secondary-bg)" stroke="var(--border)" />
        <text x="245" y="28" textAnchor="middle" fill="var(--text-secondary)" fontSize="8.5" fontFamily="system-ui">Readings</text>
        <rect x="276" y="10" width="38" height="28" rx="6" fill="var(--btn-secondary-bg)" stroke="var(--border)" />
        <text x="295" y="28" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="system-ui">Wear</text>
        <rect x="20" y="58" width="280" height="62" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1.5" />
        <text x="160" y="88" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11" fontFamily="system-ui">Content for the active tab appears here</text>
        <path d="M139 44 L160 52" stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.6" />
      </svg>
    </DemoWrap>
  )
}

export function SpecComplianceVisual() {
  return (
    <DemoWrap title="We compare rate between two taps to the maker’s green range.">
      <svg className="info-tip-demo-svg" viewBox="0 0 320 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="40" y="35" width="200" height="30" rx="4" fill="var(--success, #16a34a)" opacity="0.2" stroke="var(--success)" strokeWidth="1" />
        <text x="140" y="28" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">In spec (s/day)</text>
        <circle cx="70" cy="50" r="6" fill="var(--text-secondary)" />
        <circle cx="200" cy="50" r="6" fill="var(--text-secondary)" />
        <path
          d="M76 50 L188 50 M182 45 L190 50 L182 55"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="160" y="88" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" fontFamily="system-ui">Interval rate vs manufacturer min…max</text>
      </svg>
    </DemoWrap>
  )
}

export function OwnershipFieldsVisual() {
  return (
    <DemoWrap title="Same flow as Add watch: date → serial → optional notes, then Save.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 108" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <text x="8" y="16" fill="var(--text-tertiary)" fontSize="10" fontFamily="system-ui">1. Purchase date</text>
        <rect x="8" y="22" width="200" height="18" rx="4" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="8" y="56" fill="var(--text-tertiary)" fontSize="10" fontFamily="system-ui">2. Serial (optional)</text>
        <rect x="8" y="62" width="200" height="18" rx="4" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="8" y="90" fill="var(--text-tertiary)" fontSize="10" fontFamily="system-ui">3. Notes</text>
        <rect x="8" y="96" width="200" height="10" rx="2" fill="var(--bg-card)" stroke="var(--border)" />
      </svg>
    </DemoWrap>
  )
}

export function RunsHistoryVisual() {
  return (
    <DemoWrap title="Each run is a group of taps; new run doesn’t delete old groups.">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="12" y="12" width="276" height="36" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="24" y="34" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">Run 1 — older taps</text>
        <rect x="12" y="58" width="276" height="36" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="24" y="80" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">Run 2 — current</text>
        <text x="150" y="105" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">← stack continues for each new run</text>
      </svg>
    </DemoWrap>
  )
}

export function WearJournalVisual() {
  return (
    <DemoWrap title="Dots = days worn; separate from drift timing. Scroll the list for older days.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <text x="140" y="14" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">S M T W T F S</text>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle
            key={i}
            cx={32 + i * 32}
            cy="40"
            r="10"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        <circle cx="96" cy="40" r="4" fill="var(--accent)" />
        <circle cx="160" cy="40" r="4" fill="var(--accent)" />
        <circle cx="224" cy="40" r="4" fill="var(--accent)" />
        <rect x="40" y="60" width="200" height="28" rx="4" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="140" y="78" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">History list (scroll inside box)</text>
      </svg>
    </DemoWrap>
  )
}

export function ClockMapVisual() {
  return (
    <DemoWrap title="Local vs GMT for the hero clock · pin colors follow your city list order.">
      <svg className="info-tip-demo-svg" viewBox="0 0 320 118" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="10" y="10" width="140" height="70" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" strokeDasharray="3 2" />
        <circle cx="50" cy="45" r="5" fill="#334155" />
        <circle cx="95" cy="38" r="5" fill="#0f766e" />
        <circle cx="120" cy="58" r="5" fill="#1d4ed8" />
        <text x="80" y="88" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Map pins</text>
        <rect x="165" y="18" width="145" height="22" rx="4" fill="var(--btn-bg)" opacity="0.25" />
        <rect x="165" y="18" width="72" height="22" rx="4" fill="var(--btn-bg)" />
        <text x="201" y="33" textAnchor="middle" fill="var(--btn-color, #fff)" fontSize="8.5" fontWeight="600" fontFamily="system-ui">Local</text>
        <text x="274" y="33" textAnchor="middle" fill="var(--text-secondary)" fontSize="8.5" fontFamily="system-ui">GMT</text>
        <rect x="175" y="52" width="10" height="10" rx="2" fill="#334155" />
        <text x="192" y="62" fill="var(--text-secondary)" fontSize="10" fontFamily="system-ui">14:32:05</text>
        <rect x="175" y="72" width="10" height="10" rx="2" fill="#0f766e" />
        <text x="192" y="82" fill="var(--text-secondary)" fontSize="10" fontFamily="system-ui">09:32:05</text>
        <text x="237" y="106" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Same order → same colors on the map</text>
      </svg>
    </DemoWrap>
  )
}

export function AddCityVisual() {
  return (
    <DemoWrap title="Pick a city from the menu; it appears on the map and in the list below.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="8" y="12" width="200" height="28" rx="4" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="108" y="30" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" fontFamily="system-ui">Choose a city… ▾</text>
        <path d="M220 22 L248 22 L248 40 L220 40 Z" fill="var(--accent-subtle)" stroke="var(--accent)" />
        <text x="234" y="34" textAnchor="middle" fill="var(--accent)" fontSize="14" fontFamily="system-ui">+</text>
        <path d="M100 52 L100 72 M90 62 L110 62" stroke="var(--text-tertiary)" strokeWidth="1.5" />
        <text x="120" y="68" fill="var(--text-secondary)" fontSize="10" fontFamily="system-ui">Added cities show in the list →</text>
      </svg>
    </DemoWrap>
  )
}

export function CityListVisual() {
  return (
    <DemoWrap title="Dot color = map pin. ↑ moves the row up (and color slot). × removes from list only.">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 85" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="8" y="10" width="284" height="28" rx="4" fill="var(--bg-elevated)" stroke="var(--border)" />
        <circle cx="24" cy="24" r="6" fill="#0f766e" />
        <text x="42" y="28" fill="var(--text)" fontSize="11" fontFamily="system-ui">London · 15:04:22</text>
        <text x="230" y="24" fill="var(--text-secondary)" fontSize="12" fontFamily="system-ui">↑</text>
        <text x="258" y="26" fill="var(--danger, #dc2626)" fontSize="14" fontFamily="system-ui">×</text>
        <rect x="8" y="46" width="284" height="28" rx="4" fill="var(--bg-elevated)" stroke="var(--border)" />
        <circle cx="24" cy="60" r="6" fill="#1d4ed8" />
        <text x="42" y="64" fill="var(--text)" fontSize="11" fontFamily="system-ui">New York · 10:04:22</text>
        <text x="230" y="60" fill="var(--text-secondary)" fontSize="12" fontFamily="system-ui">↑</text>
        <text x="258" y="62" fill="var(--danger)" fontSize="14" fontFamily="system-ui">×</text>
      </svg>
    </DemoWrap>
  )
}

export function PrivacyDataVisual() {
  return (
    <DemoWrap title="Data stays on device; exports and links only run when you tap them.">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="20" y="25" width="70" height="55" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="55" y="52" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="system-ui">This</text>
        <text x="55" y="64" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="system-ui">device</text>
        <path d="M95 48 H125 M117 42 L125 48 L117 54" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" />
        <rect x="130" y="30" width="150" height="45" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" strokeDasharray="4 3" />
        <text x="205" y="48" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">No account</text>
        <text x="205" y="62" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">No auto-upload</text>
        <path d="M155 80 H250" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="202" y="94" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Optional: export / email / browser</text>
      </svg>
    </DemoWrap>
  )
}

export function CatalogCustomVisual() {
  return (
    <DemoWrap title="Catalog = we fill spec from DB. Custom = you type the s/day range for in-spec checks.">
      <svg className="info-tip-demo-svg" viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="10" y="15" width="130" height="75" rx="8" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="75" y="38" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">Catalog</text>
        <text x="75" y="54" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Pick brand/model</text>
        <text x="75" y="72" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Specs included</text>
        <rect x="175" y="15" width="130" height="75" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1.5" />
        <text x="240" y="38" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">Custom</text>
        <text x="240" y="54" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">You enter ref</text>
        <text x="240" y="72" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">& min/max s/day</text>
        <path d="M155 52 L168 52" stroke="var(--text-tertiary)" strokeWidth="2" />
        <path d="M80 100 L240 100" stroke="var(--border)" strokeWidth="1" />
        <text x="160" y="105" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Either path ends in your collection</text>
      </svg>
    </DemoWrap>
  )
}

export function DiscoveryVisual() {
  return (
    <DemoWrap title="Illustrative: each column is one reference’s anonymous pool; line at bottom is the zero baseline. Green band = factory spec idea — your cards show real ranges.">
      <svg className="info-tip-demo-svg" viewBox="0 0 320 124" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="10" y="10" width="300" height="94" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1.25" />
        <text x="160" y="26" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600" fontFamily="system-ui">
          Community drift (by reference)
        </text>
        <rect x="22" y="34" width="276" height="32" rx="4" fill="var(--success)" opacity="0.14" stroke="var(--success)" strokeWidth="1" strokeDasharray="4 3" />
        <text x="160" y="53" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">
          vs maker spec (s/day) — schematic
        </text>
        <line x1="20" y1="82" x2="300" y2="82" stroke="var(--text-tertiary)" strokeWidth="1" opacity="0.45" />
        <text x="26" y="79" fill="var(--text-tertiary)" fontSize="7" fontFamily="system-ui">0</text>
        {[
          { x: 22, h: 22 },
          { x: 81, h: 36 },
          { x: 140, h: 28 },
          { x: 199, h: 44 },
          { x: 258, h: 24 },
        ].map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={82 - b.h}
            width="40"
            height={b.h}
            rx="3"
            fill="var(--accent)"
            opacity={0.4 + i * 0.06}
          />
        ))}
        <text x="160" y="98" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">
          Ref A · B · C · D · E
        </text>
      </svg>
    </DemoWrap>
  )
}

export function ShareLinkVisual() {
  return (
    <DemoWrap title="Numbers are a snapshot from when the link was shared — not live data.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 95" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <path d="M40 45 Q40 35 55 35 L85 35 Q100 35 100 45 Q100 55 85 55 L55 55 Q40 55 40 45" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path d="M70 45 Q70 35 85 35 L115 35 Q130 35 130 45 Q130 55 115 55 L85 55 Q70 55 70 45" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <rect x="145" y="25" width="120" height="48" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="205" y="45" textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="600" fontFamily="system-ui">Ref · n · mean</text>
        <text x="205" y="62" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">frozen summary</text>
      </svg>
    </DemoWrap>
  )
}

export function CommunityShareVisual() {
  return (
    <DemoWrap title="Copy text, paste in Reddit / forums / DM — nothing posts by itself.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 95" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="15" y="20" width="100" height="58" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="65" y="48" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Blurb</text>
        <text x="65" y="62" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">in box</text>
        <path d="M125 48 L155 48 M150 43 L160 48 L150 53" fill="none" stroke="var(--text-secondary)" strokeWidth="2" />
        <rect x="168" y="22" width="95" height="52" rx="8" fill="var(--accent-subtle, rgba(13,148,136,0.12))" stroke="var(--accent)" strokeWidth="1" />
        <text x="215" y="42" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="system-ui">Your favorite</text>
        <text x="215" y="56" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="system-ui">community app</text>
      </svg>
    </DemoWrap>
  )
}

export function CollectionWatchRowVisual() {
  return (
    <DemoWrap title="Tap the main row to select & show Drift. Highlight = active. Watch opens the Watch tab. Remove drops it from the list (readings go too).">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="14" y="18" width="210" height="36" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="32" y="40" fill="var(--text-tertiary)" fontSize="10" fontFamily="system-ui">Other watch</text>
        <rect x="14" y="58" width="210" height="36" rx="8" fill="var(--accent-subtle)" stroke="var(--accent)" strokeWidth="2" />
        <text x="32" y="80" fill="var(--text)" fontSize="10" fontWeight="600" fontFamily="system-ui">Selected · tap here</text>
        <path d="M140 36 L175 36 M168 31 L175 36 L168 41" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" />
        <rect x="232" y="22" width="54" height="68" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="259" y="45" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Watch</text>
        <text x="259" y="58" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Remove</text>
        <text x="259" y="78" textAnchor="middle" fill="var(--danger, #dc2626)" fontSize="14" fontFamily="system-ui">×</text>
      </svg>
    </DemoWrap>
  )
}

export function DriftSectionIntroVisual() {
  return (
    <DemoWrap title="This block = live tap test up top, then summaries (spec, averages, service) for the same watch.">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 118" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="12" y="10" width="276" height="38" rx="8" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="150" y="34" textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="600" fontFamily="system-ui">Tap target &amp; Tap button</text>
        <rect x="12" y="56" width="130" height="28" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="77" y="74" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Compliance</text>
        <rect x="152" y="56" width="136" height="28" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="220" y="74" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Service link</text>
        <text x="150" y="108" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Full tables → Readings tab</text>
      </svg>
    </DemoWrap>
  )
}

export function ConsiderServiceVisual() {
  return (
    <DemoWrap title="We flag this when several recent rate intervals look out of spec — a hint only, not a diagnosis.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 88" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="14" y="14" width="6" height="60" rx="1" fill="#f59e0b" />
        <rect x="28" y="20" width="238" height="48" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="40" y="40" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">Heads-up</text>
        <text x="40" y="56" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Pattern: often outside maker range</text>
        <text x="147" y="78" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Optional: book service if it matches how the watch feels</text>
      </svg>
    </DemoWrap>
  )
}

export function DriftSummaryOffsetVisual() {
  return (
    <DemoWrap title="Mean rate = speed between taps (s/day). Mean offset = average seconds fast/slow at each tap vs atomic.">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 95" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="12" y="22" width="128" height="52" rx="8" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="1.2" />
        <text x="76" y="42" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Mean rate</text>
        <text x="76" y="60" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">+X s/day</text>
        <rect x="158" y="22" width="130" height="52" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="223" y="42" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Avg drift</text>
        <text x="223" y="60" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">+Y s</text>
        <text x="150" y="88" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Different numbers · both from your taps</text>
      </svg>
    </DemoWrap>
  )
}

export function ServiceCareLinkVisual() {
  return (
    <DemoWrap title="Opens the brand’s official service page in your browser — we don’t send your readings there.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 82" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="30" y="16" width="220" height="46" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" />
        <rect x="50" y="30" width="100" height="20" rx="4" fill="var(--btn-bg)" />
        <text x="100" y="44" textAnchor="middle" fill="var(--btn-color, #fff)" fontSize="9" fontWeight="600" fontFamily="system-ui">Find service</text>
        <path d="M165 38 L195 38 M190 33 L200 38 L190 43" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" />
        <text x="140" y="72" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">External link · your data stays in the app</text>
      </svg>
    </DemoWrap>
  )
}

export function MovementDetailsCardVisual() {
  return (
    <DemoWrap title="From the catalog or what you entered at Add watch — edit ownership in the Watch tab, not these lines.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="16" y="14" width="248" height="58" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="28" y="36" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Movement</text>
        <text x="110" y="36" fill="var(--text)" fontSize="10" fontFamily="system-ui">Auto · cal. 3235</text>
        <text x="28" y="54" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Category</text>
        <text x="110" y="54" fill="var(--text)" fontSize="10" fontFamily="system-ui">Dress</text>
        <text x="140" y="80" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Read-only reference</text>
      </svg>
    </DemoWrap>
  )
}

export function NewMeasurementRunCardVisual() {
  return (
    <DemoWrap title="Starts a new group label for the next taps — old runs stay in the list until you delete them.">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="20" y="14" width="260" height="26" rx="6" fill="var(--btn-bg)" />
        <text x="150" y="31" textAnchor="middle" fill="var(--btn-color, #fff)" fontSize="10" fontWeight="600" fontFamily="system-ui">Start new run</text>
        <rect x="20" y="48" width="120" height="36" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="80" y="70" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Older run</text>
        <rect x="160" y="48" width="120" height="36" rx="6" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="220" y="70" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">New taps → here</text>
      </svg>
    </DemoWrap>
  )
}

export function WatchTabContextVisual() {
  return (
    <DemoWrap title="Confirms model &amp; ref for the tab you’re on — matches the highlighted watch row.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 78" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="12" y="10" width="256" height="28" rx="6" fill="var(--btn-secondary-bg)" stroke="var(--border)" />
        <text x="140" y="28" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Drift · Watch · Readings · Wear</text>
        <rect x="12" y="44" width="256" height="26" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <text x="24" y="61" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="system-ui">Submariner</text>
        <text x="180" y="61" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Ref · 126610</text>
      </svg>
    </DemoWrap>
  )
}

export function DriftContextChipsVisual() {
  return (
    <DemoWrap title="Optional labels saved with the next tap — helps you remember position &amp; winding when you review history.">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 88" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <text x="12" y="16" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Position</text>
        <rect x="12" y="22" width="52" height="22" rx="11" fill="var(--btn-bg)" />
        <text x="38" y="37" textAnchor="middle" fill="var(--btn-color, #fff)" fontSize="8" fontFamily="system-ui">DU</text>
        <rect x="70" y="22" width="44" height="22" rx="11" fill="var(--btn-secondary-bg)" stroke="var(--border)" />
        <text x="92" y="37" textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontFamily="system-ui">DD</text>
        <text x="12" y="62" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Winding</text>
        <rect x="12" y="68" width="56" height="22" rx="11" fill="var(--btn-secondary-bg)" stroke="var(--border)" />
        <text x="40" y="83" textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontFamily="system-ui">Full</text>
        <path d="M200 52 L245 52 M240 47 L250 52 L240 57" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="222" y="74" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">Stored on tap</text>
      </svg>
    </DemoWrap>
  )
}

export function DriftOverviewCardVisual() {
  return (
    <DemoWrap title="Totals for every tap so far: toggle the chart Drift (offset) vs Rate (s/day between taps).">
      <svg className="info-tip-demo-svg" viewBox="0 0 300 102" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="14" y="12" width="62" height="20" rx="4" fill="var(--btn-bg)" />
        <text x="45" y="26" textAnchor="middle" fill="var(--btn-color, #fff)" fontSize="8" fontWeight="600" fontFamily="system-ui">Drift</text>
        <rect x="82" y="12" width="62" height="20" rx="4" fill="var(--btn-secondary-bg)" stroke="var(--border)" />
        <text x="113" y="26" textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontFamily="system-ui">Rate</text>
        <rect x="14" y="38" width="272" height="36" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <path d="M28 62 L80 52 L130 68 L180 48 L230 58 L258 54" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <rect x="14" y="78" width="272" height="18" rx="4" fill="var(--bg-elevated)" stroke="var(--border)" opacity="0.85" />
        <text x="150" y="90" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8" fontFamily="system-ui">mean · std dev · spec counts below</text>
      </svg>
    </DemoWrap>
  )
}

export function LastTapResultVisual() {
  return (
    <DemoWrap title="+ = watch ahead of atomic at that tap · − = behind. Shown right after you hit Tap.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 85" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <circle cx="78" cy="42" r="22" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <text x="78" y="46" textAnchor="middle" fill="var(--text)" fontSize="10" fontFamily="system-ui">Watch</text>
        <circle cx="200" cy="42" r="22" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <text x="200" y="46" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="600" fontFamily="system-ui">Atom</text>
        <path d="M102 42 L172 42 M163 37 L172 42 L163 47" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" />
        <text x="140" y="74" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="system-ui">Δ seconds = what this card shows</text>
      </svg>
    </DemoWrap>
  )
}

export function CollectionEmptyDriftVisual() {
  return (
    <DemoWrap title="Collection lists watches here. Add one, then this drift tool can attach readings to it.">
      <svg className="info-tip-demo-svg" viewBox="0 0 280 75" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
        <rect x="40" y="18" width="200" height="40" rx="8" fill="var(--bg-elevated)" stroke="var(--border)" strokeDasharray="4 3" />
        <text x="140" y="42" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" fontFamily="system-ui">Collection needs a watch</text>
        <path d="M140 60 L140 52 M134 58 L140 52 L146 58" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      </svg>
    </DemoWrap>
  )
}
