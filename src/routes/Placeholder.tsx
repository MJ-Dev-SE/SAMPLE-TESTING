import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Localized } from '../types'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { useLocalized } from '../lib/useLocalized'

/**
 * Generic placeholder page for routes that exist in the nav but aren't fully built out
 * (weather, currency, login, ad registration, etc.). Keeps navigation functional —
 * every link lands on a real in-app page inside the shared shell.
 */
export default function Placeholder({ title, icon }: { title: Localized; icon: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <Layout>
      <Seo title={L(title)} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{L(title)}</span>
      </nav>
      <h1 className="text-xl font-bold text-text-normal mb-l">
        <i className={`fa-solid ${icon} mr-2 text-accent-blue`} />
        {L(title)}
      </h1>
      <div className="border border-neutral-90 rounded-l p-2xl grid place-items-center text-muted">
        <div className="text-center">
          <i className={`fa-solid ${icon} text-4xl text-neutral-90 mb-3`} />
          <p className="text-sm">{L(title)} — page scaffold ready for real data / features.</p>
        </div>
      </div>
    </Layout>
  )
}
