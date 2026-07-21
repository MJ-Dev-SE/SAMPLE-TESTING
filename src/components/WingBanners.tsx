import { useQuery } from '@tanstack/react-query'
import type { AdvertisementRec } from '../types'
import { listAdvertisements } from '../lib/content'
import { publicUrl } from '../lib/media'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'
import { activeBrand } from '../config/brand'
import { haninWingsLeft, haninWingsRight } from '../data/haninWings'

/**
 * WING (side) AD BANNERS — philgo.com style.
 * Sticky vertical ad stacks that flank the centered max-w-content shell, sitting in the
 * gutter between the content edge and the viewport edge. They only appear once the
 * viewport is wide enough to clear the content column. Creatives come from public.advertisements.
 */
function Wing({ ads, side }: { ads: AdvertisementRec[]; side: 'left' | 'right' }) {
  const L = useLocalized()
  return (
    <div
      className={`pointer-events-auto absolute top-[190px] flex flex-col gap-s ${
        side === 'left' ? 'right-full mr-s' : 'left-full ml-s'
      }`}
    >
      {ads.map((ad) => (
        <a key={ad.id} href={ad.url || `/ad/view?id=${ad.id}`} className="block shrink-0">
          <img
            src={publicUrl(ad.image_url)}
            alt={L(ad.title)}
            loading="lazy"
            className="block w-[140px] max-w-none h-auto rounded-m border border-neutral-90 shadow-sm"
          />
        </a>
      ))}
    </div>
  )
}

/**
 * Wing creatives for one side: this brand's own inventory
 * (listAdvertisements scopes to 'hanin:wing-*' on hanin.tv — see
 * config/brand.ts brandedAdPositions), capped at the brand's wing count. On
 * hanin.tv, if no wing ads have been uploaded yet, fall back to the static
 * defaults (src/data/haninWings.ts) so the rails aren't empty out of the box;
 * any admin-uploaded creative for that side replaces the default entirely.
 */
async function loadWing(side: 'left' | 'right'): Promise<AdvertisementRec[]> {
  const count = side === 'left' ? activeBrand.wingCounts.left : activeBrand.wingCounts.right
  const rows = (await listAdvertisements(side === 'left' ? 'wing-left' : 'wing-right')).slice(0, count)
  if (rows.length === 0 && activeBrand.id === 'hanin') {
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

  const combined = [...left, ...right]

  return (
    <>
      {/* A fixed, centered, content-width track. The track ignores pointer events so it never
          blocks the page; only the banners re-enable them. Appears once the viewport is wide
          enough (~1320px) to clear the centered content column without overlapping it. */}
      <div className="pointer-events-none fixed inset-0 z-10 hidden min-[1320px]:block">
        <div className="relative mx-auto h-full max-w-content">
          <Wing ads={left} side="left" />
          <Wing ads={right} side="right" />
        </div>
      </div>

      {/* Below 1320px there's no room beside the content column, so instead of dropping
          these creatives entirely, show them as a horizontally scrollable strip in normal
          flow (in front of the header, same as the desktop wings sit outside the content). */}
      <MobileWingStrip ads={combined} />
    </>
  )
}

/** Horizontally-scrolling fallback for the wing ads on narrower viewports. */
function MobileWingStrip({ ads }: { ads: AdvertisementRec[] }) {
  const L = useLocalized()
  if (ads.length === 0) return null
  return (
    <div className="min-[1320px]:hidden border-b border-neutral-90 bg-page">
      <div className="mx-auto max-w-content px-xs py-s overflow-x-auto no-scrollbar">
        <div className="flex gap-s w-max">
          {ads.map((ad) => (
            <a key={ad.id} href={ad.url || `/ad/view?id=${ad.id}`} className="block shrink-0">
              <img
                src={publicUrl(ad.image_url)}
                alt={L(ad.title)}
                loading="lazy"
                className="block h-[64px] w-auto max-w-none rounded-m border border-neutral-90"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
