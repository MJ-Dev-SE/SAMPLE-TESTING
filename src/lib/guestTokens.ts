/**
 * Tracks which guest comments THIS browser authored, so it can offer a Delete
 * button for them later. The server never trusts this on its own — deletion
 * goes through delete_guest_comment(id, token), which only succeeds if the
 * token matches the row in the database (see supabase/content.sql).
 */
const KEY = 'guestCommentTokens'

function readAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function saveGuestCommentToken(commentId: string, token: string): void {
  const all = readAll()
  all[commentId] = token
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage full / private mode — the delete button just won't show later */
  }
}

export function getGuestCommentToken(commentId: string): string | null {
  return readAll()[commentId] ?? null
}

export function clearGuestCommentToken(commentId: string): void {
  const all = readAll()
  delete all[commentId]
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}
