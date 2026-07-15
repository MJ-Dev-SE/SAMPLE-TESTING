import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { requireLogin } from '../lib/alert'
import { unreadCount } from '../lib/chat'
import ChatDrawer from './ChatDrawer'
import Tooltip from './Tooltip'

const POLL_MS = 20_000 // lightweight badge refresh; the open thread itself updates live via Realtime

/**
 * Header chat icon + unread badge. Logged out → SweetAlert login prompt (6),
 * preserving where the user was so Login.tsx can send them back. Logged in →
 * the SAME icon toggles the ChatDrawer sidebar open and closed (click again
 * to close, not just via the drawer's own X/Esc/backdrop).
 */
export default function ChatButton({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const refreshUnread = () => {
    if (!user) return setUnread(0)
    unreadCount(user.id).then(setUnread).catch(() => {})
  }

  useEffect(() => {
    refreshUnread()
    if (!user) return
    const id = setInterval(refreshUnread, POLL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const close = () => {
    setOpen(false)
    refreshUnread()
  }

  const handleClick = async () => {
    if (open) return close()
    if (!user) {
      const go = await requireLogin(
        t('auth.loginRequiredTitle'),
        t('auth.loginRequiredText'),
        t('auth.loginRequiredConfirm'),
        t('auth.loginRequiredCancel'),
      )
      if (go) navigate('/user/login', { state: { from: location } })
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={t('nav.chatting')}
        aria-expanded={open}
        className={`group relative shrink-0 h-8 w-8 grid place-items-center rounded-m transition-colors ${
          open ? 'bg-chip-blue text-accent-blue' : 'text-[#333] hover:text-accent-blue hover:bg-neutral-97'
        } ${className}`}
      >
        <i className="fa-solid fa-comments" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent-pink text-white text-[10px] font-bold grid place-items-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        <Tooltip label={t('nav.chatting')} position="bottom" />
      </button>
      <ChatDrawer open={open} onClose={close} />
    </>
  )
}
