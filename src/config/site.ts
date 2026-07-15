import type { Localized } from '../types'

/**
 * CENTRAL SITE / SEO CONFIG.
 * Everything URL- or identity-related that SEO markup needs lives here, so no
 * component ever hardcodes the production domain. Values come from Vite env:
 *
 *   VITE_SITE_URL   — canonical production origin, e.g. https://manilatour.example
 *   VITE_SITE_NAME  — site display name (defaults to "Manila Tour")
 *
 * In production a missing/placeholder VITE_SITE_URL is surfaced loudly in the
 * console and the app falls back to window.location.origin — pages keep working,
 * but canonical/OG URLs will point at whatever host is serving the SPA, so fix
 * the env var before submitting the sitemap to Search Console.
 */

const RAW_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
const RAW_NAME = (import.meta.env.VITE_SITE_NAME as string | undefined)?.trim()

/** True when VITE_SITE_URL is a usable absolute production origin. */
export function isSiteUrlConfigured(): boolean {
  return !!RAW_URL && /^https?:\/\//i.test(RAW_URL) && !/example\.com/i.test(RAW_URL)
}

function resolveSiteUrl(): string {
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

/** Site display name, appended to page titles ("Page | Manila Tour"). */
export const SITE_NAME = RAW_NAME || 'Manila Tour'

/** Default document title when a page supplies none. */
export const DEFAULT_TITLE: Localized = {
  en: 'Manila Tour — Korean community & travel guide for the Philippines',
  ko: '마닐라 여행 — 필리핀 한인 커뮤니티 & 여행 가이드',
}

/** Default meta description (per locale) when a page supplies none. */
export const DEFAULT_DESCRIPTION: Localized = {
  en: 'Manila Tour is a Korean–Philippines community portal: travel information, news, Q&A, a business directory, jobs and immigration tips for life in the Philippines.',
  ko: '마닐라 여행은 한국–필리핀 커뮤니티 포털입니다. 여행 정보, 뉴스, 질문답변, 업소록, 구인구직, 이민 정보를 제공합니다.',
}

/** Site-relative default social-share image (must exist in /public). */
export const DEFAULT_OG_IMAGE = '/logo.png'

/** Twitter card type used across the site. */
export const TWITTER_CARD = 'summary_large_image'

/** Default locale ordering — mirrors the /en and /ko route prefixes in App.tsx. */
export const LOCALES = ['en', 'ko'] as const
