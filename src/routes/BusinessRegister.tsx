import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import BusinessForm from '../components/BusinessForm'
import { listCategories } from '../lib/content'
import { useAuth } from '../lib/auth'
import { STALE } from '../lib/queryClient'

/** Register a business listing (/company/register) — members only. Full-page form. */
export default function BusinessRegister() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, loading } = useAuth()
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
  })

  if (loading) return <Layout><p className="text-sm text-muted">…</p></Layout>

  if (!user) {
    return (
      <Layout>
        <Seo title={t('business.registerTitle')} noindex />
        <div className="max-w-[460px] mx-auto border border-neutral-90 rounded-l p-l text-center">
          <p className="text-sm text-muted mb-3">{t('business.memberOnly')}</p>
          <Link to="/user/login" className="text-sm text-link font-medium hover:underline">{t('nav.login')}</Link>
        </div>
      </Layout>
    )
  }

  const lockedCategory = categories.find((c) => c.slug === params.get('category')) ?? null

  return (
    <Layout>
      <Seo title={t('business.registerTitle')} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/company" className="text-link">{t('home.businessDirectory')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('business.registerTitle')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-l">{t('business.registerTitle')}</h1>

      <div className="border border-neutral-90 rounded-l p-l max-w-[640px] animate-modal-in">
        <BusinessForm
          ownerId={user.id}
          categories={categories}
          lockedCategory={lockedCategory}
          onCreated={(biz) => navigate(`/company/view?id=${biz.id}`)}
          onCancel={() => navigate('/company')}
        />
      </div>
    </Layout>
  )
}
