import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listBrandBusinessSlugs } from './content'
import { activeBrand } from '../config/brand'
import { STALE } from './queryClient'

const EMPTY: Set<string> = new Set()

/**
 * Slugs of the listings this domain OWNS in the database.
 *
 * hanin.tv ships a STATIC default set of businesses (src/data/haninBusinesses.ts)
 * so the site works before anything is seeded. Once an admin seeds/creates the
 * real row (supabase/hanin_businesses.sql), the static twin must disappear or
 * the card would show twice — and the DB row is the one the admin can edit.
 * Surfaces that inject static entries filter them through this set.
 *
 * Returns an empty set on the default brand (nothing static to gate) and before
 * the migration adds `businesses.brand`.
 *
 * The query itself resolves to a plain string[] — the cache is persisted to
 * localStorage as JSON (lib/queryClient.ts), where a Set would not survive —
 * so the Set is rebuilt here, memoized on the array identity.
 */
export function useSeededSlugs(): Set<string> {
  const { data } = useQuery({
    queryKey: ['brand-business-slugs', activeBrand.id],
    queryFn: listBrandBusinessSlugs,
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
    enabled: activeBrand.id === 'hanin',
  })
  return useMemo(() => (data && data.length ? new Set(data) : EMPTY), [data])
}
