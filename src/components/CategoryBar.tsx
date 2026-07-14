import { Link, useSearchParams } from 'react-router-dom'
import { categoryGroups } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'

/** Pull the `?maroon=` slug out of one of this bar's own hrefs, for active-state matching. */
const maroonSlugOf = (href: string) => new URLSearchParams(href.split('?')[1] ?? '').get('maroon')

/**
 * Maroon category bar (#7f1d1d) — Manila Tour taxonomy (Information, News,
 * Business Directory, Q&A, Community, Marketplace, Travel, Jobs, Immigration,
 * Real estate). Layout: ONE continuous maroon parent row + 2 child rows below,
 * columns aligned. Horizontally scrollable — parents that overflow can be
 * reached by scrolling right.
 *
 * Parents/children whose href carries `?maroon=<slug>` are the DB-backed
 * post-category feed (see src/data/categoryBar.ts); the currently selected one
 * (from the URL) gets a visible active state.
 */
export default function CategoryBar() {
  const L = useLocalized()
  const [params] = useSearchParams()
  const activeMaroon = params.get('maroon')

  return (
    <nav aria-label="Categories" className="border-b border-neutral-90">
      <div className="mx-auto max-w-content px-xs">
        <div className="overflow-x-auto no-scrollbar">
          {/* min-w-max keeps every column on a single horizontal strip (scrolls instead of wrapping) */}
          <div className="flex min-w-max">
            {categoryGroups.map((g, i) => {
              const parentSlug = maroonSlugOf(g.parent.href)
              const parentActive = !!parentSlug && parentSlug === activeMaroon
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
                      const childSlug = maroonSlugOf(c.href)
                      const childActive = !!childSlug && childSlug === activeMaroon
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
