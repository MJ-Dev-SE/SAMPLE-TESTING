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
      // Was false. Turning this on is what lets a SECOND open tab update itself:
      // edit something in the /admin tab, switch back to the site tab, and its
      // stale queries refetch on focus — no manual reload. (Each browser tab has
      // its own QueryClient, so an admin edit's invalidateQueries() only reaches
      // the tab it happened in; this covers the others.) Content that must feel
      // live regardless of staleTime is handled by LIVE_QUERY_KEYS below.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
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
 *
 * v3: business-directory queries are no longer written to localStorage
 * (NON_PERSISTED_QUERY_KEYS below); bumping the version drops every client's old
 * persisted copy on next load, so admin deletes/edits stop lingering as ghosts.
 * v4: same fix extended to category queries — a category added via a SQL
 * migration (e.g. supabase/maroon_business_categories.sql) could otherwise
 * leave a "not found" 404 cached for up to STALE.categories on any browser
 * that visited the URL before the migration ran.
 * v5: same fix extended to the footer's ad/link/policy list — a browser that
 * loaded the footer before an admin-editable row change (e.g. hiding one ad)
 * would otherwise keep showing the old list until the persisted copy expired.
 */
export const QUERY_CACHE_BUSTER = `v5-${activeBrand.id}`

/**
 * Query families that must NOT survive in localStorage across reloads.
 *
 * These are admin-editable listings: when an admin adds/edits/deletes one, other
 * browsers (esp. the live deployed site) should see it on their next RELOAD, not
 * up to `staleTime` later. Excluding them from the persister means a reload
 * always refetches them live from the DB, while they still cache normally within
 * a single session. Everything else (photos, news, ads) keeps its fast
 * persisted cache — those change rarely and don't have this "why is the
 * deleted thing still here" problem. Matched against queryKey[0].
 *
 * Categories are included too: a category added via a SQL migration (e.g.
 * supabase/maroon_business_categories.sql) is exactly this same class of bug
 * in reverse — a browser that hit the URL before the migration ran would
 * otherwise keep a persisted "not found" result and 404 for hours after the
 * category starts existing.
 */
export const NON_PERSISTED_QUERY_KEYS: ReadonlySet<string> = new Set([
  'businesses', // directory listing pages
  'business', // single profile (/business/<slug>)
  'showcase-businesses', // homepage showcase grid
  'recent-businesses', // sidebar "Recent businesses" widget
  'brand-business-slugs', // static-default gating set
  'categories', // business-directory category list (Company.tsx)
  'category-tree', // community category parent+children (CategoryPage.tsx)
  'footer-groups', // footer ADVERTISEMENT/LINK/POLICY columns (Footer.tsx)
])

/**
 * Admin-editable CONTENT families that should feel LIVE — a new/edited/deleted
 * row shows up without a manual page reload, both on the site and in a second
 * open tab. For each of these query-key prefixes we register:
 *   - refetchOnMount 'always'       → navigating to a page that reads them (e.g.
 *     opening Home) always refetches in the background, so a row added in admin
 *     — or straight in SQL — appears on the next visit. Cached data stays on
 *     screen during the refetch, so there's no empty flash.
 *   - refetchOnWindowFocus 'always' → switching back to a tab refetches them, so
 *     the site tab updates itself after you edit in the admin tab.
 * '_always_' (not plain true) is required because most of these call sites set a
 * long staleTime (categories = 6h): plain true would honor it and skip the
 * refetch. Ephemeral/expensive families (weather 'travel-info', admin 'admin-
 * visits', external APIs) are deliberately NOT listed — they keep their normal
 * cached behavior so we don't refetch them on every tab focus.
 *
 * setQueryDefaults matches by key PREFIX, so ['businesses', cat, page] etc. are
 * all covered. Call-site `staleTime` still wins for caching; only the two
 * refetch triggers above come from here (no call site overrides those).
 */
const LIVE_QUERY_KEYS: string[] = [
  // businesses / directory
  'businesses', 'business', 'showcase-businesses', 'recent-businesses', 'brand-business-slugs',
  // categories
  'categories', 'category', 'category-tree', 'category-posts',
  // posts / boards
  'posts', 'post', 'home-boards', 'popular-posts',
  // media / news / footer / ads
  'photos', 'news', 'news-article', 'ads', 'ad', 'footer-groups',
  // comments
  'comments', 'recent-comments',
  // static content pages
  'link', 'policy',
]
for (const key of LIVE_QUERY_KEYS) {
  queryClient.setQueryDefaults([key], { refetchOnMount: 'always', refetchOnWindowFocus: 'always' })
}
