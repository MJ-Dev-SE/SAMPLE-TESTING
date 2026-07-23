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
  { label: { en: 'entire', ko: '전체' }, href: '/business-directory' },
  { label: { en: 'education', ko: '교육' }, href: '/business-directory/education' },
  { label: { en: 'eating house', ko: '음식점' }, href: '/business-directory/food' },
  { label: { en: 'hospital', ko: '병원' }, href: '/business-directory/hospital' },
  { label: { en: 'mart', ko: '마트' }, href: '/business-directory/mart' },
  { label: { en: 'bank', ko: '은행' }, href: '/business-directory/bank' },
  { label: { en: 'electronic products', ko: '전자제품' }, href: '/business-directory/electronics' },
  { label: { en: 'travel agency', ko: '여행사' }, href: '/business-directory/travel-agency' },
  { label: { en: 'hotel', ko: '호텔' }, href: '/business-directory/hotel' },
  { label: { en: 'rental car', ko: '렌트카' }, href: '/business-directory/rentcar' },
  { label: { en: 'Beauty', ko: '뷰티' }, href: '/business-directory/beauty' },
  { label: { en: 'real estate', ko: '부동산' }, href: '/business-directory/realestate' },
  { label: { en: 'KTV', ko: 'KTV' }, href: '/business-directory/ktv' },
  { label: { en: 'spa', ko: '스파' }, href: '/business-directory/spa' },
  { label: { en: 'money changer', ko: '환전소' }, href: '/business-directory/money-changer' },
  { label: { en: 'logistics', ko: '물류' }, href: '/business-directory/logistics' },
  { label: { en: 'religion', ko: '종교' }, href: '/business-directory/religion' },
  { label: { en: 'etc', ko: '기타' }, href: '/business-directory/etc' },
]

// DATA SLOT: stats={subscribers, posts, statsHref} — homepage statistics counters.
export const stats: Stats = {
  subscribers: 192614,
  posts: 6983278,
  statsHref: '#',
}
