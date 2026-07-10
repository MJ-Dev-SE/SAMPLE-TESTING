import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listNews } from '../lib/content'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'
import type { Localized, NewsItemRec } from '../types'

/** Tab bar config (labels/icons are UI chrome; the items come from Supabase). */
const TABS: { key: string; label: Localized; icon: string }[] = [
  { key: 'news', label: { en: 'news', ko: '뉴스' }, icon: 'fa-newspaper' },
  { key: 'travel', label: { en: 'travel', ko: '여행' }, icon: 'fa-plane' },
  { key: 'information', label: { en: 'information', ko: '정보' }, icon: 'fa-circle-info' },
  { key: 'mustread', label: { en: 'Must Read', ko: '필독' }, icon: 'fa-bookmark' },
  { key: 'lifetips', label: { en: 'Life Tips', ko: '생활의 팁' }, icon: 'fa-lightbulb' },
]

/**
 * News tab block: tab bar + 2-column layout (LEFT featured grid with lead overlay,
 * RIGHT numbered headline list). All items come from public.news_items.
 */
export default function NewsTabs() {
  const L = useLocalized()
  const [active, setActive] = useState(0)
  const [items, setItems] = useState<NewsItemRec[]>([])

  useEffect(() => {
    let alive = true
    listNews()
      .then((n) => alive && setItems(n))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [])

  const tabKey = TABS[active].key
  const { featured, headlines } = useMemo(() => {
    const forTab = items.filter((i) => i.tab === tabKey)
    return {
      featured: forTab.filter((i) => i.kind === 'featured'),
      headlines: forTab.filter((i) => i.kind === 'headline'),
    }
  }, [items, tabKey])

  const [lead, ...rest] = featured

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      {/* Tab bar */}
      <div className="flex flex-wrap border-b border-neutral-90 bg-page">
        {TABS.map((tb, i) => (
          <button
            key={tb.key}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-m py-2.5 text-sm -mb-px border-b-2 transition-colors ${
              i === active
                ? 'border-accent-blue text-accent-blue font-semibold'
                : 'border-transparent text-muted hover:text-text-normal'
            }`}
          >
            <i className={`fa-solid ${tb.icon} text-xs`} />
            {L(tb.label)}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-l p-m">
        {/* LEFT: featured grid with lead overlay */}
        <div>
          {lead && (
            <Link to={lead.href} className="relative block rounded-m overflow-hidden mb-2 group">
              <SmartImage src={lead.thumb_url ?? ''} cover className="w-full aspect-[16/10]" />
              {L(lead.title) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="text-white text-sm font-semibold line-clamp-2">{L(lead.title)}</span>
                </div>
              )}
            </Link>
          )}
          <div className="grid grid-cols-4 gap-1">
            {rest.slice(0, 8).map((f, i) => (
              <Link key={i} to={f.href} className="block overflow-hidden rounded-m">
                <SmartImage src={f.thumb_url ?? ''} alt={L(f.title)} cover className="aspect-square hover:opacity-90" />
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT: numbered headline list */}
        <ol className="flex flex-col">
          {headlines.map((h, i) => (
            <li key={i}>
              <Link to={h.href} className="flex items-center py-1.5 text-sm group">
                <span className="w-5 shrink-0 text-muted tabular-nums">{i + 1}</span>
                <span className="text-body group-hover:text-accent-blue truncate">{L(h.title)}</span>
                <span className="leader" />
                <span className="pill bg-chip-blue text-accent-blue shrink-0">{h.comment_count}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
