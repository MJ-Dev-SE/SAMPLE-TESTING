import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recentBusinesses } from '../data/home'
import { useLocalized } from '../lib/useLocalized'

/** Sidebar "Recently updated businesses" widget — compact business list. */
export default function RecentBusinessesWidget() {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('home.recentlyUpdated')}</h3>
      </div>
      <ul>
        {recentBusinesses.map((b) => (
          <li key={b.name} className="border-t border-neutral-90 first:border-t-0">
            <Link to={b.href} className="flex gap-2 px-s py-2 hover:bg-neutral-97">
              {b.thumb && (
                <img src={b.thumb} alt="" className="w-9 h-9 rounded-m shrink-0 border border-neutral-90" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-normal truncate">{b.name}</div>
                <div className="text-[11px] text-subtlest line-clamp-2">{L(b.excerpt)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
