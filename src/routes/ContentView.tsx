import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import SmartImage from '../components/SmartImage'
import { getSiteContent } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { SiteContentRec, SiteContentType } from '../types'

/**
 * /content/view?slug=… — center-area page for a site_content record (footer
 * Advertisement / Link / Policy items). One component, three presentations:
 * the badge, image treatment and CTA adapt to the record's content_type.
 * Fixed-slug routes (e.g. /help/terms) pass `slug` as a prop instead.
 */

/** Per-type presentation: badge chip classes + label key + icon + CTA label key. */
const TYPE_STYLE: Record<SiteContentType, { chip: string; label: string; icon: string; cta: string }> = {
  advertisement: { chip: 'bg-chip-pink text-accent-pink', label: 'content.typeAdvertisement', icon: 'fa-rectangle-ad', cta: 'content.ctaAdvertisement' },
  link: { chip: 'bg-chip-blue text-accent-blue', label: 'content.typeLink', icon: 'fa-up-right-from-square', cta: 'content.ctaLink' },
  policy: { chip: 'bg-chip-teal text-accent-teal', label: 'content.typePolicy', icon: 'fa-scale-balanced', cta: 'content.ctaLink' },
}

/** Render the localized body: "## " lines → headings, "- " runs → bullet lists, blank-line-separated paragraphs. */
function Body({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  let para: string[] = []
  const flushBullets = () => {
    if (bullets.length === 0) return
    blocks.push(
      <ul key={blocks.length} className="list-disc pl-5 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="text-sm leading-6 text-text-normal">{b}</li>
        ))}
      </ul>,
    )
    bullets = []
  }
  const flushPara = () => {
    if (para.length === 0) return
    blocks.push(
      <p key={blocks.length} className="text-sm leading-6 text-text-normal">{para.join(' ')}</p>,
    )
    para = []
  }
  for (const line of text.split('\n')) {
    const s = line.trim()
    if (s.startsWith('## ')) {
      flushBullets(); flushPara()
      blocks.push(
        <h2 key={blocks.length} className="text-[15px] font-bold text-text-normal pt-2 border-t border-neutral-95 first:border-t-0 first:pt-0">
          {s.slice(3)}
        </h2>,
      )
    } else if (s.startsWith('- ')) {
      flushPara()
      bullets.push(s.slice(2))
    } else if (s === '') {
      flushBullets(); flushPara()
    } else {
      flushBullets()
      para.push(s)
    }
  }
  flushBullets(); flushPara()
  return <div className="flex flex-col gap-3">{blocks}</div>
}

export default function ContentView({ slug: fixedSlug }: { slug?: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const slug = fixedSlug ?? params.get('slug') ?? ''

  const [rec, setRec] = useState<SiteContentRec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getSiteContent(slug)
      .then((r) => alive && setRec(r))
      .catch(() => alive && setRec(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-subtlest p-l">…</p>
      </Layout>
    )
  }

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

  const style = TYPE_STYLE[rec.content_type] ?? TYPE_STYLE.link
  const isExternal = !!rec.url && /^https?:/.test(rec.url)
  const isAd = rec.content_type === 'advertisement'
  const isPolicy = rec.content_type === 'policy'

  const cta =
    rec.url &&
    (isExternal ? (
      <a
        href={rec.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
      >
        <i className="fa-solid fa-up-right-from-square" aria-hidden="true" />
        {t(style.cta)}
      </a>
    ) : (
      <Link
        to={rec.url}
        className="inline-flex items-center gap-2 h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
      >
        <i className={`fa-solid ${isAd ? 'fa-comment-dots' : 'fa-arrow-right'}`} aria-hidden="true" />
        {t(style.cta)}
      </Link>
    ))

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{L(rec.title)}</span>
      </nav>

      {/* Advertisement → big promotional banner image on top */}
      {isAd && rec.image_url && (
        <SmartImage src={rec.image_url} alt={L(rec.title)} className="rounded-l border border-neutral-90 mb-l" />
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.chip}`}>
          <i className={`fa-solid ${style.icon}`} aria-hidden="true" />
          {t(style.label)}
        </span>
      </div>

      <h1 className="text-xl font-bold text-text-normal mb-2">{L(rec.title)}</h1>
      <p className="text-sm text-muted mb-l">{L(rec.summary)}</p>

      {isPolicy ? (
        /* Policy → formal document card */
        <div className="border border-neutral-90 rounded-l">
          <div className="px-l py-3 border-b border-neutral-90 bg-neutral-97 rounded-t-l flex items-center gap-2 text-xs text-muted">
            <i className={`fa-solid ${style.icon} text-accent-teal`} aria-hidden="true" />
            {t('content.policyNote')}
          </div>
          <div className="p-l">
            <Body text={L(rec.body)} />
          </div>
        </div>
      ) : (
        /* Advertisement / Link → content card, links get a side image */
        <div className="border border-neutral-90 rounded-l p-l">
          {!isAd && rec.image_url && (
            <SmartImage
              src={rec.image_url}
              alt={L(rec.title)}
              cover
              className="float-right ml-l mb-2 w-[180px] aspect-[4/3] rounded-m border border-neutral-90 hidden sm:block"
            />
          )}
          <Body text={L(rec.body)} />
          <div className="clear-both" />
        </div>
      )}

      {cta && <div className="mt-l">{cta}</div>}
    </Layout>
  )
}
