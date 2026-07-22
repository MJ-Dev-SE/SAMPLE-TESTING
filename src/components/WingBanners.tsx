import { useQuery } from '@tanstack/react-query'
import type { AdvertisementRec } from '../types'
import { listAdvertisements } from '../lib/content'
import { publicUrl } from '../lib/media'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'
import { activeBrand } from '../config/brand'
import { haninWingsLeft, haninWingsRight } from '../data/haninWings'
import AdCarousel from './AdCarousel'

/**
 * WING (side) AD BANNERS — philgo.com style.
 * Sticky vertical ad stacks that flank the centered max-w-content shell, sitting in the
 * gutter between the content edge and the viewport edge. They only appear once the
 * viewport is wide enough to clear the content column. Creatives come from public.advertisements.
 *
 * Each side has a fixed number of visual SLOTS (activeBrand.wingCounts). A slot normally
 * shows ONE static creative, exactly as before. If the admin adds "extra" creatives for
 * that side (AdSlotsPanel's "+ Add extra" — currently enabled for hanin.tv's wing groups
 * only), the extras distribute round-robin across the slots (same mechanism Header.tsx
 * already uses for its left/right ad spots: `index % slotCount`), and any slot that ends up
 * with 2+ creatives CROSSFADES between them via AdCarousel — same rotation the header
 * banner already does. A slot with just one creative renders exactly as it always has.
 */

/** Distribute a flat, sort-ordered list into `count` buckets round-robin (ads[i] → bucket[i % count]). */
export function groupIntoSlots(ads: AdvertisementRec[], count: number): AdvertisementRec[][] {
  const buckets: AdvertisementRec[][] = Array.from({ length: count }, () => [])
  ads.forEach((ad, i) => buckets[i % count].push(ad))
  return buckets
}

function Wing({ slots, side }: { slots: AdvertisementRec[][]; side: 'left' | 'right' }) {
  const L = useLocalized()
  return (
    <div
      className={`pointer-events-auto absolute top-[190px] flex flex-col gap-s ${
        side === 'left' ? 'right-full mr-s' : 'left-full ml-s'
      }`}
    >
      {slots.map((bucket, i) => {
        if (bucket.length === 0) return null
        // Multiple creatives assigned to this slot — crossfade through them,
        // same as the header banner's rotation.
        if (bucket.length > 1) {
          return <AdCarousel key={i} ads={bucket} fit="cover" className="w-[140px] h-[180px] shadow-sm" />
        }
        // Exactly one creative — the original, unchanged plain-image treatment.
        const ad = bucket[0]
        return (
          <a key={ad.id} href={ad.url || `/ad/view?id=${ad.id}`} className="block shrink-0">
            <img
              src={publicUrl(ad.image_url)}
              alt={L(ad.title)}
              loading="lazy"
              className="block w-[140px] max-w-none h-auto rounded-m border border-neutral-90 shadow-sm"
            />
          </a>
        )
      })}
    </div>
  )
}

/**
 * Wing creatives for one side: this brand's own inventory (listAdvertisements scopes to
 * 'hanin:wing-*' on hanin.tv — see config/brand.ts brandedAdPositions), ALL active rows
 * (base slots + any admin-added extras — grouping into slots happens in WingBanners()). On
 * hanin.tv, if no wing ads have been uploaded yet, fall back to the static defaults
 * (src/data/haninWings.ts) so the rails aren't empty out of the box; any admin-uploaded
 * creative for that side replaces the default set entirely.
 */
async function loadWing(side: 'left' | 'right'): Promise<AdvertisementRec[]> {
  const rows = await listAdvertisements(side === 'left' ? 'wing-left' : 'wing-right')
  if (rows.length === 0 && activeBrand.id === 'hanin') {
    const count = side === 'left' ? activeBrand.wingCounts.left : activeBrand.wingCounts.right
    return (side === 'left' ? haninWingsLeft : haninWingsRight).slice(0, count)
  }
  return rows
}

export default function WingBanners() {
  // Per-brand slot counts (config/brand.ts wingCounts): manilatour LEFT 4 · RIGHT 3,
  // hanin.tv LEFT 4 · RIGHT 4. Managed per-slot in the admin console.
  const { data: left = [] } = useQuery({
    queryKey: ['ads', 'wing-left', activeBrand.id],
    queryFn: () => loadWing('left'),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
  })
  const { data: right = [] } = useQuery({
    queryKey: ['ads', 'wing-right', activeBrand.id],
    queryFn: () => loadWing('right'),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
  })

  if (left.length === 0 && right.length === 0) return null

  const leftSlots = groupIntoSlots(left, activeBrand.wingCounts.left)
  const rightSlots = groupIntoSlots(right, activeBrand.wingCounts.right)

  return (
    <>
      {/* A fixed, centered, content-width track. The track ignores pointer events so it never
          blocks the page; only the banners re-enable them. Appears once the viewport is wide
          enough (~1320px) to clear the centered content column without overlapping it. */}
      <div className="pointer-events-none fixed inset-0 z-10 hidden min-[1320px]:block">
        <div className="relative mx-auto h-full max-w-content">
          <Wing slots={leftSlots} side="left" />
          <Wing slots={rightSlots} side="right" />
        </div>
      </div>

      {/* Below 1320px there's no room beside the content column, so instead of dropping
          these creatives entirely, show them as a horizontally scrollable strip in normal
          flow (in front of the header, same as the desktop wings sit outside the content). */}
      <MobileWingStrip slots={[...leftSlots, ...rightSlots]} />
    </>
  )
}

/** Horizontally-scrolling fallback for the wing ads on narrower viewports — one thumbnail
 *  per slot, crossfading the same way the desktop rail does when a slot has extras. */
function MobileWingStrip({ slots }: { slots: AdvertisementRec[][] }) {
  const L = useLocalized()
  const nonEmpty = slots.filter((s) => s.length > 0)
  if (nonEmpty.length === 0) return null
  return (
    <div className="min-[1320px]:hidden border-b border-neutral-90 bg-page">
      <div className="mx-auto max-w-content px-xs py-s overflow-x-auto no-scrollbar">
        <div className="flex gap-s w-max">
          {nonEmpty.map((bucket, i) =>
            bucket.length > 1 ? (
              <AdCarousel key={i} ads={bucket} fit="cover" className="h-[64px] w-[86px] shrink-0" />
            ) : (
              <a key={bucket[0].id} href={bucket[0].url || `/ad/view?id=${bucket[0].id}`} className="block shrink-0">
                <img
                  src={publicUrl(bucket[0].image_url)}
                  alt={L(bucket[0].title)}
                  loading="lazy"
                  className="block h-[64px] w-auto max-w-none rounded-m border border-neutral-90"
                />
              </a>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
