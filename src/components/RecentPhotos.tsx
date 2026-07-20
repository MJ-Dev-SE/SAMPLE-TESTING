import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listPhotos } from '../lib/content'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'

export default function RecentPhotos() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { data: photos = [] } = useQuery({
    queryKey: ['photos', 'recent'],
    queryFn: () => listPhotos('recent'),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
  })

  if (photos.length === 0) return null

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('widgets.recentPhotos')}</h3>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1">
        {photos.map((p) => (
          <Link
            key={p.slug}
            to={`/photo/view?id=${p.slug}`}
            className="block rounded-m overflow-hidden group"
            aria-label={L(p.title)}
          >
            <SmartImage
              src={p.src}
              alt={L(p.title)}
              cover
              className="aspect-square group-hover:scale-105 transition-transform"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
