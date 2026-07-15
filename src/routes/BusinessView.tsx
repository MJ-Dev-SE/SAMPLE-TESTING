import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import Breadcrumbs from '../components/seo/Breadcrumbs'
import SmartImage from '../components/SmartImage'
import CommentsReviewsSection from '../components/comments/CommentsReviewsSection'
import { NotFoundBody } from './NotFound'
import { businessPath, getBusiness, getBusinessBySlug, listCategories } from '../lib/content'
import { resolveSlugRedirect } from '../lib/slugRedirects'
import { metaDescription } from '../lib/seo/text'
import { localBusinessLd } from '../lib/seo/structuredData'
import { useLocalized } from '../lib/useLocalized'
import type { BusinessRec, CategoryRec } from '../types'

/**
 * Business profile. Two URL shapes resolve here:
 *   /business/<slug>     — canonical, slug-based (routes in App.tsx)
 *   /company/view?id=<uuid> — legacy; still works, canonicalises to the slug URL.
 * Layout: logo, main image, gallery, name, category, short + detailed intro,
 * region, address, phone and date posted.
 */

/** One contact fact: icon chip + label over value, so long values never fight a label column. */
function InfoTile({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-m bg-neutral-97 px-3 py-2.5">
      <span className="w-8 h-8 shrink-0 grid place-items-center rounded-m bg-white border border-neutral-90 text-accent-blue">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-[0.5px] text-subtlest">{label}</dt>
        <dd className="text-sm font-medium text-text-normal break-words">{value}</dd>
      </div>
    </div>
  )
}

