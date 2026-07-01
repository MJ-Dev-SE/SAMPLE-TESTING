import { useState } from 'react'
import { Link } from 'react-router-dom'
import { newsTabs } from '../data/home'
import { useLocalized } from '../lib/useLocalized'

/**
 * News tab block: tab bar (active tab underlined blue, leading icon) +
 * 2-column layout (LEFT 3x3 featured grid with lead-story overlay, RIGHT numbered headline list).
 */
export default function NewsTabs() {
  const L = useLocalized()
  const [active, setActive] = useState(0)
  const tab = newsTabs[active]
  const [lead, ...rest] = tab.featured

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      {/* Tab bar */}
      <div className="flex flex-wrap border-b border-neutral-90 bg-page">
        {newsTabs.map((tb, i) => (
          <button
            key={tb.tabLabel.en}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-m py-2.5 text-sm -mb-px border-b-2 transition-colors ${
              i === active
                ? 'border-accent-blue text-accent-blue font-semibold'
                : 'border-transparent text-muted hover:text-text-normal'
            }`}
          >
            <i className={`fa-solid ${tb.icon} text-xs`} />
            {L(tb.tabLabel)}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-l p-m">
        {/* LEFT: featured grid with lead overlay */}
        <div>
          <Link to={lead.href} className="relative block rounded-m overflow-hidden mb-2 group">
            <img src={lead.thumb} alt="" className="w-full aspect-[16/10] object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <span className="text-white text-sm font-semibold line-clamp-2">{L(lead.title)}</span>
            </div>
          </Link>
          <div className="grid grid-cols-4 gap-1">
            {rest.slice(0, 8).map((f, i) => (
              <Link key={i} to={f.href} className="block aspect-square overflow-hidden rounded-m">
                <img src={f.thumb} alt={L(f.title)} className="w-full h-full object-cover hover:opacity-90" />
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT: numbered headline list */}
        <ol className="flex flex-col">
          {tab.headlines.map((h, i) => (
            <li key={i}>
              <Link to={h.href} className="flex items-center py-1.5 text-sm group">
                <span className="w-5 shrink-0 text-muted tabular-nums">{i + 1}</span>
                <span className="text-body group-hover:text-accent-blue truncate">{L(h.title)}</span>
                <span className="leader" />
                <span className="pill bg-chip-blue text-accent-blue shrink-0">{h.commentCount}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
