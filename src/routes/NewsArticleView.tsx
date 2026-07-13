import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import SmartImage from '../components/SmartImage'
import ArticleBody from '../components/ArticleBody'
import { getNewsArticle } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { NewsItemRec } from '../types'

/**
 * /news/view?slug=… — NEWS / INFORMATION article presentation: a news kicker,
 * headline, hero image and article body. Used for both the News and Information
 * tabs (the `tab` field distinguishes them in the kicker).
 */
export default function NewsArticleView() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const slug = params.get('slug') ?? ''
  const [rec, setRec] = useState<NewsItemRec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getNewsArticle(slug).then((r) => alive && setRec(r)).catch(() => alive && setRec(null)).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [slug])

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

  const isInfo = rec.tab === 'information'
  const hero = rec.image_url || rec.thumb_url

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{isInfo ? t('content.typeInformation') : t('content.typeNews')}</span>
      </nav>

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        <div className="px-l pt-l">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${isInfo ? 'bg-chip-purple text-accent-purple' : 'bg-chip-indigo text-accent-indigo'}`}>
            <i className={`fa-solid ${isInfo ? 'fa-circle-info' : 'fa-newspaper'}`} aria-hidden="true" />
            {isInfo ? t('content.typeInformation') : t('content.typeNews')}
          </span>
          <h1 className="text-2xl font-bold text-text-normal mt-2 mb-3 leading-8">{L(rec.title)}</h1>
        </div>
        {hero && <SmartImage src={hero} alt={L(rec.title)} className="w-full" />}
        <div className="p-l">
          {L(rec.body) ? <ArticleBody text={L(rec.body)} /> : <p className="text-sm text-muted">{L(rec.title)}</p>}
        </div>
      </article>
    </Layout>
  )
}
