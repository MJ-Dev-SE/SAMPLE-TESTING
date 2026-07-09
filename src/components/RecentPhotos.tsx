import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recentPhotos } from '../data/photos'
import { useLocalized } from '../lib/useLocalized'

export default function RecentPhotos() {
  const { t } = useTranslation()
  const L = useLocalized()

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('widgets.recentPhotos')}</h3>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1">
        {recentPhotos.map((p) => (
          <Link
            key={p.id}
            to={`/photo/view?id=${p.id}`}
            className="block aspect-square overflow-hidden rounded-m"
            aria-label={L(p.title)}
          >
            <img
              src={p.src}
              alt={L(p.title)}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
