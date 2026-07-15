import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'

/**
 * PUBLIC 404 — honest "not found" page with helpful links, always noindex.
 * NOTE (hosting limitation): on a static SPA host the rewrite serves this with
 * HTTP 200; the noindex meta keeps it (and dead URLs) out of the index. Hosts
 * that support real status codes are covered in docs/SEO_DEPLOYMENT.md.
 */

/** Inner 404 body — reused by detail pages whose record/slug doesn't exist. */
export function NotFoundBody() {
  const { t } = useTranslation()
  return (
    <div className="border border-neutral-90 rounded-l p-2xl text-center">
      <p className="text-4xl font-bold text-neutral-90 mb-2" aria-hidden="true">404</p>
      <h1 className="text-xl font-bold text-text-normal mb-2">{t('notFound.title')}</h1>
      <p className="text-sm text-muted mb-4">{t('notFound.text')}</p>
      <p className="text-sm">
        <Link to="/" className="text-link font-medium hover:underline">
          <i className="fa-solid fa-house mr-1" aria-hidden="true" />
          {t('notFound.backHome')}
        </Link>
      </p>
      <p className="text-xs text-subtlest mt-4">
        {t('notFound.browse')}{' '}
        <Link to="/business-directory" className="text-link hover:underline">{t('home.businessDirectory')}</Link>
        {' · '}
        <Link to="/post/list?post_id=freetalk" className="text-link hover:underline">{t('home.latestPosts')}</Link>
        {' · '}
        <Link to="/menu" className="text-link hover:underline">{t('menuPage.title')}</Link>
      </p>
    </div>
  )
}

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <Layout>
      <Seo title={t('notFound.title')} noindex />
      <NotFoundBody />
    </Layout>
  )
}
