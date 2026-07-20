import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/auth'
import { useIsAdmin } from '../../admin/useIsAdmin'
import { alertError, errText } from '../../lib/alert'
import { STALE } from '../../lib/queryClient'
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
  const queryClient = useQueryClient()

  const [rows, setRows] = useState<CommentRec[]>([])
  const [total, setTotal] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [posting, setPosting] = useState(false)
  const scrolledRef = useRef(false)

  const commentsKey = (p: number) => ['comments', contentType, contentId, p] as const

  const { data, isLoading, isFetching } = useQuery({
    queryKey: commentsKey(page),
    queryFn: () => listComments(contentType, contentId, { page, pageSize: PAGE_SIZE }),
    staleTime: STALE.comments,
    gcTime: STALE.comments * 2,
    enabled: !!contentId,
  })
  const loading = page === 1 && isLoading
  const loadingMore = page > 1 && isFetching

  // Reset the accumulator whenever the target record changes.
  useEffect(() => {
    setPage(1)
    setRows([])
    setTotal(0)
    setAvgRating(null)
    scrolledRef.current = false
  }, [contentType, contentId])

  // Merge each page's fetch into the accumulator — replace on page 1 (matches the
  // old load(p, replace) local-state pattern), append otherwise. On fetch failure
  // `data` stays undefined so this is a no-op (table missing / offline → empty
  // section, same as the old catch-and-clear behavior).
  useEffect(() => {
    if (!data) return
    setTotal(data.total)
    if (page === 1) setAvgRating(data.avgRating)
    setRows((prev) => (page === 1 ? data.rows : [...prev, ...data.rows.filter((g) => !prev.some((x) => x.id === g.id))]))
  }, [data, page])

  // Scroll to + flash the deep-linked comment once it's in the list.
  useEffect(() => {
    if (!highlightedCommentId || scrolledRef.current) return
    const el = document.getElementById(`comment-${highlightedCommentId}`)
    if (el) {
      scrolledRef.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedCommentId, rows])

  const loadMore = () => setPage((p) => p + 1)

  // Re-fetch page 1's aggregate (average) for accuracy — collapses the view back
  // to just page 1, matching the previous load(1, true) behavior exactly.
  const refreshPage1 = () => {
    setPage(1)
    queryClient.invalidateQueries({ queryKey: commentsKey(1) })
  }

  const submit = async (body: string, rating: number | null) => {
    if (!user) return
    setPosting(true)
    try {
      const created = await createComment({ contentType, contentId, body, rating, authorId: user.id })
      setRows((prev) => [created, ...prev])
      setTotal((n) => n + 1)
      // A new rating shifts the average — re-fetch page 1's aggregate for accuracy.
      if (allowRating && created.rating) refreshPage1()
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
                  if (allowRating) refreshPage1()
                }}
                onUpdated={(u) => {
                  setRows((prev) => prev.map((r) => (r.id === u.id ? u : r)))
                  if (allowRating) refreshPage1()
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
