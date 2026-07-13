import { Link } from 'react-router-dom'
import { topBarLeft, topBarRight } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'
import { useAuth } from '../lib/auth'
import LanguageSwitcher from './LanguageSwitcher'

// Sister deployment (PhilGo portal) + the top-bar Write button are currently disabled
// in the markup below. Re-add `useTranslation`/`SISTER_SITE_URL` here if you restore them.

/** Thin top utility bar: left links · sister-site toggle · right links · EN/KO switch. */
export default function TopBar() {
  const L = useLocalized()
  const { user, profile } = useAuth()

  // When logged in, drop the "Login" link and show the username instead.
  const rightLinks = user
    ? topBarRight.filter((l) => l.href !== '/user/login')
    : topBarRight
  const name = profile?.display_name || profile?.username || user?.email?.split('@')[0]

  return (
    <div className="bg-page border-b border-neutral-90">
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
          {/* Always-visible composer entry — the board/category is chosen on the write page */}
          <Link
            to="/post/write"
            // className="shrink-0 inline-flex items-center gap-1.5 rounded-full npm px-2.5 py-0.5 text-[12px] font-semibold text-white hover:bg-[#005bc4]"
          >
            {/* <i className="fa-solid fa-pen" aria-hidden="true" />
            {t('post.write')} */}
          </Link>
          {/* Toggle back to the PhilGo community portal (hidden until configured) */}
          {/* {SISTER_SITE_URL && (
            <a
              href={SISTER_SITE_URL}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-neutral-90 bg-neutral-97 px-2.5 py-0.5 text-[12px] font-semibold text-[#5b6068] hover:border-accent-blue"
            >
              <i className="fa-solid fa-globe text-[#f15a24]" aria-hidden="true" />
              PhilGo
            </a>
          )} */}
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
