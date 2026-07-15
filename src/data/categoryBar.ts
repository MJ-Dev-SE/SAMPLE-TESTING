import type { CategoryGroup, NavLink } from '../types'

// DATA SLOT: the maroon scrolling category bar — Manila Tour taxonomy.
// Parents Information / News / Business Directory (+ Q&A, Community, Marketplace …)
// with two child rows each. One continuous parent strip, horizontally scrollable.
//
// Labels/order are unchanged. The 8 non-Business-Directory groups point at the
// stable category landing pages — /<parent> and /<parent>/<child> (SEO-clean
// URLs; routes/CategoryPage.tsx) — backed by public.categories kind='community'
// (supabase/community.sql). Parent click = combined feed of all its children;
// child click = just that child. Old /post/list?maroon=<slug> URLs redirect.
// "Business Directory" and "Real estate" link into /business-directory —
// that tree has its own categories (kind='business') and posting flow.
export const categoryGroups: CategoryGroup[] = [
  { parent: { label: { en: 'Information', ko: '정보' }, href: '/information' },
    children: [
      { label: { en: 'Weather', ko: '날씨' }, href: '/information/weather' },
      { label: { en: 'Experiences', ko: '경험담' }, href: '/information/experiences' },
    ] },
  { parent: { label: { en: 'News', ko: '뉴스' }, href: '/news' },
    children: [
      { label: { en: 'Notices', ko: '공지사항' }, href: '/news/notices' },
      { label: { en: 'Life Tips', ko: '생활의 팁' }, href: '/news/life-tips' },
    ] },
  { parent: { label: { en: 'Business Directory', ko: '업소록' }, href: '/business-directory' },
    children: [
      { label: { en: 'Restaurants', ko: '음식점' }, href: '/business-directory/food' },
      { label: { en: 'Hotels', ko: '호텔' }, href: '/business-directory/hotel' },
    ] },
  { parent: { label: { en: 'Q&A', ko: '질문답변' }, href: '/qna' },
    children: [
      { label: { en: 'Free discussion', ko: '자유게시판' }, href: '/qna/free-discussion' },
      { label: { en: 'Chit-chat', ko: '잡담' }, href: '/qna/chit-chat' },
    ] },
  { parent: { label: { en: 'Community', ko: '커뮤니티' }, href: '/community' },
    children: [
      { label: { en: 'Manila', ko: '마닐라' }, href: '/community/manila' },
      { label: { en: 'Angeles', ko: '앙헬레스' }, href: '/community/angeles' },
    ] },
  { parent: { label: { en: "Members' Marketplace", ko: '회원장터' }, href: '/marketplace' },
    children: [
      { label: { en: 'Cell phone', ko: '핸드폰' }, href: '/marketplace/cell-phone' },
      { label: { en: 'Peso exchange', ko: '페소환전' }, href: '/marketplace/peso-exchange' },
    ] },
  { parent: { label: { en: 'Travel', ko: '여행' }, href: '/travel' },
    children: [
      { label: { en: 'Tours & itineraries', ko: '투어·일정' }, href: '/travel/tours-itineraries' },
      { label: { en: 'Food trips', ko: '먹방' }, href: '/travel/food-trips' },
    ] },
  { parent: { label: { en: 'Jobs', ko: '구인구직' }, href: '/jobs' },
    children: [
      { label: { en: 'New member greetings', ko: '신입인사' }, href: '/jobs/new-member-greetings' },
      { label: { en: 'People search', ko: '사람찾기' }, href: '/jobs/people-search' },
    ] },
  { parent: { label: { en: 'Immigration', ko: '이민' }, href: '/immigration' },
    children: [
      { label: { en: 'Passport / Visa', ko: '여권/비자' }, href: '/immigration/passport-visa' },
      { label: { en: 'Boarding house', ko: '하숙집' }, href: '/immigration/boarding-house' },
    ] },
  { parent: { label: { en: 'Real estate', ko: '부동산' }, href: '/business-directory/realestate' },
    children: [
      { label: { en: 'Rental car', ko: '렌트카' }, href: '/business-directory/rentcar' },
      { label: { en: 'Massage / Spa', ko: '마사지' }, href: '/business-directory/spa' },
    ] },
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
