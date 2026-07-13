import type { LinkRec, PolicyRec } from '../types'
import raw from './siteContent.json'

/**
 * OFFLINE FALLBACK for the footer Links + Policies (and their detail pages).
 * `siteContent.json` is the shared content source: the app reads the DB first
 * (lib/content.ts) and only falls back here when the `links` / `policies` tables
 * are missing or unreachable, so the footer and policy pages never render empty.
 * The same JSON seeds the DB (scripts/seed.mjs).
 */
interface RawRow {
  slug: string
  content_type: 'advertisement' | 'link' | 'policy'
  section: string
  sort: number
  active: boolean
  image_url: string | null
  url: string | null
  category?: string | null
  title: { en: string; ko: string }
  summary: { en: string; ko: string }
  body: { en: string; ko: string }
}

const rows = raw as RawRow[]
const EMPTY = { en: '', ko: '' }

export function fallbackLinks(): LinkRec[] {
  return rows
    .filter((r) => r.content_type === 'link' && r.active)
    .map((r, i) => ({
      id: r.slug,
      slug: r.slug,
      title: r.title,
      description: r.summary ?? EMPTY,
      body: r.body ?? EMPTY,
      url: r.url,
      image_url: r.image_url,
      category: r.category ?? null,
      section: 'footer-link',
      sort: r.sort ?? i,
    }))
}

export const fallbackLinkBySlug = (slug: string): LinkRec | null =>
  fallbackLinks().find((r) => r.slug === slug) ?? null

export function fallbackPolicies(): PolicyRec[] {
  return rows
    .filter((r) => r.content_type === 'policy' && r.active)
    .map((r, i) => ({
      id: r.slug,
      slug: r.slug,
      title: r.title,
      summary: r.summary ?? EMPTY,
      body: r.body ?? EMPTY,
      sort: r.sort ?? i,
    }))
}

export const fallbackPolicyBySlug = (slug: string): PolicyRec | null =>
  fallbackPolicies().find((r) => r.slug === slug) ?? null
