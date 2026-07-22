import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import Breadcrumbs from '../components/seo/Breadcrumbs'
import SmartImage from '../components/SmartImage'
import InfoTile from '../components/InfoTile'
import ContactCard from '../components/ContactCard'
import PhotoLightbox from '../components/PhotoLightbox'
import BusinessModal from '../components/BusinessModal'
import { useAuth } from '../lib/auth'
import CommentsReviewsSection from '../components/comments/CommentsReviewsSection'
import AiAssistantButton from '../components/ai/AiAssistantButton'
import AiAssistantSection from '../components/ai/AiAssistantSection'
import { useAiAssistant } from '../components/ai/useAiAssistant'
import { NotFoundBody } from './NotFound'
import { businessPath, getBusiness, getBusinessBySlug, listCategories } from '../lib/content'
import { activeBrand } from '../config/brand'
import { findHaninBusiness, toBusinessRec } from '../data/haninBusinesses'
import { resolveSlugRedirect } from '../lib/slugRedirects'
import { metaDescription } from '../lib/seo/text'
import { localBusinessLd } from '../lib/seo/structuredData'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'

/**
 * Business profile. Two URL shapes resolve here:
 *   /business/<slug>     — canonical, slug-based (routes in App.tsx)
 *   /company/view?id=<uuid> — legacy; still works, canonicalises to the slug URL.
 * Layout: logo, main image, gallery, name, category, short + detailed intro,
 * region, address, phone and date posted.
 */

export default function BusinessView() {
  const { t, i18n } = useTranslation()
  const L = useLocalized()
  const { slug } = useParams()
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  /** Index of the photo shown full-size in the lightbox; null = closed. */
  const [lightbox, setLightbox] = useState<number | null>(null)
  /** Owner-only edit modal. */
  const [editOpen, setEditOpen] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
  })

  const { data, isLoading: loading } = useQuery({
    queryKey: ['business', slug ?? null, id],
    queryFn: async () => {
      const cats = await listCategories()
      const b = await (slug ? getBusinessBySlug(slug) : getBusiness(id))
      // hanin.tv static businesses (src/data/haninBusinesses.ts) resolve here
      // too, so a showcase card / wing link opens the same profile page — but
      // only as a FALLBACK: once the slug exists as a real row
      // (supabase/hanin_businesses.sql) the admin-editable DB record wins.
      const staticHb = !b && activeBrand.id === 'hanin' ? findHaninBusiness(slug ?? id) : null
      if (staticHb) {
        const biz = toBusinessRec(staticHb, cats.find((c) => c.slug === staticHb.categorySlug)?.id ?? null)
        const cat = cats.find((c) => c.slug === staticHb.categorySlug) ?? null
        return { biz, cat, hero: biz.main_image_url ?? '', redirectTo: null as string | null }
      }
      if (!b && slug) {
        const next = await resolveSlugRedirect('business', slug)
        if (next) return { biz: null, cat: null, hero: '', redirectTo: `/business/${encodeURIComponent(next)}` }
      }
      const hero = b?.main_image_url || b?.thumb_url || (b?.images?.find((i) => i.image_type === 'gallery')?.image_url ?? '')
      const cat = b ? cats.find((c) => c.id === b.category_id || c.slug === b.category) ?? null : null
      return { biz: b, cat, hero, redirectTo: null as string | null }
    },
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
    enabled: !!(slug || id),
  })
  const biz = data?.biz ?? null
  const cat = data?.cat ?? null
  const hero = data?.hero ?? ''
  const redirectTo = data?.redirectTo ?? null
  const ai = useAiAssistant('business', biz?.id ?? '')

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
  // Edit is OWNER-ONLY: only the member who owns this listing (owner_id) may edit
  // it. Static hanin defaults have no owner and are managed in admin, not here.
  const canEdit = !!user && !!biz.owner_id && biz.owner_id === user.id

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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-text-normal">{biz.name}</h1>
                {cat && (
                  <Link to={catHref} className="inline-flex items-center gap-1 rounded-full bg-chip-green px-2 py-0.5 text-[11px] font-semibold text-accent-green hover:underline">
                    {cat.icon && <i className={`fa-solid ${cat.icon}`} aria-hidden="true" />}
                    {L(cat.name)}
                  </Link>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-link border border-link/40 rounded-m hover:bg-link hover:text-white"
                  >
                    <i className="fa-solid fa-pen" aria-hidden="true" />
                    {t('business.edit')}
                  </button>
                )}
                <AiAssistantButton open={ai.open} onClick={ai.toggle} />
              </div>
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

        {/* Info — label-over-value tiles in a 2-col grid */}
        <section className="border border-neutral-90 rounded-l p-l">
          <h2 className="text-[15px] font-bold text-text-normal mb-3">{t('business.info')}</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(biz.region || biz.location) && (
              <InfoTile icon="fa-location-dot" label={t('business.region')} value={biz.region || biz.location || ''} />
            )}
            {postedLabel && <InfoTile icon="fa-calendar" label={t('business.posted')} value={postedLabel} />}
          </dl>
        </section>

        <ContactCard phone={biz.phone} mobilePhone={biz.mobile_phone} address={biz.address} />

        {allShots.length > 0 && (
          <section className="border border-neutral-90 rounded-l p-l">
            <h2 className="text-[15px] font-bold text-text-normal mb-3">{t('business.photos')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allShots.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightbox(i)}
                  aria-label={`${biz.name} — ${t('business.photos')} ${i + 1}`}
                  className="group block overflow-hidden rounded-m border border-neutral-90 cursor-zoom-in"
                >
                  <SmartImage src={src} cover className="aspect-[4/3] transition-transform group-hover:scale-105" />
                </button>
              ))}
            </div>
          </section>
        )}

        <Link to="/business-directory" className="inline-flex items-center gap-2 text-sm text-link font-medium hover:underline">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          {t('company.back')}
        </Link>

        <AiAssistantSection ai={ai} />

        <CommentsReviewsSection
          contentType="business"
          contentId={biz.id}
          allowRating
          highlightedCommentId={params.get('comment')}
        />
      </div>

      {/* Clicking any photo above opens it full size, centered over the page. */}
      <PhotoLightbox
        images={allShots}
        index={lightbox}
        onIndexChange={setLightbox}
        onClose={() => setLightbox(null)}
        alt={biz.name}
      />

      {/* Owner-only edit — reuses the registration modal in edit mode. */}
      {editOpen && canEdit && (
        <BusinessModal
          categories={categories}
          editing={biz}
          onCreated={(updated) => {
            setEditOpen(false)
            queryClient.invalidateQueries({ queryKey: ['business'] })
            // Slug may have changed with the name → keep the URL canonical.
            if (updated.slug && updated.slug !== biz.slug) navigate(businessPath(updated))
          }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </Layout>
  )
}
