import { Link } from 'react-router-dom'
import type { BusinessRec, CategoryRec } from '../types'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'

/**
 * Business Directory card — image-first: main photo on top, then name, one-line
 * intro, a category chip and the region with a location icon. Clicking opens the
 * business profile at /company/view?id=…
 */
export default function BusinessCard({
  business,
  category,
}: {
  business: BusinessRec
  /** Resolved child category (for the chip label + icon); optional. */
  category?: CategoryRec
}) {
  const L = useLocalized()
  const intro = L(business.short_intro) || L(business.excerpt)
  const image = business.main_image_url || business.thumb_url
  const catLabel = category ? L(category.name) : business.category

  return (
    <Link
      to={`/company/view?id=${business.id}`}
      className="group flex flex-col overflow-hidden border border-neutral-90 rounded-l bg-white hover:shadow-card hover:-translate-y-0.5 transition-all"
    >
      {/* Image-first header */}
      <div className="relative aspect-[4/3] bg-neutral-95 overflow-hidden">
        {image ? (
          <SmartImage src={image} cover className="absolute inset-0 h-full w-full" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-neutral-90">
            <i className="fa-solid fa-store text-4xl" aria-hidden="true" />
          </span>
        )}
        {business.logo_url && (
          <span className="absolute bottom-2 left-2 h-10 w-10 rounded-lg border-2 border-white bg-white shadow overflow-hidden">
            <SmartImage src={business.logo_url} cover className="h-full w-full" />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1 p-s">
        <div className="flex items-center gap-2">
          {catLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chip-blue px-2 py-0.5 text-[11px] font-semibold text-accent-blue">
              {category?.icon && <i className={`fa-solid ${category.icon}`} aria-hidden="true" />}
              {catLabel}
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-text-normal truncate group-hover:text-accent-blue">{business.name}</h4>
        <p className="text-xs text-subtlest line-clamp-2 min-h-[2rem]">{intro}</p>
        {(business.region || business.location) && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted">
            <i className="fa-solid fa-location-dot text-subtlest" aria-hidden="true" />
            {business.region || business.location}
          </span>
        )}
      </div>
    </Link>
  )
}
