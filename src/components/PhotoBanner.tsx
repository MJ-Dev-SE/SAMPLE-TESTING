import { Link } from 'react-router-dom'
import type { ResortPhoto } from '../types'
import { useLocalized } from '../lib/useLocalized'

/** Banner row of resort photos. Clicking a card opens its photo page (pic + info + comments). */
export default function PhotoBanner({ photos, className = '' }: { photos: ResortPhoto[]; className?: string }) {
  const L = useLocalized()
  return (
    <div className={`flex flex-wrap gap-s ${className}`}>
      {photos.map((p) => (
        <Link
          key={p.id}
          to={`/photo/view?id=${p.id}`}
          className="group block min-w-[160px] flex-1"
          aria-label={L(p.title)}
        >
          <img
            src={p.src}
            alt={L(p.title)}
            className="w-full rounded-m border border-neutral-90 object-cover transition-transform group-hover:scale-[1.02]"
          />
        </Link>
      ))}
    </div>
  )
}
