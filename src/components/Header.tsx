import { useEffect, useState } from 'react'
import type { AdvertisementRec } from '../types'
import { listAdvertisements } from '../lib/content'
import AdCarousel from './AdCarousel'
import Logo from './Logo'
import SearchBar from './SearchBar'
import CategoryBar from './CategoryBar'

/**
 * HEADER / TOP NAVIGATION (banner):
 *  1) banner row: [Header Ad 1] · [logo + search centered] · [Header Ad 2]
 *  2) maroon Manila Tour category bar (Information / News / Business Directory …)
 * Rendered below Layout's sticky TopBar and scrolls away normally with the page.
 * The two side banner ads come from the `header` advertisement position (hidden if none).
 */
export default function Header() {
  const [ads, setAds] = useState<AdvertisementRec[]>([])
  useEffect(() => {
    let alive = true
    listAdvertisements('header').then((a) => alive && setAds(a)).catch(() => alive && setAds([]))
    return () => {
      alive = false
    }
  }, [])

  // Split the header creatives into two sides (Ad 1 / Ad 2), each crossfading
  // through its share. Larger, more visible treatment than the old resort header.
  const adSize = 'h-[104px] w-[300px]'
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
            <span className="hidden md:block shrink-0 w-[300px]" />
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
            <span className="hidden md:block shrink-0 w-[300px]" />
          )}
        </div>
      </div>

      <CategoryBar />
    </header>
  )
}
