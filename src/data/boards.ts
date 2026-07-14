import type { Localized } from '../types'

/** Registry of every board id (post_id) → its localized title. Real PhilGo board ids.
 *  Structural chrome (board names) stays in code; the posts themselves live in Supabase. */
export const boardTitles: Record<string, Localized> = {
  freetalk: { en: 'Free Board', ko: '자유게시판' },
  qna: { en: 'Q&A board', ko: '질문게시판' },
  // Photo-page community board: user posts made from a /photo/view category page.
  // Each post carries a `category` = the photo/theme slug so it groups under that category.
  resort_community: { en: 'Photo Community', ko: '포토 커뮤니티' },
  // Maroon-bar community posts: board is fixed to this id, the real filtering
  // dimension is posts.category_id (see supabase/community.sql + lib/posts.ts).
  maroon: { en: 'Community Categories', ko: '커뮤니티 카테고리' },
  news: { en: 'News', ko: '뉴스' },
  travel: { en: 'Travel', ko: '여행' },
  buyandsell: { en: 'Marketplace', ko: '장터' },
  massage: { en: 'Massage', ko: '마사지' },
  wanted: { en: 'Recruitment', ko: '구인구직' },
  boarding_house: { en: 'Boarding House', ko: '하숙집' },
  business: { en: 'Business', ko: '비즈니스' },
  blog: { en: 'Column', ko: '칼럼' },
  study: { en: 'Academy', ko: '학원' },
  youtube: { en: 'YouTube', ko: '유튜브' },
  rest: { en: 'Rest', ko: '휴식' },
  greeting: { en: 'Greetings', ko: '인사' },
  school: { en: 'School', ko: '학교' },
  lookfor: { en: 'Looking For', ko: '찾습니다' },
  caution: { en: 'Caution', ko: '주의' },
}
