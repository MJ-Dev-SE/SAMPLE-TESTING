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
