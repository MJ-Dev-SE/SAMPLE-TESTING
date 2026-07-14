/**
 * Stable per-browser anonymous identifier, used ONLY to dedupe post view counts
 * for logged-out visitors (see record_post_view() in supabase/community.sql).
 * Not tied to any account; a private/incognito window or cleared storage gets a
 * fresh one, which is fine — the goal is "not the same click spamming refresh,"
 * not cross-session tracking.
 */
const KEY = 'mtAnonSessionId'

export function getAnonSessionId(): string {
  try {
    const existing = localStorage.getItem(KEY)
    if (existing) return existing
    const next = crypto.randomUUID()
    localStorage.setItem(KEY, next)
    return next
  } catch {
    // storage unavailable (private mode / disabled) — fall back to an
    // in-memory id for this page load only; dedup just won't persist.
    return crypto.randomUUID()
  }
}
