import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Manila Tour brand mark. Renders a text/icon wordmark by default; if a real
 * horizontal logo exists at `public/brand-logo.png` it is used instead (and the
 * wordmark is the automatic fallback when that image is missing / fails to load).
 * Used in BOTH the header and footer. Height is controlled via `className`.
 */
export default function Logo({ className = 'h-[56px]' }: { className?: string }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="Manila Tour — Home">
      {imgOk ? (
        <img
          src="/brand-logo.png"
          alt="Manila Tour"
          onError={() => setImgOk(false)}
          className="h-full w-auto max-w-full object-contain"
        />
      ) : (
        <span className="inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-maroon text-white shrink-0">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-xl font-extrabold tracking-tight text-maroon">Manila Tour</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              Korean · Philippines Guide
            </span>
          </span>
        </span>
      )}
    </Link>
  )
}
