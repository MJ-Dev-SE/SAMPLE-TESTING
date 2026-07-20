import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import SmartImage from '../components/SmartImage'
import { listAllAdvertisements } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'
import type { AdPosition, Localized } from '../types'

/** Section grouping + label for each ad placement, in the order shown on the page. */
const SECTIONS: { position: AdPosition; label: Localized; icon: string }[] = [
  { position: 'header', label: { en: 'Header advertisements', ko: '헤더 광고' }, icon: 'fa-window-maximize' },
  { position: 'homepage', label: { en: 'Banner / rotating advertisements', ko: '배너 · 순환 광고' }, icon: 'fa-images' },
  { position: 'wing-left', label: { en: 'Left wing advertisements', ko: '왼쪽 윙 광고' }, icon: 'fa-arrow-left' },
  { position: 'wing-right', label: { en: 'Right wing advertisements', ko: '오른쪽 윙 광고' }, icon: 'fa-arrow-right' },
  { position: 'footer-info', label: { en: 'Footer advertisements', ko: '푸터 광고' }, icon: 'fa-shoe-prints' },
]

/**
 * /adv/banner — the header "Ad" nav item's target: every active advertisement
 * currently live anywhere on the site (header, homepage/rotating banner, both
 * wing rails, footer), grouped by placement. Each card opens the full ad at
 * /ad/view?id=… (AdvertisementView). Single source of truth: public.advertisements.
 */
export default function AdGalleryView() {
  const { t } = useTranslation()
  const L = useLocalized()
  // `ads === null` keeps meaning "still loading" for the spinner branch below.
  const { data: ads = null } = useQuery({
    queryKey: ['ads', 'all'],
    queryFn: () => listAllAdvertisements(),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
  })

  const groups = SECTIONS.map((s) => ({ ...s, ads: (ads ?? []).filter((a) => a.position === s.position) })).filter(
    (g) => g.ads.length > 0,
  )

  return (
    <Layout>
      <Seo title={t('ads.galleryTitle')} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('ads.galleryTitle')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-1">
        <i className="fa-solid fa-bullhorn mr-2 text-accent-pink" aria-hidden="true" />
        {t('ads.galleryTitle')}
      </h1>
      <p className="text-sm text-muted mb-l">{t('ads.gallerySubtitle')}</p>

      {ads === null ? (
        <p className="p-l text-sm text-subtlest text-center border border-neutral-90 rounded-l">
          <i className="fa-solid fa-spinner fa-spin mr-2 text-accent-pink" aria-hidden="true" />…
        </p>
      ) : groups.length === 0 ? (
        <p className="p-l text-sm text-subtlest text-center border border-neutral-90 rounded-l">{t('ads.galleryEmpty')}</p>
      ) : (
        <div className="flex flex-col gap-2xl">
          {groups.map((g) => (
            <section key={g.position}>
              <h2 className="text-sm font-semibold text-text-normal mb-2 pb-1.5 border-b border-neutral-90 flex items-center gap-1.5">
                <i className={`fa-solid ${g.icon} text-accent-pink text-xs`} aria-hidden="true" />
                {L(g.label)}
                <span className="text-xs font-normal text-subtlest">({g.ads.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {g.ads.map((ad) => (
                  <Link
                    key={ad.id}
                    to={`/ad/view?id=${ad.id}`}
                    className="group border border-neutral-90 rounded-m overflow-hidden bg-white hover:border-accent-pink transition-colors"
                  >
                    <div className="aspect-[4/3]">
                      {ad.image_url ? (
                        <SmartImage src={ad.image_url} alt={L(ad.title)} cover className="w-full h-full" />
                      ) : (
                        <div className="w-full h-full grid place-items-center bg-neutral-95">
                          <i className="fa-solid fa-image text-2xl text-neutral-90" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-medium text-text-normal truncate group-hover:text-accent-pink">
                        {L(ad.title)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Layout>
  )
}
