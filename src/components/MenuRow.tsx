import { Link } from 'react-router-dom'
import type { MenuItem } from '../types'
import { accentClass } from '../lib/accent'
import { useLocalized } from '../lib/useLocalized'

/**
 * Menu row (.menu-item > a.menu-link): height 60px; padding 12px 16px; flex gap 12px.
 * HOVER: bg neutral-97 + content nudges right (padding-left 8px), 0.15s.
 */
export default function MenuRow({ item }: { item: MenuItem }) {
  const L = useLocalized()
  return (
    <li className="border-t border-neutral-90 first:border-t-0">
      <Link
        to={item.href}
        className="group flex items-center gap-s h-[60px] py-s pl-m pr-m no-underline text-text-normal transition-[background-color,padding] duration-150 hover:bg-neutral-97 hover:pl-xs"
      >
        {/* Icon chip: 36x36, radius 6px, tinted bg+icon per accent pair */}
        <span
          className={`grid place-items-center w-9 h-9 min-w-9 rounded-m text-[0.95em] ${accentClass[item.iconColor]}`}
        >
          <i className={`fa-solid ${item.icon}`} />
        </span>
        <span className="min-w-0">
          <span className="block text-[14.4px] font-medium text-text-normal truncate">
            {L(item.title)}
          </span>
          <span className="block text-[0.78em] leading-[1.3] mt-px text-subtlest truncate">
            {L(item.desc)}
          </span>
        </span>
      </Link>
    </li>
  )
}
