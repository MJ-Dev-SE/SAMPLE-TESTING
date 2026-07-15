import { SITE_URL } from '../../config/site'
import { publicUrl } from '../media'

/**
 * URL HELPERS for metadata — canonical URLs and absolute image URLs.
 * All canonical/OG URLs must be absolute; these are the only places that
 * prepend the site origin (SITE_URL from src/config/site.ts).
 */

/** Strip a leading /en or /ko locale prefix — canonicals point at the default URL. */
export function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|ko)(?=\/|$)/, '')
  return stripped === '' ? '/' : stripped
}

/** Absolute canonical URL for a site-relative path (query strings allowed). */
export function canonicalUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const rel = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${rel === '/' ? '/' : rel}`
}

/** Locale-prefixed variant of a path, for hreflang alternates. */
export function localeUrl(path: string, locale: 'en' | 'ko'): string {
  const rel = stripLocalePrefix(path.startsWith('/') ? path : `/${path}`)
  return `${SITE_URL}/${locale}${rel === '/' ? '' : rel}`
}

/**
 * Absolute URL for a social-share image. Accepts a media-bucket path
 * ("businesses/x.jpg" → Supabase public URL), a site-relative asset
 * ("/logo.png" → SITE_URL + path) or an already-absolute URL.
 */
export function absoluteImageUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return ''
  const resolved = publicUrl(pathOrUrl)
  if (/^https?:\/\//i.test(resolved)) return resolved
  return canonicalUrl(resolved)
}
