// Focused end-to-end verification of the site_content / business / admin features
// (headless Chromium). Dev server must be running on BASE.
//
//   BASE_URL=http://localhost:5175 node tests/verify-features.mjs
//
// Each check runs in a FRESH browser context: the language choice persists in
// localStorage, so a /ko/ visit would otherwise flip every later page to Korean.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:5175'
const out = []
const browser = await chromium.launch()

async function visit(route, checks) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  const rec = { route, ok: true, errors, notes: [] }
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(2500)
    await checks(page, rec)
  } catch (e) {
    rec.ok = false
    rec.notes.push(`FAIL: ${e.message.split('\n')[0]}`)
    rec.notes.push('PAGE TEXT: ' + (await page.locator('#root').innerText().catch(() => '(none)')).replace(/\s+/g, ' ').slice(0, 200))
  }
  out.push(rec)
  await ctx.close()
}

const text = async (page) => (await page.locator('#root').innerText()).replace(/\s+/g, ' ')

// 1. Policy pages via footer URLs
await visit('/help/terms', async (page, rec) => {
  const t = await text(page)
  rec.notes.push(/Terms of Use/.test(t) ? 'title ok' : 'MISSING title')
  rec.notes.push(/Acceptable use/i.test(t) ? 'body ok' : 'MISSING body')
  rec.notes.push(/Policy/.test(t) ? 'policy badge ok' : 'MISSING badge')
  rec.ok = rec.notes.every((n) => !n.startsWith('MISSING'))
})
await visit('/help/privacy', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Privacy Policy/.test(t) && /local storage/i.test(t)
  rec.notes.push(rec.ok ? 'privacy content ok' : 'privacy content MISSING')
})
await visit('/help/safety', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Child Safety Standards/.test(t) && /zero tolerance/i.test(t)
  rec.notes.push(rec.ok ? 'child safety content ok' : 'child safety MISSING')
})

// 2. Advertisement child items — EN presentation + KO locale variant
await visit('/adv/banner', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Banner Ad Information/.test(t) && /Advertisement/.test(t)
  rec.notes.push(rec.ok ? 'ad presentation ok' : 'ad page MISSING content')
})
await visit('/ko/adv/massage', async (page, rec) => {
  const t = await text(page)
  rec.ok = /마사지 광고 안내/.test(t)
  rec.notes.push(rec.ok ? 'KO ad page ok' : 'KO ad page MISSING')
})

// 3. Link child item via the generic content route
await visit('/content/view?slug=user-guide', async (page, rec) => {
  const t = await text(page)
  rec.ok = /User Guide/.test(t) && /Recommended link/.test(t)
  rec.notes.push(rec.ok ? 'link presentation ok' : 'link page MISSING')
})

// 4. Footer child items clickable → open in the center area
await visit('/', async (page, rec) => {
  const links = page.locator('footer a')
  rec.notes.push(`footer links: ${await links.count()}`)
  const policy = page.locator('footer a', { hasText: 'Terms of Use' }).first()
  await policy.waitFor({ timeout: 15000 })
  await policy.evaluate((el) => el.click())
  await page.waitForTimeout(1500)
  const t = await text(page)
  rec.ok = /Terms of Use/.test(t) && /Acceptable use/i.test(t)
  rec.notes.push(rec.ok ? 'footer click-through ok' : 'footer click-through FAILED')
})

// 5. "+" button on Recently updated businesses widget → modal opens
await visit('/', async (page, rec) => {
  const plus = page.locator('button[aria-label="Add a business listing"]')
  if ((await plus.count()) === 0) {
    rec.notes.push('widget hidden (no businesses from DB) — + button not present')
    return
  }
  await plus.first().click()
  await page.waitForTimeout(800)
  rec.ok = (await page.locator('text=Register your business').count()) > 0
  rec.notes.push(rec.ok ? '+ opens modal ok' : 'modal did NOT open')
})

// 6. Business detail page (grab a real id from the homepage widgets)
await visit('/', async (page, rec) => {
  const href = await page
    .locator('a[href*="/company/view?id="]')
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (!href) {
    rec.notes.push('no business links found (DB empty?) — skipping detail check')
    return
  }
  await page.goto(BASE + href, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const t = await text(page)
  rec.ok = /Business Directory/.test(t) && /Last updated/.test(t)
  rec.notes.push(rec.ok ? `business view ok (${href})` : `business view FAILED (${href})`)
})

// 7. /admin — guarded; should redirect to login (not crash)
await visit('/admin', async (page, rec) => {
  await page.waitForTimeout(800)
  const url = page.url()
  const t = await text(page)
  rec.ok = /user\/login/.test(url) || /Log in|로그인/i.test(t)
  rec.notes.push(rec.ok ? `admin guard ok → ${url}` : `unexpected: ${url}`)
})

console.log(JSON.stringify(out, null, 2))
await browser.close()
