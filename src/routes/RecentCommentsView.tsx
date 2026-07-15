import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import RecentCommentItem from '../components/RecentCommentItem'
import { listRecentComments, type RecentCommentRec } from '../lib/comments'

const PAGE_SIZE = 20

/**
 * Full "Recent Comments" view (/post/comments) — the sidebar widget's "See More"
 * target. A larger list of the newest comments/reviews across every content type,
 * with Load More; each row opens its exact source record. noindex (activity feed).
 */
export default function RecentCommentsView() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<RecentCommentRec[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [errored, setErrored] = useState(false)
  const [done, setDone] = useState(false)

  const load = useCallback((offset: number) => {
    offset === 0 ? setLoading(true) : setLoadingMore(true)
    listRecentComments(PAGE_SIZE, offset)
      .then((got) => {
        setRows((prev) => (offset === 0 ? got : [...prev, ...got.filter((g) => !prev.some((x) => x.id === g.id))]))
        if (got.length < PAGE_SIZE) setDone(true)
      })
      .catch(() => setErrored(true))
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }, [])

  useEffect(() => {
    load(0)
  }, [load])

  return (
    <Layout>
      <Seo title={t('comments.recentTitle')} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('comments.recentTitle')}</span>
      </nav>

      <div className="border border-neutral-90 rounded-l overflow-hidden">
        <div className="bg-neutral-95 px-l py-3">
          <h1 className="text-base font-bold text-text-normal">
            <i className="fa-solid fa-comment-dots mr-2 text-accent-blue" aria-hidden="true" />
            {t('comments.recentTitle')}
          </h1>
          <p className="text-xs text-muted mt-0.5">{t('comments.recentSubtitle')}</p>
        </div>

        {loading ? (
          <p className="p-l text-sm text-subtlest text-center">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-accent-blue" aria-hidden="true" />…
          </p>
        ) : errored ? (
          <p className="p-l text-sm text-subtlest text-center">{t('content.notFound')}</p>
        ) : rows.length === 0 ? (
          <p className="p-l text-sm text-subtlest text-center">{t('comments.emptyState')}</p>
        ) : (
          <>
            <ul>
              {rows.map((c) => (
                <RecentCommentItem key={c.id} row={c} />
              ))}
            </ul>
            {!done && (
              <div className="p-3 text-center border-t border-neutral-90">
                <button
                  type="button"
                  onClick={() => load(rows.length)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-90 bg-white px-4 py-1.5 text-xs font-medium text-muted hover:border-accent-blue hover:text-accent-blue disabled:opacity-60 transition-colors"
                >
                  <i className={`fa-solid ${loadingMore ? 'fa-spinner fa-spin' : 'fa-chevron-down'} text-[11px]`} aria-hidden="true" />
                  {loadingMore ? t('comments.loading') : t('comments.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
