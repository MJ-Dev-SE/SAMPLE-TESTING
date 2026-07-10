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

/** One category column: a parent header (maroon row) + its child links (2 rows below). */
export interface CategoryGroup {
  parent: NavLink
  children: NavLink[]
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

/** public.businesses row — Business Directory + recently-updated widget. */
export interface BusinessRec {
  id: string
  name: string
  category: string | null
  location: string | null
  excerpt: Localized
  description: Localized
  thumb_url: string | null
  updated_at: string
}

/** public.ads row — ad cards + wing banners. */
export interface AdRec {
  id: string
  slot: 'mid' | 'wing-left' | 'wing-right' | 'top'
  image_url: string
  href: string
  alt: string
}

/** public.news_items row — homepage News tabs. */
export interface NewsItemRec {
  tab: string
  kind: 'featured' | 'headline'
  title: Localized
  thumb_url: string | null
  href: string
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
