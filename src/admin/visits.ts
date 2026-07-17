import { supabase } from '../lib/supabase'

/** One page-view row, with the profile (name + picture) if the visitor was logged in. */
export interface VisitRow {
  id: string
  visitor_id: string
  user_id: string | null
  path: string
  referrer: string | null
  ip_masked: string | null
  created_at: string
  visitor: { username: string | null; display_name: string | null; avatar_url: string | null } | null
}

export interface VisitStats {
  total_visits: number
  unique_visitors: number
  visits_today: number
  logged_in_visits: number
}

export interface TopPage {
  path: string
  visits: number
}

const VISIT_COLS = 'id, visitor_id, user_id, path, referrer, ip_masked, created_at'
const VISITOR_SELECT = 'visitor:profiles(username, display_name, avatar_url)'

/** Most recent page views, newest first. Backed by public.page_visits (admin-only RLS). */
export async function listRecentVisits(limit = 50): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from('page_visits')
    .select(`${VISIT_COLS}, ${VISITOR_SELECT}`)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as VisitRow[]
}

/** Aggregate KPIs, computed server-side by the admin_visit_stats() RPC. */
export async function getVisitStats(): Promise<VisitStats | null> {
  const { data, error } = await supabase.rpc('admin_visit_stats')
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return (row as VisitStats) ?? null
}

/** Most-visited paths, computed server-side by the admin_top_pages() RPC. */
export async function getTopPages(limit = 5): Promise<TopPage[]> {
  const { data, error } = await supabase.rpc('admin_top_pages', { p_limit: limit })
  if (error) throw error
  return (data ?? []) as TopPage[]
}

/** Short label for a visit's "who": profile name if logged in, else a shortened anonymous id. */
export function visitorLabel(row: VisitRow): string {
  if (row.visitor?.display_name) return row.visitor.display_name
  if (row.visitor?.username) return row.visitor.username
  return row.visitor_id.slice(0, 8)
}
