import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import ArticleBody from '../components/ArticleBody'
import { getPolicy } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { PolicyRec } from '../types'

/**
 * /policy/view?slug=… (and the fixed /help/{terms,privacy,safety} routes) —
 * formal POLICY document presentation: title, summary, a formal document card.
 */
export default function PolicyView({ slug: fixedSlug }: { slug?: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const slug = fixedSlug ?? params.get('slug') ?? ''
  const [rec, setRec] = useState<PolicyRec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getPolicy(slug).then((r) => alive && setRec(r)).catch(() => alive && setRec(null)).finally(() => alive && setLoading(false))
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

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{L(rec.title)}</span>
      </nav>

      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-chip-teal text-accent-teal">
          <i className="fa-solid fa-scale-balanced" aria-hidden="true" />
          {t('content.typePolicy')}
        </span>
      </div>
      <h1 className="text-xl font-bold text-text-normal mb-2">{L(rec.title)}</h1>
      {L(rec.summary) && <p className="text-sm text-muted mb-l">{L(rec.summary)}</p>}

      <div className="border border-neutral-90 rounded-l">
        <div className="px-l py-3 border-b border-neutral-90 bg-neutral-97 rounded-t-l flex items-center gap-2 text-xs text-muted">
          <i className="fa-solid fa-file-shield text-accent-teal" aria-hidden="true" />
          {t('content.policyNote')}
        </div>
        <div className="p-l">
          <ArticleBody text={L(rec.body)} />
        </div>
      </div>
    </Layout>
  )
}
