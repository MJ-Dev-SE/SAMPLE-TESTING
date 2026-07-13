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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-l">
        {/* Left: detailed intro + gallery */}
        <div className="lg:col-span-2 flex flex-col gap-l">
          {detailed && (
            <section className="border border-neutral-90 rounded-l p-l">
              <h2 className="text-[15px] font-bold text-text-normal mb-2">{t('business.about')}</h2>
              <p className="text-sm leading-6 text-text-normal whitespace-pre-line">{detailed}</p>
            </section>
          )}
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
        </div>

        {/* Right: contact / info card */}
        <aside className="flex flex-col gap-l">
          <section className="border border-neutral-90 rounded-l p-l">
            <h2 className="text-[15px] font-bold text-text-normal mb-3">{t('business.info')}</h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              {(biz.region || biz.location) && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-subtlest"><i className="fa-solid fa-location-dot mr-1.5" aria-hidden="true" />{t('business.region')}</dt>
                  <dd className="text-text-normal">{biz.region || biz.location}</dd>
                </div>
              )}
              {biz.address && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-subtlest"><i className="fa-solid fa-map mr-1.5" aria-hidden="true" />{t('business.address')}</dt>
                  <dd className="text-text-normal">{biz.address}</dd>
                </div>
              )}
              {biz.phone && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-subtlest"><i className="fa-solid fa-phone mr-1.5" aria-hidden="true" />{t('business.phone')}</dt>
                  <dd className="text-text-normal">
                    <a href={`tel:${biz.phone}`} className="text-link hover:underline">{biz.phone}</a>
                  </dd>
                </div>
              )}
              {postedLabel && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-subtlest"><i className="fa-solid fa-calendar mr-1.5" aria-hidden="true" />{t('business.posted')}</dt>
                  <dd className="text-muted">{postedLabel}</dd>
                </div>
              )}
            </dl>
          </section>
          <Link to="/company" className="inline-flex items-center gap-2 text-sm text-link font-medium hover:underline">
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            {t('company.back')}
          </Link>
        </aside>
      </div>
    </Layout>
  )
}
