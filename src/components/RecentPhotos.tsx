import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recentPhotos } from '../data/sidebar'

export default function RecentPhotos() {
  const { t } = useTranslation()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('widgets.recentPhotos')}</h3>
        <Link to="/photo/latest" className="text-xs text-link hover:underline">
          {t('common.seeMore')}
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1">
        {recentPhotos.map((p, i) => (
          <Link key={i} to={p.href} className="block aspect-square overflow-hidden rounded-m">
            <img src={p.thumb} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
          </Link>
        ))}
      </div>
    </section>
  )
}
