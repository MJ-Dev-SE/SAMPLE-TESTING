import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import SmartImage from '../components/SmartImage'
import ArticleBody from '../components/ArticleBody'
import { getAdvertisement } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { AdvertisementRec } from '../types'

/**
 * /ad/view?id=… — promotional / SPONSORED presentation: a "Sponsored" banner
 * label, large creative image, headline, blurb, body and a call-to-action button.
 */
export default function AdvertisementView() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''
  const [rec, setRec] = useState<AdvertisementRec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getAdvertisement(id).then((r) => alive && setRec(r)).catch(() => alive && setRec(null)).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [id])

  if (loading) return <Layout><p className="text-sm text-subtlest p-l">…</p></Layout>
  if (!rec) {
    return (
      <Layout>
        <div className="border border-neutral-90 rounded-l p-2xl text-center">
          <p className="text-sm text-muted mb-3">{t('content.notFound')}</p>
          <Link to="/" className="text-sm text-link font-medium hover:underline">{t('menuPage.breadcrumbHome')}</Link>
        </div>
      </Layout>
    )
  }

  const external = !!rec.url && /^https?:/.test(rec.url)
  const cta = rec.url && (external ? (
    <a href={rec.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-10 px-5 bg-accent-pink text-white text-sm font-semibold rounded-m hover:opacity-90">
      <i className="fa-solid fa-up-right-from-square" aria-hidden="true" />{t('content.ctaAdvertisement')}
    </a>
  ) : (
    <Link to={rec.url} className="inline-flex items-center gap-2 h-10 px-5 bg-accent-pink text-white text-sm font-semibold rounded-m hover:opacity-90">
      <i className="fa-solid fa-arrow-right" aria-hidden="true" />{t('content.ctaAdvertisement')}
    </Link>
  ))

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{L(rec.title)}</span>
      </nav>

      {/* Sponsored banner */}
      <div className="rounded-l overflow-hidden border border-accent-pink/30">
        <div className="bg-chip-pink px-l py-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-accent-pink">
          <i className="fa-solid fa-bullhorn" aria-hidden="true" />
          {t('content.sponsored')}
        </div>
        {rec.image_url && <SmartImage src={rec.image_url} alt={L(rec.title)} className="w-full" />}
        <div className="p-l">
          <h1 className="text-2xl font-bold text-text-normal mb-2">{L(rec.title)}</h1>
          {L(rec.description) && <p className="text-sm text-muted mb-3">{L(rec.description)}</p>}
          {L(rec.body) && <div className="mb-4"><ArticleBody text={L(rec.body)} /></div>}
          {cta}
        </div>
      </div>
    </Layout>
  )
}
