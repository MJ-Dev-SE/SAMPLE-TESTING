import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SHOW_DELAY_MS = 300

/**
 * Floating label for icon-only buttons. Drop it as the last child of any
 * trigger (button/link) — it reads that element's own hover/focus state and
 * portals the bubble to <body> with fixed positioning computed from its
 * bounding rect, so it always escapes clipping/scroll ancestors (horizontal
 * nav rows, sidebar lists, the slide-over chat drawer's transformed panel,
 * etc.) instead of being cut off by their overflow.
 */
export default function Tooltip({
  label,
  position = 'top',
}: {
  label: string
  position?: 'top' | 'bottom'
}) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const timeoutRef = useRef<number>()

  useEffect(() => {
    const trigger = anchorRef.current?.parentElement
    if (!trigger) return

    const place = () => {
      const r = trigger.getBoundingClientRect()
      setCoords({ top: position === 'top' ? r.top - 6 : r.bottom + 6, left: r.left + r.width / 2 })
    }
    const show = () => {
      timeoutRef.current = window.setTimeout(place, SHOW_DELAY_MS)
    }
    const showNow = () => {
      window.clearTimeout(timeoutRef.current)
      place()
    }
    const hide = () => {
      window.clearTimeout(timeoutRef.current)
      setCoords(null)
    }

    trigger.addEventListener('mouseenter', show)
    trigger.addEventListener('mouseleave', hide)
    trigger.addEventListener('focus', showNow)
    trigger.addEventListener('blur', hide)
    return () => {
      window.clearTimeout(timeoutRef.current)
      trigger.removeEventListener('mouseenter', show)
      trigger.removeEventListener('mouseleave', hide)
      trigger.removeEventListener('focus', showNow)
      trigger.removeEventListener('blur', hide)
    }
  }, [position])

  return (
    <span ref={anchorRef} aria-hidden="true">
      {coords &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[100] whitespace-nowrap rounded-m bg-text-normal px-2 py-1 text-[11px] font-medium text-white shadow-card"
            style={{
              top: coords.top,
              left: coords.left,
              transform: position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}
