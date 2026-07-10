import { Link } from 'react-router-dom'
import type { PhotoRec } from '../types'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'

/** Banner row of resort photos. Clicking a card opens its photo page (pic + info + comments). */
export default function PhotoBanner({ photos, className = '' }: { photos: PhotoRec[]; className?: string }) {
  const L = useLocalized()
  if (photos.length === 0) return null
  return (
    <div className={`flex flex-wrap gap-s ${className}`}>
      {photos.map((p) => (
        <Link
          key={p.slug}
          to={`/photo/view?id=${p.slug}`}
          className="group block min-w-[160px] flex-1"
          aria-label={L(p.title)}
        >
          <SmartImage
            src={p.src}
            alt={L(p.title)}
            className="w-full rounded-m border border-neutral-90 transition-transform group-hover:scale-[1.02]"
          />
        </Link>
      ))}
    </div>
  )
}
