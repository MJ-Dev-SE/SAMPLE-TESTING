import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/auth'
import { useIsAdmin } from '../../admin/useIsAdmin'
import { alertError, errText } from '../../lib/alert'
import { createComment, listComments, type CommentRec, type ContentType } from '../../lib/comments'
import CommentForm from './CommentForm'
import CommentRow from './CommentRow'
import { StarRating } from './RatingInput'

const PAGE_SIZE = 10

/**
 * THE reusable comments/reviews section — appended below any center-displayed
 * record (business, advertisement, news). Fetches the record's comments
 * (newest-first, paginated with Load More), shows the count + average rating
 * when ratings are enabled, a composer (login-gated), and per-row edit/delete.
 * Fails soft to an empty section if supabase/comments.sql hasn't been run.
 *
 * `highlightedCommentId` (from a ?comment= deep link) is scrolled to + highlighted.
 */
export default function CommentsReviewsSection({
  contentType,
  contentId,
  allowRating = false,
  highlightedCommentId,
}: {
  contentType: ContentType
  contentId: string
  allowRating?: boolean
  highlightedCommentId?: string | null
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = useIsAdmin() === true

  const [rows, setRows] = useState<CommentRec[]>([])
  const [total, setTotal] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [posting, setPosting] = useState(false)
  const scrolledRef = useRef(false)

  const load = useCallback(
    async (p: number, replace: boolean) => {
      if (!contentId) return
      p === 1 ? setLoading(true) : setLoadingMore(true)
      try {
        const { rows: got, total: tot, avgRating: avg } = await listComments(contentType, contentId, { page: p, pageSize: PAGE_SIZE })
        setTotal(tot)
        if (p === 1) setAvgRating(avg)
        setRows((prev) => (replace ? got : [...prev, ...got.filter((g) => !prev.some((x) => x.id === g.id))]))
      } catch {
        if (replace) setRows([]) // table missing / offline → empty section
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [contentType, contentId],
  )

  useEffect(() => {
    setPage(1)
    scrolledRef.current = false
    load(1, true)
  }, [load])

  // Scroll to + flash the deep-linked comment once it's in the list.
  useEffect(() => {
    if (!highlightedCommentId || scrolledRef.current) return
    const el = document.getElementById(`comment-${highlightedCommentId}`)
    if (el) {
      scrolledRef.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedCommentId, rows])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(next, false)
  }

  const submit = async (body: string, rating: number | null) => {
    if (!user) return
    setPosting(true)
    try {
      const created = await createComment({ contentType, contentId, body, rating, authorId: user.id })
      setRows((prev) => [created, ...prev])
      setTotal((n) => n + 1)
      // A new rating shifts the average — re-fetch page 1's aggregate for accuracy.
      if (allowRating && created.rating) load(1, true)
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setPosting(false)
    }
  }

  const hasMore = rows.length < total

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden mt-l">
      <div className="flex items-center justify-between gap-2 bg-neutral-95 px-l py-3">
        <h2 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-comments mr-2 text-accent-blue" aria-hidden="true" />
          {allowRating ? t('comments.reviewsHeading') : t('comments.commentsHeading')}
          <span className="ml-1.5 text-subtlest font-normal">({total})</span>
        </h2>
        {allowRating && avgRating != null && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <StarRating value={avgRating} />
            <span className="font-semibold text-text-normal">{avgRating.toFixed(1)}</span>
          </span>
        )}
      </div>

      <div className="p-l border-b border-neutral-90">
        <CommentForm allowRating={allowRating} busy={posting} onSubmit={submit} />
      </div>

      {loading ? (
        <p className="p-l text-sm text-subtlest text-center">
          <i className="fa-solid fa-spinner fa-spin mr-2 text-accent-blue" aria-hidden="true" />…
        </p>
      ) : rows.length === 0 ? (
        <p className="p-l text-sm text-subtlest text-center">{t('comments.emptyState')}</p>
      ) : (
        <>
          <ul>
            {rows.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                allowRating={allowRating}
                highlighted={c.id === highlightedCommentId}
                isAdmin={isAdmin}
                onDeleted={(id) => {
                  setRows((prev) => prev.filter((r) => r.id !== id))
                  setTotal((n) => Math.max(0, n - 1))
                  if (allowRating) load(1, true)
                }}
                onUpdated={(u) => {
                  setRows((prev) => prev.map((r) => (r.id === u.id ? u : r)))
                  if (allowRating) load(1, true)
                }}
              />
            ))}
          </ul>
          {hasMore && (
            <div className="p-3 text-center border-t border-neutral-90">
              <button
                type="button"
                onClick={loadMore}
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
    </section>
  )
}
