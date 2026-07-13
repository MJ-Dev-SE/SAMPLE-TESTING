import { useEffect, useState } from 'react'
import type { AdPosition, AdvertisementRec } from '../types'
import { listAdvertisements } from '../lib/content'
import AdCarousel from './AdCarousel'

/**
 * Ad-card row. Fetches the advertisements for a position from Supabase and renders
 * them as two crossfading cards, splitting the creatives between them.
 */
export default function BannerRow({ position = 'homepage', className = '' }: { position?: AdPosition; className?: string }) {
  const [ads, setAds] = useState<AdvertisementRec[]>([])

  useEffect(() => {
    let alive = true
    listAdvertisements(position)
      .then((a) => alive && setAds(a))
      .catch(() => alive && setAds([]))
    return () => {
      alive = false
    }
  }, [position])

  if (ads.length === 0) return null

  // Alternate creatives into two cards so each has something to crossfade through.
  const cardA = ads.filter((_, i) => i % 2 === 0)
  const cardB = ads.filter((_, i) => i % 2 === 1)

  return (
    <div className={`flex flex-wrap gap-s ${className}`}>
      <AdCarousel ads={cardA} className="flex-1 min-w-[160px] aspect-[5/3]" />
      {cardB.length > 0 && <AdCarousel ads={cardB} intervalMs={6000} className="flex-1 min-w-[160px] aspect-[5/3]" />}
    </div>
  )
}
