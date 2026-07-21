import { useCallback, useEffect } from 'react'
import { publicUrl } from '../lib/media'

/**
 * Full-size photo viewer for the public site — click a thumbnail in a gallery
 * and the original pops up CENTERED over the page, big. Thumbnails stay small
 * so a gallery scans quickly; this is the "see it properly" affordance.
 *
 * Open with an index into `images`; ← / → (and the on-screen arrows) walk the
 * gallery without closing, Esc / backdrop / × close it. Body scroll is locked
 * while open so the page behind doesn't drift.
 */
export default function PhotoLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  alt = '',
}: {
  images: string[]
  /** null = closed. */
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
  alt?: string
}) {
  const open = index !== null && index >= 0 && index < images.length
  const count = images.length

  const step = useCallback(
    (delta: number) => {
      if (index === null) return
      onIndexChange((index + delta + count) % count)
    },
    [index, count, onIndexChange],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    // Lock the page behind the overlay, restoring whatever was set before.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose, step])

  if (!open) return null

  const arrow = 'absolute top-1/2 -translate-y-1/2 h-11 w-11 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Photo'}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm grid place-items-center p-4 sm:p-8 animate-overlay-in"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/25 grid place-items-center transition-colors"
      >
        <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            className={`${arrow} left-3 sm:left-6`}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            className={`${arrow} right-3 sm:right-6`}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </>
      )}

      <img
        key={index}
        src={publicUrl(images[index as number])}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[84vh] w-auto h-auto rounded-l shadow-2xl object-contain bg-white animate-modal-in"
      />

      {count > 1 && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
          {(index as number) + 1} / {count}
        </span>
      )}
    </div>
  )
}
