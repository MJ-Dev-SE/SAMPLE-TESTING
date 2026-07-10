import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import PhotoBanner from '../components/PhotoBanner'
import NewsTabs from '../components/NewsTabs'
import BoardColumn from '../components/BoardColumn'
import PopularList from '../components/PopularList'
import BannerRow from '../components/BannerRow'
import { boardTitles } from '../data/boards'
import { listPhotos } from '../lib/content'
import { commentCountOf, listPosts, type DbPost } from '../lib/posts'
import type { Board, PhotoRec } from '../types'

/** Board ids previewed on the homepage "Latest posts" columns. */
const HOME_BOARDS = ['freetalk', 'qna'] as const

/** Adapt Supabase posts into the Board shape BoardColumn renders (title → Localized). */
function toBoard(boardId: string, posts: DbPost[]): Board {
  const name = boardTitles[boardId] ?? { en: boardId, ko: boardId }
  return {
    boardName: name,
    seeMoreHref: `/post/list?post_id=${boardId}`,
    posts: posts.map((p) => ({
      title: { en: p.title, ko: p.title },
      commentCount: commentCountOf(p),
      href: `/post/view?id=${p.id}&post_id=${boardId}`,
    })),
  }
}

export default function Home() {
  const { t } = useTranslation()
  const [banner, setBanner] = useState<PhotoRec[]>([])
  const [boards, setBoards] = useState<Board[]>([])

  useEffect(() => {
    let alive = true
    listPhotos('banner')
      .then((p) => alive && setBanner(p))
      .catch(() => alive && setBanner([]))

    Promise.all(HOME_BOARDS.map((b) => listPosts(b, 5).catch(() => [] as DbPost[]))).then((lists) => {
      if (alive) setBoards(HOME_BOARDS.map((b, i) => toBoard(b, lists[i])))
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <Layout>
      <div className="flex flex-col gap-l">
        {/* 4a. News tab block */}
        <NewsTabs />

        {/* 4b. Room-rate photo banner row — click a card for the full pic + info */}
        <PhotoBanner photos={banner} />

        {/* Ad cards (crossfading, from the DB) */}
        <BannerRow slot="mid" />

        {/* 4c. Board columns ("Latest posts") */}
        <div>
          <h2 className="text-base font-bold text-text-normal mb-s">{t('home.latestPosts')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-l">
            {boards.map((b) => (
              <BoardColumn key={b.boardName.en} board={b} />
            ))}
          </div>
        </div>

        {/* 4d. Popular Posts (Last 30 days) */}
        <PopularList />
      </div>
    </Layout>
  )
}
