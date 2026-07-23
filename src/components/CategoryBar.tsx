import { Link, useLocation } from 'react-router-dom'
import { categoryGroups } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'
import { stripLocalePrefix } from '../lib/seo/url'

/**
 * Maroon category bar (#7f1d1d) — Manila Tour taxonomy. One row, 12
 * parent-only columns: Business Directory, Travel, Golf, Famous Restaurants,
 * Members' Marketplace, Information, News, Community, Rent Car, Academy,
 * Q&A, Real Estate (src/data/categoryBar.ts — order is authoritative there).
 * Horizontally scrollable — columns that overflow can be reached by
 * scrolling right; when they all fit, the row centers instead of hugging left.
 *
 * Each links to its stable landing page (/information, /famous-restaurants,
 * …); the one matching the current URL path gets a visible active state. Every
 * category's own sub-navigation (children, if it has any) lives on that
 * landing page itself, not in this bar.
 */
export default function CategoryBar() {
  const L = useLocalized()
  const { pathname } = useLocation()
  const activePath = stripLocalePrefix(pathname)

  return (
    <nav aria-label="Categories" className="border-b border-neutral-90">
      <div className="mx-auto max-w-content px-xs">
        <div className="overflow-x-auto no-scrollbar">
          {/* min-w-max keeps every column on a single horizontal strip (scrolls instead of wrapping).
              justify-center centers the columns when they're narrower than the bar (e.g. Korean
              labels, which run shorter than English ones, otherwise pack flush-left leaving a bare
              gap on the right); when columns overflow (English) this has no visual effect other
              than the scrollable area growing symmetrically, so scroll-to-see-more still works. */}
          <div className="flex min-w-max justify-center">
            {categoryGroups.map((item) => {
              const active = activePath === item.href.split('?')[0]
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-[12.5px] font-bold text-center px-3 py-2 whitespace-nowrap border-r border-white/15 transition-colors ${
                    active ? 'bg-[#5a1212] text-white' : 'bg-[#7f1d1d] text-white hover:bg-[#6a1818]'
                  }`}
                >
                  {L(item.label)}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
