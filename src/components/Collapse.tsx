import { useEffect, useState, type ReactNode } from 'react'

/**
 * Reveal/hide children WITHOUT animating a layout property (height/grid-rows/max-height).
 * Those reflow the whole page every frame — janky/laggy on image-heavy pages. Instead the
 * layout space toggles in a single step, and the content itself animates only `opacity` +
 * `transform` (GPU-composited, no per-frame reflow) so the reveal always stays smooth.
 *
 *  open → occupy space (1 reflow), then fade + slide the content in.
 *  close → fade + slide the content out, then release the space (1 reflow).
 */
export default function Collapse({
  open,
  children,
  className = '',
  duration = 240,
}: {
  open: boolean
  children: ReactNode
  className?: string
  duration?: number
}) {
  // `spaced` = takes up layout height · `shown` = faded/slid into view.
  const [spaced, setSpaced] = useState(open)
  const [shown, setShown] = useState(open)

  useEffect(() => {
    if (open) {
      setSpaced(true)
      // Next frame so the browser has painted the collapsed start state to ease from.
      const id = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(id)
    }
    setShown(false)
    const id = window.setTimeout(() => setSpaced(false), duration)
    return () => window.clearTimeout(id)
  }, [open, duration])

  return (
    <div aria-hidden={!open} className={className} style={{ height: spaced ? 'auto' : 0, overflow: 'hidden' }}>
      <div
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : 'translateY(-6px)',
          transition: `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
