// SEO unit tests — pure-logic coverage for the SEO utility layer + sitemap
// output. No dev server needed:  npm run test:seo
//
// The TS utilities are bundled on the fly with esbuild (already present as a
// Vite dependency) so the tests exercise the exact source modules. import.meta
// env access is shimmed with production-like values.
import { build } from 'esbuild'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let pass = 0
let fail = 0
const eq = (actual, expected, label) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) pass++
  else {
    fail++
    console.error(`✗ ${label}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`)
  }
}
const ok = (cond, label) => eq(!!cond, true, label)

// ---------- bundle the SEO lib (slug/text/url/structuredData + config) --------
const tmp = mkdtempSync(join(tmpdir(), 'seo-test-'))
const entry = join(tmp, 'entry.ts')
writeFileSync(
  entry,
  `export * from '${pathToFileURL(join(root, 'src/lib/seo/index.ts')).href.replace('file:///', '').replace(/%20/g, ' ')}'`.replace(/\\/g, '/'),
)
const outfile = join(tmp, 'seo.mjs')
await build({
  entryPoints: [join(root, 'src/lib/seo/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile,
  define: {
    'import.meta.env.VITE_SITE_URL': '"https://manilatour.test"',
    'import.meta.env.VITE_SITE_NAME': '"Manila Tour"',
    'import.meta.env.PROD': 'true',
    'import.meta.env.DEV': 'false',
  },
  // lib/media imports the supabase client — stub the whole module: the URL
  // helpers only call publicUrl(), which for tests can pass strings through.
  plugins: [
    {
      name: 'stub-media',
      setup(b) {
        b.onResolve({ filter: /\.\.\/media$/ }, () => ({ path: 'media-stub', namespace: 'stub' }))
        b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
          contents: `export function publicUrl(p){ if(!p) return ''; return /^(https?:|data:|blob:|\\/)/.test(p) ? p : 'https://cdn.test/storage/' + p }`,
          loader: 'js',
        }))
      },
    },
  ],
})
const seo = await import(pathToFileURL(outfile).href)

// ---------- slug generation ---------------------------------------------------
eq(seo.slugify('Best Places in Intramuros!'), 'best-places-in-intramuros', 'slugify basic')
eq(seo.slugify('  --Hello,   World--  '), 'hello-world', 'slugify trims/dedupes hyphens')
eq(seo.slugify('Café au Lait'), 'cafe-au-lait', 'slugify strips Latin accents')
eq(seo.slugify('마닐라 여행 팁'), '마닐라-여행-팁', 'slugify keeps Korean syllables')
eq(seo.slugify('!!!'), '', 'slugify empty when nothing usable')
eq(seo.slugifyOr('!!!', 'post-abc123'), 'post-abc123', 'slugifyOr falls back')
ok(seo.slugify('x'.repeat(200)).length <= 80, 'slugify caps length at 80')
eq(seo.isValidSlug('manila-grand-hotel'), true, 'isValidSlug accepts valid')
eq(seo.isValidSlug('-bad-'), false, 'isValidSlug rejects edge hyphens')
eq(seo.isValidSlug(''), false, 'isValidSlug rejects empty')
eq(seo.isValidSlug('한글-slug-2'), true, 'isValidSlug accepts Korean')
eq(seo.uniqueSlug('hotel', ['hotel', 'hotel-2']), 'hotel-3', 'uniqueSlug appends counter')
eq(seo.uniqueSlug('hotel', []), 'hotel', 'uniqueSlug untouched when free')

// ---------- text: strip / truncate / excerpt ----------------------------------
eq(seo.stripHtml('<p>Hello <b>world</b> &amp; friends</p>'), 'Hello world & friends', 'stripHtml tags+entities')
eq(seo.stripHtml('<script>alert(1)</script>Safe'), 'Safe', 'stripHtml drops script bodies')
ok(seo.truncate('word '.repeat(100), 160).length <= 160, 'truncate respects max')
ok(seo.truncate('word '.repeat(100), 160).endsWith('…'), 'truncate adds ellipsis')
eq(seo.truncate('short', 160), 'short', 'truncate leaves short text')
eq(seo.metaDescription(null, '', '<p>Body text</p>'), 'Body text', 'metaDescription fallback chain')
eq(seo.metaDescription('Set desc', 'body'), 'Set desc', 'metaDescription prefers first')
eq(seo.metaDescription(null, null), '', 'metaDescription empty when nothing')

