import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'

/** Chat page (/chat) — placeholder real-time chat room shell. */
export default function Chat() {
  const { t } = useTranslation()
  return (
    <Layout>
      <h1 className="text-xl font-bold text-text-normal mb-l">
        <i className="fa-solid fa-comments mr-2 text-accent-blue" />
        {t('nav.chatting')}
      </h1>
      <div className="border border-neutral-90 rounded-l h-[400px] grid place-items-center text-muted">
        <div className="text-center">
          <i className="fa-solid fa-comments text-4xl text-neutral-90 mb-3" />
          <p className="text-sm">Real-time chat room (placeholder)</p>
        </div>
      </div>
    </Layout>
  )
}
