import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { accentClass } from '../lib/accent'
import { formatDate } from '../lib/posts'
import { countCommentsFor } from '../lib/comments'
import { useLocalized } from '../lib/useLocalized'
import { CATEGORY_META, pseudoViews, useWeatherNewsFeed, type WeatherNewsItem } from '../lib/weatherNews'

const INFORMATION_LABEL = { en: 'Information', ko: '정보' }

/**
 * /information/weather — replaces the generic community-board CategoryPage for
 * this one maroon-bar child with a PAGASA-style weather NEWS feed (current
 * status, short-range outlook, rainfall/heat advisories, typhoon watches),
 * rendered as clickable news rows. Data: lib/weatherNews.ts (Open-Meteo +
 * NASA EONET, both free/no-key). Each row opens the full item at
 * /information/weather/<id> (WeatherNewsArticleView).
 */
export default function WeatherNewsView() {
  const { t } = useTranslation()
  const L = useLocalized()
  const items = useWeatherNewsFeed()
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!items || items.length === 0) return
    let alive = true
    countCommentsFor('news', items.map((i) => i.id))
      .then((c) => alive && setCounts(c))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [items])

  return (
    <Layout>
      <Seo title={t('weatherNews.title')} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/information" className="text-link font-medium">{L(INFORMATION_LABEL)}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('weatherNews.title')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-1">
        <i className="fa-solid fa-cloud-bolt mr-2 text-accent-blue" aria-hidden="true" />
        {t('weatherNews.title')}
      </h1>
      <p className="text-sm text-muted mb-l">{t('weatherNews.subtitle')}</p>

      <div className="border border-neutral-90 rounded-l overflow-hidden">
        {items === null ? (
          <p className="p-l text-sm text-subtlest text-center">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-accent-blue" aria-hidden="true" />
            {t('weatherNews.loading')}
          </p>
        ) : items.length === 0 ? (
          <p className="p-l text-sm text-subtlest text-center">{t('weatherNews.empty')}</p>
        ) : (
          <ul>
            {items.map((item: WeatherNewsItem) => {
              const meta = CATEGORY_META[item.category]
              const commentCount = counts[item.id] ?? 0
              return (
                <li key={item.id} className="border-t border-neutral-90 first:border-t-0">
                  <Link
                    to={`/information/weather/${encodeURIComponent(item.id)}`}
                    className="flex items-center gap-s px-m py-3 hover:bg-neutral-97"
                  >
                    <span className={`shrink-0 grid place-items-center h-11 w-11 rounded-m ${accentClass[item.accent]}`}>
                      <i className={`fa-solid ${item.icon} text-lg`} aria-hidden="true" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${accentClass[item.accent]}`}>
                          {meta.label}
                        </span>
                        {item.location && <span className="text-[11px] text-subtlest">{item.location}</span>}
                      </span>
                      <span className="block text-sm font-medium text-text-normal truncate mt-0.5">
                        {item.headline}
                        {commentCount > 0 && (
                          <span className="ml-2 text-xs font-semibold text-accent-pink">[{commentCount}]</span>
                        )}
                      </span>
                      <span className="block text-xs text-muted truncate mt-0.5">{item.summary}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-subtlest hidden sm:block tabular-nums">
                      <span className="block">{item.sourceLabel}</span>
                      <span className="block mt-0.5">{formatDate(item.dateStr)}</span>
                      <span className="block mt-0.5"><i className="fa-solid fa-eye mr-1" aria-hidden="true" />{pseudoViews(item.id)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}
