import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './routes/Home'
import Menu from './routes/Menu'
import PostList from './routes/PostList'
import PostView from './routes/PostView'
import Company from './routes/Company'
import Chat from './routes/Chat'
import Placeholder from './routes/Placeholder'

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
      <Route path="post/comments" element={<Placeholder title={{ en: 'Recent Comments', ko: '최근 댓글' }} icon="fa-comment-dots" />} />

      {/* Business directory */}
      <Route path="company" element={<Company />} />
      <Route path="company/view" element={<Placeholder title={{ en: 'Business', ko: '업소' }} icon="fa-store" />} />
      <Route path="real_estate/list.php" element={<Placeholder title={{ en: 'Real Estate', ko: '부동산' }} icon="fa-building" />} />

      {/* Utilities */}
      <Route path="chat" element={<Chat />} />
      <Route path="chat/index" element={<Chat />} />
      <Route path="weather" element={<Placeholder title={{ en: 'Weather', ko: '날씨' }} icon="fa-cloud-sun" />} />
      <Route path="currency" element={<Placeholder title={{ en: 'Exchange rate calculator', ko: '환율 계산기' }} icon="fa-calculator" />} />
      <Route path="ai" element={<Placeholder title={{ en: 'AI chatbot', ko: 'AI 챗봇' }} icon="fa-robot" />} />
      <Route path="today" element={<Placeholder title={{ en: 'Today', ko: '오늘' }} icon="fa-calendar-day" />} />

      {/* Account */}
      <Route path="user/login" element={<Placeholder title={{ en: 'log in', ko: '로그인' }} icon="fa-right-to-bracket" />} />
      <Route path="user/profile" element={<Placeholder title={{ en: 'Edit Profile', ko: '프로필 수정' }} icon="fa-user-pen" />} />
      <Route path="user/settings" element={<Placeholder title={{ en: 'setting', ko: '설정' }} icon="fa-gear" />} />
      <Route path="point/history" element={<Placeholder title={{ en: 'Point history', ko: '포인트 내역' }} icon="fa-clock-rotate-left" />} />

      {/* Advertising */}
      <Route path="adv/banner" element={<Placeholder title={{ en: 'Banner ads', ko: '배너 광고' }} icon="fa-rectangle-ad" />} />
      <Route path="adv/point" element={<Placeholder title={{ en: 'Point advertisements', ko: '포인트 광고' }} icon="fa-coins" />} />

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
