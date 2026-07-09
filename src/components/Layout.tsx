import type { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import WingBanners from './WingBanners'

/**
 * PAGE SHELL / LAYOUT GRID.
 * Header (top bar + banners + logo/search + category bar) + 3-column shell + footer.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-page">
      <WingBanners />
      <Header />

      <div className="mx-auto w-full max-w-content px-xs py-l flex-1">
        <div className="flex flex-col lg:flex-row gap-l items-start">
          <LeftSidebar />
          <main className="w-full flex-1 min-w-0 order-first lg:order-none">{children}</main>
          <RightSidebar />
        </div>
      </div>

      <Footer />
    </div>
  )
}