// ---------- canonical / image URLs ---------------------------------------------
eq(seo.canonicalUrl('/posts/abc'), 'https://manilatour.test/posts/abc', 'canonicalUrl absolute')
eq(seo.canonicalUrl('/'), 'https://manilatour.test/', 'canonicalUrl root')
eq(seo.canonicalUrl('https://other.test/x'), 'https://other.test/x', 'canonicalUrl passthrough')
eq(seo.stripLocalePrefix('/en/posts/abc'), '/posts/abc', 'stripLocalePrefix en')
eq(seo.stripLocalePrefix('/ko'), '/', 'stripLocalePrefix bare ko')
eq(seo.stripLocalePrefix('/environment'), '/environment', 'stripLocalePrefix ignores non-locale')
eq(seo.localeUrl('/posts/abc', 'ko'), 'https://manilatour.test/ko/posts/abc', 'localeUrl ko')
eq(seo.absoluteImageUrl('/logo.png'), 'https://manilatour.test/logo.png', 'absoluteImageUrl site asset')
eq(seo.absoluteImageUrl('businesses/x.jpg'), 'https://cdn.test/storage/businesses/x.jpg', 'absoluteImageUrl media path')
eq(seo.absoluteImageUrl(null), '', 'absoluteImageUrl empty')

// ---------- structured data -----------------------------------------------------
const site = seo.websiteLd()
eq(site['@type'], 'WebSite', 'websiteLd type')
eq(site.url, 'https://manilatour.test/', 'websiteLd url')
const art = seo.articleLd({ headline: 'H', url: '/posts/h', datePublished: '2026-01-01', authorName: 'Ana' })
eq(art['@type'], 'Article', 'articleLd type')
eq(art.mainEntityOfPage, 'https://manilatour.test/posts/h', 'articleLd absolute url')
ok(!('image' in art), 'articleLd omits absent image (no fake data)')
const nart = seo.articleLd({ headline: 'N', url: '/news/article/n', isNews: true })
eq(nart['@type'], 'NewsArticle', 'articleLd news variant')
const biz = seo.localBusinessLd({ name: 'B', url: '/business/b' })
ok(!('address' in biz) && !('telephone' in biz), 'localBusinessLd omits absent address/phone')
const biz2 = seo.localBusinessLd({ name: 'B', url: '/business/b', addressLocality: 'Manila' })
eq(biz2.address.addressLocality, 'Manila', 'localBusinessLd real address kept')
const crumbs = seo.breadcrumbLd([{ label: 'Home', href: '/' }, { label: 'Here' }])
eq(crumbs.itemListElement.length, 2, 'breadcrumbLd items')
eq(crumbs.itemListElement[0].item, 'https://manilatour.test/', 'breadcrumbLd absolute item url')
ok(!('item' in crumbs.itemListElement[1]), 'breadcrumbLd last item without url')
for (const block of [site, art, biz2, crumbs]) {
  ok(JSON.parse(JSON.stringify(block))['@context'] === 'https://schema.org', 'JSON-LD serialisable + context')
}

// ---------- sitemap generator (offline mode → static-only, valid XML) ----------
execFileSync(process.execPath, [join(root, 'scripts/generate-sitemap.mjs')], {
  cwd: root,
  env: { ...process.env, VITE_SITE_URL: 'https://manilatour.test', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  stdio: 'pipe',
})
const xml = readFileSync(join(root, 'public/sitemap.xml'), 'utf8')
ok(xml.startsWith('<?xml version="1.0"'), 'sitemap XML declaration')
ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap urlset ns')
ok(xml.includes('<loc>https://manilatour.test/</loc>'), 'sitemap includes home')
ok(xml.includes('<loc>https://manilatour.test/business-directory</loc>'), 'sitemap includes directory')
ok(!xml.includes('/admin'), 'sitemap excludes /admin')
ok(!xml.includes('/user/'), 'sitemap excludes auth/account routes')
ok(!xml.includes('/post/write'), 'sitemap excludes write route')
ok(!/page=/.test(xml), 'sitemap excludes pagination variants')
eq((xml.match(/<url>/g) || []).length, (xml.match(/<\/url>/g) || []).length, 'sitemap balanced tags')
const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8')
ok(robots.includes('Disallow: /admin'), 'robots disallows /admin')
ok(robots.includes('Sitemap: https://manilatour.test/sitemap.xml'), 'robots absolute sitemap URL')
ok(!robots.includes('Disallow: /assets'), 'robots does not block assets')

// ---------- done -----------------------------------------------------------------
rmSync(tmp, { recursive: true, force: true })
console.log(`\nSEO tests: ${pass} passed, ${fail} failed`)
if (existsSync(join(root, 'public/sitemap.xml'))) {
  console.log('(note: public/sitemap.xml + robots.txt were regenerated with the test domain — `npm run build` rewrites them with your real VITE_SITE_URL)')
}
process.exit(fail === 0 ? 0 : 1)
