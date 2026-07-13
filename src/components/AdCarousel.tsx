import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AdvertisementRec } from '../types'
import { publicUrl } from '../lib/media'
import { useLocalized } from '../lib/useLocalized'

/** Internal app routes navigate via <Link> (SPA — opens in the middle); external URLs use <a>. */
function AdLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const external = /^https?:/.test(href)
  return external ? (
    <a href={href} className={className}>{children}</a>
  ) : (
    <Link to={href} className={className}>{children}</Link>
  )
}

/**
 * A single ad "card" that crossfades through one or more creatives every few seconds.
 * Images are stacked absolutely; only the active one is opaque (CSS opacity transition).
 */
export default function AdCarousel({
  ads,
  intervalMs = 5000,
  className = '',
}: {
  ads: AdvertisementRec[]
  intervalMs?: number
  className?: string
}) {
  const L = useLocalized()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (ads.length < 2) return
    const id = setInterval(() => setI((n) => (n + 1) % ads.length), intervalMs)
    return () => clearInterval(id)
  }, [ads.length, intervalMs])

  if (ads.length === 0) return null

  return (
    // Size (aspect ratio or fixed w/h) comes from `className` so the same carousel
    // works for the big homepage cards and the small header banners.
    <div className={`relative overflow-hidden rounded-m border border-neutral-90 ${className}`}>
      {ads.map((ad, idx) => (
        <AdLink
          key={ad.id}
          href={ad.url || `/ad/view?id=${ad.id}`}
          className={`absolute inset-0 block transition-opacity duration-700 ${
            idx === i ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img src={publicUrl(ad.image_url)} alt={L(ad.title)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </AdLink>
      ))}
    </div>
  )
}
