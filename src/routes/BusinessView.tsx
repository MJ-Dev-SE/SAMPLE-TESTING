import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import SmartImage from '../components/SmartImage'
import { getBusiness } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { BusinessRec } from '../types'

/**
 * /company/view?id=… — one Business Directory listing in the center area:
 * business-information presentation (logo/photo, category chip, location,
 * description, last-updated) for links from the directory and the sidebar
 * "Recently updated businesses" widget.
 */
export default function BusinessView() {
  const { t, i18n } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''

  const [biz, setBiz] = useState<BusinessRec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getBusiness(id)
      .then((b) => alive && setBiz(b))
      .catch(() => alive && setBiz(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-subtlest p-l">…</p>
      </Layout>
    )
  }

  if (!biz) {
    return (
      <Layout>
        <div className="border border-neutral-90 rounded-l p-2xl text-center">
          <p className="text-sm text-muted mb-3">{t('company.notFound')}</p>
          <Link to="/company" className="text-sm text-link font-medium hover:underline">
            {t('company.back')}
          </Link>
        </div>
      </Layout>
    )
  }

  const updated = biz.updated_at
    ? new Date(biz.updated_at).toLocaleDateString(i18n.resolvedLanguage === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null
  const description = L(biz.description) || L(biz.excerpt)

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/company" className="text-link">{t('home.businessDirectory')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{biz.name}</span>
      </nav>

      {/* Business-listing presentation: header card with logo + facts */}
      <div className="border border-neutral-90 rounded-l overflow-hidden mb-l">
        <div className="p-l flex gap-l items-start">
          {biz.thumb_url && (
            <SmartImage
              src={biz.thumb_url}
              alt={biz.name}
              cover
              className="w-[120px] aspect-square rounded-m border border-neutral-90 shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-xl font-bold text-text-normal">{biz.name}</h1>
              {biz.category && (
                <Link
                  to={`/company?category=${biz.category}`}
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-chip-green text-accent-green hover:underline"
                >
                  {biz.category}
                </Link>
              )}
            </div>
            {biz.location && (
              <p className="text-sm text-muted mb-1">
                <i className="fa-solid fa-location-dot mr-1.5 text-subtlest" aria-hidden="true" />
                {biz.location}
              </p>
            )}
            {updated && (
              <p className="text-xs text-subtlest">
                {t('company.updated')}: {updated}
              </p>
            )}
          </div>
        </div>
      </div>

      {description && (
        <div className="border border-neutral-90 rounded-l p-l mb-l">
          <h2 className="text-[15px] font-bold text-text-normal mb-2">{t('business.description')}</h2>
          <p className="text-sm leading-6 text-text-normal whitespace-pre-line">{description}</p>
        </div>
      )}

      <Link to="/company" className="inline-flex items-center gap-2 text-sm text-link font-medium hover:underline">
        <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        {t('company.back')}
      </Link>
    </Layout>
  )
}
