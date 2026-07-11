import { supabase } from '../lib/supabase'

/** One account's login-audit row (from the admin_recent_logins RPC). */
export interface LoginRow {
  id: string
  email: string | null
  username: string | null
  last_sign_in_at: string | null
  created_at: string
  is_admin: boolean
}

/**
 * Recent sign-ins across the system, newest first. Backed by the admin-only
 * SECURITY DEFINER function `admin_recent_logins` (see supabase/admin.sql) —
 * it raises "not authorized" for non-admin callers, so this fails soft to [].
 */
export async function listRecentLogins(limit = 50): Promise<LoginRow[]> {
  const { data, error } = await supabase.rpc('admin_recent_logins', { p_limit: limit })
  if (error) throw error
  return (data ?? []) as LoginRow[]
}

/** ISO → readable local date + time (e.g. "Jul 11, 2026, 3:42 PM"), or "—". */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
