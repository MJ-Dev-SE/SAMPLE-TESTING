import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ChatPanel from './ChatPanel'

const DURATION = 240 // matches Collapse.tsx, so every slide/reveal in the app feels the same

/**
 * Slide-over sidebar from the right, hosting ChatPanel — opened/closed by
 * ChatButton (same icon toggles both ways). Stays mounted a beat after `open`
 * flips false so it can slide back OUT instead of teleporting away: only
 * `transform` + backdrop opacity animate (GPU-composited, no layout thrash),
 * the same two-phase mounted/visible technique as Collapse.tsx.
 */
export default function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      // Next frame so the browser paints the off-screen start state to ease from.
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const id = window.setTimeout(() => setMounted(false), DURATION)
    return () => window.clearTimeout(id)
  }, [open])

  // Esc closes the drawer, same convenience as the business-posting modal.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      style={{ backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)', transition: `background-color ${DURATION}ms ease` }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:w-[560px] h-full bg-white shadow-lg flex flex-col"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: 'transform',
        }}
      >
        <div className="flex items-center justify-between gap-3 px-l py-3 border-b border-neutral-90 shrink-0">
          <h2 className="text-base font-bold text-text-normal">
            <i className="fa-solid fa-comments mr-2 text-accent-blue" aria-hidden="true" />
            {t('nav.chatting')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('post.cancel')}
            className="h-8 w-8 grid place-items-center rounded-m text-muted hover:bg-neutral-97"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 min-h-0 p-3">
          <ChatPanel onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
