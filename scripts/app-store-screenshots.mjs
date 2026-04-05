/**
 * Captures real UI screenshots for App Store Connect (iPhone 6.7" portrait: 1290×2796).
 *
 * By default this script does NOT write any files (no PNGs on disk).
 *
 * To opt in and save PNGs on your Desktop (CollectorIQ-app-store-screenshots/):
 *   npm run build && npm run screenshots:appstore:save
 *
 * Prerequisites for :save: npm install && npx playwright install chromium
 *
 * Starts `vite preview` on 127.0.0.1:4173 if nothing is listening there, then seeds
 * demo localStorage (collection + drift + wear) so screens look populated.
 *
 * Produces 10 PNGs (App Store Connect allows up to 10 screenshots per display size).
 */

import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'

const argv = process.argv.slice(2)
const SAVE = argv.includes('--save')
const outIdx = argv.indexOf('--out')
const DESKTOP_DEFAULT = path.join(homedir(), 'Desktop', 'CollectorIQ-app-store-screenshots')
const OUT_DIR =
  outIdx >= 0 && argv[outIdx + 1]
    ? path.resolve(argv[outIdx + 1])
    : DESKTOP_DEFAULT

/** Pro Max–class logical size; 3× matches real device (430×932 → 1290×2796 PNG). */
const VIEWPORT = { width: 430, height: 932 }
const DEVICE_SCALE = 3

const REF_PRIMARY = '126610LN'
const REF_SECOND = '79000N'

function driftRowsForRef(reference) {
  const day = 86400000
  const t0 = Date.now() - 8 * day
  const run = 'legacy'
  const base = [
    { id: `${reference}_1`, driftInSeconds: 0.6, runId: run, position: 'du', winding: 'full' },
    { id: `${reference}_2`, driftInSeconds: 1.0, runId: run },
    { id: `${reference}_3`, driftInSeconds: 0.2, runId: run },
    { id: `${reference}_4`, driftInSeconds: 1.4, runId: run },
    { id: `${reference}_5`, driftInSeconds: 0.9, runId: run },
  ]
  return base.map((r, i) => ({
    ...r,
    timestamp: new Date(t0 + i * day * 1.2).toISOString(),
  }))
}

const SEED = {
  collection: [
    {
      brand: 'Rolex',
      model: 'Submariner Date',
      reference: REF_PRIMARY,
      specMin: -2,
      specMax: 2,
      movementType: 'Automatic',
      movementCalibre: '3235',
      category: 'Diver',
      purchaseDate: '2024-05-18',
      serialNumber: '12A34B56',
    },
    {
      brand: 'Tudor',
      model: 'Black Bay 54',
      reference: REF_SECOND,
      specMin: -2,
      specMax: 4,
      movementType: 'Automatic',
      movementCalibre: 'MT5402',
      category: 'Diver',
    },
  ],
  wear: [
    {
      id: 'seed_w1',
      reference: REF_PRIMARY,
      date: '2026-03-15',
      note: 'Office week',
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'seed_w2',
      reference: REF_PRIMARY,
      date: '2026-03-22',
      note: '',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'seed_w3',
      reference: REF_SECOND,
      date: '2026-03-20',
      note: 'Weekend',
      createdAt: Date.now() - 86400000 * 3,
    },
  ],
}

async function waitForHttpOk(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok || res.status === 404) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function startPreview() {
  const proc = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    env: { ...process.env },
  })
  proc.stderr?.on('data', (d) => {
    const s = d.toString()
    if (/error/i.test(s)) process.stderr.write(s)
  })
  return proc
}

async function portInUse() {
  try {
    const res = await fetch(PREVIEW_URL + '/', { method: 'HEAD' })
    return res.ok || res.status === 200 || res.status === 404
  } catch {
    return false
  }
}

