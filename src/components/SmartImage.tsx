import { useState } from 'react'
import { publicUrl } from '../lib/media'

/**
 * Full-resolution image with a loading effect: while the (full) image downloads, a
 * shimmering skeleton + spinner fills the box; when it finishes it fades in. No resizing/
 * transform — the picture shown is always the original file, everywhere it appears.
 * Egress is controlled elsewhere (1-year cacheControl on uploads → each browser
 * downloads a file at most once), not by degrading what renders.
 *
 * Modes:
 *  - default → natural aspect (free height; a min-height holds the skeleton until load).
 *  - cover   → fills a fixed-size/aspect parent box (pass an aspect/height via className).
 */
export default function SmartImage({
  src,
  alt = '',
  className = '',
  cover = false,
}: {
  src: string
  alt?: string
  className?: string
  cover?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const full = publicUrl(src)

  const imgBase = cover ? 'absolute inset-0 h-full w-full object-cover' : 'block h-auto w-full'

  return (
    <span className={`relative block overflow-hidden bg-neutral-95 ${cover ? '' : 'min-h-[120px]'} ${className}`}>
      {/* Loading effect: shimmer skeleton + centered spinner until the full image is ready. */}
      {!loaded && !errored && (
        <span className="absolute inset-0 grid place-items-center animate-pulse bg-gradient-to-br from-neutral-95 via-neutral-97 to-neutral-90">
          <i className="fa-solid fa-spinner fa-spin text-subtlest text-lg" aria-hidden="true" />
        </span>
      )}
      <img
        src={full}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`relative ${imgBase} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}
