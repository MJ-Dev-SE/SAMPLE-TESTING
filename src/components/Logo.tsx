import { useState } from 'react'
import { Link } from 'react-router-dom'
import { activeBrand } from '../config/brand'

/**
 * Brand mark for whichever hostname is serving the page (src/config/brand.ts —
 * manilatour.com keeps its current logo, hanin.tv gets its own). Renders the
 * brand's horizontal logo image from /public; the text/icon wordmark is the
 * automatic fallback when that image is missing / fails to load.
 * Used in BOTH the header and footer. Height is controlled via `className`.
 */
export default function Logo({ className = 'h-[56px]' }: { className?: string }) {
  const [imgOk, setImgOk] = useState(true)
  const { logo } = activeBrand
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label={logo.homeAriaLabel}>
      {imgOk ? (
        <img
          src={logo.src}
          alt={logo.alt}
          onError={() => setImgOk(false)}
          className="h-full w-auto max-w-full object-contain"
        />
      ) : (
        <span className="inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-maroon text-white shrink-0">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-xl font-extrabold tracking-tight text-maroon">{logo.wordmarkTitle}</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              {logo.wordmarkSubtitle}
            </span>
          </span>
        </span>
      )}
    </Link>
  )
}
