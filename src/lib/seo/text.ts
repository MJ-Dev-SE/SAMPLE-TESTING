/**
 * TEXT UTILITIES for metadata — HTML stripping, safe truncation and
 * meta-description excerpts. Pure functions, no DOM dependency (they also run
 * in the sitemap script and tests under plain Node).
 */

/** Recommended search-snippet lengths (soft limits — warn, never block). */
export const TITLE_MAX = 60
export const TITLE_MIN = 50
export const DESCRIPTION_MAX = 160
export const DESCRIPTION_MIN = 140

/** Strip HTML tags/entities and collapse whitespace. Regex-based on purpose —
 *  output is only ever used as plain text in <meta> content, never re-rendered. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Truncate on a word boundary with an ellipsis, never exceeding `max`.
 * Falls back to a hard cut for unbroken strings (URLs, Korean without spaces
 * is fine to cut anywhere).
 */
export function truncate(input: string, max: number): string {
  const text = input.trim()
  if (text.length <= max) return text
  const slice = text.slice(0, max - 1)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut.replace(/[\s,.;:!?—-]+$/g, '')}…`
}

/** Build a meta description from raw body text: strip markup, truncate safely. */
export function excerpt(body: string | null | undefined, max = DESCRIPTION_MAX): string {
  return truncate(stripHtml(body), max)
}

/**
 * Pick the first non-empty candidate (meta_description → excerpt(body) → default),
 * already stripped/truncated. Centralises the fallback chain detail pages use.
 */
export function metaDescription(
  ...candidates: (string | null | undefined)[]
): string {
  for (const c of candidates) {
    const text = excerpt(c)
    if (text) return text
  }
  return ''
}
