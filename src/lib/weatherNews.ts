import { useEffect, useState } from 'react'
import { WEATHER_LOCATIONS } from './weather'
import type { AccentColor } from '../types'

/**
 * Synthesized "weather news" feed for /information/weather — a PAGASA-style
 * status/advisory list (current conditions, short-range outlook, rainfall &
 * heat-index advisories, tropical-cyclone watches) built entirely from free,
 * no-key public APIs: Open-Meteo (current + daily forecast, already used by
 * lib/weather.ts) and NASA EONET (open natural-event tracker) for cyclones
 * near the Philippines. There is no PAGASA public API, so this is the closest
 * honest equivalent: real live data, presented in a news-row format.
 *
 * Items are NOT stored anywhere — ids are deterministic (location+category+date,
 * or the EONET event id) so the same headline gets the same id across reloads,
 * which lets comments (content_type='news') and the detail route attach to it
 * consistently even though nothing is persisted server-side.
 */

export type WeatherNewsCategory = 'current' | 'forecast' | 'rain' | 'heat' | 'typhoon'

export interface WeatherNewsItem {
  id: string
  category: WeatherNewsCategory
  headline: string
  summary: string
  body: string
  icon: string
  accent: AccentColor
  location: string | null
  dateStr: string
  sourceLabel: string
}

export const CATEGORY_META: Record<WeatherNewsCategory, { label: string; icon: string; accent: AccentColor }> = {
  current: { label: 'Current status', icon: 'fa-cloud-sun', accent: 'blue' },
  forecast: { label: 'Outlook', icon: 'fa-calendar-days', accent: 'indigo' },
  rain: { label: 'Rainfall advisory', icon: 'fa-cloud-showers-heavy', accent: 'teal' },
  heat: { label: 'Heat index advisory', icon: 'fa-temperature-high', accent: 'pink' },
  typhoon: { label: 'Typhoon watch', icon: 'fa-hurricane', accent: 'purple' },
}

const wmoIcon = (code: number): string => {
  if (code === 0) return 'fa-sun'
  if (code <= 2) return 'fa-cloud-sun'
  if (code === 3) return 'fa-cloud'
  if (code >= 45 && code <= 48) return 'fa-smog'
  if (code >= 51 && code <= 67) return 'fa-cloud-rain'
  if (code >= 71 && code <= 77) return 'fa-snowflake'
  if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy'
  if (code >= 95) return 'fa-cloud-bolt'
  return 'fa-cloud-sun'
}
const wmoLabel = (code: number): string => {
  if (code === 0) return 'Clear sky'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Cloudy'
}

/** Stable pseudo view-count from a string id — decorative only (nothing here is persisted, so a
 *  real per-item counter isn't possible; this keeps the row shape consistent across reloads). */
function pseudoViews(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return 40 + (h % 860)
}

const PH_BOUNDS = { latMin: 4, latMax: 21, lonMin: 115, lonMax: 130 }

async function fetchTyphoonItems(): Promise<WeatherNewsItem[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&status=open&days=20')
    if (!res.ok) return []
    const json = await res.json()
    const events: any[] = json?.events ?? []
    const items: WeatherNewsItem[] = []
    for (const ev of events) {
      const geoms: any[] = ev?.geometry ?? []
      const near = geoms.find((g) => {
        const [lon, lat] = g?.coordinates ?? []
        return (
          typeof lat === 'number' &&
          typeof lon === 'number' &&
          lat >= PH_BOUNDS.latMin &&
          lat <= PH_BOUNDS.latMax &&
          lon >= PH_BOUNDS.lonMin &&
          lon <= PH_BOUNDS.lonMax
        )
      })
      if (!near) continue
      const dateStr = String(near.date ?? ev.geometry?.[0]?.date ?? '').slice(0, 10)
      items.push({
        id: `wx-typhoon-${ev.id}`,
        category: 'typhoon',
        headline: `Tropical cyclone watch: ${ev.title}`,
        summary: `Tracked near the Philippines as of ${dateStr}. Monitor official PAGASA bulletins for local warning signals.`,
        body:
          `${ev.title} is being tracked by NASA's Earth Observatory Natural Event Tracker with a position near the ` +
          `Philippines (${near.coordinates[1].toFixed(1)}°, ${near.coordinates[0].toFixed(1)}°) as of ${dateStr}. ` +
          `This is a general-interest track, not an official PAGASA warning signal — always follow local government ` +
          `and PAGASA advisories for evacuation or safety decisions.`,
        icon: 'fa-hurricane',
        accent: 'purple',
        location: null,
        dateStr,
        sourceLabel: 'NASA EONET',
      })
    }
    return items
  } catch {
    return []
  }
}

