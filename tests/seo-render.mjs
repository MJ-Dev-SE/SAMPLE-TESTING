// Runtime SEO render test — dev server must be running on :5176 (npm run dev).
// node tests/seo-render.mjs   (uses waitUntil load: the Supabase realtime
// socket keeps the network busy, so networkidle never settles). Verifies each route
// renders, has the expected head tags, and logs console errors.
import { chromium } from 'playwright'

// Defaults to the hanin brand — bare localhost hits the temporarily-disabled
// Manila Tour (renders NotFound). Revert to localhost:5176 when it is re-enabled.
const BASE = process.env.BASE_URL || 'http://hanin.localhost:5176'
const CHECKS = [
  { route: '/', expectIndex: true, h1: true },
  { route: '/menu', expectIndex: true },
  { route: '/business-directory', expectIndex: true },
  { route: '/information', expectIndex: null }, // index unless empty category
  { route: '/information/weather', expectIndex: null },
  { route: '/post/list?post_id=freetalk', expectIndex: true },
  { route: '/user/login', expectIndex: false },
  { route: '/chat', expectIndex: false },
  { route: '/this-page-does-not-exist-xyz', expectIndex: false, is404: true },
  { route: '/en/', expectIndex: true },
  { route: '/company?category=hotel', redirect: '/business-directory/hotel' },
  { route: '/help/terms', expectIndex: true },
]

const browser = await chromium.launch()
const page = await browser.newPage()
const results = []
for (const c of CHECKS) {
  const errors = []
  const onErr = (m) => { if (m.type() === 'error') errors.push(m.text()) }
  page.on('console', onErr)
  try {
    await page.goto(`${BASE}${c.route}`, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1500)
    const head = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
      robots: document.querySelector('meta[name=robots]')?.content ?? null,
      description: document.querySelector('meta[name=description]')?.content?.slice(0, 60) ?? null,
      ogImage: !!document.querySelector('meta[property="og:image"]'),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent)['@type'] } catch { return 'INVALID' } }),
      h1s: document.querySelectorAll('h1').length,
      path: location.pathname,
      body404: document.body.innerText.includes('404'),
    }))
    const problems = []
    if (!head.title) problems.push('no title')
    if (!head.canonical) problems.push('no canonical')
    if (c.expectIndex === true && head.robots !== 'index, follow') problems.push(`robots=${head.robots}`)
    if (c.expectIndex === false && head.robots !== 'noindex, nofollow') problems.push(`robots=${head.robots}`)
    if (c.is404 && !head.body404) problems.push('no 404 body')
    if (c.redirect && head.path !== c.redirect) problems.push(`landed on ${head.path}, want ${c.redirect}`)
    if (c.h1 && head.h1s !== 1) problems.push(`${head.h1s} h1s`)
    if (head.jsonLd.includes('INVALID')) problems.push('invalid JSON-LD')
    results.push({ route: c.route, ok: problems.length === 0, problems, head: { title: head.title, canonical: head.canonical, robots: head.robots, jsonLd: head.jsonLd }, consoleErrors: errors.slice(0, 3) })
  } catch (err) {
    results.push({ route: c.route, ok: false, problems: [err.message] })
  }
  page.off('console', onErr)
}
await browser.close()
console.log(JSON.stringify(results, null, 1))
