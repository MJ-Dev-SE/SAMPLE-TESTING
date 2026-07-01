import type { Banner } from '../types'
import { bannersLeft, bannersRight } from '../data/home'

/**
 * WING (side) AD BANNERS — philgo.com style.
 * Sticky vertical ad stacks that flank the centered max-w-content shell, sitting in the
 * gutter between the content edge and the viewport edge. They stay fixed while the page
 * scrolls and only appear once the viewport is wide enough to clear the content column.
 *
 * DATA SLOT: bannersLeft / bannersRight in src/data/home.ts (markup is fixed; edit data only).
 */
function Wing({ banners, side }: { banners: Banner[]; side: 'left' | 'right' }) {
  return (
    <div
      className={`pointer-events-auto absolute top-[190px] flex flex-col gap-s ${
        side === 'left' ? 'right-full mr-s' : 'left-full ml-s'
      }`}
    >
      {banners.map((b, i) => (
        <a key={i} href={b.href} className="block shrink-0">
          <img
            src={b.imageUrl}
            alt={b.alt}
            loading="lazy"
            className="block w-[140px] max-w-none h-auto rounded-m border border-neutral-90 shadow-sm"
          />
        </a>
      ))}
    </div>
  )
}

export default function WingBanners() {
  return (
    // A fixed, centered, content-width track. The track itself ignores pointer events so it
    // never blocks the page; only the banners inside re-enable them. Appears once the viewport
    // is wide enough (~1320px) to clear the centered content column without overlapping it.
    <div className="pointer-events-none fixed inset-0 z-10 hidden min-[1320px]:block">
      <div className="relative mx-auto h-full max-w-content">
        <Wing banners={bannersLeft} side="left" />
        <Wing banners={bannersRight} side="right" />
      </div>
    </div>
  )
}
