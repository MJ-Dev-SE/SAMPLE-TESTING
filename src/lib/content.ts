import { supabase } from './supabase'
import { fallbackLinks, fallbackLinkBySlug, fallbackPolicies, fallbackPolicyBySlug } from '../data/siteContent'
import type {
  AdPosition,
  AdvertisementRec,
  BusinessImage,
  BusinessRec,
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
 * offline client degrades to an empty section instead of crashing — same pattern as posts.ts.
 */

/* ------------------------------- Photos -------------------------------- */

export async function listPhotos(section: 'banner' | 'recent'): Promise<PhotoRec[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('slug, src, section, tag, title, description, details')
    .eq('section', section)
    .order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PhotoRec[]
}

/** All photos (banner first, then recent), ordered — for the /photo/view walker. */
export async function listAllPhotos(): Promise<PhotoRec[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('slug, src, section, tag, title, description, details')
    .order('sort', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as unknown as PhotoRec[]
  // Deterministic order: all banner photos, then all recent photos.
  return [...rows.filter((r) => r.section === 'banner'), ...rows.filter((r) => r.section === 'recent')]
}

export async function getPhoto(slug: string): Promise<PhotoRec | null> {
  const { data, error } = await supabase
    .from('photos')
    .select('slug, src, section, tag, title, description, details')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as PhotoRec) ?? null
}

/* ------------------------------ Categories ----------------------------- */

/** Business Directory child categories (shared by the filter, cards, posting + admin forms). */
export async function listCategories(parentSlug = 'business-directory'): Promise<CategoryRec[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, parent_slug, name, icon, sort')
    .eq('parent_slug', parentSlug)
    .eq('active', true)
    .order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as CategoryRec[]
}

/* ------------------------------ Businesses ----------------------------- */

const BIZ_COLS =
  'id, name, category, category_id, location, region, address, phone, excerpt, description, short_intro, detailed_intro, thumb_url, logo_url, main_image_url, status, display_order, updated_at, created_at'

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
  const from = (page - 1) * pageSize
  let q = supabase
    .from('businesses')
    .select(BIZ_COLS, { count: 'exact' })
    .eq('status', 'active')
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false })
    .range(from, from + pageSize - 1)
  if (category && category !== 'all') q = q.eq('category', category)
  const { data, error, count } = await q
  if (error) throw error
  return { rows: (data ?? []) as unknown as BusinessRec[], total: count ?? 0 }
}

/** Compact "recently updated" widget list. */
export async function listRecentBusinesses(limit = 6): Promise<BusinessRec[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select(BIZ_COLS)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as BusinessRec[]
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

/** Insert a business + its logo/main/gallery image rows. Returns the new row. */
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

/** One business by id, with its gallery — /company/view profile page. */
export async function getBusiness(id: string): Promise<BusinessRec | null> {
  const { data, error } = await supabase.from('businesses').select(BIZ_COLS).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const biz = data as unknown as BusinessRec
  const { data: imgs } = await supabase
    .from('business_images')
    .select('id, image_url, image_type, display_order')
    .eq('business_id', id)
    .order('display_order', { ascending: true })
  biz.images = (imgs ?? []) as unknown as BusinessImage[]
  return biz
}

/* --------------------------- Advertisements ---------------------------- */

const AD_COLS = 'id, title, description, body, image_url, url, position, sort, active, start_date, end_date'

/** Active advertisements for a position (header/homepage/wing/footer-info), within their date window. */
export async function listAdvertisements(position: AdPosition): Promise<AdvertisementRec[]> {
  const { data, error } = await supabase
    .from('advertisements')
    .select(AD_COLS)
    .eq('position', position)
    .eq('active', true)
    .order('sort', { ascending: true })
  if (error) throw error
  const today = new Date().toISOString().slice(0, 10)
  return ((data ?? []) as unknown as AdvertisementRec[]).filter(
    (a) => (!a.start_date || a.start_date <= today) && (!a.end_date || a.end_date >= today),
  )
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

const NEWS_COLS = 'tab, kind, title, body, thumb_url, image_url, href, article_slug, comment_count, sort'

export async function listNews(): Promise<NewsItemRec[]> {
  const { data, error } = await supabase
    .from('news_items')
    .select(NEWS_COLS)
    .order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as NewsItemRec[]
}

/** One news/information article by its article_slug — /news/view page. */
export async function getNewsArticle(slug: string): Promise<NewsItemRec | null> {
  const { data, error } = await supabase.from('news_items').select(NEWS_COLS).eq('article_slug', slug).maybeSingle()
  if (error) throw error
  return (data as unknown as NewsItemRec) ?? null
}

/* ----------------------------- Travel info ----------------------------- */

export async function listTravelInfo(): Promise<TravelInfo[]> {
  const { data, error } = await supabase
    .from('travel_info')
    .select('id, title, blurb, icon, href')
    .order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as TravelInfo[]
}
