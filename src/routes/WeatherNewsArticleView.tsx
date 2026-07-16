import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import CommentsReviewsSection from '../components/comments/CommentsReviewsSection'
import { accentClass } from '../lib/accent'
import { formatDate } from '../lib/posts'
import { useLocalized } from '../lib/useLocalized'
import { CATEGORY_META, pseudoViews, getWeatherNewsItem, type WeatherNewsItem } from '../lib/weatherNews'

const INFORMATION_LABEL = { en: 'Information', ko: '정보' }
const WEATHER_LABEL = { en: 'Weather', ko: '날씨' }

/**
 * /information/weather/:id — full detail for one weather-news row (see
 * WeatherNewsView + lib/weatherNews.ts). Comments reuse the existing
 * polymorphic system (content_type='news'); no star rating — a "current
 * weather status" isn't something to rate 1-5.
 */
export default function WeatherNewsArticleView() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { id = '' } = useParams()
  const [item, setItem] = useState<WeatherNewsItem | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    setItem(undefined)
    getWeatherNewsItem(id)
      .then((r) => alive && setItem(r))
      .catch(() => alive && setItem(null))
    return () => {
      alive = false
    }
  }, [id])

  if (item === undefined) return <Layout><p className="text-sm text-subtlest p-l">…</p></Layout>
  if (!item) {
    return (
      <Layout>
        <Seo title={t('content.notFound')} noindex />
        <div className="border border-neutral-90 rounded-l p-2xl text-center">
          <p className="text-sm text-muted mb-3">{t('content.notFound')}</p>
          <Link to="/information/weather" className="text-sm text-link font-medium hover:underline">
            {L(WEATHER_LABEL)}
          </Link>
        </div>
      </Layout>
    )
  }

  const meta = CATEGORY_META[item.category]

  return (
    <Layout>
      <Seo title={item.headline} description={item.summary} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/information" className="text-link font-medium">{L(INFORMATION_LABEL)}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/information/weather" className="text-link font-medium">{L(WEATHER_LABEL)}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{item.headline}</span>
      </nav>

      <div className="border border-neutral-90 rounded-l overflow-hidden">
        <div className={`flex items-center gap-3 px-l py-3 ${accentClass[item.accent]}`}>
          <span className="grid place-items-center h-14 w-14 rounded-m bg-white/60">
            <i className={`fa-solid ${item.icon} text-2xl`} aria-hidden="true" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide">{meta.label}</span>
            <h1 className="text-lg font-bold leading-snug">{item.headline}</h1>
          </div>
        </div>

        <div className="p-l">
          <div className="flex flex-wrap items-center gap-l text-xs text-subtlest mb-3 tabular-nums">
            {item.location && <span><i className="fa-solid fa-location-dot mr-1" aria-hidden="true" />{item.location}</span>}
            <span><i className="fa-solid fa-calendar mr-1" aria-hidden="true" />{formatDate(item.dateStr)}</span>
            <span><i className="fa-solid fa-eye mr-1" aria-hidden="true" />{pseudoViews(item.id)}</span>
            <span><i className="fa-solid fa-satellite-dish mr-1" aria-hidden="true" />{item.sourceLabel}</span>
          </div>
          <p className="text-sm text-text-normal leading-relaxed">{item.body}</p>
        </div>
      </div>

      <CommentsReviewsSection contentType="news" contentId={item.id} />
    </Layout>
  )
}
