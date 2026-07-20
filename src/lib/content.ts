import { supabase } from './supabase'
import { activeBrand } from '../config/brand'
import { fallbackLinks, fallbackLinkBySlug, fallbackPolicies, fallbackPolicyBySlug } from '../data/siteContent'
import type {
  AdPosition,
  AdvertisementRec,
  BusinessImage,
  BusinessRec,
  CategoryKind,
  CategoryRec,
  LinkRec,
  NewsItemRec,
  PhotoRec,
  PolicyRec,
  TravelInfo,
} from '../types'

/**
 * Content data-access layer: everything that used to live in src/data/{home,photos,sidebar}.ts
 * now comes from Supabase. All reads fail soft (return [] / null) so a missing table or an
 * offline client degrades to an empty section instead of crashing.
 *
 * Caching lives at the call site now (React Query, see src/lib/queryClient.ts) — these functions
 * are plain, uncached reads. Community data (posts/comments, posts.ts) is cached the same way.
 */

/* ------------------------------- Photos -------------------------------- */

const PHOTO_COLS = 'slug, src, section, tag, title, description, details'

export async function listPhotos(section: 'banner' | 'recent'): Promise<PhotoRec[]> {
  const { data, error } = await supabase
    .from('photos')
    .select(PHOTO_COLS)
    .eq('section', section)
    .order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PhotoRec[]
}

/** All photos (banner first, then recent), ordered — for the /photo/view walker. */
export async function listAllPhotos(): Promise<PhotoRec[]> {
  const { data, error } = await supabase.from('photos').select(PHOTO_COLS).order('sort', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as unknown as PhotoRec[]
  // Deterministic order: all banner photos, then all recent photos.
  return [...rows.filter((r) => r.section === 'banner'), ...rows.filter((r) => r.section === 'recent')]
}

export async function getPhoto(slug: string): Promise<PhotoRec | null> {
  const { data, error } = await supabase.from('photos').select(PHOTO_COLS).eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data as unknown as PhotoRec) ?? null
}

/* ------------------------------ Categories ----------------------------- */

/* --------------------------- SEO column fallback ------------------------ */

/**
 * The SEO columns (meta_*, og_image_url, is_indexable, businesses.slug) come
 * from supabase/seo.sql. Until that migration is applied, selecting them
 * returns Postgres 42703 (undefined column) — instead of degrading every list
 * to empty, the queries below retry once with their pre-migration column list
 * and remember the outcome. Pages simply see records without SEO overrides.
 */
let seoColumnsMissing = false

export async function withSeoColumnFallback<T>(
  run: (cols: string) => Promise<T>,
  fullCols: string,
  legacyCols: string,
): Promise<T> {
  if (!seoColumnsMissing) {
    try {
      return await run(fullCols)
    } catch (e) {
      if ((e as { code?: string })?.code !== '42703') throw e
      seoColumnsMissing = true
      console.warn('[seo] DB is missing the SEO columns — run supabase/seo.sql. Falling back to legacy columns.')
    }
  }
  return run(legacyCols)
}

const CATEGORY_COLS = 'id, slug, parent_slug, kind, name, icon, sort, meta_title, meta_description, og_image_url, is_indexable'
const CATEGORY_COLS_LEGACY = 'id, slug, parent_slug, kind, name, icon, sort'

/**
 * Child categories under one parent, shared by the filter chips, posting form,
 * card display and admin form. Defaults to the Business Directory tree
 * (`kind='business'`); pass `kind='community'` for the maroon-bar post-category
 * tree (parentSlug null = the 8 top-level maroon parents themselves).
 */
export async function listCategories(
  parentSlug: string | null = 'business-directory',
  kind: CategoryKind = 'business',
): Promise<CategoryRec[]> {
  return withSeoColumnFallback(
    async (cols) => {
      let q = supabase
        .from('categories')
        .select(cols)
        .eq('kind', kind)
        .eq('active', true)
        .order('sort', { ascending: true })
      q = parentSlug === null ? q.is('parent_slug', null) : q.eq('parent_slug', parentSlug)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as CategoryRec[]
    },
    CATEGORY_COLS,
    CATEGORY_COLS_LEGACY,
  )
}

