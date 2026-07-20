import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { activeBrand } from '../config/brand'

/**
 * Cache lifetime tiers, one per data-change frequency. Replaces the old
 * hand-rolled contentCache.ts TTL cache — React Query is now the single
 * caching layer for every Supabase read in the app.
 */
export const STALE = {
  categories: 6 * 60 * 60 * 1000, // 1–24h band — edited rarely
  homepageSection: 10 * 60 * 1000, // 5–15min band — photos/ads/news/travel info
  postList: 3 * 60 * 1000, // 2–5min band — community boards
  comments: 45 * 1000, // 30–60s band — most "live" of the cached data
} as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: STALE.homepageSection,
      gcTime: STALE.homepageSection * 2,
    },
  },
})

/**
 * Survives a hard reload/new tab the same way the old localStorage-backed
 * cachedQuery() did — without this, React Query's cache is memory-only and a
 * fresh page load would refetch everything even inside a data's staleTime.
 */
export const queryPersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'mt-query-cache',
})

/**
 * Discards any persisted cache written under a different value — bump the
 * version segment whenever cached QUERY RESULTS change shape/meaning (e.g. the
 * per-brand ad-slot scoping in lib/content.ts: caches persisted before that
 * change hold wrong ad lists and must not be restored). Includes the brand id
 * so a cache never crosses brands even if two are ever served from one origin.
 */
export const QUERY_CACHE_BUSTER = `v2-${activeBrand.id}`
