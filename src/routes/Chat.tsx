import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import ChatPanel from '../components/ChatPanel'
import { useAuth } from '../lib/auth'

/** Full-page chat (/chat, /chat/index) — same ChatPanel the header drawer uses, for
 *  direct links and mobile. Logged-out visitors are sent to log in (6). */
export default function Chat() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-subtlest">…</p>
      </Layout>
    )
  }

  if (!user) return <Navigate to="/user/login" state={{ from: location }} replace />

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('nav.chatting')}</span>
      </nav>
      <h1 className="text-xl font-bold text-text-normal mb-l">
        <i className="fa-solid fa-comments mr-2 text-accent-blue" aria-hidden="true" />
        {t('nav.chatting')}
      </h1>
      <div className="h-[560px]">
        <ChatPanel />
      </div>
    </Layout>
  )
}
