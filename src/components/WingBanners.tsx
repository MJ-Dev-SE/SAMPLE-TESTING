import { useEffect, useState } from 'react'
import type { AdRec } from '../types'
import { listAds } from '../lib/content'
import { publicUrl } from '../lib/media'

/**
 * WING (side) AD BANNERS — philgo.com style.
 * Sticky vertical ad stacks that flank the centered max-w-content shell, sitting in the
 * gutter between the content edge and the viewport edge. They only appear once the
 * viewport is wide enough to clear the content column. Creatives come from public.ads.
 */
function Wing({ ads, side }: { ads: AdRec[]; side: 'left' | 'right' }) {
  return (
    <div
      className={`pointer-events-auto absolute top-[190px] flex flex-col gap-s ${
        side === 'left' ? 'right-full mr-s' : 'left-full ml-s'
      }`}
    >
      {ads.map((ad) => (
        <a key={ad.id} href={ad.href} className="block shrink-0">
          <img
            src={publicUrl(ad.image_url)}
            alt={ad.alt}
            loading="lazy"
            className="block w-[140px] max-w-none h-auto rounded-m border border-neutral-90 shadow-sm"
          />
        </a>
      ))}
    </div>
  )
}

export default function WingBanners() {
  const [left, setLeft] = useState<AdRec[]>([])
  const [right, setRight] = useState<AdRec[]>([])

  useEffect(() => {
    let alive = true
    listAds('wing-left').then((a) => alive && setLeft(a)).catch(() => alive && setLeft([]))
    listAds('wing-right').then((a) => alive && setRight(a)).catch(() => alive && setRight([]))
    return () => {
      alive = false
    }
  }, [])

  if (left.length === 0 && right.length === 0) return null

  return (
    // A fixed, centered, content-width track. The track ignores pointer events so it never
    // blocks the page; only the banners re-enable them. Appears once the viewport is wide
    // enough (~1320px) to clear the centered content column without overlapping it.
    <div className="pointer-events-none fixed inset-0 z-10 hidden min-[1320px]:block">
      <div className="relative mx-auto h-full max-w-content">
        <Wing ads={left} side="left" />
        <Wing ads={right} side="right" />
      </div>
    </div>
  )
}
