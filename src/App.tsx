import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './routes/Home'
import Menu from './routes/Menu'
import PostList from './routes/PostList'
import PostView from './routes/PostView'
import Company from './routes/Company'
import Chat from './routes/Chat'
import Login from './routes/Login'
import Register from './routes/Register'
import Profile from './routes/Profile'
import PostWrite from './routes/PostWrite'
import PhotoView from './routes/PhotoView'
import BusinessRegister from './routes/BusinessRegister'
import BusinessView from './routes/BusinessView'
import ContentView from './routes/ContentView'
import Placeholder from './routes/Placeholder'
import AdminPage from './admin/AdminPage'

/** Shared page routes, reused at root and under /en, /ko prefixes (relative paths). */
function PageRoutes() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="menu" element={<Menu />} />

      {/* Board list + post view (real PhilGo query-param routes) */}
      <Route path="post/list" element={<PostList />} />
      <Route path="post/latest" element={<PostList />} />
      <Route path="post/region" element={<PostList />} />
      <Route path="post/view" element={<PostView />} />
      <Route path="post/write" element={<PostWrite />} />
      <Route path="post/comments" element={<Placeholder title={{ en: 'Recent Comments', ko: '최근 댓글' }} icon="fa-comment-dots" />} />

      {/* Resort photo pages — pic centered + caption/info + comment thread */}
      <Route path="photo/view" element={<PhotoView />} />

      {/* Business directory */}
      <Route path="company" element={<Company />} />
      <Route path="company/register" element={<BusinessRegister />} />
      <Route path="company/view" element={<BusinessView />} />
      <Route path="real_estate/list.php" element={<Placeholder title={{ en: 'Real Estate', ko: '부동산' }} icon="fa-building" />} />

      {/* Utilities */}
      <Route path="chat" element={<Chat />} />
      <Route path="chat/index" element={<Chat />} />
      <Route path="weather" element={<Placeholder title={{ en: 'Weather', ko: '날씨' }} icon="fa-cloud-sun" />} />
      <Route path="currency" element={<Placeholder title={{ en: 'Exchange rate calculator', ko: '환율 계산기' }} icon="fa-calculator" />} />
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

      {/* Site content pages (site_content table via ContentView) — generic route
          + the fixed footer URLs for advertising, link and policy items */}
      <Route path="content/view" element={<ContentView />} />
      <Route path="adv/banner" element={<ContentView slug="banner-ad-information" />} />
      <Route path="adv/massage" element={<ContentView slug="massage-ad-information" />} />
      <Route path="adv/point" element={<ContentView slug="point-ad-information" />} />
      <Route path="help/guideline" element={<ContentView slug="user-guide" />} />
      <Route path="help/about" element={<ContentView slug="about-manilatour" />} />
      <Route path="help/terms" element={<ContentView slug="terms-of-use" />} />
      <Route path="help/privacy" element={<ContentView slug="privacy-policy" />} />
      <Route path="help/safety" element={<ContentView slug="child-safety-standards" />} />

      {/* Unknown routes fall back to home */}
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
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

export default function App() {
  return (
    <Routes>
      {/* locale-prefixed routes: /en/*, /ko/* */}
      <Route path="en/*" element={<LocalePrefix lng="en" />} />
      <Route path="ko/*" element={<LocalePrefix lng="ko" />} />
      {/* default (no prefix) */}
      <Route path="/*" element={<PageRoutes />} />
    </Routes>
  )
}
