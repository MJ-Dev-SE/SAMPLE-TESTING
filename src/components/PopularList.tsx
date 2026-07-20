import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate, listPopularPosts, postPath } from '../lib/posts'
import { STALE } from '../lib/queryClient'

/** Popular Posts (Last 30 days): ranked by views, from the `popular_posts` Supabase view. */
export default function PopularList() {
  const { t } = useTranslation()
  const { data: posts = [] } = useQuery({
    queryKey: ['popular-posts'],
    queryFn: () => listPopularPosts(),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
  })

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-fire mr-2 text-accent-pink" />
          {t('home.popularPosts')}
        </h3>
      </div>
      {posts.length === 0 ? (
        <p className="px-s py-3 text-xs text-subtlest text-center">{t('post.noComments')}</p>
      ) : (
        <ol>
          {posts.map((p, i) => {
            const rank = i + 1
            return (
              <li key={p.id} className="border-t border-neutral-90 first:border-t-0">
                <Link
                  to={postPath(p)}
                  className="flex items-center gap-s px-s py-2 text-sm hover:bg-neutral-97"
                >
                  <span
                    className={`w-6 shrink-0 text-center font-bold tabular-nums ${
                      rank <= 3 ? 'text-accent-pink' : 'text-muted'
                    }`}
                  >
                    {rank}
                  </span>
                  <span className="flex-1 min-w-0 text-body truncate">{p.title}</span>
                  <span className="shrink-0 text-xs text-subtlest tabular-nums hidden sm:inline">
                    {p.views} / {p.comment_total ?? 0} / {formatDate(p.created_at)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
