import { Link } from 'react-router-dom'
import { topBarLeft, topBarRight } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'
import { useAuth } from '../lib/auth'
import LanguageSwitcher from './LanguageSwitcher'

/** Thin top utility bar: left links · right links · EN/KO switch. */
export default function TopBar() {
  const L = useLocalized()
  const { user, profile } = useAuth()

  // When logged in, drop the "Login" link and show the username instead.
  const rightLinks = user
    ? topBarRight.filter((l) => l.href !== '/user/login')
    : topBarRight
  const name = profile?.display_name || profile?.username || user?.email?.split('@')[0]

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
          {user && name && (
            <Link
              to="/user/profile"
              className="shrink-0 font-medium text-text-normal hover:text-accent-blue"
            >
              <i className="fa-solid fa-user mr-1 text-accent-blue" />
              {name}
            </Link>
          )}
          {rightLinks.map((l) => (
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