async function seedAndGoto(page, hashPath) {
  await page.goto(`${PREVIEW_URL}/#/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.evaluate((payload) => {
    localStorage.setItem('collectoriq_collection', JSON.stringify(payload.collection))
    localStorage.setItem('collectoriq_wear_log', JSON.stringify(payload.wear))
    localStorage.setItem('collectoriq_world_clock_ids', JSON.stringify(['london', 'istanbul', 'new-york', 'delhi']))
    for (const w of payload.collection) {
      const readings = payload.drift[w.reference] || []
      localStorage.setItem(`collectoriq_drift_${w.reference}`, JSON.stringify(readings))
      localStorage.setItem(`collectoriq_run_${w.reference}`, 'legacy')
    }
  }, {
    collection: SEED.collection,
    wear: SEED.wear,
    drift: {
      [REF_PRIMARY]: driftRowsForRef(REF_PRIMARY),
      [REF_SECOND]: driftRowsForRef(REF_SECOND),
    },
  })
  const url =
    hashPath.startsWith('http') ? hashPath : `${PREVIEW_URL}${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}`
  await page.goto(url, { waitUntil: 'load', timeout: 120_000 })
  await sleep(1500)
}

async function capture(page, filename) {
  const fp = path.join(OUT_DIR, filename)
  await page.screenshot({ path: fp, type: 'png' })
  console.log('Wrote', fp)
}

/**
 * Real taps/focus before each PNG so tabs, chips, filters, and fields look intentionally selected.
 * @param {import('playwright').Page} page
 * @param {string} filename
 */
async function prepShot(page, filename) {
  const tryClick = async (locator, opts) => {
    if (await locator.isVisible().catch(() => false)) await locator.click(opts)
  }

  switch (filename) {
    case '01-collection-watch.png': {
      const tudor = page.locator('.collection-item').nth(1)
      await tryClick(tudor.getByRole('button', { name: /Watch details/i }))
      await sleep(450)
      await page.locator('#collection-watch-detail').scrollIntoViewIfNeeded().catch(() => {})
      break
    }
    case '02-collection-drift.png': {
      await page.getByRole('tab', { name: 'Drift' }).click().catch(() => {})
      await sleep(200)
      await tryClick(page.getByRole('button', { name: 'Face up' }))
      await tryClick(page.getByRole('button', { name: 'Fully wound' }))
      await sleep(200)
      const rateBtn = page.locator('.drift-overview-card').getByRole('button', { name: 'Rate' })
      if (await rateBtn.isVisible().catch(() => false)) {
        await rateBtn.click()
        await sleep(200)
      }
      await page.locator('.collection-drift-section').scrollIntoViewIfNeeded().catch(() => {})
      break
    }
    case '03-collection-readings.png': {
      await page.getByRole('tab', { name: 'Readings' }).click().catch(() => {})
      await sleep(250)
      const row = page.locator('.drift-history-row').first()
      await row.scrollIntoViewIfNeeded().catch(() => {})
      const del = row.locator('.drift-history-delete').first()
      if (await del.isVisible().catch(() => false)) await del.focus()
      break
    }
    case '04-collection-wear.png': {
      await page.getByRole('tab', { name: 'Wear' }).click().catch(() => {})
      await sleep(250)
      await page.locator('.wear-rolling-calendar').scrollIntoViewIfNeeded().catch(() => {})
      const note = page.locator(`#panel-wear-note-${REF_PRIMARY}`)
      if (await note.isVisible().catch(() => false)) {
        await note.fill('Weekend trip - demo')
      }
      break
    }
    case '05-discovery-detail.png': {
      await page.locator('.discovery-spec-bar-wrap').scrollIntoViewIfNeeded().catch(() => {})
      const cta = page.getByRole('link', { name: /View your readings|Add to collection/i }).first()
      if (await cta.isVisible().catch(() => false)) await cta.focus()
      break
    }
    case '06-time.png': {
      await page.getByRole('tab', { name: 'GMT' }).click()
      await sleep(250)
      await page.locator('.time-city-list .time-city-card').first().scrollIntoViewIfNeeded().catch(() => {})
      break
    }
    case '07-discovery.png': {
      const search = page.locator('.discovery-search-input')
      await search.fill('Omega')
      await sleep(350)
      await page.locator('.discovery-card-link').first().scrollIntoViewIfNeeded().catch(() => {})
      break
    }
    case '08-add-watch.png': {
      await page.getByRole('button', { name: 'From catalog' }).click().catch(() => {})
      await sleep(200)
      const selects = page.locator('.card .select')
      if ((await selects.count()) >= 1) {
        let hasOmega = false
        try {
          hasOmega = await selects
            .nth(0)
            .evaluate((el) => [...el.options].some((o) => o.textContent?.includes('Omega')))
        } catch {
          hasOmega = false
        }
        if (hasOmega) {
          await selects.nth(0).selectOption({ label: 'Omega' })
          await sleep(350)
        }
        if ((await selects.count()) >= 2) {
          const modelSel = selects.nth(1)
          const optCount = await modelSel.locator('option').count()
          if (optCount > 1) await modelSel.selectOption({ index: 1 })
        }
        if ((await selects.count()) >= 3) {
          const refSel = selects.nth(2)
          const rc = await refSel.locator('option').count()
          if (rc > 1) await refSel.selectOption({ index: 1 })
        }
      }
      const serial = page.locator('.card').getByPlaceholder(/serial/i).first()
      if (await serial.isVisible().catch(() => false)) await serial.fill('DEMO-12345')
      break
    }
    case '09-feedback.png': {
      const idea = page.getByRole('link', { name: /Idea/i }).first()
      if (await idea.isVisible().catch(() => false)) await idea.focus()
      break
    }
    case '10-settings.png': {
      const summary = page.locator('details.settings-details summary').first()
      if (await summary.isVisible().catch(() => false)) {
        await summary.click()
        await sleep(350)
      }
      const exportSelect = page.locator('details.settings-details select.select--compact')
      if (await exportSelect.isVisible().catch(() => false)) {
        await exportSelect.selectOption('wear')
      }
      break
    }
    default:
      break
  }
  await sleep(350)
}

