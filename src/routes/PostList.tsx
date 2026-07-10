import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { boardTitles } from '../data/boards'
import { useLocalized } from '../lib/useLocalized'
import { authorName, commentCountOf, formatDate, isGuest, listPosts, type DbPost } from '../lib/posts'

/** LIST / BOARD PAGE (/post/list?post_id=…&category=…) — real posts from Supabase. */
export default function PostList() {
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