/** One category row by slug (either a maroon parent or a child), or null. */
export async function getCategoryBySlug(slug: string, kind: CategoryKind = 'community'): Promise<CategoryRec | null> {
  return withSeoColumnFallback(
    async (cols) => {
      const { data, error } = await supabase
        .from('categories')
        .select(cols)
        .eq('slug', slug)
        .eq('kind', kind)
        .eq('active', true)
        .maybeSingle()
      if (error) throw error
      return (data as unknown as CategoryRec) ?? null
    },
    CATEGORY_COLS,
    CATEGORY_COLS_LEGACY,
  )
}

/* ------------------------------ Businesses ----------------------------- */

const BIZ_COLS_LEGACY =
  'id, name, category, category_id, location, region, address, phone, excerpt, description, short_intro, detailed_intro, thumb_url, logo_url, main_image_url, status, display_order, updated_at, created_at'
const BIZ_COLS = `id, slug, ${BIZ_COLS_LEGACY.replace('id, ', '')}, meta_title, meta_description, og_image_url, canonical_url, is_indexable`

export interface BusinessPage {
  rows: BusinessRec[]
  total: number
}

/**
 * Business Directory listing, filtered by category, paginated (default 9 per page
 * = 3×3 grid). Active listings first, then by display_order and newest.
 */
export async function listBusinesses(
  category?: string | null,
  opts: { page?: number; pageSize?: number } = {},
): Promise<BusinessPage> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = opts.pageSize ?? 9
  return withSeoColumnFallback(
    async (cols) => {
      const from = (page - 1) * pageSize
      let q = supabase
        .from('businesses')
        .select(cols, { count: 'exact' })
        .eq('status', 'active')
        .order('display_order', { ascending: true })
        .order('updated_at', { ascending: false })
        .range(from, from + pageSize - 1)
      if (category && category !== 'all') q = q.eq('category', category)
      const { data, error, count } = await q
      if (error) throw error
      return { rows: (data ?? []) as unknown as BusinessRec[], total: count ?? 0 }
    },
    BIZ_COLS,
    BIZ_COLS_LEGACY,
  )
}

/** Compact "recently updated" widget list. */
export async function listRecentBusinesses(limit = 6): Promise<BusinessRec[]> {
  return withSeoColumnFallback(
    async (cols) => {
      const { data, error } = await supabase
        .from('businesses')
        .select(cols)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as unknown as BusinessRec[]
    },
    BIZ_COLS,
    BIZ_COLS_LEGACY,
  )
}

export interface NewBusiness {
  name: string
  categoryId: string | null
  categorySlug: string | null
  region: string | null
  address: string | null
  phone: string | null
  shortIntro: { en: string; ko: string }
  detailedIntro: { en: string; ko: string }
  logoUrl: string | null
  mainImageUrl: string | null
  /** Additional gallery image paths (in display order). */
  galleryUrls: string[]
  ownerId: string
}

/**
 * Insert a business + its logo/main/gallery image rows. Returns the new row.
 * Caller is responsible for invalidating the ['businesses'] query cache afterward
 * (React Query has no hook access from a plain lib function) — see BusinessRegister.tsx.
 */
export async function createBusiness(b: NewBusiness): Promise<BusinessRec> {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      name: b.name,
      category: b.categorySlug,
      category_id: b.categoryId,
      location: b.region,
      region: b.region,
      address: b.address,
      phone: b.phone,
      excerpt: b.shortIntro,
      description: b.detailedIntro,
      short_intro: b.shortIntro,
      detailed_intro: b.detailedIntro,
      thumb_url: b.mainImageUrl,
      main_image_url: b.mainImageUrl,
      logo_url: b.logoUrl,
      status: 'active',
      owner_id: b.ownerId,
    })
    .select(BIZ_COLS)
    .single()
  if (error) throw error
  const biz = data as unknown as BusinessRec

  const imgs = [
    ...(b.logoUrl ? [{ business_id: biz.id, image_url: b.logoUrl, image_type: 'logo', display_order: 0 }] : []),
    ...(b.mainImageUrl ? [{ business_id: biz.id, image_url: b.mainImageUrl, image_type: 'main', display_order: 0 }] : []),
    ...b.galleryUrls.map((u, i) => ({ business_id: biz.id, image_url: u, image_type: 'gallery', display_order: i })),
  ]
  if (imgs.length) await supabase.from('business_images').insert(imgs) // best-effort; card still works from main_image_url
  return biz
}

