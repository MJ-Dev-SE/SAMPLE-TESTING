// Baseline Playwright smoke test for the PhilGo clone (used by the FE-CO agent).
// Launches headless Chromium against the running Vite dev server, visits every
// route, exercises core interactions (language switch, scroll), and collects
// real console errors / page exceptions. Prints a JSON summary to stdout.
//
//   BASE_URL=http://localhost:5175 node tests/smoke.mjs
//
// The dev server must already be running. Exit code is 0 even when issues are
// found — the caller reads the JSON, it does not rely on the exit code.

import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:5175'

// Routes worth visiting. Mirrors src/App.tsx PageRoutes (+ locale prefixes).
const ROUTES = [
  '/',
  '/menu',
  '/post/list?post_id=freetalk',
  '/company',
  '/chat',
  '/post/view',
  '/en/',
  '/ko/',
]

const result = { base: BASE, routes: [], interactions: [], summary: {} }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })

for (const route of ROUTES) {
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  let rendered = false
  let status = null
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 20000 })
    status = resp ? resp.status() : null
    // "rendered" = React mounted real content into #root.
    rendered = await page.evaluate(() => {
      const root = document.getElementById('root')
      return !!root && root.children.length > 0 && root.innerText.trim().length > 0
    })
    // Scroll to the bottom to trigger any scroll-driven UI, then back up.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(250)
    await page.evaluate(() => window.scrollTo(0, 0))
  } catch (e) {
    errors.push(`navigation: ${e.message}`)
  }

  result.routes.push({ route, status, rendered, errors })
  await page.close()
}

// Interaction: language switch on the home page should flip <html lang>.
// Use a FRESH context so a previously-persisted lang (from visiting /ko/) does
// not poison the test, then click the currently-inactive locale button.
{
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await fresh.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 })
    // Start from a known state: clear the persisted lang and reload (→ default en).
    await page.evaluate(() => localStorage.removeItem('lang'))
    await page.reload({ waitUntil: 'networkidle' })
    const before = await page.evaluate(() => document.documentElement.lang)
    // The LanguageSwitcher is a role=group; click the button that is NOT active.
    const group = page.locator('[role="group"][aria-label="Language"]').first()
    const inactive = group.locator('button[aria-pressed="false"]').first()
    let clicked = false
    if (await inactive.count()) {
      await inactive.click({ timeout: 3000 }).then(() => (clicked = true)).catch(() => {})
    }
    await page.waitForTimeout(300)
    const after = await page.evaluate(() => document.documentElement.lang)
    result.interactions.push({
      name: 'language-switch',
      clicked,
      langBefore: before,
      langAfter: after,
      changed: before !== after,
      errors,
    })
  } catch (e) {
    result.interactions.push({ name: 'language-switch', error: e.message, errors })
  }
  await fresh.close()
}

await browser.close()

// Roll up.
const routesWithErrors = result.routes.filter((r) => r.errors.length > 0)
const routesNotRendered = result.routes.filter((r) => !r.rendered)
result.summary = {
  routesChecked: result.routes.length,
  routesWithErrors: routesWithErrors.map((r) => r.route),
  routesNotRendered: routesNotRendered.map((r) => r.route),
  totalConsoleErrors: result.routes.reduce((n, r) => n + r.errors.length, 0),
  ok: routesWithErrors.length === 0 && routesNotRendered.length === 0,
}

console.log(JSON.stringify(result, null, 2))
