import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recentComments } from '../data/sidebar'
import { useLocalized } from '../lib/useLocalized'

export default function RecentComments() {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('widgets.recentComments')}</h3>
        <Link to="/post/comments" className="text-xs text-link hover:underline">
          {t('common.seeMore')}
        </Link>
      </div>
      <ul>
        {recentComments.map((c, i) => (
          <li key={i} className="px-s py-2 border-t border-neutral-90 first:border-t-0">
            <Link to={c.href} className="flex gap-2 group">
              <img src={c.avatar} alt="" className="w-9 h-9 rounded-full shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-text-normal">{c.author}</span>
                  <span className="text-subtlest">{L(c.timeAgo)}</span>
                </div>
                <p className="text-xs text-body line-clamp-2 group-hover:text-accent-blue">
                  {L(c.snippet)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
