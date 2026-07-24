// Verifies the Manila Tour alignment that does NOT require the DB migration:
// static category bar, sticky header, policy/link pages (offline fallback),
// footer branding, and that DB-backed routes degrade without crashing.
import { chromium } from 'playwright'

// Defaults to the hanin brand — bare localhost hits the temporarily-disabled
// Manila Tour (renders NotFound). Revert to localhost:5176 when it is re-enabled.
const BASE = process.env.BASE_URL || 'http://hanin.localhost:5176'
const out = []
const browser = await chromium.launch()

async function visit(route, checks) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  const rec = { route, ok: true, notes: [], pageerrors: errors.filter((e) => e.startsWith('pageerror')) }
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(2200)
    await checks(page, rec)
  } catch (e) {
    rec.ok = false
    rec.notes.push(`FAIL: ${e.message.split('\n')[0]}`)
  }
  rec.pageerrors = errors.filter((e) => e.startsWith('pageerror'))
  if (rec.pageerrors.length) rec.ok = false
  out.push(rec)
  await ctx.close()
}
const text = async (page) => (await page.locator('#root').innerText()).replace(/\s+/g, ' ')

await visit('/', async (page, rec) => {
  const t = await text(page)
  rec.notes.push(/Business Directory/.test(t) && /Information/.test(t) && /News/.test(t) ? 'category bar Manila taxonomy ok' : 'MISSING taxonomy')
  rec.notes.push(/Rooms & Rates|Cottages|Bamboo|Resort/.test(t) ? 'RESORT LEAK' : 'no resort themes ok')
  // Sticky: the top band should have position:sticky
  const sticky = await page.evaluate(() => {
    const el = document.querySelector('.sticky')
    return el ? getComputedStyle(el).position : 'none'
  })
  rec.notes.push(`sticky header: ${sticky}`)
  rec.ok = !/RESORT LEAK|MISSING/.test(rec.notes.join(' ')) && sticky === 'sticky'
})

await visit('/help/terms', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Terms of Use/.test(t) && /Acceptable use/i.test(t) && /Policy/.test(t)
  rec.notes.push(rec.ok ? 'policy (fallback) ok' : 'policy MISSING')
})
await visit('/help/privacy', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Privacy Policy/.test(t) && /local storage/i.test(t)
  rec.notes.push(rec.ok ? 'privacy ok' : 'privacy MISSING')
})
await visit('/help/safety', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Child Safety Standards/.test(t) && /zero tolerance/i.test(t)
  rec.notes.push(rec.ok ? 'child safety ok' : 'MISSING')
})
await visit('/link/view?slug=business-directory', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Business Directory/.test(t) && /Recommended link/.test(t)
  rec.notes.push(rec.ok ? 'link page (fallback) ok' : 'link MISSING')
})
await visit('/company', async (page, rec) => {
  const t = await text(page)
  // Degrades to the empty-state without crashing when the DB isn't migrated.
  rec.ok = /Business Directory|No businesses/.test(t)
  rec.notes.push(rec.ok ? 'company renders (no crash) ok' : 'company FAILED')
})
await visit('/', async (page, rec) => {
  const foot = await page.locator('footer').innerText().catch(() => '')
  rec.ok = /Manila Tour/.test(foot) && /(POLICY|정책)/i.test(foot)
  rec.notes.push(rec.ok ? 'footer Manila branding + policy group ok' : `footer weak: ${foot.slice(0, 80)}`)
})
await visit('/admin', async (page, rec) => {
  await page.waitForTimeout(700)
  rec.ok = /user\/login/.test(page.url()) || /Log in|로그인/i.test(await text(page))
  rec.notes.push(rec.ok ? `admin guard ok → ${page.url()}` : `unexpected ${page.url()}`)
})

console.log(JSON.stringify(out, null, 2))
await browser.close()
