import type { MenuSectionData } from '../types'
import { useLocalized } from '../lib/useLocalized'
import MenuRow from './MenuRow'

/**
 * Section card (.menu-section): border 1px #e4e5e9; radius 12px; overflow hidden.
 * HOVER: translateY(-2px) + box-shadow (whole card lifts), 0.2s.
 */
export default function MenuSection({ section }: { section: MenuSectionData }) {
  const L = useLocalized()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card">
      {/* Section header bar */}
      <div className="flex items-center gap-xs bg-neutral-95 px-m py-s">
        <i className={`fa-solid ${section.icon} text-muted`} />
        <h2 className="text-[0.8em] font-semibold uppercase tracking-[0.5px] text-muted">
          {L(section.header)}
        </h2>
      </div>
      <ul>
        {section.items.map((item) => (
          <MenuRow key={item.title.en} item={item} />
        ))}
      </ul>
    </section>
  )
}
