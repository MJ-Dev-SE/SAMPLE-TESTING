import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import SmartImage from '../components/SmartImage'
import { getBusiness, listCategories } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { BusinessRec, CategoryRec } from '../types'

/**
 * /company/view?id=… — business PROFILE layout (item 10): logo, main image,
 * gallery, name, category, short + detailed intro, region, address, phone and
 * date posted. Deliberately distinct from the advertisement / link / policy pages.
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
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''

  const [biz, setBiz] = useState<BusinessRec | null>(null)
  const [cat, setCat] = useState<CategoryRec | null>(null)
  const [loading, setLoading] = useState(true)
  const [hero, setHero] = useState<string>('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([getBusiness(id), listCategories()])
      .then(([b, cats]) => {
        if (!alive) return
        setBiz(b)
        setHero(b?.main_image_url || b?.thumb_url || (b?.images?.find((i) => i.image_type === 'gallery')?.image_url ?? ''))
        setCat(b ? cats.find((c) => c.id === b.category_id || c.slug === b.category) ?? null : null)
      })
      .catch(() => alive && setBiz(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  if (loading) return <Layout><p className="text-sm text-subtlest p-l">…</p></Layout>

  if (!biz) {
    return (
      <Layout>
        <div className="border border-neutral-90 rounded-l p-2xl text-center">
          <p className="text-sm text-muted mb-3">{t('company.notFound')}</p>
          <Link to="/company" className="text-sm text-link font-medium hover:underline">{t('company.back')}</Link>
        </div>
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

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/company" className="text-link">{t('home.businessDirectory')}</Link>
        {cat && (
          <>
            <span className="mx-1 text-subtlest">›</span>
            <Link to={`/company?category=${cat.slug}`} className="text-link">{L(cat.name)}</Link>
          </>
        )}
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{biz.name}</span>
      </nav>

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
                <Link to={`/company?category=${cat.slug}`} className="inline-flex items-center gap-1 rounded-full bg-chip-green px-2 py-0.5 text-[11px] font-semibold text-accent-green hover:underline">
                  {cat.icon && <i className={`fa-solid ${cat.icon}`} aria-hidden="true" />}
                  {L(cat.name)}
                </Link>
              )}
            </div>
            {(L(biz.short_intro) || L(biz.excerpt)) && (
              <p className="text-sm text-muted">{L(biz.short_intro) || L(biz.excerpt)}</p>
            )}
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

        <Link to="/company" className="inline-flex items-center gap-2 text-sm text-link font-medium hover:underline">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          {t('company.back')}
        </Link>
      </div>
    </Layout>
  )
}
