import type { Localized } from '../types'

/** Registry of every board id (post_id) → its localized title. Real PhilGo board ids.
 *  Structural chrome (board names) stays in code; the posts themselves live in Supabase. */
export const boardTitles: Record<string, Localized> = {
  freetalk: { en: 'Free Board', ko: '자유게시판' },
  qna: { en: 'Q&A board', ko: '질문게시판' },
  // Resort community board: user posts made from a category page (maroon bar). Each
  // post carries a `category` = the photo/theme slug so it groups under that category.
  resort_community: { en: 'Resort Community', ko: '리조트 커뮤니티' },
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
