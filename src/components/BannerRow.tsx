import { useEffect, useState } from 'react'
import type { AdRec } from '../types'
import { listAds } from '../lib/content'
import AdCarousel from './AdCarousel'

/**
 * Ad-card row. Fetches the ads for a slot from Supabase and renders them as two
 * crossfading cards ("Ad Card 1" / "Ad Card 2"), splitting the creatives between them.
 */
export default function BannerRow({ slot = 'mid', className = '' }: { slot?: AdRec['slot']; className?: string }) {
  const [ads, setAds] = useState<AdRec[]>([])

  useEffect(() => {
    let alive = true
    listAds(slot)
      .then((a) => alive && setAds(a))
      .catch(() => alive && setAds([]))
    return () => {
      alive = false
    }
  }, [slot])

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