/** Attach the gallery rows to a business record (profile page). */
async function withGallery(biz: BusinessRec): Promise<BusinessRec> {
  const { data: imgs } = await supabase
    .from('business_images')
    .select('id, image_url, image_type, display_order')
    .eq('business_id', biz.id)
    .order('display_order', { ascending: true })
  biz.images = (imgs ?? []) as unknown as BusinessImage[]
  return biz
}

/** One business by id, with its gallery — /company/view profile page. */
export async function getBusiness(id: string): Promise<BusinessRec | null> {
  return withSeoColumnFallback(
    async (cols) => {
      const { data, error } = await supabase.from('businesses').select(cols).eq('id', id).maybeSingle()
      if (error) throw error
      return data ? withGallery(data as unknown as BusinessRec) : null
    },
    BIZ_COLS,
    BIZ_COLS_LEGACY,
  )
}

/** One business by URL slug, with its gallery — /business/<slug> profile page.
 *  (No legacy fallback: the slug column IS the migration.) */
export async function getBusinessBySlug(slug: string): Promise<BusinessRec | null> {
  const { data, error } = await supabase.from('businesses').select(BIZ_COLS).eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? withGallery(data as unknown as BusinessRec) : null
}

/**
 * Canonical in-app URL for a business: pretty slug URL when the row has one,
 * legacy query URL otherwise. Single source of truth for business links.
 */
export function businessPath(b: Pick<BusinessRec, 'id'> & { slug?: string | null }): string {
  return b.slug ? `/business/${encodeURIComponent(b.slug)}` : `/company/view?id=${b.id}`
}

/** Canonical in-app URL for a news/information article. */
export function newsArticlePath(article_slug: string): string {
  return `/news/article/${encodeURIComponent(article_slug)}`
}

/* --------------------------- Advertisements ---------------------------- */

const AD_COLS = 'id, title, description, body, image_url, url, position, sort, active, start_date, end_date'

/**
 * Ad slots are scoped per hostname AND per position (src/config/brand.ts):
 * a position listed in the brand's `brandedAdPositions` reads that brand's own
 * inventory, stored under prefixed keys ('hanin:header', …) in the same table;
 * every other position falls through to the shared base keys ('wing-left', …)
 * so those creatives appear identically on every domain. Rows are normalized
 * back to the logical position so every consumer (Header, WingBanners,
 * AdGalleryView, …) is brand-agnostic.
 */
const adKeyFor = (position: AdPosition): string =>
  activeBrand.brandedAdPositions.includes(position) ? `${activeBrand.adPrefix}${position}` : position

const stripAdPrefix = (a: AdvertisementRec): AdvertisementRec =>
  activeBrand.adPrefix && String(a.position).startsWith(activeBrand.adPrefix)
    ? { ...a, position: String(a.position).slice(activeBrand.adPrefix.length) as AdPosition }
    : a

/** True when this row belongs to the ACTIVE brand's ad inventory. */
const isActiveBrandAd = (a: AdvertisementRec): boolean => {
  const pos = String(a.position)
  if (pos.includes(':')) {
    // Another brand's private inventory unless it carries OUR prefix.
    return !!activeBrand.adPrefix && pos.startsWith(activeBrand.adPrefix)
  }
  // Shared base row — ours unless this brand overrides that position.
  return !activeBrand.brandedAdPositions.includes(pos as AdPosition)
}

/** Active advertisements for a position (header/homepage/wing/footer-info), within their date window. */
export async function listAdvertisements(position: AdPosition): Promise<AdvertisementRec[]> {
  const { data, error } = await supabase
    .from('advertisements')
    .select(AD_COLS)
    .eq('position', adKeyFor(position))
    .eq('active', true)
    .order('sort', { ascending: true })
  if (error) throw error
  const today = new Date().toISOString().slice(0, 10)
  return ((data ?? []) as unknown as AdvertisementRec[])
    .filter((a) => (!a.start_date || a.start_date <= today) && (!a.end_date || a.end_date >= today))
    .map(stripAdPrefix)
}

