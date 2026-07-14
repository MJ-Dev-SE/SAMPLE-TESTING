import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { boardTitles } from '../data/boards'
import { getCategoryBySlug, listCategories } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import {
  authorName,
  commentCountOf,
  formatDate,
  isGuest,
  listPosts,
  listPostsByCategory,
  listPostsByParentCategory,
  type DbPost,
} from '../lib/posts'
import type { CategoryRec } from '../types'

const PAGE_SIZE = 20

/**
 * LIST / BOARD PAGE (/post/list?post_id=…&category=…) — real posts from Supabase.
 *
 * Also doubles as the maroon-bar CATEGORY FEED when `?maroon=<slug>` is present:
 * a parent slug shows the combined feed of all its children (2.1), a child slug
 * shows only that child's posts (2.2) — independent of board_id entirely. See
 * lib/posts.ts listPostsByCategory / listPostsByParentCategory and
 * supabase/community.sql. Absent `maroon`, this page behaves exactly as before.
 */
export default function PostList() {
  const [params] = useSearchParams()
  const maroonSlug = params.get('maroon')
  return maroonSlug ? <CategoryFeed key={maroonSlug} slug={maroonSlug} /> : <BoardList />
}

/** Original board-based list — unchanged from before this feature. */
function BoardList() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const postId = params.get('post_id') || 'freetalk'
  const category = params.get('category')

  const title = boardTitles[postId] ?? { en: 'Board', ko: '게시판' }

  const [posts, setPosts] = useState<DbPost[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    setLoading(true)
    listPosts(postId)
      .then((rows) => alive && setPosts(rows))
      .catch(() => alive && setPosts([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [postId])

  const writeHref = `/post/write?post_id=${postId}${category ? `&category=${encodeURIComponent(category)}` : ''}`

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">
          {t('menuPage.breadcrumbHome')}
        </Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{L(title)}</span>
      </nav>

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
            <li key={p.id} className="border-t border-neutral-90 first:border-t-0">
              <Link
                to={`/post/view?id=${p.id}&post_id=${postId}`}
                className="flex items-center gap-s px-m py-2.5 text-sm hover:bg-neutral-97"
              >
                <span className="flex-1 min-w-0 text-body truncate">
                  {p.title}
                  {commentCountOf(p) > 0 && (
                    <span className="ml-2 text-xs font-semibold text-accent-pink">[{commentCountOf(p)}]</span>
                  )}
                  {p.images.length > 0 && <i className="fa-solid fa-image ml-2 text-subtlest text-xs" />}
                </span>
                <span className="shrink-0 text-xs text-subtlest hidden sm:flex items-center gap-l tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    {authorName(p)}
                    {isGuest(p) && (
                      <span className="text-[10px] uppercase bg-neutral-95 text-subtlest rounded px-1">
                        {t('post.guestBadge')}
                      </span>
                    )}
                  </span>
                  <span>{formatDate(p.created_at)}</span>
                  <span>
                    <i className="fa-solid fa-eye mr-1" />
                    {p.views}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination />
    </Layout>
  )
}

/** Maroon-bar parent/child post-category feed (?maroon=<slug>). */
function CategoryFeed({ slug }: { slug: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') || 1))

  const [category, setCategory] = useState<CategoryRec | null | undefined>(undefined) // undefined = loading
  const [parent, setParent] = useState<CategoryRec | null>(null)
  const [posts, setPosts] = useState<DbPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Resolve the slug (once per slug change) — is it a parent or a child?
  useEffect(() => {
    let alive = true
    setCategory(undefined)
    setParent(null)
    getCategoryBySlug(slug, 'community')
      .then((cat) => {
        if (!alive) return
        setCategory(cat)
        if (cat?.parent_slug) {
          getCategoryBySlug(cat.parent_slug, 'community')
            .then((p) => alive && setParent(p))
            .catch(() => {})
        }
      })
      .catch(() => alive && setCategory(null))
    return () => {
      alive = false
    }
  }, [slug])

  // Load the feed once the category is resolved.
  useEffect(() => {
    if (category === undefined) return // still resolving
    if (!category) {
      setPosts([])
      setTotal(0)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    const isParent = category.parent_slug === null
    const fetch = isParent
      ? listCategories(category.slug, 'community').then((children) =>
          listPostsByParentCategory(
            children.map((c) => c.id),
            { page, pageSize: PAGE_SIZE },
          ),
        )
      : listPostsByCategory(category.id, { page, pageSize: PAGE_SIZE })
    fetch
      .then(({ rows, total }) => {
        if (!alive) return
        setPosts(rows)
        setTotal(total)
      })
      .catch(() => alive && (setPosts([]), setTotal(0)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [category, page])

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isParent = category?.parent_slug === null
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const writeHref = `/post/write?maroon=${slug}`

  if (category === undefined) {
    return (
      <Layout>
        <p className="text-sm text-subtlest">…</p>
      </Layout>
    )
  }

  if (!category) {
    return (
      <Layout>
        <div className="border border-neutral-90 rounded-l p-2xl text-center">
          <p className="text-sm text-muted">{t('category.notFound')}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Breadcrumb — Home › Parent [› Child] */}
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">
          {t('menuPage.breadcrumbHome')}
        </Link>
        <span className="mx-1 text-subtlest">›</span>
        {parent ? (
          <>
            <Link to={`/post/list?maroon=${parent.slug}`} className="text-link">
              {L(parent.name)}
            </Link>
            <span className="mx-1 text-subtlest">›</span>
            <span className="text-muted">{L(category.name)}</span>
          </>
        ) : (
          <span className="text-muted">{L(category.name)}</span>
        )}
      </nav>

      <div className="flex items-center justify-between gap-3 mb-l">
        <h1 className="text-xl font-bold text-text-normal min-w-0 flex items-center gap-2">
          {category.icon && <i className={`fa-solid ${category.icon} text-accent-blue`} aria-hidden="true" />}
          {L(category.name)}
          {isParent && <span className="ml-1 text-sm font-normal text-muted">· {t('category.allChildren')}</span>}
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
          <p className="text-sm text-subtlest mb-3">{t('category.empty')}</p>
          <Link to={writeHref} className="text-sm text-link font-medium hover:underline">
            <i className="fa-solid fa-pen mr-1" />
            {t('post.write')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="border border-neutral-90 rounded-l overflow-hidden">
            {posts.map((p) => (
              <li key={p.id} className="border-t border-neutral-90 first:border-t-0">
                <Link
                  to={`/post/view?id=${p.id}&post_id=maroon`}
                  className="flex items-center gap-s px-m py-2.5 text-sm hover:bg-neutral-97"
                >
                  <span className="flex-1 min-w-0 flex items-center gap-2 text-body">
                    {/* Which specific child category this post belongs to (2.1) */}
                    {isParent && p.category_row && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-chip-blue px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
                        {p.category_row.icon && <i className={`fa-solid ${p.category_row.icon}`} aria-hidden="true" />}
                        {L(p.category_row.name)}
                      </span>
                    )}
                    <span className="min-w-0 truncate">
                      {p.title}
                      {commentCountOf(p) > 0 && (
                        <span className="ml-2 text-xs font-semibold text-accent-pink">[{commentCountOf(p)}]</span>
                      )}
                      {p.images.length > 0 && <i className="fa-solid fa-image ml-2 text-subtlest text-xs" />}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-subtlest hidden sm:flex items-center gap-l tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {authorName(p)}
                      {isGuest(p) && (
                        <span className="text-[10px] uppercase bg-neutral-95 text-subtlest rounded px-1">
                          {t('post.guestBadge')}
                        </span>
                      )}
                    </span>
                    <span>{formatDate(p.created_at)}</span>
                    <span>
                      <i className="fa-solid fa-eye mr-1" />
                      {p.views}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </Layout>
  )
}
