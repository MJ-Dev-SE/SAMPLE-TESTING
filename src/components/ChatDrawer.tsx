import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ChatPanel from './ChatPanel'

/** Slide-over panel from the right, hosting ChatPanel — opened by ChatButton. */
export default function ChatDrawer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  // Esc closes the drawer, same convenience as the business-posting modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:w-[560px] h-full bg-white shadow-lg flex flex-col">
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
