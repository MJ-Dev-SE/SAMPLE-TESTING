import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authorName, listRecentComments, timeAgo, type DbComment } from '../lib/posts'
import { avatar } from '../lib/placeholder'

/** Sidebar "Recent Comments" — newest comments across all boards, from Supabase. */
export default function RecentComments() {
  const { t } = useTranslation()
  const [comments, setComments] = useState<DbComment[]>([])

  useEffect(() => {
    let alive = true
    listRecentComments(8)
      .then((c) => alive && setComments(c))
      .catch(() => alive && setComments([]))
    return () => {
      alive = false
    }
  }, [])

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
          comments.map((c) => {
            const name = authorName(c)
            const href = c.post ? `/post/view?id=${c.post.id}&post_id=${c.post.board_id}` : '#'
            return (
              <li key={c.id} className="px-s py-2 border-t border-neutral-90 first:border-t-0">
                <Link to={href} className="flex gap-2 group">
                  <img
                    src={c.author?.avatar_url || avatar(name)}
                    alt=""
                    className="w-9 h-9 rounded-full shrink-0 object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-text-normal truncate">{name}</span>
                      <span className="text-subtlest shrink-0">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-xs text-body line-clamp-2 group-hover:text-accent-blue">
                      {c.body}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
