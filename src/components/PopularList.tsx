import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { popularPosts } from '../data/home'
import { useLocalized } from '../lib/useLocalized'

/** Popular Posts (Last 30 days): ranked list = rank + title + views + comments + date. */
export default function PopularList() {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-fire mr-2 text-accent-pink" />
          {t('home.popularPosts')}
        </h3>
      </div>
      <ol>
        {popularPosts.map((p) => (
          <li key={p.rank} className="border-t border-neutral-90 first:border-t-0">
            <Link to={p.href} className="flex items-center gap-s px-s py-2 text-sm hover:bg-neutral-97">
              <span
                className={`w-6 shrink-0 text-center font-bold tabular-nums ${
                  p.rank <= 3 ? 'text-accent-pink' : 'text-muted'
                }`}
              >
                {p.rank}
              </span>
              <span className="flex-1 min-w-0 text-body truncate">{L(p.title)}</span>
              <span className="shrink-0 text-xs text-subtlest tabular-nums hidden sm:inline">
                {p.views} / {p.comments} / {p.date}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
