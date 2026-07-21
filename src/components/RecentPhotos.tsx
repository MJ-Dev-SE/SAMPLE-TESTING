import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { businessPath, listPhotos, listRecentBusinesses } from '../lib/content'
import { activeBrand } from '../config/brand'
import { haninBusinesses } from '../data/haninBusinesses'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'
import { useSeededSlugs } from '../lib/useSeededSlugs'
import { STALE } from '../lib/queryClient'

const TILES = 6

/** One tile: an image plus where clicking it goes. */
interface Tile {
  key: string
  src: string
  label: string
  href: string
}

/**
 * Sidebar "Recent Photos" grid.
 *
 * manilatour.com — the curated resort photos (public.photos, section='recent'),
 * each opening its /photo/view page. Unchanged.
 *
 * hanin.tv — the most recently updated BUSINESSES instead, showing each one's
 * MAIN photo only (never its gallery shots, so one business never fills the
 * grid), each opening that business's directory profile. DB listings come
 * first; the static defaults (src/data/haninBusinesses.ts) fill any remaining
 * tiles until they're seeded.
 */
export default function RecentPhotos() {
  const { t } = useTranslation()
  const L = useLocalized()
  const isBusinessMode = activeBrand.id === 'hanin'
  const seeded = useSeededSlugs()

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', 'recent'],
    queryFn: () => listPhotos('recent'),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
    enabled: !isBusinessMode,
  })

  const { data: businesses = [] } = useQuery({
    queryKey: ['recent-businesses', TILES],
    queryFn: () => listRecentBusinesses(TILES),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
    enabled: isBusinessMode,
  })

  let tiles: Tile[]
  if (isBusinessMode) {
    const fromDb: Tile[] = businesses
      // Parent image only — business_images gallery rows are deliberately ignored.
      .filter((b) => b.main_image_url || b.thumb_url)
      .map((b) => ({
        key: b.id,
        src: (b.main_image_url || b.thumb_url) as string,
        label: b.name,
        href: businessPath(b),
      }))
    const fromStatic: Tile[] = haninBusinesses
      .filter((b) => !seeded.has(b.slug))
      .map((b) => ({ key: b.id, src: b.image, label: b.name, href: businessPath({ id: b.id, slug: b.slug }) }))
    tiles = [...fromDb, ...fromStatic].slice(0, TILES)
  } else {
    tiles = photos.map((p) => ({ key: p.slug, src: p.src, label: L(p.title), href: `/photo/view?id=${p.slug}` }))
  }

  if (tiles.length === 0) return null

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          {isBusinessMode ? t('widgets.recentBusinessPhotos') : t('widgets.recentPhotos')}
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1">
        {tiles.map((tile) => (
          <Link key={tile.key} to={tile.href} className="block rounded-m overflow-hidden group" aria-label={tile.label}>
            <SmartImage
              src={tile.src}
              alt={tile.label}
              cover
              className="aspect-square group-hover:scale-105 transition-transform"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
