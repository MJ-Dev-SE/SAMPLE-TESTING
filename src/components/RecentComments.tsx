import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listRecentComments } from '../lib/comments'
import { STALE } from '../lib/queryClient'
import RecentCommentItem from './RecentCommentItem'

/**
 * Sidebar "Recent Comments" — newest active comments/reviews across ALL content
 * types (posts, businesses, ads, news), from the recent_comments_mt view. Each
 * row links to its exact source record. "See More" opens the full view.
 */
export default function RecentComments() {
  const { t } = useTranslation()
  const { data: comments = [] } = useQuery({
    queryKey: ['recent-comments', 8],
    queryFn: () => listRecentComments(8),
    staleTime: STALE.comments,
    gcTime: STALE.comments * 4,
  })

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('widgets.recentComments')}</h3>
        <Link to="/post/comments" className="text-xs text-link hover:underline">
          {t('common.seeMore')}
        </Link>
      </div>
      <ul>
        {comments.length === 0 ? (
          <li className="px-s py-3 text-xs text-subtlest text-center">{t('post.noComments')}</li>
        ) : (
          comments.map((c) => <RecentCommentItem key={c.id} row={c} compact />)
        )}
      </ul>
    </section>
  )
}
