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
 *
 * Only the active slide plus the *next* one are ever mounted (added to `loaded`) — every
 * other creative in the rotation stays unmounted (no <img>, no request) until its turn is
 * about to come up. This bounds each carousel to at most 2 concurrent downloads no matter
 * how many creatives a slot has ("unlimited extra creatives" per AdSlotsPanel), instead of
 * fetching every single one on every page load. Preloading one slide ahead (a full interval
 * early) keeps the crossfade looking identical — the next image has already downloaded by
 * the time it needs to fade in.
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
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set(ads.length > 1 ? [0, 1] : [0]))

  useEffect(() => {
    if (ads.length < 2) return
    const id = setInterval(() => {
      setI((n) => {
        const next = (n + 1) % ads.length
        const preload = (next + 1) % ads.length
        setLoaded((prev) => (prev.has(preload) ? prev : new Set(prev).add(preload)))
        return next
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [ads.length, intervalMs])

  if (ads.length === 0) return null

  return (
    // Size (aspect ratio or fixed w/h) comes from `className` so the same carousel
    // works for the big homepage cards and the small header banners.
    <div className={`relative overflow-hidden rounded-m border border-neutral-90 ${className}`}>
      {ads.map(
        (ad, idx) =>
          loaded.has(idx) && (
            <AdLink
              key={ad.id}
              href={ad.url || `/ad/view?id=${ad.id}`}
              className={`absolute inset-0 block transition-opacity duration-700 ${
                idx === i ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={publicUrl(ad.image_url)}
                alt={L(ad.title)}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </AdLink>
          ),
      )}
    </div>
  )
}
