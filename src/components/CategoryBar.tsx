import { Link, useLocation } from 'react-router-dom'
import { categoryGroups } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'
import { stripLocalePrefix } from '../lib/seo/url'

/**
 * Maroon category bar (#7f1d1d) — Manila Tour taxonomy (Information, News,
 * Business Directory, Q&A, Community, Marketplace, Travel, Jobs, Immigration,
 * Real estate). Layout: ONE continuous maroon parent row + 2 child rows below,
 * columns aligned. Horizontally scrollable — parents that overflow can be
 * reached by scrolling right.
 *
 * Parents/children now link to the stable category landing pages
 * (/information, /information/weather — see src/data/categoryBar.ts); the one
 * matching the current URL path gets a visible active state.
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
            {categoryGroups.map((g, i) => {
              const parentActive = activePath === g.parent.href.split('?')[0]
              return (
                <div key={i} className="flex flex-col shrink-0">
                  {/* Parent (maroon row) */}
                  <Link
                    to={g.parent.href}
                    aria-current={parentActive ? 'page' : undefined}
                    className={`text-[12.5px] font-bold text-center px-3 py-2 whitespace-nowrap border-r border-white/15 transition-colors ${
                      parentActive ? 'bg-[#5a1212] text-white' : 'bg-[#7f1d1d] text-white hover:bg-[#6a1818]'
                    }`}
                  >
                    {L(g.parent.label)}
                  </Link>
                  {/* Children (2 rows) — aligned to the parent column width */}
                  <div className="bg-[#fcecec] flex-1 flex flex-col items-center px-3 py-1.5 gap-0.5 border-r border-neutral-90">
                    {g.children.map((c) => {
                      const childActive = activePath === c.href.split('?')[0]
                      return (
                        <Link
                          key={c.label.en}
                          to={c.href}
                          aria-current={childActive ? 'page' : undefined}
                          className={`text-[12px] whitespace-nowrap hover:underline ${
                            childActive ? 'font-bold text-[#5a1212] underline' : 'text-[#7f1d1d]'
                          }`}
                        >
                          {L(c.label)}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
