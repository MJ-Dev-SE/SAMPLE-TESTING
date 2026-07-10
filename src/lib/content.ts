import { supabase } from './supabase'
import type { AdRec, BusinessRec, NewsItemRec, PhotoRec, TravelInfo } from '../types'

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

/* ------------------------------ Businesses ----------------------------- */

const BIZ_COLS = 'id, name, category, location, excerpt, description, thumb_url, updated_at'

/** Business Directory listing, optionally filtered by category, newest-updated first. */
export async function listBusinesses(category?: string | null): Promise<BusinessRec[]> {
  let q = supabase.from('businesses').select(BIZ_COLS).order('updated_at', { ascending: false })
  if (category && category !== 'all') q = q.eq('category', category)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as BusinessRec[]
}

/** Compact "recently updated" widget list. */
export async function listRecentBusinesses(limit = 6): Promise<BusinessRec[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select(BIZ_COLS)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as BusinessRec[]
}

/** Distinct non-null categories present in the directory (for the sidebar chips). */
export async function listBusinessCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('businesses').select('category')
  if (error) throw error
  const set = new Set<string>()
  for (const row of data ?? []) if (row.category) set.add(row.category as string)
  return [...set]
}

export interface NewBusiness {
  name: string
  category: string | null
  location: string | null
  excerpt: { en: string; ko: string }
  description: { en: string; ko: string }
  thumbUrl: string | null
  ownerId: string
}

export async function createBusiness(b: NewBusiness): Promise<BusinessRec> {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      name: b.name,
      category: b.category,
      location: b.location,
      excerpt: b.excerpt,
      description: b.description,
      thumb_url: b.thumbUrl,
      owner_id: b.ownerId,
    })
    .select(BIZ_COLS)
    .single()
  if (error) throw error
  return data as unknown as BusinessRec
}

/* --------------------------------- Ads --------------------------------- */

export async function listAds(slot: AdRec['slot']): Promise<AdRec[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('id, slot, image_url, href, alt')
    .eq('slot', slot)
    .eq('active', true)
    .order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as AdRec[]
}

/* -------------------------------- News --------------------------------- */

export async function listNews(): Promise<NewsItemRec[]> {
  const { data, error } = await supabase
    .from('news_items')
    .select('tab, kind, title, thumb_url, href, comment_count, sort')
    .order('sort', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as NewsItemRec[]
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
