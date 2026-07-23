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
 *   - components/Footer.tsx → tagline + copyright line under the footer logo
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
  /**
   * Temporary, reversible kill-switch for this brand's domain — App.tsx
   * renders the honest noindex 404 page for EVERY path when true, instead of
   * the real site. Nothing is deleted: the DNS/Vercel domain binding, the
   * database, and all routes stay fully intact underneath. Flip back to
   * false (or delete the line) to bring the domain back instantly on redeploy.
   */
  disabled?: boolean
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
  /** One-line description under the footer logo. */
  footerTagline: Localized
  /** Footer copyright line (rarely differs by locale, so a single string). */
  footerCopyright: string
  /** Language every page load lands on (see `forceDefaultLocale` for how strictly). */
  defaultLocale: 'en' | 'ko'
  /**
   * true = EVERY page load — fresh visit, reload, or revisit — always opens in
   * `defaultLocale`. No browser Accept-Language detection AND no persistence:
   * the language-switcher still changes what's displayed for the current page
   * view (i18n itself doesn't care where the active language came from), but
   * that choice is never saved, so the next reload resets straight back to
   * `defaultLocale`. false = src/i18n/index.ts's original manilatour.com
   * behavior — detect from the browser on a fresh visit, and an explicit
   * switcher choice persists in that domain's own localStorage and wins on
   * every later visit/reload.
   */
  forceDefaultLocale: boolean
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
  /** How many wing banners each rail shows (WingBanners.tsx). */
  wingCounts: { left: number; right: number }
}

const MANILATOUR: BrandConfig = {
  id: 'manilatour',
  hostnames: ['manilatour.com'],
  // TEMPORARY — manilatour.com shows "not found" for every URL while this is
  // true. See the `disabled` field doc above. Set back to false to reopen.
  disabled: true,
  siteName: 'Manila Tour',
  siteUrl: null, // VITE_SITE_URL env keeps deciding, exactly as before
  defaultTitle: {
    en: 'Manila Tour',
    ko: '',
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
  footerTagline: {
    en: 'Your Korean–Philippines guide to Manila: tours, trusted local businesses, community and travel information.',
    ko: '한인을 위한 마닐라 여행 가이드: 투어, 신뢰할 수 있는 현지 업소, 커뮤니티, 여행 정보.',
  },
  footerCopyright: '© 2026 ManilaTour.Com',
  defaultLocale: 'en',
  forceDefaultLocale: false, // unchanged — still detects the browser's language on a fresh visit
  adPrefix: '',
  brandedAdPositions: [],
  wingCounts: { left: 4, right: 3 }, // unchanged from the original hardcoded WingBanners counts
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
  // Was left blank ("[HANIN: default title EN/KO]") — an empty defaultTitle
  // means Home.tsx (which supplies no title of its own) renders a literal
  // empty <title> and empty <h1> on the hanin.tv homepage, the single most
  // SEO-critical page on the domain. Filled in with real copy; wording is
  // freely editable, nothing structural depends on the exact text.
  defaultTitle: {
    en: 'Hanin TV — Korean Community & Travel Guide for the Philippines',
    ko: '하닌 TV — 필리핀 한인 커뮤니티 & 여행 가이드',
  },
  defaultDescription: {
    en: 'Hanin TV is a Korean–Philippines community portal: travel information, news, Q&A, a business directory and tips for life in the Philippines.', // [HANIN: description EN]
    ko: '하닌 TV는 한국–필리핀 커뮤니티 포털입니다. 여행 정보, 뉴스, 질문답변, 업소록, 생활 정보를 제공합니다.', // [HANIN: description KO]
  },
  ogImage: '/brand-logo-hanin.png', // [HANIN: /public social-share image]
  favicon: '/brand-logo-hanin.png', // [HANIN: /public tab icon]
  documentTitle: 'Hanin TV', // [HANIN: pre-hydration tab title]
  logo: {
    src: '/brand-logo-hanin.png', // [HANIN: /public horizontal logo]
    alt: 'Hanin TV',
    homeAriaLabel: 'Hanin TV — Home',
    wordmarkTitle: 'Hanin TV', // [HANIN: wordmark text fallback]
    wordmarkSubtitle: 'Korean · Philippines Community', // [HANIN: wordmark subtitle]
  },
  footerTagline: {
    en: 'Your Korean–Philippines guide to Manila: tours, trusted local businesses, community and travel information.', // [HANIN: footer tagline EN]
    ko: '한인을 위한 마닐라 여행 가이드: 투어, 신뢰할 수 있는 현지 업소, 커뮤니티, 여행 정보.', // [HANIN: footer tagline KO]
  },
  footerCopyright: '© 2026 Hanin.TV', // [HANIN: footer copyright line]
  defaultLocale: 'ko',
  // EVERY page load — fresh visit, reload, or revisit — always opens in
  // Korean, regardless of browser language or any earlier switcher pick: the
  // switcher still works for the current view, but the choice is never saved.
  forceDefaultLocale: true,
  adPrefix: 'hanin:',
  // Header banners AND the side wings are hanin.tv-specific (rows stored as
  // position='hanin:header' / 'hanin:wing-left' / 'hanin:wing-right');
  // homepage banners and footer stay shared with manilatour.
  brandedAdPositions: ['header', 'wing-left', 'wing-right'],
  wingCounts: { left: 4, right: 4 }, // hanin.tv shows 4 banners per side
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
