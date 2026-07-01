import { Link } from 'react-router-dom'
import { categoryGroups } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'

/**
 * Maroon category bar (#7f1d1d) matching the live philgo.com.
 * Layout: ONE continuous maroon parent row + 2 child rows below, columns aligned.
 * Horizontally scrollable — parents that overflow can be reached by scrolling right.
 */
export default function CategoryBar() {
  const L = useLocalized()
  return (
    <nav aria-label="Categories" className="border-b border-neutral-90">
      <div className="mx-auto max-w-content px-xs">
        <div className="overflow-x-auto no-scrollbar">
          {/* min-w-max keeps every column on a single horizontal strip (scrolls instead of wrapping) */}
          <div className="flex min-w-max">
            {categoryGroups.map((g, i) => (
              <div key={i} className="flex flex-col shrink-0">
                {/* Parent (maroon row) */}
                <Link
                  to={g.parent.href}
                  className="bg-[#7f1d1d] text-white text-[12.5px] font-bold text-center px-3 py-2 whitespace-nowrap border-r border-white/15 hover:bg-[#6a1818]"
                >
                  {L(g.parent.label)}
                </Link>
                {/* Children (2 rows) — aligned to the parent column width */}
                <div className="bg-[#fcecec] flex-1 flex flex-col items-center px-3 py-1.5 gap-0.5 border-r border-neutral-90">
                  {g.children.map((c) => (
                    <Link
                      key={c.label.en}
                      to={c.href}
                      className="text-[12px] text-[#7f1d1d] whitespace-nowrap hover:underline"
                    >
                      {L(c.label)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
