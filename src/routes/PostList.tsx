import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import Seo from '../components/seo/Seo'
import Breadcrumbs from '../components/seo/Breadcrumbs'
import { NotFoundBody } from './NotFound'
import { boardTitles } from '../data/boards'
import { getCategoryBySlug } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'
import { listPostsPage } from '../lib/posts'
import PostListItem from '../components/PostListItem'

/**
 * LIST / BOARD PAGE (/post/list?post_id=…&category=…) — real posts from Supabase.
 *
 * The maroon-bar feeds moved to stable path URLs (/information,
 * /information/weather — see routes/CategoryPage.tsx). The old
 * ?maroon=<slug> URLs still work: they resolve the slug and redirect.
 */
export default function PostList() {
  const [params] = useSearchParams()
  const maroonSlug = params.get('maroon')
  return maroonSlug ? <MaroonRedirect key={maroonSlug} slug={maroonSlug} /> : <BoardList />
}

/** Legacy /post/list?maroon=<slug> → /<parent>[/<child>] (URL kept alive). */
function MaroonRedirect({ slug }: { slug: string }) {
  const { t } = useTranslation()
  const [target, setTarget] = useState<string | null | undefined>(undefined) // undefined = resolving

  useEffect(() => {
    let alive = true
    getCategoryBySlug(slug, 'community')
      .then((cat) => {
        if (!alive) return
        if (!cat) setTarget(null)
        else setTarget(cat.parent_slug ? `/${cat.parent_slug}/${cat.slug}` : `/${cat.slug}`)
      })
      .catch(() => alive && setTarget(null))
    return () => {
      alive = false
    }
  }, [slug])

  if (target === undefined) {
    return (
      <Layout>
        <Seo noindex />
        <p className="text-sm text-subtlest">…</p>
      </Layout>
    )
  }
  if (target === null) {
    return (
      <Layout>
        <Seo title={t('notFound.title')} noindex />
        <NotFoundBody />
      </Layout>
    )
  }
  return <Navigate to={target} replace />
}

/** Original board-based list — unchanged behavior, now with unique metadata. */
function BoardList() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const postId = params.get('post_id') || 'freetalk'
  const category = params.get('category')

  const title = boardTitles[postId] ?? { en: 'Board', ko: '게시판' }
  const pageSize = 20

  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [postId, category])

  const { data, isLoading } = useQuery({
    queryKey: ['posts', postId, category ?? null, page, pageSize],
    queryFn: () => listPostsPage(postId, { page, pageSize, category: category ?? undefined }),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
  })
  const posts = data?.rows ?? []
  const loading = isLoading
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))

  const writeHref = `/post/write?post_id=${postId}${category ? `&category=${encodeURIComponent(category)}` : ''}`

  return (
    <Layout>
      {/* Free-text category filters are duplicate views of the board — canonical
          points at the clean board URL and filtered variants stay unindexed. */}
      <Seo
        title={L(title)}
        description={`${L(title)} — ${L(boardDescription)}`}
        path={`/post/list?post_id=${postId}`}
        noindex={!!category}
      />
      <Breadcrumbs items={[{ label: t('menuPage.breadcrumbHome'), href: '/' }, { label: L(title) }]} />

      {/* Title row + Write button */}
      <div className="flex items-center justify-between gap-3 mb-l">
        <h1 className="text-xl font-bold text-text-normal min-w-0">
          {L(title)}
          {category && <span className="ml-2 text-sm font-normal text-muted">· {category}</span>}
        </h1>
        <Link
          to={writeHref}
          className="shrink-0 inline-flex items-center gap-2 h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
        >
          <i className="fa-solid fa-pen" />
          {t('post.write')}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-subtlest">…</p>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-neutral-90 rounded-l p-l text-center">
          <p className="text-sm text-subtlest mb-3">{t('post.noComments')}</p>
          <Link to={writeHref} className="text-sm text-link font-medium hover:underline">
            <i className="fa-solid fa-pen mr-1" />
            {t('post.write')}
          </Link>
        </div>
      ) : (
        <ul className="border border-neutral-90 rounded-l overflow-hidden">
          {posts.map((p) => (
            <PostListItem key={p.id} post={p} />
          ))}
        </ul>
      )}

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </Layout>
  )
}

/** Localized board-list blurb for the meta description. */
const boardDescription = {
  en: 'community board on Manila Tour. Read the latest posts or write your own.',
  ko: '마닐라 여행 커뮤니티 게시판. 최신 글을 읽고 직접 글을 남겨보세요.',
}
