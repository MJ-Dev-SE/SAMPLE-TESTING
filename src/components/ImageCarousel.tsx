import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SmartImage from './SmartImage'
import Tooltip from './Tooltip'

/**
 * One-at-a-time photo viewer for a post's images. A single image renders with no
 * chrome; two or more get ‹ / › arrows (wrap-around) and a "n / total" badge.
 */
export default function ImageCarousel({ images, className = '' }: { images: string[]; className?: string }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  if (images.length === 0) return null

  const step = (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length)

  const arrowCls =
    'group absolute top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full ' +
    'bg-black/45 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70'

  return (
    <div className={`relative ${className}`}>
      {/* key remounts SmartImage per photo so its load-shimmer replays on navigation */}
      <SmartImage key={index} src={images[index]} className="w-full rounded-m border border-neutral-90" />

      {images.length > 1 && (
        <>
          <button type="button" aria-label={t('post.prevPhoto')} onClick={() => step(-1)} className={`${arrowCls} left-2`}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            <Tooltip label={t('post.prevPhoto')} />
          </button>
          <button type="button" aria-label={t('post.nextPhoto')} onClick={() => step(1)} className={`${arrowCls} right-2`}>
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            <Tooltip label={t('post.nextPhoto')} />
          </button>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/55 text-white text-xs px-2 py-0.5 tabular-nums">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  )
}