async function fetchLocationItems(): Promise<WeatherNewsItem[]> {
  const lats = WEATHER_LOCATIONS.map((l) => l.lat).join(',')
  const lons = WEATHER_LOCATIONS.map((l) => l.lon).join(',')
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,apparent_temperature_max,weather_code` +
    `&forecast_days=3&timezone=Asia%2FManila`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const json = await res.json()
  const perLocation: any[] = Array.isArray(json) ? json : [json]

  const items: WeatherNewsItem[] = []
  perLocation.forEach((loc, i) => {
    const name = WEATHER_LOCATIONS[i].name
    const key = WEATHER_LOCATIONS[i].key
    const today = loc?.daily?.time?.[0]?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)

    // Current status
    const curTemp = loc?.current?.temperature_2m
    const curCode = Number(loc?.current?.weather_code ?? 0)
    if (curTemp != null) {
      items.push({
        id: `wx-current-${key}-${today}`,
        category: 'current',
        headline: `Current weather in ${name}: ${wmoLabel(curCode)}, ${Math.round(Number(curTemp))}°C`,
        summary: `${name} is at ${Math.round(Number(curTemp))}°C with ${wmoLabel(curCode).toLowerCase()} conditions right now.`,
        body: `As of this report, ${name} is experiencing ${wmoLabel(curCode).toLowerCase()} conditions at ${Math.round(Number(curTemp))}°C. Data from Open-Meteo, refreshed live.`,
        icon: wmoIcon(curCode),
        accent: 'blue',
        location: name,
        dateStr: today,
        sourceLabel: 'Open-Meteo',
      })
    }

    // Daily outlook / rain / heat advisories
    const days: string[] = loc?.daily?.time ?? []
    const tmax: number[] = loc?.daily?.temperature_2m_max ?? []
    const tmin: number[] = loc?.daily?.temperature_2m_min ?? []
    const rain: number[] = loc?.daily?.precipitation_probability_max ?? []
    const feels: number[] = loc?.daily?.apparent_temperature_max ?? []
    const codes: number[] = loc?.daily?.weather_code ?? []

    days.forEach((dateStr, di) => {
      if (di === 0) return // today is covered by the "current" item above
      const label = di === 1 ? 'Tomorrow' : `${dateStr}`
      items.push({
        id: `wx-forecast-${key}-${dateStr}`,
        category: 'forecast',
        headline: `${label}'s outlook for ${name}: High ${Math.round(tmax[di])}°C / Low ${Math.round(tmin[di])}°C`,
        summary: `${wmoLabel(codes[di])}, ${Math.round(rain[di] ?? 0)}% chance of rain.`,
        body: `Forecast for ${name} on ${dateStr}: expect ${wmoLabel(codes[di]).toLowerCase()} with a high of ${Math.round(tmax[di])}°C, a low of ${Math.round(tmin[di])}°C, and roughly a ${Math.round(rain[di] ?? 0)}% chance of rain.`,
        icon: wmoIcon(codes[di]),
        accent: 'indigo',
        location: name,
        dateStr,
        sourceLabel: 'Open-Meteo',
      })

      if ((rain[di] ?? 0) >= 60) {
        items.push({
          id: `wx-rain-${key}-${dateStr}`,
          category: 'rain',
          headline: `Rainfall advisory: ${name} (${dateStr})`,
          summary: `${Math.round(rain[di])}% chance of rain — expect wet conditions and possible flooding in low-lying areas.`,
          body: `A high, ${Math.round(rain[di])}% chance of rainfall is forecast for ${name} on ${dateStr}. Motorists and residents in flood-prone or low-lying areas should take precautions.`,
          icon: 'fa-cloud-showers-heavy',
          accent: 'teal',
          location: name,
          dateStr,
          sourceLabel: 'Open-Meteo',
        })
      }
      if ((feels[di] ?? 0) >= 33) {
        items.push({
          id: `wx-heat-${key}-${dateStr}`,
          category: 'heat',
          headline: `Heat index advisory: ${name} (${dateStr})`,
          summary: `Feels-like temperature reaching ${Math.round(feels[di])}°C — extreme caution advised for outdoor activity.`,
          body: `The apparent (feels-like) temperature in ${name} is forecast to reach ${Math.round(feels[di])}°C on ${dateStr}. Limit prolonged outdoor exposure, stay hydrated, and watch for signs of heat exhaustion.`,
          icon: 'fa-temperature-high',
          accent: 'pink',
          location: name,
          dateStr,
          sourceLabel: 'Open-Meteo',
        })
      }
    })
  })
  return items
}

const PRIORITY: Record<WeatherNewsCategory, number> = { typhoon: 0, rain: 1, heat: 1, current: 2, forecast: 3 }

async function buildFeed(): Promise<WeatherNewsItem[]> {
  const [locationItems, typhoonItems] = await Promise.all([
    fetchLocationItems().catch(() => [] as WeatherNewsItem[]),
    fetchTyphoonItems(),
  ])
  return [...typhoonItems, ...locationItems].sort((a, b) => {
    const p = PRIORITY[a.category] - PRIORITY[b.category]
    if (p !== 0) return p
    return b.dateStr.localeCompare(a.dateStr)
  })
}

const CACHE_KEY = 'weather.news'
const TTL_MS = 30 * 60 * 1000

function readCache(): { items: WeatherNewsItem[]; fetchedAt: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeCache(items: WeatherNewsItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, fetchedAt: Date.now() }))
  } catch {
    /* ignore */
  }
}

/** React hook: the full weather-news feed (cache first, 30-min TTL, fails soft to stale/empty). */
export function useWeatherNewsFeed(): WeatherNewsItem[] | null {
  const [data, setData] = useState<WeatherNewsItem[] | null>(() => readCache()?.items ?? null)

  useEffect(() => {
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      setData(cached.items)
      return
    }
    let alive = true
    buildFeed()
      .then((items) => {
        if (!alive) return
        setData(items)
        writeCache(items)
      })
      .catch(() => alive && setData(cached?.items ?? []))
    return () => {
      alive = false
    }
  }, [])

  return data
}

/** One item by id, for the detail route — regenerates the feed (deterministic ids) and looks it up. */
export async function getWeatherNewsItem(id: string): Promise<WeatherNewsItem | null> {
  const cached = readCache()
  const fromCache = cached?.items.find((i) => i.id === id)
  if (fromCache) return fromCache
  const items = await buildFeed()
  writeCache(items)
  return items.find((i) => i.id === id) ?? null
}

export { pseudoViews }
