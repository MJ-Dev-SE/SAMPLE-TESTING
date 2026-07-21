import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import PhotoBanner from '../components/PhotoBanner'
import NewsTabs from '../components/NewsTabs'
import HaninShowcase from '../components/HaninShowcase'
import BoardColumn from '../components/BoardColumn'
import PopularList from '../components/PopularList'
import BannerRow from '../components/BannerRow'
import { activeBrand } from '../config/brand'
import { boardTitles } from '../data/boards'
import { listPhotos } from '../lib/content'
import { commentCountOf, listPosts, postPath, type DbPost } from '../lib/posts'
import { organizationLd, websiteLd } from '../lib/seo/structuredData'
import { DEFAULT_TITLE } from '../config/site'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'
import type { Board } from '../types'

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
      href: postPath(p),
    })),
  }
}

export default function Home() {
  const { t } = useTranslation()
  const L = useLocalized()

  // The resort photo banner (room types, rate card) is manilatour.com content —
  // hanin.tv shows its business showcase there instead, so the query is skipped
  // entirely rather than fetched and thrown away.
  const showPhotoBanner = activeBrand.id !== 'hanin'
  const { data: banner = [] } = useQuery({
    queryKey: ['photos', 'banner'],
    queryFn: () => listPhotos('banner'),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
    enabled: showPhotoBanner,
  })

  const { data: boardLists } = useQuery({
    queryKey: ['home-boards', HOME_BOARDS],
    queryFn: () => Promise.all(HOME_BOARDS.map((b) => listPosts(b, 5).catch(() => [] as DbPost[]))),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
  })
  const boards: Board[] = boardLists ? HOME_BOARDS.map((b, i) => toBoard(b, boardLists[i])) : []

  return (
    <Layout>
      <Seo path="/" jsonLd={[websiteLd(), organizationLd()]} />
      {/* Single page h1 — visually hidden; the homepage design has no title row. */}
      <h1 className="sr-only">{L(DEFAULT_TITLE)}</h1>
      <div className="flex flex-col gap-l">
        {/* 4a. News tab block */}
        <NewsTabs />

        {/* hanin.tv only: business showcase grid directly below the News card.
            manilatour.com (and every other host) renders nothing here. */}
        {activeBrand.id === 'hanin' && <HaninShowcase />}

        {/* 4b. Room-rate photo banner row — click a card for the full pic + info.
            manilatour.com only (see showPhotoBanner above). */}
        {showPhotoBanner && <PhotoBanner photos={banner} />}

        {/* Ad cards (crossfading, from the DB) */}
        <BannerRow position="homepage" />

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
