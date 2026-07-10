import type { NavLink, Stats } from '../types'

// ---------------------------------------------------------------------------
// Structural chrome that is NOT user content and stays in code (per the
// content-migration decision). Everything dynamic — news, boards, popular posts,
// businesses, photos, ads, weather/exchange — now comes from Supabase / live APIs.
// See src/lib/content.ts, src/lib/posts.ts, src/lib/weather.ts, src/lib/fx.ts.
// ---------------------------------------------------------------------------

// DATA SLOT: bizCategories=[{label, href}] — the canonical Business Directory category
// set (nav chips). The listings themselves are user-registered rows in public.businesses.
export const bizCategories: NavLink[] = [
  { label: { en: 'entire', ko: '전체' }, href: '/company' },
  { label: { en: 'government offices', ko: '관공서' }, href: '/company?category=government' },
  { label: { en: 'education', ko: '교육' }, href: '/company?category=education' },
  { label: { en: 'eating house', ko: '음식점' }, href: '/company?category=food' },
  { label: { en: 'traffic', ko: '교통' }, href: '/company?category=traffic' },
  { label: { en: 'hospital', ko: '병원' }, href: '/company?category=hospital' },
  { label: { en: 'mart', ko: '마트' }, href: '/company?category=mart' },
  { label: { en: 'bank', ko: '은행' }, href: '/company?category=bank' },
  { label: { en: 'electronic products', ko: '전자제품' }, href: '/company?category=electronics' },
  { label: { en: 'travel agency', ko: '여행사' }, href: '/company?category=travel' },
  { label: { en: 'hotel', ko: '호텔' }, href: '/company?category=hotel' },
  { label: { en: 'rental car', ko: '렌트카' }, href: '/company?category=rentcar' },
  { label: { en: 'Beauty', ko: '뷰티' }, href: '/company?category=beauty' },
  { label: { en: 'real estate', ko: '부동산' }, href: '/company?category=realestate' },
  { label: { en: 'KTV', ko: 'KTV' }, href: '/company?category=ktv' },
  { label: { en: 'spa', ko: '스파' }, href: '/company?category=spa' },
  { label: { en: 'etc', ko: '기타' }, href: '/company?category=etc' },
]

// DATA SLOT: stats={subscribers, posts, statsHref} — homepage statistics counters.
export const stats: Stats = {
  subscribers: 192614,
  posts: 6983278,
  statsHref: '#',
}
