import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { haninBusinesses } from '../data/haninBusinesses'
import { businessPath, listCategories, listShowcaseBusinesses } from '../lib/content'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'
import { useSeededSlugs } from '../lib/useSeededSlugs'
import { STALE } from '../lib/queryClient'

/**
 * hanin.tv HOME SHOWCASE — big 2-up cards of featured businesses, each opening
 * its Business Directory profile (/business/<slug> → BusinessView) with the
 * address + Contact card. Rendered below the News/Information card on hanin.tv
 * only (Home.tsx); manilatour.com renders nothing here.
 *
 * Source of truth, in order: DB rows with showcase=true (admin-managed, from
 * supabase/hanin_businesses.sql), then the static defaults in
 * src/data/haninBusinesses.ts for anything not yet seeded — so this grid is
 * fully editable in the admin console without ever going blank.
 */

interface Card {
  key: string
  href: string
  name: string
  image: string
  tag: string
  intro: string
  address: string
}

export default function HaninShowcase() {
  const { t } = useTranslation()
  const L = useLocalized()
  const seeded = useSeededSlugs()

  const { data: dbRows = [] } = useQuery({
    queryKey: ['showcase-businesses'],
    queryFn: () => listShowcaseBusinesses(),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
  })

  const catName = (b: { category_id: string | null; category: string | null }) => {
    const c = categories.find((x) => x.id === b.category_id || x.slug === b.category)
    return c ? L(c.name) : ''
  }

  const fromDb: Card[] = dbRows.map((b) => ({
    key: b.id,
    href: businessPath(b),
    name: b.name,
    image: b.main_image_url || b.thumb_url || '',
    tag: catName(b),
    intro: L(b.short_intro) || L(b.excerpt),
    address: b.address || b.address_city || b.region || '',
  }))

  const fromStatic: Card[] = haninBusinesses
    .filter((b) => b.showcase && !seeded.has(b.slug))
    .map((b) => ({
      key: b.id,
      href: businessPath({ id: b.id, slug: b.slug }),
      name: b.name,
      image: b.image,
      tag: L(b.tag),
      intro: L(b.shortIntro),
      address: b.address || b.addressCity || '',
    }))

  const items = [...fromDb, ...fromStatic]
  if (items.length === 0) return null

  return (
    <section>
      <h2 className="text-base font-bold text-text-normal mb-s">{t('home.haninShowcase')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-l">
        {items.map((b) => (
          <Link
            key={b.key}
            to={b.href}
            className="group flex flex-col overflow-hidden rounded-l border border-neutral-90 bg-page transition-shadow hover:shadow-card"
            aria-label={b.name}
          >
            <div className="relative aspect-[16/10] bg-neutral-95 overflow-hidden">
              <SmartImage
                src={b.image}
                alt={b.name}
                cover
                className="absolute inset-0 h-full w-full transition-transform group-hover:scale-[1.03]"
              />
              {b.tag && (
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-accent-blue shadow-sm">
                  {b.tag}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-[15px] font-bold text-text-normal">{b.name}</p>
              {b.intro && <p className="mt-0.5 text-[13px] text-muted line-clamp-2">{b.intro}</p>}
              {b.address && (
                <p className="mt-1 text-[12px] text-subtlest truncate">
                  <i className="fa-solid fa-location-dot mr-1" aria-hidden="true" />
                  {b.address}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
