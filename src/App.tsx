import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from './components/seo/Seo'
import { trackPageVisit } from './lib/trackVisit'
// Home stays eager: it's the most common entry and the LCP-critical page.
import Home from './routes/Home'
import Placeholder from './routes/Placeholder'
import NotFound from './routes/NotFound'

// Route-level code splitting (Core Web Vitals): every other page loads its own
// chunk on demand. The Suspense fallback is a stable full-height shell so
// switching routes never causes layout shift.
const Menu = lazy(() => import('./routes/Menu'))
const PostList = lazy(() => import('./routes/PostList'))
const PostView = lazy(() => import('./routes/PostView'))
const CategoryPage = lazy(() => import('./routes/CategoryPage'))
const Company = lazy(() => import('./routes/Company'))
const CompanyRedirect = lazy(() => import('./routes/Company').then((m) => ({ default: m.CompanyRedirect })))
const Chat = lazy(() => import('./routes/Chat'))
const Login = lazy(() => import('./routes/Login'))
const Register = lazy(() => import('./routes/Register'))
const Profile = lazy(() => import('./routes/Profile'))
const PostWrite = lazy(() => import('./routes/PostWrite'))
const PhotoView = lazy(() => import('./routes/PhotoView'))
const BusinessRegister = lazy(() => import('./routes/BusinessRegister'))
const BusinessView = lazy(() => import('./routes/BusinessView'))
const AdvertisementView = lazy(() => import('./routes/AdvertisementView'))
const LinkView = lazy(() => import('./routes/LinkView'))
const PolicyView = lazy(() => import('./routes/PolicyView'))
const NewsArticleView = lazy(() => import('./routes/NewsArticleView'))
const RecentCommentsView = lazy(() => import('./routes/RecentCommentsView'))
const WeatherView = lazy(() => import('./routes/WeatherView'))
const CurrencyView = lazy(() => import('./routes/CurrencyView'))
const AdGalleryView = lazy(() => import('./routes/AdGalleryView'))
const WeatherNewsView = lazy(() => import('./routes/WeatherNewsView'))
const WeatherNewsArticleView = lazy(() => import('./routes/WeatherNewsArticleView'))
const AdminPage = lazy(() => import('./admin/AdminPage'))

/**
 * Maroon-bar parent categories (community tree, supabase/community.sql).
 * Each gets a stable landing URL (/information) plus child URLs
 * (/information/weather). Kept in code because the maroon bar itself
 * (src/data/categoryBar.ts) is code too — adding a parent means touching both.
 */
const COMMUNITY_PARENTS = [
  'information',
  'news',
  'qna',
  'community',
  'marketplace',
  'travel',
  'jobs',
  'immigration',
] as const

