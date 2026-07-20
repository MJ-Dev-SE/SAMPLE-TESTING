import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { breadcrumbLd, type CrumbItem } from '../../lib/seo/structuredData'
import { stripLocalePrefix } from '../../lib/seo/url'

/**
 * Shared breadcrumb trail + matching BreadcrumbList JSON-LD.
 * Markup/styling matches the hand-rolled breadcrumbs the pages used before
 * (12.48px row, › separators) so swapping it in changes nothing visually.
 * The last item is the current page (no link); items with an href are links.
 *
 * Google's structured-data validator requires an `item` URL on EVERY
 * itemListElement, including the last (current-page) one — even though it's
 * deliberately not a clickable <Link> in the UI. Fall back to the current
 * page's own URL for the JSON-LD only; the visible trail is unaffected.
 */
export default function Breadcrumbs({ items }: { items: CrumbItem[] }) {
  const location = useLocation()
  if (items.length === 0) return null
  const currentPath = stripLocalePrefix(location.pathname)
  const ldItems = items.map((item) => ({ ...item, href: item.href ?? currentPath }))
  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd(ldItems))}</script>
      </Helmet>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <ol className="inline">
          {items.map((item, i) => {
            const last = i === items.length - 1
            return (
              <li key={`${item.label}-${i}`} className="inline">
                {i > 0 && <span className="mx-1 text-subtlest" aria-hidden="true">›</span>}
                {item.href && !last ? (
                  <Link to={item.href} className={i === 0 ? 'text-link font-medium' : 'text-link'}>
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-muted" aria-current={last ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