/** Every active advertisement of THIS brand, across every placement, within its date window — the /adv/banner gallery. */
export async function listAllAdvertisements(): Promise<AdvertisementRec[]> {
  const { data, error } = await supabase
    .from('advertisements')
    .select(AD_COLS)
    .eq('active', true)
    .order('position', { ascending: true })
    .order('sort', { ascending: true })
  if (error) throw error
  const today = new Date().toISOString().slice(0, 10)
  return ((data ?? []) as unknown as AdvertisementRec[])
    .filter((a) => (!a.start_date || a.start_date <= today) && (!a.end_date || a.end_date >= today))
    .filter(isActiveBrandAd)
    .map(stripAdPrefix)
}

/** One advertisement by id — /ad/view promotional page. */
export async function getAdvertisement(id: string): Promise<AdvertisementRec | null> {
  const { data, error } = await supabase.from('advertisements').select(AD_COLS).eq('id', id).maybeSingle()
  if (error) throw error
  return (data as unknown as AdvertisementRec) ?? null
}

/* -------------------------------- Links -------------------------------- */

const LINK_COLS = 'id, slug, title, description, body, url, image_url, category, section, sort'

export async function listLinks(section = 'footer-link'): Promise<LinkRec[]> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select(LINK_COLS)
      .eq('section', section)
      .eq('active', true)
      .order('sort', { ascending: true })
    if (error) throw error
    if (data && data.length > 0) return data as unknown as LinkRec[]
  } catch {
    /* table missing / offline → fall back */
  }
  return fallbackLinks()
}

export async function getLink(slug: string): Promise<LinkRec | null> {
  try {
    const { data, error } = await supabase.from('links').select(LINK_COLS).eq('slug', slug).eq('active', true).maybeSingle()
    if (error) throw error
    if (data) return data as unknown as LinkRec
  } catch {
    /* fall back */
  }
  return fallbackLinkBySlug(slug)
}

/* ------------------------------- Policies ------------------------------ */

const POLICY_COLS = 'id, slug, title, summary, body, sort'

export async function listPolicies(): Promise<PolicyRec[]> {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select(POLICY_COLS)
      .eq('active', true)
      .order('sort', { ascending: true })
    if (error) throw error
    if (data && data.length > 0) return data as unknown as PolicyRec[]
  } catch {
    /* fall back */
  }
  return fallbackPolicies()
}

export async function getPolicy(slug: string): Promise<PolicyRec | null> {
  try {
    const { data, error } = await supabase.from('policies').select(POLICY_COLS).eq('slug', slug).eq('active', true).maybeSingle()
    if (error) throw error
    if (data) return data as unknown as PolicyRec
  } catch {
    /* fall back */
  }
  return fallbackPolicyBySlug(slug)
}

/* -------------------------------- News --------------------------------- */

const NEWS_COLS_LEGACY = 'id, tab, kind, title, body, thumb_url, image_url, href, article_slug, comment_count, sort'
const NEWS_COLS = `${NEWS_COLS_LEGACY}, updated_at, meta_title, meta_description, og_image_url, canonical_url, is_indexable`

export async function listNews(): Promise<NewsItemRec[]> {
  return withSeoColumnFallback(
    async (cols) => {
      const { data, error } = await supabase.from('news_items').select(cols).order('sort', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as NewsItemRec[]
    },
    NEWS_COLS,
    NEWS_COLS_LEGACY,
  )
}

/** One news/information article by its article_slug — /news/article/<slug>. */
export async function getNewsArticle(slug: string): Promise<NewsItemRec | null> {
  return withSeoColumnFallback(
    async (cols) => {
      const { data, error } = await supabase.from('news_items').select(cols).eq('article_slug', slug).maybeSingle()
      if (error) throw error
      return (data as unknown as NewsItemRec) ?? null
    },
    NEWS_COLS,
    NEWS_COLS_LEGACY,
  )
}

/* ----------------------------- Travel info ----------------------------- */

export async function listTravelInfo(): Promise<TravelInfo[]> {
  const { data, error } = await supabase.from('travel_info').select('id, title, blurb, icon, href').order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as TravelInfo[]
}
