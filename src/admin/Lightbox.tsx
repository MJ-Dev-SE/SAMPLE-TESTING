import { useEffect } from 'react'
import { publicUrl } from '../lib/media'

/**
 * Full-size image viewer for the admin console — click any small table/slot
 * thumbnail and the ORIGINAL image pops up centered over everything (backdrop
 * click, × button, or Esc to close). Thumbnails stay small for scanning rows
 * quickly; this is the "see it bigger" affordance.
 */
export default function Lightbox({ src, alt = '', onClose }: { src: string | null; alt?: string; onClose: () => void }) {
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 grid place-items-center transition-colors"
      >
        <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
      </button>
      <img
        src={publicUrl(src)}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[88vh] w-auto h-auto rounded-2xl shadow-2xl object-contain bg-white"
      />
    </div>
  )
}
