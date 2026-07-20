import type { AdPosition, Localized } from '../types'

/**
 * PER-HOSTNAME BRANDING — the single config that decides how the SAME app
 * presents itself on each domain it is served from. Page content is identical
 * everywhere; only the identity layer (logo, site name, title/meta defaults,
 * favicon, ad slots) switches with the request host.
 *
 * How it works: this is a client-rendered SPA, so "request host" means
 * window.location.hostname, resolved ONCE at module load into `activeBrand`.
 * Everything brandable reads from `activeBrand`:
 *   - src/config/site.ts   → SITE_URL / SITE_NAME / DEFAULT_TITLE / DEFAULT_DESCRIPTION / DEFAULT_OG_IMAGE
 *   - components/Logo.tsx  → header+footer logo image, alt text, wordmark fallback
 *   - lib/content.ts       → advertisement slots (per-brand position keys, see `adPrefix`)
 *   - main.tsx             → pre-hydration favicon / tab title swap
 *
 * The FIRST entry is the default brand (manilatour) — any unknown hostname
 * (localhost, previews, the bare IP) falls back to it, so the current
 * manilatour.com output is byte-identical to before this config existed: its
 * values below are the exact literals that used to be hardcoded.
 *
 * To add a domain: append a BrandConfig here, then allow the hostname at the
 * hosting layer (DNS + the static host's domain list; see docs in the PR/chat).
 */
export interface BrandConfig {
  /** Stable key — also the advertisement position prefix root. */
  id: string
  /** Hostnames (lowercase, no "www." — it is stripped before matching). */
  hostnames: string[]
  /** og:site_name + the "Page | <name>" title suffix. */
  siteName: string
  /**
   * Canonical origin for this brand's own domain (canonical/OG/hreflang URLs).
   * null = defer to VITE_SITE_URL env (the default brand's behavior).
   */
  siteUrl: string | null
  /** <title> when a page supplies none. */
  defaultTitle: Localized
  /** Meta description when a page supplies none. */
  defaultDescription: Localized
  /** Default social-share image (/public asset). */
  ogImage: string
  /** Tab icon override; null = keep index.html's favicon as-is. */
  favicon: string | null
  /** Pre-hydration tab title override; null = keep index.html's <title> as-is. */
  documentTitle: string | null
  logo: {
    /** /public path of the horizontal logo image. */
    src: string
    alt: string
    /** aria-label of the logo's home link. */
    homeAriaLabel: string
    /** Text wordmark shown when the logo image is missing/fails to load. */
    wordmarkTitle: string
    wordmarkSubtitle: string
  }
  /**
   * Advertisement slot scoping — PER POSITION. Positions listed in
   * `brandedAdPositions` read this brand's own inventory, stored under
   * `adPrefix + position` (e.g. 'hanin:header') in
   * public.advertisements.position (plain text column — no migration needed).
   * Every position NOT listed falls through to the shared base slots
   * ('header', 'wing-left', …), i.e. shows the same creatives as the default
   * brand. Base brand: adPrefix '' and an empty list — everything shared.
   */
  adPrefix: string
  brandedAdPositions: AdPosition[]
}

const MANILATOUR: BrandConfig = {
  id: 'manilatour',
  hostnames: ['manilatour.com'],
  siteName: 'Manila Tour',
  siteUrl: null, // VITE_SITE_URL env keeps deciding, exactly as before
  defaultTitle: {
    en: 'Manila Tour — Korean community & travel guide for the Philippines',
    ko: '마닐라 여행 — 필리핀 한인 커뮤니티 & 여행 가이드',
  },
  defaultDescription: {
    en: 'Manila Tour is a Korean–Philippines community portal: travel information, news, Q&A, a business directory, jobs and immigration tips for life in the Philippines.',
    ko: '마닐라 여행은 한국–필리핀 커뮤니티 포털입니다. 여행 정보, 뉴스, 질문답변, 업소록, 구인구직, 이민 정보를 제공합니다.',
  },
  ogImage: '/logo.png',
  favicon: null, // index.html's /logo-mark.jpg stays
  documentTitle: null, // index.html's "Manila Tour- 마닐라 여행" stays
  logo: {
    src: '/brand-logo.png',
    alt: 'Manila Tour',
    homeAriaLabel: 'Manila Tour — Home',
    wordmarkTitle: 'Manila Tour',
    wordmarkSubtitle: 'Korean · Philippines Guide',
  },
  adPrefix: '',
  brandedAdPositions: [],
}

/**
 * hanin.tv — second domain, same content, own identity.
 * [HANIN: …] values are placeholders awaiting the real logo/text/title from
 * the client; the structure is final. 'hanin.localhost' is included so the
 * branding can be previewed locally (http://hanin.localhost:5176) without DNS.
 */
const HANIN: BrandConfig = {
  id: 'hanin',
  hostnames: ['hanin.tv', 'hanin.localhost'],
  siteName: 'Hanin TV', // [HANIN: display name]
  siteUrl: 'https://hanin.tv',
  defaultTitle: {
    en: 'Hanin TV — Korean community & travel guide for the Philippines', // [HANIN: default title EN]
    ko: '하닌 TV — 필리핀 한인 커뮤니티 & 여행 가이드', // [HANIN: default title KO]
  },
  defaultDescription: {
    en: 'Hanin TV is a Korean–Philippines community portal: travel information, news, Q&A, a business directory and tips for life in the Philippines.', // [HANIN: description EN]
    ko: '하닌 TV는 한국–필리핀 커뮤니티 포털입니다. 여행 정보, 뉴스, 질문답변, 업소록, 생활 정보를 제공합니다.', // [HANIN: description KO]
  },
  ogImage: '/brand-logo-hanin.png', // [HANIN: /public social-share image]
  favicon: '/favicon-hanin.png', // [HANIN: /public tab icon]
  documentTitle: 'Hanin TV', // [HANIN: pre-hydration tab title]
  logo: {
    src: '/brand-logo-hanin.png', // [HANIN: /public horizontal logo]
    alt: 'Hanin TV',
    homeAriaLabel: 'Hanin TV — Home',
    wordmarkTitle: 'Hanin TV', // [HANIN: wordmark text fallback]
    wordmarkSubtitle: 'Korean · Philippines Community', // [HANIN: wordmark subtitle]
  },
  adPrefix: 'hanin:',
  // Only the two header banner slots differ on hanin.tv (rows stored as
  // position='hanin:header'); wings, homepage banners and footer stay shared
  // with manilatour.
  brandedAdPositions: ['header'],
}

/** All brands — first entry is the default/fallback. */
export const BRANDS: BrandConfig[] = [MANILATOUR, HANIN]

/** Brand for a hostname ("www." tolerated); unknown hosts get the default brand. */
export function resolveBrand(hostname: string): BrandConfig {
  const h = hostname.toLowerCase().replace(/^www\./, '')
  return BRANDS.find((b) => b.hostnames.includes(h)) ?? BRANDS[0]
}

/** The brand serving THIS page load. */
export const activeBrand: BrandConfig = resolveBrand(
  typeof window !== 'undefined' ? window.location.hostname : '',
)
