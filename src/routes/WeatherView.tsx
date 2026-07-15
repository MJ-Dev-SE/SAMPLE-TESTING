import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { WEATHER_LOCATIONS, useWeatherOverview } from '../lib/weather'

/** "2026-07-18" → "07/18 (Sat)", locale-aware weekday. */
function formatFutureDay(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
  return `${mmdd} (${weekday})`
}

/**
 * /weather — the sidebar Weather card's "more" target. Current conditions +
 * an hourly-by-day forecast table (today in 2h steps, later days in 4h steps)
 * for the resort's own barangay plus Manila and Pagsanjan. Data: Open-Meteo
 * (free, no API key), one multi-location request via lib/weather.ts.
 */
export default function WeatherView() {
  const { t, i18n } = useTranslation()
  const overview = useWeatherOverview()
  const locale = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('ko') ? 'ko-KR' : 'en-US'

  const dayLabel = (dateStr: string, index: number): string => {
    if (index === 0) return t('weather.today')
    if (index === 1) return t('weather.tomorrow')
    if (index === 2) return t('weather.dayAfterTomorrow')
    return formatFutureDay(dateStr, locale)
  }

  return (
    <Layout>
      <Seo title={t('weather.title')} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('weather.title')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-l">
        <i className="fa-solid fa-cloud-sun mr-2 text-accent-blue" aria-hidden="true" />
        {t('weather.title')}
      </h1>

      {/* Current conditions — one card per town */}
      <h2 className="text-sm font-semibold text-muted mb-2">{t('weather.currentTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2xl">
        {WEATHER_LOCATIONS.map((loc, i) => {
          const cur = overview?.current[i] ?? null
          return (
            <div key={loc.key} className="border border-neutral-90 rounded-l p-l text-center bg-neutral-97">
              <div className="text-sm font-semibold text-text-normal mb-1">{loc.name}</div>
              <i className={`fa-solid ${cur?.icon ?? 'fa-cloud-sun'} text-2xl text-accent-blue mb-1`} aria-hidden="true" />
              <div className="text-2xl font-bold text-text-normal">{cur ? cur.temp : '…'}</div>
            </div>
          )
        })}
      </div>

      {/* Hourly-by-day table */}
      <h2 className="text-sm font-semibold mb-2 pb-1.5 border-b-2 border-accent-blue inline-flex items-center gap-1.5">
        <i className="fa-regular fa-clock text-accent-blue" aria-hidden="true" />
        <span className="text-text-normal">{t('weather.byTimeOfDay')}</span>
      </h2>

      <div className="border border-neutral-90 rounded-l overflow-hidden overflow-x-auto">
        {!overview ? (
          <p className="p-l text-sm text-subtlest text-center">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-accent-blue" aria-hidden="true" />
            {t('weather.loading')}
          </p>
        ) : overview.days.length === 0 ? (
          <p className="p-l text-sm text-subtlest text-center">{t('weather.unavailable')}</p>
        ) : (
          <table className="w-full min-w-[480px] text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-95 text-left text-xs text-muted">
                <th className="px-s py-2 font-semibold">{t('weather.hour')}</th>
                {WEATHER_LOCATIONS.map((loc) => (
                  <th key={loc.key} className="px-s py-2 font-semibold text-center">{loc.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overview.days.map((day, di) => (
                <Fragment key={day.dateStr}>
                  <tr className="bg-neutral-97">
                    <td colSpan={WEATHER_LOCATIONS.length + 1} className="px-s py-1.5 text-xs font-bold text-accent-blue">
                      {dayLabel(day.dateStr, di)}
                    </td>
                  </tr>
                  {day.rows.map((row) => (
                    <tr key={row.hour} className="border-t border-neutral-90">
                      <td className="px-s py-2 text-muted">{row.hour}</td>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className="px-s py-2 text-center text-text-normal">
                          {cell ? (
                            <span className="inline-flex items-center gap-1">
                              <i className={`fa-solid ${cell.icon} text-accent-blue text-xs`} aria-hidden="true" />
                              {cell.temp}
                            </span>
                          ) : (
                            <span className="text-subtlest">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
