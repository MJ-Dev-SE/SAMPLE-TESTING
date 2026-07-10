import { useEffect, useState } from 'react'

/**
 * Live foreign-exchange rates via open.er-api.com — free, no key. USD is the base.
 * We surface PHP per USD and KRW per USD (the two figures the sidebar card shows).
 * Cached in localStorage for 1 hour; fails soft to the last cached value.
 */
const CACHE_KEY = 'fx.usd'
const TTL_MS = 60 * 60 * 1000

export interface FxRates {
  /** Philippine peso per 1 USD, e.g. 58.2 */
  php: number
  /** Korean won per 1 USD, e.g. 1544 */
  krw: number
  fetchedAt: number
}

function readCache(): FxRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as FxRates) : null
  } catch {
    return null
  }
}

async function fetchFx(): Promise<FxRates> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!res.ok) throw new Error(`fx ${res.status}`)
  const json = await res.json()
  const rates = json?.rates ?? {}
  const value: FxRates = {
    php: Number(rates.PHP) || 0,
    krw: Number(rates.KRW) || 0,
    fetchedAt: Date.now(),
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
  return value
}

/** React hook: returns current FX rates (cache first, then live). */
export function useFx(): FxRates | null {
  const [data, setData] = useState<FxRates | null>(() => readCache())

  useEffect(() => {
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      setData(cached)
      return
    }
    let alive = true
    fetchFx()
      .then((f) => alive && setData(f))
      .catch(() => alive && setData(cached))
    return () => {
      alive = false
    }
  }, [])

  return data
}
