import type { NavLink } from '../types'

// DATA SLOT: the maroon category bar — Manila Tour taxonomy. One row, 12
// parent-only columns (no child rows) — same dense/compact styling as before,
// just flattened. Order below is authoritative.
//
// Every item still has real content behind it, just not a visible child strip
// in the bar itself:
//  - Information / News / Community / Q&A / Travel / Members' Marketplace /
//    Golf are community categories (kind='community', supabase/community.sql +
//    golf_category.sql) — each still HAS child categories in the DB (e.g.
//    Information → Weather/Experiences) for routing, the posting form's
//    required parent→child picker, and CategoryPage's own "chip" sub-nav; they
//    just aren't listed here anymore. /jobs and /immigration keep working the
//    same way — only removed from this bar, not from the app (routes/App.tsx).
//  - Business Directory / Famous Restaurants / Rent Car / Academy / Real
//    Estate all resolve through the existing /business-directory[/<slug>]
//    route (kind='business' categories) — Famous Restaurants = the "food"
//    category, Rent Car = "rentcar", Academy = "education", Real Estate =
//    "realestate" (all already seeded with real listings, see manilaSeed.json).
export const categoryGroups: NavLink[] = [
  { label: { en: 'Business Directory', ko: '업소록' }, href: '/business-directory' },
  { label: { en: 'Travel', ko: '여행' }, href: '/travel' },
  { label: { en: 'Golf', ko: '골프' }, href: '/golf' },
  { label: { en: 'Famous Restaurants', ko: '맛집' }, href: '/business-directory/food' },
  { label: { en: "Members' Marketplace", ko: '회원장터' }, href: '/marketplace' },
  { label: { en: 'Information', ko: '정보' }, href: '/information' },
  { label: { en: 'News', ko: '뉴스' }, href: '/news' },
  { label: { en: 'Community', ko: '커뮤니티' }, href: '/community' },
  { label: { en: 'Rent Car', ko: '렌트카' }, href: '/business-directory/rentcar' },
  { label: { en: 'Academy', ko: '학원' }, href: '/business-directory/education' },
  { label: { en: 'Q&A', ko: '질문답변' }, href: '/qna' },
  { label: { en: 'Real Estate', ko: '부동산' }, href: '/business-directory/realestate' },
]

// DATA SLOT: thin top utility bar (left + right link clusters)
export const topBarLeft: NavLink[] = [
  { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
  { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
  { label: { en: 'Chat', ko: '채팅' }, href: '/chat' },
  { label: { en: 'Home', ko: '홈' }, href: '/' },
]

export const topBarRight: NavLink[] = [
  { label: { en: 'Login', ko: '로그인' }, href: '/user/login' },
  { label: { en: 'Ad', ko: '광고' }, href: '/adv/banner' },
  { label: { en: 'Operation Inquiry', ko: '운영자 문의' }, href: '/chat/index' },
  { label: { en: 'Menu', ko: '메뉴' }, href: '/menu' },
]

// Quick links shown to the right of the center search box
export const searchQuickLinks: NavLink[] = [
  { label: { en: 'Encyclopedia', ko: '백과' }, href: '/post/list?post_id=freetalk&category=백과' },
  { label: { en: 'Life Tips', ko: '생활의 팁' }, href: '/post/list?post_id=freetalk&category=생활의팁' },
]
