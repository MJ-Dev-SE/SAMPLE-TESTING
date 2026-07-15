import { useEffect, useState } from 'react'

/**
 * Live weather for the resort (Calamba, Laguna) via Open-Meteo — a free, no-key
 * public API. Result is cached in localStorage for 10 minutes so re-renders and
 * page revisits don't refetch. Fails soft: on error we keep the last cached value.
 */
const LAT = 14.21
const LON = 121.16
const CACHE_KEY = 'weather.calamba'
const TTL_MS = 10 * 60 * 1000

export interface WeatherNow {
  /** e.g. "26.4°C" */
  temp: string
  /** WMO weather code → a Font Awesome icon name. */
  icon: string
  fetchedAt: number
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

function readCache(): WeatherNow | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WeatherNow
  } catch {
    return null
  }
}

async function fetchWeather(): Promise<WeatherNow> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const json = await res.json()
  const t = json?.current?.temperature_2m
  const code = json?.current?.weather_code ?? 0
  const value: WeatherNow = {
    temp: `${Math.round(Number(t) * 10) / 10}°C`,
    icon: wmoIcon(Number(code)),
    fetchedAt: Date.now(),
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch {
    /* storage full / private mode — ignore */
  }
  return value
}

/** React hook: returns the current weather (from cache first, then live). */
export function useWeather(): WeatherNow | null {
  const [data, setData] = useState<WeatherNow | null>(() => readCache())

  useEffect(() => {
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      setData(cached)
      return
    }
    let alive = true
    fetchWeather()
      .then((w) => alive && setData(w))
      .catch(() => alive && setData(cached)) // keep stale value on failure
    return () => {
      alive = false
    }
  }, [])

  return data
}

/* ------------------------------------------------------------------------ *
 * /weather page — current conditions + hourly-by-day forecast for 3 towns,
 * all from the same free, no-key Open-Meteo API (one request, multi-location).
 * ------------------------------------------------------------------------ */

export interface WeatherLocation {
  key: string
  name: string
  lat: number
  lon: number
}

/** Bagong Kalsada is the resort's own barangay — same coordinates as useWeather() above. */
export const WEATHER_LOCATIONS: WeatherLocation[] = [
  { key: 'bagongKalsada', name: 'Bagong Kalsada', lat: LAT, lon: LON },
  { key: 'manila', name: 'Manila', lat: 14.5995, lon: 120.9842 },
  { key: 'pagsanjan', name: 'Pagsanjan', lat: 14.2694, lon: 121.4522 },
]

export interface HourCell {
  temp: string
  icon: string
}

export interface WeatherDayRow {
  hour: string // "14:00"
  cells: (HourCell | null)[] // one per WEATHER_LOCATIONS entry, in order
}

export interface WeatherDayGroup {
  dateStr: string // "2026-07-15"
  rows: WeatherDayRow[]
}

export interface WeatherOverview {
  /** One entry per WEATHER_LOCATIONS, in order; null if that location failed. */
  current: (WeatherNow | null)[]
  days: WeatherDayGroup[]
}

const OVERVIEW_CACHE_KEY = 'weather.overview'
const OVERVIEW_TTL_MS = 30 * 60 * 1000
const FORECAST_DAYS = 4

function readOverviewCache(): (WeatherOverview & { fetchedAt: number }) | null {
  try {
    const raw = localStorage.getItem(OVERVIEW_CACHE_KEY)
    return raw ? (JSON.parse(raw) as WeatherOverview & { fetchedAt: number }) : null
  } catch {
    return null
  }
}

async function fetchWeatherOverview(): Promise<WeatherOverview & { fetchedAt: number }> {
  const lats = WEATHER_LOCATIONS.map((l) => l.lat).join(',')
  const lons = WEATHER_LOCATIONS.map((l) => l.lon).join(',')
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code` +
    `&forecast_days=${FORECAST_DAYS}&timezone=Asia%2FManila`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const json = await res.json()
  // Single-location requests return one object; multi-location returns an array.
  const perLocation: any[] = Array.isArray(json) ? json : [json]

  const current: (WeatherNow | null)[] = perLocation.map((loc) => {
    const t = loc?.current?.temperature_2m
    if (t == null) return null
    return {
      temp: `${Math.round(Number(t) * 10) / 10}°C`,
      icon: wmoIcon(Number(loc?.current?.weather_code ?? 0)),
      fetchedAt: Date.now(),
    }
  })

  // Lookup maps: "YYYY-MM-DDTHH:00" → { temp, code }, one per location.
  const maps = perLocation.map((loc) => {
    const m = new Map<string, { temp: number; code: number }>()
    const times: string[] = loc?.hourly?.time ?? []
    const temps: number[] = loc?.hourly?.temperature_2m ?? []
    const codes: number[] = loc?.hourly?.weather_code ?? []
    times.forEach((t, i) => m.set(t, { temp: temps[i], code: codes[i] }))
    return m
  })

  const todayStr = perLocation[0]?.hourly?.time?.[0]?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  // Browser-local hour, not Manila time — acceptable since the audience is PH-based;
  // worst case "today" starts a couple hours early/late for a visitor abroad.
  const nowHour = new Date().getHours()
  const dateStrs: string[] = [...new Set<string>((perLocation[0]?.hourly?.time ?? []).map((t: string) => t.slice(0, 10)))]

  const days: WeatherDayGroup[] = dateStrs
    .map((dateStr) => {
      const isToday = dateStr === todayStr
      const step = isToday ? 2 : 4
      const hours: number[] = []
      for (let h = 0; h < 24; h += step) {
        if (isToday && h < nowHour) continue
        hours.push(h)
      }
      const rows: WeatherDayRow[] = hours.map((h) => {
        const hh = String(h).padStart(2, '0')
        const key = `${dateStr}T${hh}:00`
        return {
          hour: `${hh}:00`,
          cells: maps.map((m) => {
            const v = m.get(key)
            return v ? { temp: `${Math.round(v.temp)}°C`, icon: wmoIcon(v.code) } : null
          }),
        }
      })
      return { dateStr, rows }
    })
    .filter((d) => d.rows.length > 0)

  const value = { current, days, fetchedAt: Date.now() }
  try {
    localStorage.setItem(OVERVIEW_CACHE_KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
  return value
}

/** React hook: current + hourly-by-day forecast for Bagong Kalsada, Manila, Pagsanjan. */
export function useWeatherOverview(): WeatherOverview | null {
  const [data, setData] = useState<WeatherOverview | null>(() => readOverviewCache())

  useEffect(() => {
    const cached = readOverviewCache()
    if (cached && Date.now() - cached.fetchedAt < OVERVIEW_TTL_MS) {
      setData(cached)
      return
    }
    let alive = true
    fetchWeatherOverview()
      .then((w) => alive && setData(w))
      .catch(() => alive && setData(cached))
    return () => {
      alive = false
    }
  }, [])

  return data
}
