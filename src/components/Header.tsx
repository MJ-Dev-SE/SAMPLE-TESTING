import { useEffect, useState } from 'react'
import type { AdRec } from '../types'
import { listAds } from '../lib/content'
import AdCarousel from './AdCarousel'
import Logo from './Logo'
import SearchBar from './SearchBar'
import CategoryBar from './CategoryBar'

/**
 * HEADER / TOP NAVIGATION (banner):
 *  1) banner row: [Banner Ad 1] · [logo + search centered] · [Banner Ad 2]
 *  2) maroon category bar (resort themes → photo pages / boards)
 * The thin top utility bar (TopBar) is rendered separately in Layout, above this,
 * so it can stay sticky across the FULL page scroll (this header block is short,
 * so a sticky element nested inside it would only stick for its own height).
 * The two side banner ads come from the 'top' ad slot in Supabase (hidden if none).
 */
export default function Header() {
  const [ads, setAds] = useState<AdRec[]>([])
  useEffect(() => {
    let alive = true
    listAds('top').then((a) => alive && setAds(a)).catch(() => alive && setAds([]))
    return () => {
      alive = false
    }
  }, [])

  // Split the top-slot creatives into two sides (Ad 1 / Ad 2), each crossfading
  // through its share. With 1 creative a side just shows static; 2+ animates.
  const adSize = 'h-[84px] w-[230px]'
  const side1 = ads.filter((_, i) => i % 2 === 0)
  const side2 = ads.filter((_, i) => i % 2 === 1)

  return (
    <header className="bg-page">
      {/* Banner row with centered logo + search (banners kept small so the center is prominent) */}
      <div className="mx-auto max-w-content px-xs py-m">
        <div className="flex items-center justify-between gap-l">
          {/* Banner Ad 1 (left) — crossfading */}
          {side1.length > 0 ? (
            <AdCarousel ads={side1} className={`hidden md:block shrink-0 ${adSize}`} />
          ) : (
            <span className="hidden md:block shrink-0 w-[150px]" />
          )}

          {/* Center: logo above search */}
          <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
            <Logo />
            <SearchBar />
          </div>

          {/* Banner Ad 2 (right) — crossfading */}
          {side2.length > 0 ? (
            <AdCarousel ads={side2} intervalMs={6000} className={`hidden md:block shrink-0 ${adSize}`} />
          ) : (
            <span className="hidden md:block shrink-0 w-[150px]" />
          )}
        </div>
      </div>

      <CategoryBar />
    </header>
  )
}
