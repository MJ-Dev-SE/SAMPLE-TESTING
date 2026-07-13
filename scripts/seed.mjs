// =============================================================================
// Manila Tour — content seed. Uploads generated placeholder images into Supabase
// Storage and fills the content tables so the DB-driven site looks populated on
// day one. Run AFTER applying supabase/{schema,content,manilatour}.sql.
//
// Needs the SERVICE-ROLE key (bypasses RLS, never shipped to the browser):
//   # PowerShell
//   $env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ...service-role..."
//   node scripts/seed.mjs
//
// Idempotent: rows are upserted by natural key or re-inserted after clearing the
// previously-seeded rows. Media files are overwritten (upsert:true). All imagery
// is generated SVG — replace it later with real uploads from the admin console.
//
// Content sources (single source of truth, shared with the app fallback):
//   src/data/manilaSeed.json  — categories, businesses, photos, news, travel, ads
//   src/data/siteContent.json — links + policies + footer advertising pages
// =============================================================================
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment first.')
  process.exit(1)
}
const db = createClient(URL, KEY, { auth: { persistSession: false } })
const BUCKET = 'media'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const seed = JSON.parse(await readFile(join(root, 'src', 'data', 'manilaSeed.json'), 'utf8'))
const siteContent = JSON.parse(await readFile(join(root, 'src', 'data', 'siteContent.json'), 'utf8'))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A colored SVG placeholder with a label (and optional sub-label). */
function svg(label, bg, { w = 600, h = 450, sub = '' } = {}) {
  const lines = String(label).split(' ').reduce((acc, word) => {
    const last = acc[acc.length - 1]
    if (last && (last + ' ' + word).length <= 18) acc[acc.length - 1] = last + ' ' + word
    else acc.push(word)
    return acc
  }, [])
  const cy = h / 2 - (lines.length - 1) * 20
  const text = lines
    .map((ln, i) => `<text x='50%' y='${cy + i * 40}' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='34' font-weight='700' fill='#ffffff'>${esc(ln)}</text>`)
    .join('')
  const subEl = sub
    ? `<text x='50%' y='${h - 34}' text-anchor='middle' font-family='system-ui,sans-serif' font-size='20' fill='rgba(255,255,255,0.85)'>${esc(sub)}</text>`
    : ''
  return Buffer.from(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${bg}'/><stop offset='1' stop-color='${bg}' stop-opacity='0.75'/>
      </linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>${text}${subEl}</svg>`,
  )
}

async function put(destPath, buffer) {
  // 7-day browser/CDN cache: long enough to kill repeat-view egress, short enough
  // that a re-seed (which OVERWRITES these fixed paths) propagates within a week.
  const { error } = await db.storage
    .from(BUCKET)
    .upload(destPath, buffer, { contentType: 'image/svg+xml', upsert: true, cacheControl: '604800' })
  if (error) throw new Error(`upload ${destPath}: ${error.message}`)
  return destPath
}

async function upsert(table, rows, onConflict) {
  const { error } = await db.from(table).upsert(rows, { onConflict })
  if (error) throw new Error(`${table}: ${error.message}`)
  console.log(`  ✓ ${table}: ${rows.length} rows`)
}

async function reinsert(table, rows, applyWhere) {
  const { error: delErr } = await applyWhere(db.from(table).delete())
  if (delErr) throw new Error(`${table} (clear): ${delErr.message}`)
  if (rows.length) {
    const { error } = await db.from(table).insert(rows)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
  console.log(`  ✓ ${table}: ${rows.length} rows`)
}

const initials = (name) => name.replace(/[^A-Za-z0-9가-힣 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// ---------------------------------------------------------------------------
// 1) CATEGORIES (parent business-directory + children)
// ---------------------------------------------------------------------------
async function seedCategories() {
  console.log('Seeding categories…')
  const parent = { slug: 'business-directory', parent_slug: null, name: { en: 'Business Directory', ko: '업소록' }, icon: 'fa-store', sort: -1, active: true }
  const children = seed.categories.map((c) => ({ ...c, parent_slug: 'business-directory', active: true }))
  await upsert('categories', [parent, ...children], 'slug')
  const { data } = await db.from('categories').select('id, slug')
  return Object.fromEntries((data ?? []).map((r) => [r.slug, r.id]))
}

// ---------------------------------------------------------------------------
// 2) BUSINESSES + BUSINESS_IMAGES (generated logo / main / gallery)
// ---------------------------------------------------------------------------
async function seedBusinesses(catId) {
  console.log('Uploading + seeding businesses…')
  // Clear previously-seeded rows (owner_id null); leave member-registered listings.
  await db.from('business_images').delete().in(
    'business_id',
    (await db.from('businesses').select('id').is('owner_id', null)).data?.map((r) => r.id) ?? ['00000000-0000-0000-0000-000000000000'],
  )
  await db.from('businesses').delete().is('owner_id', null)

  for (let i = 0; i < seed.businesses.length; i++) {
    const b = seed.businesses[i]
    const dir = `businesses/${b.slug}`
    const logo = await put(`${dir}/logo.svg`, svg(initials(b.name), b.color, { w: 240, h: 240 }))
    const main = await put(`${dir}/main.svg`, svg(b.name, b.color, { w: 600, h: 450, sub: b.region }))
    const gallery = []
    for (let g = 1; g <= 3; g++) gallery.push(await put(`${dir}/photo-${g}.svg`, svg(`${b.name} · ${g}`, b.color, { w: 600, h: 450 })))

    const { data: row, error } = await db
      .from('businesses')
      .insert({
        name: b.name,
        category: b.category,
        category_id: catId[b.category] ?? null,
        location: b.region,
        region: b.region,
        address: b.address,
        phone: b.phone,
        excerpt: b.short_intro,
        description: b.detailed_intro,
        short_intro: b.short_intro,
        detailed_intro: b.detailed_intro,
        thumb_url: main,
        main_image_url: main,
        logo_url: logo,
        status: 'active',
        display_order: i,
        owner_id: null,
      })
      .select('id')
      .single()
    if (error) throw new Error(`businesses ${b.slug}: ${error.message}`)

    const imgs = [
      { business_id: row.id, image_url: logo, image_type: 'logo', display_order: 0 },
      { business_id: row.id, image_url: main, image_type: 'main', display_order: 0 },
      ...gallery.map((u, gi) => ({ business_id: row.id, image_url: u, image_type: 'gallery', display_order: gi })),
    ]
    const { error: imgErr } = await db.from('business_images').insert(imgs)
    if (imgErr) throw new Error(`business_images ${b.slug}: ${imgErr.message}`)
    console.log('  ↑', b.slug)
  }
  console.log(`  ✓ businesses: ${seed.businesses.length} rows (+ images)`)
}

// ---------------------------------------------------------------------------
// 3) PHOTOS (Manila attractions — generated SVG)
// ---------------------------------------------------------------------------
async function seedPhotos() {
  console.log('Uploading + seeding photos…')
  const rows = []
  for (let i = 0; i < seed.photos.length; i++) {
    const p = seed.photos[i]
    const src = await put(`photos/manila/${p.slug}.svg`, svg(p.title.en, p.color, { w: 900, h: 560, sub: p.tag.en }))
    rows.push({ slug: p.slug, src, section: p.section, tag: p.tag, title: p.title, description: p.description, details: p.details ?? [], sort: i })
  }
  await upsert('photos', rows, 'slug')
  return Object.fromEntries(rows.map((r) => [r.slug, r.src]))
}

// ---------------------------------------------------------------------------
// 4) NEWS_ITEMS (Manila news + information, with article bodies)
// ---------------------------------------------------------------------------
async function seedNews() {
  console.log('Uploading + seeding news_items…')
  const rows = []
  for (const n of seed.news) {
    const image = n.kind === 'featured' ? await put(`news/${n.article_slug}.svg`, svg(n.title.en, n.color, { w: 600, h: 400 })) : null
    rows.push({
      tab: n.tab, kind: n.kind, title: n.title, thumb_url: image, image_url: image,
      href: `/news/view?slug=${n.article_slug}`, article_slug: n.article_slug,
      body: n.body ?? {}, comment_count: n.comment_count ?? 0, sort: n.sort ?? 0,
    })
  }
  await reinsert('news_items', rows, (q) => q.neq('tab', '__none__'))
}

// ---------------------------------------------------------------------------
// 5) TRAVEL_INFO (Manila)
// ---------------------------------------------------------------------------
async function seedTravel() {
  console.log('Seeding travel_info…')
  const rows = seed.travel_info.map((t) => ({
    title: t.title, blurb: t.blurb, icon: t.icon, href: `/news/view?slug=${t.article_slug}`, sort: t.sort ?? 0,
  }))
  await reinsert('travel_info', rows, (q) => q.neq('icon', '__none__'))
}

// ---------------------------------------------------------------------------
// 6) ADVERTISEMENTS (banner creatives + footer program pages)
// ---------------------------------------------------------------------------
async function seedAds() {
  console.log('Uploading + seeding advertisements…')
  const counters = {}
  const rows = []
  for (const a of seed.advertisements) {
    const n = (counters[a.position] = (counters[a.position] ?? 0) + 1)
    const wide = a.position === 'header' || a.position === 'homepage'
    const image = await put(`ads/${a.position}-${n}.svg`, svg(a.title.en, a.color, wide ? { w: 600, h: 220 } : { w: 300, h: 240 }))
    rows.push({ title: a.title, description: a.description, body: {}, image_url: image, url: a.url ?? null, position: a.position, sort: a.sort ?? n, active: true })
  }
  // Footer "Advertisement" group = the advertising-program pages from siteContent.
  const adColors = ['#0071ec', '#00883c', '#6163f2', '#dc3146']
  let fi = 0
  for (const c of siteContent.filter((r) => r.content_type === 'advertisement')) {
    const image = await put(`ads/footer-info-${++fi}.svg`, svg(c.title.en, adColors[fi % adColors.length], { w: 600, h: 220 }))
    rows.push({ title: c.title, description: c.summary, body: c.body, image_url: image, url: null, position: 'footer-info', sort: fi, active: true })
  }
  await reinsert('advertisements', rows, (q) => q.neq('position', '__none__'))
}

// ---------------------------------------------------------------------------
// 7) LINKS (partners / resources / references)  +  8) POLICIES
// ---------------------------------------------------------------------------
async function seedLinksAndPolicies() {
  console.log('Uploading + seeding links + policies…')
  const linkColors = ['#0071ec', '#078098', '#00883c', '#9951db', '#6163f2']
  const links = []
  let li = 0
  for (const c of siteContent.filter((r) => r.content_type === 'link')) {
    const image = await put(`links/${c.slug}.svg`, svg(c.title.en, linkColors[li % linkColors.length], { w: 600, h: 360 }))
    links.push({ slug: c.slug, title: c.title, description: c.summary, body: c.body, url: c.url ?? null, image_url: image, category: c.category ?? null, section: 'footer-link', sort: li++, active: true })
  }
  // A few Manila tourism partner/resource links (no detail body → open the URL directly).
  const partners = [
    { slug: 'dot-philippines', title: { en: 'Department of Tourism (PH)', ko: '필리핀 관광부' }, description: { en: 'Official Philippine tourism information and advisories.', ko: '필리핀 공식 관광 정보 및 안내.' }, url: 'https://www.tourism.gov.ph', color: '#0071ec' },
    { slug: 'pagasa-weather', title: { en: 'PAGASA Weather', ko: 'PAGASA 날씨' }, description: { en: 'Official Philippine weather and typhoon advisories.', ko: '필리핀 공식 기상·태풍 정보.' }, url: 'https://www.pagasa.dost.gov.ph', color: '#078098' },
    { slug: 'naia-airport', title: { en: 'Manila NAIA Airport', ko: '마닐라 NAIA 공항' }, description: { en: 'Terminal guide, flights and airport services.', ko: '터미널 안내·항공편·공항 서비스.' }, url: 'https://www.manila-airport.net', color: '#6163f2' },
  ]
  for (const p of partners) {
    const image = await put(`links/${p.slug}.svg`, svg(p.title.en, p.color, { w: 600, h: 360 }))
    links.push({ slug: p.slug, title: p.title, description: p.description, body: {}, url: p.url, image_url: image, category: 'resource', section: 'footer-link', sort: li++, active: true })
  }
  await upsert('links', links, 'slug')

  const policies = siteContent
    .filter((r) => r.content_type === 'policy')
    .map((c, i) => ({ slug: c.slug, title: c.title, summary: c.summary, body: c.body, sort: i, active: true }))
  await upsert('policies', policies, 'slug')
}

async function main() {
  const catId = await seedCategories()
  await seedBusinesses(catId)
  await seedPhotos()
  await seedNews()
  await seedTravel()
  await seedAds()
  await seedLinksAndPolicies()
  console.log('\nDone. Manila Tour content is now served from Supabase.')
}

main().catch((e) => {
  console.error('\nSeed failed:', e.message)
  process.exit(1)
})
