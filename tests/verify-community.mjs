// Verifies the parts of the Post Views / Maroon Feeds / Login Gate / Chat feature
// that DO NOT require the DB migration (supabase/community.sql) to have run yet:
// no crashes on the new routes, active-state highlighting, logged-out SweetAlert
// gate on chat, PostWrite's community-category picker shows up, graceful
// degradation when the categories/chat tables don't exist.
import { chromium } from 'playwright'

// Defaults to the hanin brand — bare localhost hits the temporarily-disabled
// Manila Tour (renders NotFound). Revert to localhost:5176 when it is re-enabled.
const BASE = process.env.BASE_URL || 'http://hanin.localhost:5176'
const out = []
const browser = await chromium.launch()

async function visit(route, checks) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 } })
  const page = await ctx.newPage()
  const pageerrors = []
  page.on('pageerror', (e) => pageerrors.push(e.message))
  const rec = { route, ok: true, notes: [] }
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(2000)
    await checks(page, rec)
  } catch (e) {
    rec.ok = false
    rec.notes.push(`FAIL: ${e.message.split('\n')[0]}`)
  }
  if (pageerrors.length) {
    rec.ok = false
    rec.notes.push(`pageerrors: ${pageerrors.join(' | ')}`)
  }
  out.push(rec)
  await ctx.close()
}
const text = async (page) => (await page.locator('#root').innerText()).replace(/\s+/g, ' ')

// 1. Maroon category feed route doesn't crash (DB not migrated -> "not found" state)
await visit('/post/list?maroon=weather', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Category|카테고리/i.test(t) || t.length > 0
  rec.notes.push('renders without crash: ' + (rec.ok ? 'ok' : 'FAILED'))
})

// 2. Maroon parent feed route doesn't crash
await visit('/post/list?maroon=information', async (page, rec) => {
  const t = await text(page)
  rec.notes.push('renders without crash: ' + (t.length > 0 ? 'ok' : 'FAILED'))
  rec.ok = t.length > 0
})

// 3. Existing board list (non-maroon) still works exactly as before
await visit('/post/list?post_id=freetalk', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Free Board|자유게시판/.test(t)
  rec.notes.push(rec.ok ? 'board list unaffected: ok' : 'board list BROKEN')
})

// 4. Category bar renders new maroon labels (Information/News/Q&A/etc, no resort leak)
await visit('/', async (page, rec) => {
  const t = await text(page)
  rec.notes.push(/Information/.test(t) && /Q&A/.test(t) ? 'taxonomy ok' : 'taxonomy MISSING')
  rec.notes.push(/Rooms & Rates|Cottages|Bamboo/.test(t) ? 'RESORT LEAK' : 'no resort leak')
  rec.ok = !/RESORT LEAK|MISSING/.test(rec.notes.join(' '))
})

// 5. Chat icon in header exists and shows SweetAlert when logged out
await visit('/', async (page, rec) => {
  const btn = page.locator('button[aria-label="Chatting"]')
  const count = await btn.count()
  rec.notes.push(`chat button present: ${count > 0}`)
  if (count === 0) {
    rec.ok = false
    return
  }
  await btn.first().click()
  await page.waitForTimeout(600)
  const swal = await page.locator('.swal2-popup').count()
  const swalText = swal > 0 ? await page.locator('.swal2-popup').innerText() : ''
  rec.ok = swal > 0 && /Login Required/i.test(swalText)
  rec.notes.push(rec.ok ? 'login-required SweetAlert shown: ok' : `SweetAlert FAILED: ${swalText.slice(0, 80)}`)
})

// 6. /chat direct route redirects logged-out visitors to login (no crash)
await visit('/chat', async (page, rec) => {
  await page.waitForTimeout(600)
  const url = page.url()
  rec.ok = /user\/login/.test(url)
  rec.notes.push(rec.ok ? `redirected to login: ${url}` : `unexpected: ${url}`)
})

// 7. PostWrite shows the community-category cascade when opened via ?maroon=
await visit('/post/write?maroon=weather', async (page, rec) => {
  const t = await text(page)
  const hasParent = await page.locator('select').count()
  rec.notes.push(`selects on page: ${hasParent}`)
  rec.ok = /Category|카테고리/.test(t) && hasParent >= 2
  rec.notes.push(rec.ok ? 'community cascade fields present: ok' : 'cascade fields MISSING')
})

// 8. PostWrite normal mode (no maroon) keeps the plain board picker, unaffected
await visit('/post/write?post_id=freetalk', async (page, rec) => {
  const t = await text(page)
  rec.ok = /Board|게시판/.test(t)
  rec.notes.push(rec.ok ? 'normal post-write unaffected: ok' : 'FAILED')
})

// 9. /admin guard unaffected by any of this
await visit('/admin', async (page, rec) => {
  await page.waitForTimeout(700)
  const url = page.url()
  rec.ok = /user\/login/.test(url)
  rec.notes.push(rec.ok ? `admin guard ok -> ${url}` : `unexpected ${url}`)
})

console.log(JSON.stringify(out, null, 2))
await browser.close()
