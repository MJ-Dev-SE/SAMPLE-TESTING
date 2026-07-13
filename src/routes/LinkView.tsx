import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import SmartImage from '../components/SmartImage'
import ArticleBody from '../components/ArticleBody'
import { getLink } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { LinkRec } from '../types'

/**
 * /link/view?slug=… — recommended-resource / PARTNER presentation: a resource
 * card with a "Recommended link" label, image, description, optional body and a
 * "Visit" button. External URLs open in a new tab; internal paths navigate in-app.
 */
export default function LinkView() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const slug = params.get('slug') ?? ''
  const [rec, setRec] = useState<LinkRec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getLink(slug).then((r) => alive && setRec(r)).catch(() => alive && setRec(null)).finally(() => alive && setLoading(false))
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

  const external = !!rec.url && /^https?:/.test(rec.url)
  const body = L(rec.body)
  const cta = rec.url && (external ? (
    <a href={rec.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]">
      <i className="fa-solid fa-up-right-from-square" aria-hidden="true" />{t('content.ctaLink')}
    </a>
  ) : (
    <Link to={rec.url} className="inline-flex items-center gap-2 h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]">
      <i className="fa-solid fa-arrow-right" aria-hidden="true" />{t('content.ctaLink')}
    </Link>
  ))

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{L(rec.title)}</span>
      </nav>

      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-chip-blue text-accent-blue">
          <i className="fa-solid fa-link" aria-hidden="true" />
          {t('content.typeLink')}
        </span>
        {rec.category && <span className="text-[11px] text-subtlest uppercase tracking-wide">{rec.category}</span>}
      </div>
      <h1 className="text-xl font-bold text-text-normal mb-2">{L(rec.title)}</h1>
      {L(rec.description) && <p className="text-sm text-muted mb-l">{L(rec.description)}</p>}

      <div className="border border-neutral-90 rounded-l p-l">
        {rec.image_url && (
          <SmartImage
            src={rec.image_url}
            alt={L(rec.title)}
            cover
            className="float-right ml-l mb-2 w-[200px] aspect-[5/3] rounded-m border border-neutral-90 hidden sm:block"
          />
        )}
        {body ? <ArticleBody text={body} /> : <p className="text-sm text-muted">{L(rec.description)}</p>}
        <div className="clear-both" />
        {cta && <div className="mt-l">{cta}</div>}
      </div>
    </Layout>
  )
}