async function main() {
  if (!SAVE) {
    console.log('App Store screenshot capture is opt-in — no files were written.\n')
    console.log(
      'With --save, PNGs go to ~/Desktop/CollectorIQ-app-store-screenshots/ (or use --out).\n',
    )
    console.log('PNG generation writes to disk only when you ask for it. Run:\n')
    console.log('  npm run build && npm run screenshots:appstore:save\n')
    console.log('Optional custom folder (overrides Desktop default):\n')
    console.log('  npm run build && node scripts/app-store-screenshots.mjs --save --out /path/you/want\n')
    console.log('Or skip automation: open the built app in Simulator/device and capture screens in Xcode / Photos.')
    return
  }

  let previewProc = null
  const already = await portInUse()
  if (!already) {
    console.log('Starting vite preview…')
    previewProc = startPreview()
    await waitForHttpOk(PREVIEW_URL + '/')
  } else {
    console.log(`Using existing server at ${PREVIEW_URL}`)
  }

  console.log('Output folder:', OUT_DIR)
  await mkdir(OUT_DIR, { recursive: true })

  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })
  const page = await context.newPage()

  const shots = [
    [`/#/?ref=${encodeURIComponent(REF_PRIMARY)}&view=watch`, '01-collection-watch.png'],
    [`/#/?ref=${encodeURIComponent(REF_PRIMARY)}&view=drift`, '02-collection-drift.png'],
    [`/#/?ref=${encodeURIComponent(REF_PRIMARY)}&view=readings`, '03-collection-readings.png'],
    [`/#/?ref=${encodeURIComponent(REF_PRIMARY)}&view=wear`, '04-collection-wear.png'],
    [
      `/#/discovery?mock=1&ref=${encodeURIComponent(REF_PRIMARY)}`,
      '05-discovery-detail.png',
    ],
    [`/#/time`, '06-time.png'],
    [`/#/discovery?mock=1`, '07-discovery.png'],
    [`/#/add-watch`, '08-add-watch.png'],
    [`/#/feedback`, '09-feedback.png'],
    [`/#/settings`, '10-settings.png'],
  ]

  for (const [hashPath, file] of shots) {
    await seedAndGoto(page, hashPath)
    await prepShot(page, file)
    await capture(page, file)
  }

  await browser.close()

  if (previewProc) {
    previewProc.kill('SIGTERM')
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log(`\nDone — ${shots.length} files, 1290×2796 (6.7"/6.9" slot).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
