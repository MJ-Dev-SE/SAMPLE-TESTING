const STORAGE_KEY = 'mt_visitor_id'

/**
 * Stable anonymous ID for this browser, used to recognize a returning visitor
 * who is NOT logged in (see supabase/page_visits.sql). Generated once and kept
 * in localStorage — clearing site data or using a different browser/incognito
 * session produces a new one, which is expected (that's genuinely "a new,
 * unrecognized visitor" from the site's point of view).
 */
export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    // Storage unavailable (private-mode edge cases, disabled storage, …) — fall
    // back to a per-load id so tracking can still fire without hard-failing.
    return crypto.randomUUID()
  }
}
