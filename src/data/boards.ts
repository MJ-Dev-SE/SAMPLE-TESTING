import type { Localized, ListItem } from '../types'
import { boards } from './home'

/** Registry of every board id (post_id) → its localized title. Real PhilGo board ids. */
export const boardTitles: Record<string, Localized> = {
  freetalk: { en: 'Free Board', ko: '자유게시판' },
  qna: { en: 'Q&A board', ko: '질문게시판' },
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

const authors = ['민호', '제니', '카를로', '수진', '대한', '하나', '레이', '유나']

/**
 * Build a sequential list for a given board.
 * Real posts (where we captured them) are shown first, then realistic filler.
 * Items load sequentially here — no real pagination logic.
 */
export function getBoardItems(postId: string): ListItem[] {
  const known = boards.find(
    (b) => (postId === 'freetalk' && b.boardName.en === 'Free Board') ||
           (postId === 'qna' && b.boardName.en === 'Q&A board'),
  )

  const real: ListItem[] = (known?.posts ?? []).map((p, i) => ({
    title: p.title,
    author: authors[i % authors.length],
    date: `2026.06.${String(29 - i).padStart(2, '0')}`,
    views: 200 + i * 53,
    comments: p.commentCount,
    href: p.href,
  }))

  const filler: ListItem[] = Array.from({ length: 20 - real.length }, (_, i) => {
    const n = real.length + i + 1
    return {
      title: {
        en: `${boardTitles[postId]?.en ?? 'Post'} — discussion thread #${n}`,
        ko: `${boardTitles[postId]?.ko ?? '게시글'} — 게시글 #${n}`,
      },
      author: authors[n % authors.length],
      date: `2026.06.${String(((n * 3) % 28) + 1).padStart(2, '0')}`,
      views: 80 + n * 29,
      comments: (n * 5) % 37,
      href: `/post/view?idx=${1275700000 + n}&post_id=${postId}`,
    }
  })

  return [...real, ...filler]
}