export default function BusinessView() {
  const { t, i18n } = useTranslation()
  const L = useLocalized()
  const { slug } = useParams()
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''

  const [biz, setBiz] = useState<BusinessRec | null>(null)
  const [cat, setCat] = useState<CategoryRec | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [hero, setHero] = useState<string>('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    const load = slug ? getBusinessBySlug(slug) : getBusiness(id)
    Promise.all([load, listCategories()])
      .then(async ([b, cats]) => {
        if (!alive) return
        if (!b && slug) {
          const next = await resolveSlugRedirect('business', slug)
          if (!alive) return
          if (next) return setRedirectTo(`/business/${encodeURIComponent(next)}`)
        }
        setBiz(b)
        setHero(b?.main_image_url || b?.thumb_url || (b?.images?.find((i) => i.image_type === 'gallery')?.image_url ?? ''))
        setCat(b ? cats.find((c) => c.id === b.category_id || c.slug === b.category) ?? null : null)
      })
      .catch(() => alive && setBiz(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug, id])

  if (redirectTo) return <Navigate to={redirectTo} replace />

  if (loading) return <Layout><p className="text-sm text-subtlest p-l">…</p></Layout>

  if (!biz) {
    return (
      <Layout>
        <Seo title={t('notFound.title')} noindex />
        <NotFoundBody />
      </Layout>
    )
  }

  const gallery = (biz.images ?? []).filter((i) => i.image_type === 'gallery')
  const allShots = [biz.main_image_url, ...gallery.map((g) => g.image_url)].filter(Boolean) as string[]
  const detailed = L(biz.detailed_intro) || L(biz.description) || L(biz.short_intro) || L(biz.excerpt)
  const posted = biz.created_at || biz.updated_at
  const postedLabel = posted
    ? new Date(posted).toLocaleDateString(i18n.resolvedLanguage === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  // DB-driven metadata with safe fallbacks (meta_* columns are admin-editable).
  const canonicalPath = biz.canonical_url || businessPath(biz)
  const shortIntro = L(biz.short_intro) || L(biz.excerpt)
  const description = metaDescription(biz.meta_description, shortIntro, detailed, biz.name)
  const catHref = cat ? `/business-directory/${cat.slug}` : '/business-directory'
  const inactive = biz.status !== 'active'

  return (
    <Layout>
      <Seo
        title={biz.meta_title || `${biz.name}${cat ? ` — ${L(cat.name)}` : ''}`}
        description={description}
        path={canonicalPath}
        image={biz.og_image_url || biz.main_image_url || biz.thumb_url}
        noindex={biz.is_indexable === false || inactive}
        jsonLd={localBusinessLd({
          name: biz.name,
          description,
          image: biz.og_image_url || biz.main_image_url || biz.thumb_url,
          url: canonicalPath,
          telephone: biz.phone,
          streetAddress: biz.address,
          addressLocality: biz.region || biz.location,
        })}
      />
      <Breadcrumbs
        items={[
          { label: t('menuPage.breadcrumbHome'), href: '/' },
          { label: t('home.businessDirectory'), href: '/business-directory' },
          ...(cat ? [{ label: L(cat.name), href: catHref }] : []),
          { label: biz.name },
        ]}
      />

      {/* Profile header: hero image + logo + identity */}
      <div className="border border-neutral-90 rounded-l overflow-hidden mb-l">
        {hero && (
          <div className="relative aspect-[16/6] bg-neutral-95">
            <SmartImage src={hero} cover className="absolute inset-0 h-full w-full" />
          </div>
        )}
        <div className="p-l flex gap-l items-start">
          {biz.logo_url && (
            <SmartImage src={biz.logo_url} cover className="w-[84px] h-[84px] rounded-l border-2 border-white shadow shrink-0 -mt-12 bg-white" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-text-normal">{biz.name}</h1>
              {cat && (
                <Link to={catHref} className="inline-flex items-center gap-1 rounded-full bg-chip-green px-2 py-0.5 text-[11px] font-semibold text-accent-green hover:underline">
                  {cat.icon && <i className={`fa-solid ${cat.icon}`} aria-hidden="true" />}
                  {L(cat.name)}
                </Link>
              )}
            </div>
            {shortIntro && <p className="text-sm text-muted">{shortIntro}</p>}
          </div>
        </div>
      </div>

      {/* Stacked full-width cards — the center column is narrow (~510px), so a
          side-by-side split leaves no room for values to breathe. */}
      <div className="flex flex-col gap-l">
        {detailed && (
          <section className="border border-neutral-90 rounded-l p-l">
            <h2 className="text-[15px] font-bold text-text-normal mb-2">{t('business.about')}</h2>
            <p className="text-sm leading-6 text-text-normal whitespace-pre-line">{detailed}</p>
          </section>
        )}

        {/* Contact / info — label-over-value tiles in a 2-col grid */}
        <section className="border border-neutral-90 rounded-l p-l">
          <h2 className="text-[15px] font-bold text-text-normal mb-3">{t('business.info')}</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(biz.region || biz.location) && (
              <InfoTile icon="fa-location-dot" label={t('business.region')} value={biz.region || biz.location || ''} />
            )}
            {biz.address && <InfoTile icon="fa-map" label={t('business.address')} value={biz.address} />}
            {biz.phone && (
              <InfoTile
                icon="fa-phone"
                label={t('business.phone')}
                value={<a href={`tel:${biz.phone}`} className="text-link hover:underline">{biz.phone}</a>}
              />
            )}
            {postedLabel && <InfoTile icon="fa-calendar" label={t('business.posted')} value={postedLabel} />}
          </dl>
        </section>

        {allShots.length > 0 && (
          <section className="border border-neutral-90 rounded-l p-l">
            <h2 className="text-[15px] font-bold text-text-normal mb-3">{t('business.photos')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allShots.map((src, i) => (
                <SmartImage key={i} src={src} cover className="aspect-[4/3] rounded-m border border-neutral-90" />
              ))}
            </div>
          </section>
        )}

        <Link to="/business-directory" className="inline-flex items-center gap-2 text-sm text-link font-medium hover:underline">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          {t('company.back')}
        </Link>

        <CommentsReviewsSection
          contentType="business"
          contentId={biz.id}
          allowRating
          highlightedCommentId={params.get('comment')}
        />
      </div>
    </Layout>
  )
}
