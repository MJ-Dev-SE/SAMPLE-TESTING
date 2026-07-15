// =============================================================================
// SITEMAP + ROBOTS GENERATOR — runs at build time (npm run generate:sitemap,
// wired into `npm run build`). Writes public/sitemap.xml and rewrites
// public/robots.txt with the absolute Sitemap URL.
//
// Included: static public pages, community parent/child category pages,
// business-directory + its categories, indexable posts (/posts/<slug>),
// active indexable businesses (/business/<slug>), news/information articles
// (/news/article/<slug>), photo pages. <lastmod> comes from updated_at /
// created_at where available.
//
// Excluded: admin/auth/chat/account/write routes, query-param filter and
// pagination variants, rows with is_indexable=false, inactive businesses,
// photo-anchor posts (board mt-photos), invalid/empty slugs.
//
// SECURITY: uses the PUBLIC anon key only — every read below is already
// public under RLS. Never put the service-role key in a VITE_ var; this
// script does not need it and never reads it.
//
// Fail-soft: if Supabase is unreachable (CI without env, offline), a
// static-routes-only sitemap is still written and the build continues.
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ---------- env (.env.local / .env, without requiring dotenv) ---------------
function loadEnvFile(file) {
  const path = resolve(root, file)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return out
}
const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }

const SITE_URL = (env.VITE_SITE_URL || '').replace(/\/+$/, '')
const SUPABASE_URL = env.VITE_SUPABASE_URL
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY

if (!SITE_URL || /example\.com/.test(SITE_URL)) {
  console.warn(
    '[sitemap] WARNING: VITE_SITE_URL is missing or a placeholder — using https://example.com. ' +
      'Set the real production domain before submitting the sitemap.',
  )
}
const BASE = SITE_URL || 'https://example.com'

// ---------- helpers ----------------------------------------------------------
const today = new Date().toISOString().slice(0, 10)
const validSlug = (s) => typeof s === 'string' && /^[a-z0-9가-힣](?:[a-z0-9가-힣-]*[a-z0-9가-힣])?$/.test(s)

/** GET one PostgREST resource with the anon key; [] on any failure. */
async function rest(pathAndQuery) {
  if (!SUPABASE_URL || !ANON_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    })
    if (!res.ok) {
      console.warn(`[sitemap] ${pathAndQuery} → HTTP ${res.status} (skipping)`)
      return []
    }
    return await res.json()
  } catch (err) {
    console.warn(`[sitemap] ${pathAndQuery} failed: ${err.message} (skipping)`)
    return []
  }
}

const urls = new Map() // loc → { lastmod }
const add = (path, lastmod) => {
  const loc = `${BASE}${path}`
  const mod = lastmod ? String(lastmod).slice(0, 10) : undefined
  if (!urls.has(loc) || (mod && mod > (urls.get(loc).lastmod ?? ''))) urls.set(loc, { lastmod: mod })
}

// ---------- 1) static public pages -------------------------------------------
add('/', today)
add('/menu')
add('/business-directory')
add('/help/terms')
add('/help/privacy')
add('/help/safety')
// Core community boards (clean, unfiltered board URLs only)
for (const board of ['freetalk', 'qna', 'buyandsell', 'wanted']) add(`/post/list?post_id=${board}`)

// ---------- 2) category landing pages (parents + children) -------------------
const categories = await rest(
  'categories?select=slug,parent_slug,kind,is_indexable&active=is.true&order=sort',
)
const communityParents = new Set(
  categories.filter((c) => c.kind === 'community' && c.parent_slug === null).map((c) => c.slug),
)
for (const c of categories) {
  if (c.is_indexable === false || !validSlug(c.slug)) continue
  if (c.kind === 'community') {
    if (c.parent_slug === null) add(`/${c.slug}`)
    else if (communityParents.has(c.parent_slug)) add(`/${c.parent_slug}/${c.slug}`)
  } else if (c.kind === 'business') {
    add(`/business-directory/${c.slug}`)
  }
}

// ---------- 3) posts (indexable, this site's boards, no photo anchors) -------
const posts = await rest(
  'posts?select=slug,created_at,is_indexable&board_id=like.mt-*&board_id=neq.mt-photos&is_indexable=is.true&order=created_at.desc&limit=5000',
)
for (const p of posts) if (validSlug(p.slug)) add(`/posts/${encodeURIComponent(p.slug)}`, p.created_at)

// ---------- 4) businesses (active + indexable) --------------------------------
const businesses = await rest(
  'businesses?select=slug,updated_at,is_indexable&status=eq.active&is_indexable=is.true&order=updated_at.desc&limit=5000',
)
for (const b of businesses) if (validSlug(b.slug)) add(`/business/${encodeURIComponent(b.slug)}`, b.updated_at)

// ---------- 5) news / information articles -----------------------------------
const news = await rest(
  'news_items?select=article_slug,updated_at,is_indexable&article_slug=not.is.null&is_indexable=is.true',
)
for (const n of news) if (validSlug(n.article_slug)) add(`/news/article/${encodeURIComponent(n.article_slug)}`, n.updated_at)

// ---------- 6) photo pages -----------------------------------------------------
const photos = await rest('photos?select=slug,created_at')
for (const p of photos) if (validSlug(p.slug)) add(`/photo/view?id=${encodeURIComponent(p.slug)}`, p.created_at)

// ---------- write sitemap.xml -------------------------------------------------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...urls.entries()].map(([loc, { lastmod }]) =>
    [
      '  <url>',
      `    <loc>${esc(loc)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n')
writeFileSync(resolve(root, 'public/sitemap.xml'), xml)

// ---------- write robots.txt (absolute Sitemap URL) ---------------------------
const robots = `# Manila Tour — robots policy (generated by scripts/generate-sitemap.mjs).
# JS, CSS, fonts and images are NOT blocked. Auth protects the private pages;
# these rules just keep crawlers from wasting budget on them.

User-agent: *
Disallow: /admin
Disallow: /user/login
Disallow: /user/register
Disallow: /user/profile
Disallow: /user/settings
Disallow: /chat
Disallow: /post/write
Disallow: /point/
Disallow: /api/
Allow: /

Sitemap: ${BASE}/sitemap.xml
`
writeFileSync(resolve(root, 'public/robots.txt'), robots)

console.log(`[sitemap] wrote public/sitemap.xml (${urls.size} URLs) and public/robots.txt (base: ${BASE})`)
