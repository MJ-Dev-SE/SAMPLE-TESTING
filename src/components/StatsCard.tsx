import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { stats } from '../data/home'

/** Sidebar Homepage Statistics card. */
export default function StatsCard() {
  const { t } = useTranslation()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-chart-simple mr-2 text-accent-indigo" />
          {t('home.statistics')}
        </h3>
      </div>
      <div className="p-s space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t('home.subscribers')}</span>
          <span className="font-bold text-accent-blue tabular-nums">{stats.subscribers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t('home.posts')}</span>
          <span className="font-bold text-accent-green tabular-nums">{stats.posts.toLocaleString()}</span>
        </div>
        <Link to={stats.statsHref} className="block text-xs text-link hover:underline">
          {t('home.viewGoogleStats')}
        </Link>
      </div>
    </section>
  )
}
