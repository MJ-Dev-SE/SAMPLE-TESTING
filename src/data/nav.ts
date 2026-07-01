import type { NavLink } from '../types'

// DATA SLOT: nav link list (two rows of inline text links) — REAL PhilGo route paths.
export const navRow1: NavLink[] = [
  { label: { en: 'home', ko: '홈' }, href: '/' },
  { label: { en: 'log in', ko: '로그인' }, href: '/user/login' },
  { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
  { label: { en: 'question', ko: '질문' }, href: '/post/list?post_id=qna' },
  { label: { en: 'experiences', ko: '경험담' }, href: '/post/list?post_id=freetalk&category=경험담' },
  { label: { en: 'marketplace', ko: '장터' }, href: '/post/list?post_id=buyandsell' },
  { label: { en: 'Business Directory', ko: '업소록' }, href: '/company' },
  { label: { en: 'travel', ko: '여행' }, href: '/post/list?post_id=travel' },
  { label: { en: 'currency exchange', ko: '환전' }, href: '/currency' },
  { label: { en: 'rental car', ko: '렌트카' }, href: '/post/list?post_id=buyandsell&category=렌트카' },
  { label: { en: 'massage', ko: '마사지' }, href: '/post/list?post_id=massage' },
]

export const navRow2: NavLink[] = [
  { label: { en: 'boarding house', ko: '하숙집' }, href: '/post/list?post_id=boarding_house' },
  { label: { en: 'immigrant', ko: '이민' }, href: '/post/list?post_id=freetalk&category=이민' },
  { label: { en: 'passport', ko: '여권' }, href: '/post/list?post_id=qna&category=여권/비자' },
  { label: { en: 'real estate', ko: '부동산' }, href: '/real_estate/list.php' },
  { label: { en: 'AI', ko: 'AI' }, href: '/ai' },
  { label: { en: 'Recruitment', ko: '구인구직' }, href: '/post/list?post_id=wanted' },
  { label: { en: 'advertisement', ko: '광고' }, href: '/adv/banner' },
  { label: { en: 'Chatting', ko: '채팅' }, href: '/chat' },
]
