/**
 * SLUG GENERATION — the single client-side slugify used by admin forms and
 * URL helpers. Mirrors public.slugify() in supabase/seo.sql (the DB trigger is
 * the authority for uniqueness; this exists for live previews / suggestions).
 *
 * Rules: NFKD-normalize + strip Latin diacritics (café → cafe), keep Korean
 * syllables intact (Korean slugs are valid, percent-encoded URLs and rank for
 * Korean queries), lowercase, everything else → hyphen, dedupe/trim hyphens,
 * cap length, and fall back when nothing slug-able remains (e.g. emoji-only).
 */

export const SLUG_MAX_LENGTH = 80

/** Basic slugify. Returns '' when the input has no usable characters. */
export function slugify(input: string): string {
  const cleaned = (input ?? '')
    // NFKD splits Latin accents into combining marks (stripped next) and
    // decomposes Hangul into jamo; the final NFC recomposes the Hangul.
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned.slice(0, SLUG_MAX_LENGTH).replace(/-+$/g, '')
}

/**
 * Slugify with a guaranteed non-empty result: falls back to `fallback`
 * (e.g. "post-3f2a91c4" from the row id) when the title yields nothing.
 */
export function slugifyOr(input: string, fallback: string): string {
  return slugify(input) || fallback
}

/** Whether a stored slug is valid for use in a public URL. */
export function isValidSlug(slug: string | null | undefined): slug is string {
  if (!slug) return false
  return /^[a-z0-9가-힣](?:[a-z0-9가-힣-]*[a-z0-9가-힣])?$/.test(slug)
}

/**
 * Make `base` unique against a set of already-taken slugs by appending -2, -3…
 * (client-side helper for admin previews; the DB trigger re-checks on save).
 */
export function uniqueSlug(base: string, taken: Set<string> | string[]): string {
  const set = taken instanceof Set ? taken : new Set(taken)
  if (!set.has(base)) return base
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`
    if (!set.has(candidate)) return candidate
  }
}