/** Shared page routes, reused at root and under /en, /ko prefixes (relative paths). */
function PageRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" aria-busy="true" />}>
      <Routes>
      <Route index element={<Home />} />
      <Route path="menu" element={<Menu />} />

      {/* Board list + post view. /posts/<slug> is the canonical post URL;
          the query-param routes remain for old links. */}
      <Route path="posts/:slug" element={<PostView />} />
      <Route path="post/list" element={<PostList />} />
      <Route path="post/latest" element={<PostList />} />
      <Route path="post/region" element={<PostList />} />
      <Route path="post/view" element={<PostView />} />
      <Route path="post/write" element={<PostWrite />} />
      <Route path="post/comments" element={<RecentCommentsView />} />

      {/* Information → Weather is a PAGASA-style live weather-news feed (Open-Meteo +
          NASA EONET), not a generic community board — these static routes outrank
          the /information/:childSlug fallback below regardless of declaration order
          (React Router ranks static segments over dynamic ones), same as
          /news/article/<slug> already outranks /news/:childSlug. */}
      <Route path="information/weather" element={<WeatherNewsView />} />
      <Route path="information/weather/:id" element={<WeatherNewsArticleView />} />

      {/* Members' Marketplace → Peso exchange is the same live currency calculator
          as the sidebar Exchange card's "calculator" link (/currency), not a
          generic community board — there's nothing to post/browse here, just the
          converter itself. */}
      <Route path="marketplace/peso-exchange" element={<CurrencyView />} />

      {/* Community category landing pages: /information, /information/experiences, … */}
      {COMMUNITY_PARENTS.map((p) => (
        <Route key={p} path={p} element={<CategoryPage parentSlug={p} />} />
      ))}
      {COMMUNITY_PARENTS.map((p) => (
        <Route key={`${p}-child`} path={`${p}/:childSlug`} element={<CategoryPage parentSlug={p} />} />
      ))}

      {/* Resort photo pages — pic centered + caption/info + comment thread */}
      <Route path="photo/view" element={<PhotoView />} />

      {/* Business directory — /business-directory[/<category>] is canonical;
          /business/<slug> is the profile page; /company/* stays alive. */}
      <Route path="business-directory" element={<Company />} />
      <Route path="business-directory/:categorySlug" element={<Company />} />
      <Route path="business/:slug" element={<BusinessView />} />
      <Route path="company" element={<CompanyRedirect />} />
      <Route path="company/register" element={<BusinessRegister />} />
      <Route path="company/view" element={<BusinessView />} />
      <Route path="real_estate/list.php" element={<Placeholder title={{ en: 'Real Estate', ko: '부동산' }} icon="fa-building" />} />

      {/* Utilities */}
      <Route path="chat" element={<Chat />} />
      <Route path="chat/index" element={<Chat />} />
      <Route path="weather" element={<WeatherView />} />
      <Route path="currency" element={<CurrencyView />} />
      <Route path="ai" element={<Placeholder title={{ en: 'AI chatbot', ko: 'AI 챗봇' }} icon="fa-robot" />} />
      <Route path="today" element={<Placeholder title={{ en: 'Today', ko: '오늘' }} icon="fa-calendar-day" />} />

      {/* Account */}
      <Route path="user/login" element={<Login />} />
      <Route path="user/register" element={<Register />} />
      <Route path="user/profile" element={<Profile />} />
      {/* Settings merged into Profile — one account hub; the old URL still works */}
      <Route path="user/settings" element={<Profile />} />

      {/* Admin DBMS — CRUD over all content tables; admins only (see supabase/admin.sql) */}
      <Route path="admin" element={<AdminPage />} />
      <Route path="point/history" element={<Placeholder title={{ en: 'Point history', ko: '포인트 내역' }} icon="fa-clock-rotate-left" />} />

      {/* Content-type-specific detail pages: each renders its own layout. */}
      <Route path="ad/view" element={<AdvertisementView />} />
      <Route path="link/view" element={<LinkView />} />
      <Route path="policy/view" element={<PolicyView />} />
      <Route path="news/article/:slug" element={<NewsArticleView />} />
      <Route path="news/view" element={<NewsArticleView />} />

      {/* Fixed footer URLs → their content-type page */}
      <Route path="adv/banner" element={<AdGalleryView />} />
      <Route path="help/guideline" element={<LinkView />} />
      <Route path="help/about" element={<LinkView />} />
      <Route path="help/terms" element={<PolicyView slug="terms-of-use" />} />
      <Route path="help/privacy" element={<PolicyView slug="privacy-policy" />} />
      <Route path="help/safety" element={<PolicyView slug="child-safety-standards" />} />

      {/* Unknown routes render an honest 404 (noindex) instead of silently
          redirecting home — dead links must not look like duplicate homepages. */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

/** Forces i18n locale to the URL prefix, then renders the shared routes. */
function LocalePrefix({ lng }: { lng: 'en' | 'ko' }) {
  const { i18n } = useTranslation()
  useEffect(() => {
    if (i18n.resolvedLanguage !== lng) i18n.changeLanguage(lng)
  }, [lng, i18n])
  return <PageRoutes />
}

/**
 * Fires one page-view record per navigation (see lib/trackVisit.ts). The admin
 * console (/admin*) is excluded so an admin's own dashboard browsing never
 * mixes into the site's visitor stats.
 */
function usePageViewTracking() {
  const location = useLocation()
  useEffect(() => {
    if (location.pathname.replace(/^\/(en|ko)(?=\/|$)/, '').startsWith('/admin')) return
    trackPageVisit(location.pathname + location.search)
  }, [location.pathname, location.search])
}

export default function App() {
  usePageViewTracking()
  return (
    <>
      {/* Site-wide head defaults — every page's own <Seo> overrides these. */}
      <Seo />
      <Routes>
        {/* locale-prefixed routes: /en/*, /ko/* */}
        <Route path="en/*" element={<LocalePrefix lng="en" />} />
        <Route path="ko/*" element={<LocalePrefix lng="ko" />} />
        {/* default (no prefix) */}
        <Route path="/*" element={<PageRoutes />} />
      </Routes>
    </>
  )
}
