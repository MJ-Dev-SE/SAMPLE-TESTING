// Shared TypeScript interfaces for all DATA SLOTs.
// Swapping in real data later = editing /src/data modules only; markup stays unchanged.

export type Localized = { en: string; ko: string }

/** Accent pairs (chip bg / icon color) from the design-token system. */
export type AccentColor =
  | 'blue'
  | 'green'
  | 'indigo'
  | 'pink'
  | 'purple'
  | 'teal'
  | 'neutral'

export interface NavLink {
  label: Localized
  href: string
}

export interface MegaMenuGroup {
  groupTitle: Localized
  items: NavLink[]
}

/** One column of the maroon category bar: bold header links + sub-item links. */
export interface CategoryColumn {
  headers: NavLink[]
  nav: NavLink[]
}

export interface Banner {
  imageUrl: string
  href: string
  alt: string
}

/* ---- Homepage ---- */
export interface FeaturedStory {
  thumb: string
  title: Localized
  href: string
}

export interface Headline {
  title: Localized
  commentCount: number
  href: string
}

export interface NewsTab {
  tabLabel: Localized
  icon: string
  featured: FeaturedStory[]
  headlines: Headline[]
}

export interface BoardPost {
  title: Localized
  commentCount: number
  href: string
}

export interface Board {
  boardName: Localized
  seeMoreHref: string
  posts: BoardPost[]
}

export interface PopularPost {
  rank: number
  title: Localized
  views: number
  comments: number
  date: string // YYYY.MM.DD
  href: string
}

export interface Business {
  name: string // brand/proper noun — same in both locales
  excerpt: Localized
  href: string
  thumb?: string
}

export interface Stats {
  subscribers: number
  posts: number
  statsHref: string
}

export interface Weather {
  temp: string
  moreHref: string
}

export interface Exchange {
  php: string
  usdToKrw: string
  calcHref: string
}

/* ---- Menu page ---- */
export interface MenuItem {
  icon: string
  iconColor: AccentColor
  href: string
  title: Localized
  desc: Localized
}

export interface MenuSectionData {
  header: Localized
  icon: string
  items: MenuItem[]
}

/* ---- Sidebar widgets ---- */
export interface RecentComment {
  avatar: string
  author: string
  timeAgo: Localized
  snippet: Localized
  href: string
}

export interface RecentPhoto {
  thumb: string
  href: string
}

/* ---- Resort photos (hardcoded pics from /public/photos) ---- */
/** One resort photo: shown in the banner row / recent-photos grid; clicking it opens
 *  its own photo page (/photo/view?id=…) with the pic centered + caption + comments. */
export interface ResortPhoto {
  /** Stable slug used in /photo/view?id=… and as the comment-thread key. */
  id: string
  src: string
  title: Localized
  /** Small category chip shown above the title (e.g. "Room Rates", "Promo"). */
  tag: Localized
  description: Localized
  /** Dense caption lines shown under the description (rates, inclusions, schedules…). */
  details?: Localized[]
}

export interface EmergencyContact {
  label: Localized
  number: string
  note?: Localized
  href?: string
}

/* ---- Footer ---- */
export interface FooterGroup {
  groupTitle: Localized
  links: NavLink[]
}

export interface Language {
  code: 'en' | 'ko'
  label: string
  href: string
}

/* ---- Supabase content records (jsonb localized fields → Localized) ---- */

/** SEO columns shared by posts / businesses / news_items (supabase/seo.sql).
 *  All optional overrides — pages fall back to the record's own content. */
export interface SeoFields {
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  canonical_url: string | null
  is_indexable: boolean
}

/** public.photos row — banner row, recent-photos grid, /photo/view. */
export interface PhotoRec {
  slug: string
  /** Storage-relative path (or absolute URL); resolve with lib/media.publicUrl. */
  src: string
  section: 'banner' | 'recent'
  tag: Localized
  title: Localized
  description: Localized
  details: Localized[]
}

/** Which tree a category row belongs to: Business Directory, or the maroon community bar. */
export type CategoryKind = 'business' | 'community'

/** public.categories row — Business Directory parent + child categories, and
 *  (kind='community') the maroon category bar's parent + child post categories. */
export interface CategoryRec {
  id: string
  slug: string
  parent_slug: string | null
  kind: CategoryKind
  name: Localized
  icon: string
  sort: number
  /** SEO overrides for the category's landing page (nullable, seo.sql). */
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  is_indexable?: boolean
}

/** public.business_images row — a business's logo / main / gallery photos. */
export interface BusinessImage {
  id: string
  image_url: string
  image_type: 'logo' | 'main' | 'gallery'
  display_order: number
}

/** public.businesses row — Business Directory cards, profile page, widgets. */
export interface BusinessRec extends Partial<SeoFields> {
  id: string
  /** URL slug (/business/<slug>), auto-generated from the name (seo.sql). */
  slug?: string | null
  name: string
  category: string | null
  category_id: string | null
  location: string | null
  region: string | null
  address: string | null
  /** Structured breakdown of `address` (Province/City/Barangay picker) — supabase/address_contact.sql. */
  address_province: string | null
  address_city: string | null
  address_barangay: string | null
  phone: string | null
  mobile_phone: string | null
  /** { en, ko } one-line intro (card). Falls back to legacy `excerpt`. */
  short_intro: Localized
  /** { en, ko } full intro (profile). Falls back to legacy `description`. */
  detailed_intro: Localized
  excerpt: Localized
  description: Localized
  thumb_url: string | null
  logo_url: string | null
  main_image_url: string | null
  status: string
  display_order: number
  updated_at: string
  created_at?: string
  /** Joined gallery (profile page only). */
  images?: BusinessImage[]
}

/** Advertisement position on the site (drives where a banner renders). */
export type AdPosition = 'header' | 'homepage' | 'wing-left' | 'wing-right' | 'footer-info'

/** public.advertisements row — header/homepage/wing banners + footer program pages. */
export interface AdvertisementRec {
  id: string
  title: Localized
  description: Localized
  body: Localized
  image_url: string | null
  url: string | null
  position: AdPosition
  sort: number
  active: boolean
  start_date: string | null
  end_date: string | null
}

/** public.links row — partner websites, tourism resources, references. */
export interface LinkRec {
  id: string
  slug: string | null
  title: Localized
  description: Localized
  body: Localized
  url: string | null
  image_url: string | null
  category: string | null
  section: string
  sort: number
}

/** public.policies row — Terms / Privacy / Child Safety, formal documents. */
export interface PolicyRec {
  id: string
  slug: string
  title: Localized
  summary: Localized
  body: Localized
  sort: number
}

/** public.news_items row — homepage News tabs + news/information article pages. */
export interface NewsItemRec extends Partial<SeoFields> {
  /** Row id (used as content_id for the polymorphic comments/reviews section). */
  id?: string
  tab: string
  /** <lastmod> source for the sitemap (seo.sql adds the column + trigger). */
  updated_at?: string
  kind: 'featured' | 'headline'
  title: Localized
  body: Localized
  thumb_url: string | null
  image_url: string | null
  href: string
  article_slug: string | null
  comment_count: number
  sort: number
}

/** public.travel_info row — Travel Information card. */
export interface TravelInfo {
  id: string
  title: Localized
  blurb: Localized
  icon: string
  href: string
}

/* ---- Generic list / board page ---- */
export interface ListItem {
  title: Localized
  author: string
  date: string
  views: number
  comments: number
  href: string
}
