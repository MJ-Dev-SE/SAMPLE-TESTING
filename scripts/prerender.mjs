// =============================================================================
// PRE-RENDER (SSG-lite) — `npm run build:prerender`
//
// Rendering strategy (least disruptive meaningful option): the app stays a
// Vite SPA, but after `vite build` this script serves dist/ with `vite
// preview`, loads each KNOWN public route in headless Chromium (Playwright is
// already a devDependency), waits for react-helmet-async to settle the <head>,
// and saves the fully rendered HTML to dist/<route>/index.html.
//
// Static hosts (Vercel included) serve real files before applying the SPA
// rewrite, so crawlers and social scrapers get complete HTML + metadata for
// these routes with zero server runtime; React then mounts on top as usual.
//
// Dynamic detail pages (posts/businesses/news) are NOT pre-rendered — they are
// unbounded and change without redeploys. They stay client-rendered; Google
// executes JS and reads their react-helmet metadata, but non-JS scrapers only
// see the defaults. This limitation is documented in docs/SEO_DEPLOYMENT.md.
//
// Requires: `npm run build` first (the npm script chains it), the Playwright
// Chromium binary (npx playwright install chromium), and .env.local Supabase
// keys so pages render real content.
// =============================================================================
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4183
const BASE = `http://localhost:${PORT}`

/** Known public routes worth shipping as static HTML (keep in sync with App.tsx). */
const ROUTES = [
  '/',
  '/menu',
  '/business-directory',
  '/information', '/information/weather', '/information/experiences',
  '/news', '/news/notices', '/news/life-tips',
  '/qna', '/qna/free-discussion', '/qna/chit-chat',
  '/community', '/community/manila', '/community/angeles',
  '/marketplace', '/marketplace/cell-phone', '/marketplace/peso-exchange',
  '/travel', '/travel/tours-itineraries', '/travel/food-trips',
  '/jobs', '/jobs/new-member-greetings', '/jobs/people-search',
  '/immigration', '/immigration/passport-visa', '/immigration/boarding-house',
  '/help/terms', '/help/privacy', '/help/safety',
]

// 1) serve dist/ via vite preview (reuse a server that's already on the port —
//    e.g. a leftover from an aborted run)
async function portResponds() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}
let preview = null
if (await portResponds()) {
  console.log(`[prerender] reusing server already running on :${PORT}`)
} else {
  preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: root,
    shell: true,
    stdio: 'pipe',
  })
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('vite preview did not start in 30s')), 30000)
    preview.stdout.on('data', (d) => {
      if (String(d).includes(String(PORT))) { clearTimeout(t); res() }
    })
    preview.on('exit', (code) => rej(new Error(`vite preview exited early (${code})`)))
  })
}

// 2) snapshot each route
const browser = await chromium.launch()
const page = await browser.newPage()
let ok = 0
for (const route of ROUTES) {
  try {
    // 'load', not 'networkidle' — the Supabase realtime socket keeps the
    // network permanently busy, so networkidle never settles on some pages.
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 30000 })
    // let react-helmet-async apply the final head tags + data render
    await page.waitForFunction(() => !!document.querySelector('link[rel="canonical"]'), null, { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1500)
    const html = await page.content()
    const outDir = resolve(root, 'dist', route === '/' ? '.' : `.${route}`)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(resolve(outDir, 'index.html'), `<!doctype html>\n${html.replace(/^<!doctype html>/i, '')}`)
    ok++
    console.log(`[prerender] ${route} ✓`)
  } catch (err) {
    console.warn(`[prerender] ${route} FAILED: ${err.message}`)
  }
}
await browser.close()
if (preview) {
  // plain kill() only stops the wrapper shell on Windows — kill the whole tree
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { shell: true })
  } else {
    preview.kill()
  }
}
console.log(`[prerender] wrote ${ok}/${ROUTES.length} routes into dist/`)
process.exit(0)
