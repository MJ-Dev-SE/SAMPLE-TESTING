import type { CategoryGroup, NavLink } from '../types'

// DATA SLOT: the maroon scrolling category bar — Manila Tour taxonomy.
// Parents Information / News / Business Directory (+ Q&A, Community, Marketplace …)
// with two child rows each. One continuous parent strip, horizontally scrollable.
export const categoryGroups: CategoryGroup[] = [
  { parent: { label: { en: 'Information', ko: '정보' }, href: '/post/list?post_id=freetalk&category=info' },
    children: [
      { label: { en: 'Weather', ko: '날씨' }, href: '/weather' },
      { label: { en: 'Experiences', ko: '경험담' }, href: '/post/list?post_id=freetalk&category=경험담' },
    ] },
  { parent: { label: { en: 'News', ko: '뉴스' }, href: '/post/list?post_id=news' },
    children: [
      { label: { en: 'Notices', ko: '공지사항' }, href: '/post/list?post_id=freetalk&category=공지사항' },
      { label: { en: 'Life Tips', ko: '생활의 팁' }, href: '/post/list?post_id=freetalk&category=생활의팁' },
    ] },
  { parent: { label: { en: 'Business Directory', ko: '업소록' }, href: '/company' },
    children: [
      { label: { en: 'Restaurants', ko: '음식점' }, href: '/company?category=food' },
      { label: { en: 'Hotels', ko: '호텔' }, href: '/company?category=hotel' },
    ] },
  { parent: { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
    children: [
      { label: { en: 'Free discussion', ko: '자유게시판' }, href: '/post/list?post_id=freetalk' },
      { label: { en: 'Chit-chat', ko: '잡담' }, href: '/post/list?post_id=freetalk&category=잡담' },
    ] },
  { parent: { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
    children: [
      { label: { en: 'Manila', ko: '마닐라' }, href: '/post/region?region=마닐라' },
      { label: { en: 'Angeles', ko: '앙헬레스' }, href: '/post/region?region=앙헬레스' },
    ] },
  { parent: { label: { en: "Members' Marketplace", ko: '회원장터' }, href: '/post/list?post_id=buyandsell' },
    children: [
      { label: { en: 'Cell phone', ko: '핸드폰' }, href: '/post/list?post_id=buyandsell&category=핸드폰' },
      { label: { en: 'Peso exchange', ko: '페소환전' }, href: '/post/list?post_id=buyandsell&category=페소환전' },
    ] },
  { parent: { label: { en: 'Travel', ko: '여행' }, href: '/post/list?post_id=travel' },
    children: [
      { label: { en: 'Tours & itineraries', ko: '투어·일정' }, href: '/company?category=travel' },
      { label: { en: 'Food trips', ko: '먹방' }, href: '/post/list?post_id=freetalk&category=먹방' },
    ] },
  { parent: { label: { en: 'Jobs', ko: '구인구직' }, href: '/post/list?post_id=wanted' },
    children: [
      { label: { en: 'New member greetings', ko: '신입인사' }, href: '/post/list?post_id=greeting' },
      { label: { en: 'People search', ko: '사람찾기' }, href: '/post/list?post_id=lookfor' },
    ] },
  { parent: { label: { en: 'Immigration', ko: '이민' }, href: '/post/list?post_id=freetalk&category=이민' },
    children: [
      { label: { en: 'Passport / Visa', ko: '여권/비자' }, href: '/post/list?post_id=qna&category=여권/비자' },
      { label: { en: 'Boarding house', ko: '하숙집' }, href: '/post/list?post_id=boarding_house' },
    ] },
  { parent: { label: { en: 'Real estate', ko: '부동산' }, href: '/company?category=realestate' },
    children: [
      { label: { en: 'Rental car', ko: '렌트카' }, href: '/company?category=rentcar' },
      { label: { en: 'Massage / Spa', ko: '마사지' }, href: '/company?category=spa' },
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
