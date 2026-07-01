import { bannersTop } from '../data/home'
import TopBar from './TopBar'
import Logo from './Logo'
import SearchBar from './SearchBar'
import CategoryBar from './CategoryBar'

/**
 * HEADER / TOP NAVIGATION (banner) — matches the live philgo.com structure:
 *  1) thin top utility bar
 *  2) banner row: [Banner Ad 1] · [logo + search centered] · [Banner Ad 2]
 *  3) maroon 4-column category bar
 */
export default function Header() {
  const [banner1, banner2] = bannersTop
  return (
    <header className="bg-page">
      <TopBar />

      {/* Banner row with centered logo + search (banners kept small so the center is prominent) */}
      <div className="mx-auto max-w-content px-xs py-m">
        <div className="flex items-center justify-between gap-l">
          {/* Banner Ad 1 (left) — small */}
          <a href={banner1.href} className="hidden md:block shrink-0">
            <img src={banner1.imageUrl} alt={banner1.alt} className="h-[56px] w-[150px] object-cover rounded-m border border-neutral-90" />
          </a>

          {/* Center: logo above search */}
          <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
            <Logo />
            <SearchBar />
          </div>

          {/* Banner Ad 2 (right) — small */}
          <a href={banner2.href} className="hidden md:block shrink-0">
            <img src={banner2.imageUrl} alt={banner2.alt} className="h-[56px] w-[150px] object-cover rounded-m border border-neutral-90" />
          </a>
        </div>
      </div>

      <CategoryBar />
    </header>
  )
}
