import { Link } from 'react-router-dom'
import { topBarLeft, topBarRight } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'
import LanguageSwitcher from './LanguageSwitcher'

/** Thin top utility bar: left links · right links · EN/KO switch. */
export default function TopBar() {
  const L = useLocalized()
  return (
    <div className="border-b border-neutral-90">
      <div className="mx-auto max-w-content px-xs flex items-center justify-center sm:justify-between h-9 text-[13px] text-[#333]">
        {/* Left utility links: hidden on phones (crowded in a 36px row), shown from sm up. */}
        <nav className="hidden sm:flex items-center gap-m" aria-label="Top utility left">
          {topBarLeft.map((l) => (
            <Link key={l.label.en} to={l.href} className="hover:text-accent-blue whitespace-nowrap">
              {L(l.label)}
            </Link>
          ))}
        </nav>
        {/* Right utilities: scroll cleanly on mobile instead of overflowing / squishing. */}
        <div
          className="flex items-center gap-3 sm:gap-m min-w-0 overflow-x-auto no-scrollbar whitespace-nowrap"
          aria-label="Top utility right"
        >
          {topBarRight.map((l) => (
            <Link key={l.label.en} to={l.href} className="shrink-0 hover:text-accent-blue">
              {L(l.label)}
            </Link>
          ))}
          <LanguageSwitcher className="shrink-0" />
        </div>
      </div>
    </div>
  )
}
