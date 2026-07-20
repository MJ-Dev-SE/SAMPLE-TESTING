import type { Localized } from '../types'
import { activeBrand, BRANDS } from './brand'

/**
 * CENTRAL SITE / SEO CONFIG.
 * Everything URL- or identity-related that SEO markup needs lives here, so no
 * component ever hardcodes the production domain. Identity values (name, title,
 * description, OG image) come from the per-hostname brand config
 * (src/config/brand.ts); URL + name for the DEFAULT brand still honor Vite env:
 *
 *   VITE_SITE_URL   — canonical production origin, e.g. https://manilatour.example
 *   VITE_SITE_NAME  — site display name (defaults to the brand's name)
 *
 * A secondary brand (e.g. hanin.tv) carries its own siteUrl/siteName in
 * brand.ts and ignores those env vars — one build serves every domain, so a
 * single env value can't describe them all.
 *
 * In production a missing/placeholder VITE_SITE_URL is surfaced loudly in the
 * console and the app falls back to window.location.origin — pages keep working,
 * but canonical/OG URLs will point at whatever host is serving the SPA, so fix
 * the env var before submitting the sitemap to Search Console.
 */

const RAW_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
const RAW_NAME = (import.meta.env.VITE_SITE_NAME as string | undefined)?.trim()

const isDefaultBrand = activeBrand.id === BRANDS[0].id

/** True when VITE_SITE_URL is a usable absolute production origin. */
export function isSiteUrlConfigured(): boolean {
  return !!RAW_URL && /^https?:\/\//i.test(RAW_URL) && !/example\.com/i.test(RAW_URL)
}

function resolveSiteUrl(): string {
  // A non-default brand owns its canonical origin outright (brand.ts).
  if (activeBrand.siteUrl) return activeBrand.siteUrl.replace(/\/+$/, '')
  if (RAW_URL && /^https?:\/\//i.test(RAW_URL)) {
    if (/example\.com/i.test(RAW_URL)) {
      console.error(
        '[seo] VITE_SITE_URL still points at the example.com placeholder — set the real production domain.',
      )
    }
    return RAW_URL.replace(/\/+$/, '')
  }
  if (import.meta.env.PROD) {
    console.error(
      '[seo] VITE_SITE_URL is missing or not an absolute http(s) URL. ' +
        'Canonical/OG URLs are falling back to window.location.origin — set VITE_SITE_URL in the production env.',
    )
  }
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'http://localhost:5175'
}

/** Canonical site origin, no trailing slash. */
export const SITE_URL = resolveSiteUrl()

/** Site display name, appended to page titles ("Page | Manila Tour").
 *  Env override applies to the default brand only — other domains brand themselves. */
export const SITE_NAME = isDefaultBrand ? RAW_NAME || activeBrand.siteName : activeBrand.siteName

/** Default document title when a page supplies none. */
export const DEFAULT_TITLE: Localized = activeBrand.defaultTitle

/** Default meta description (per locale) when a page supplies none. */
export const DEFAULT_DESCRIPTION: Localized = activeBrand.defaultDescription

/** Site-relative default social-share image (must exist in /public). */
export const DEFAULT_OG_IMAGE = activeBrand.ogImage

/** Twitter card type used across the site. */
export const TWITTER_CARD = 'summary_large_image'

/** Default locale ordering — mirrors the /en and /ko route prefixes in App.tsx. */
export const LOCALES = ['en', 'ko'] as const
