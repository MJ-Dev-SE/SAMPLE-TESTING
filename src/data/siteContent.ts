import type { SiteContentRec } from '../types'
import raw from './siteContent.json'

/**
 * DATA SLOT: siteContent — canonical seed/fallback for the `site_content` table.
 * This JSON is the single source of truth shared by the app (offline fallback)
 * and scripts/seed.mjs (DB seed). The live site reads the DB first (lib/content.ts)
 * and only falls back here when the table is missing or unreachable, so pages
 * like Terms of Use never render empty.
 */
export const siteContentFallback = raw as SiteContentRec[]

export const fallbackContentBySlug = (slug: string): SiteContentRec | null =>
  siteContentFallback.find((r) => r.slug === slug && r.active) ?? null
