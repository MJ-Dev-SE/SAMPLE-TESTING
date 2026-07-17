import { supabase } from './supabase'
import { getVisitorId } from './visitorId'

/**
 * Fires a page-view record at the track-visit Edge Function (see
 * supabase/functions/track-visit + supabase/page_visits.sql). Best-effort and
 * silent: a failed/blocked tracking call must never affect the visitor's
 * actual browsing experience, so errors are swallowed (not surfaced to the UI).
 * supabase-js auto-attaches the caller's access token when logged in, which is
 * how the function resolves user_id — anonymous visitors send none.
 */
export function trackPageVisit(path: string): void {
  const visitorId = getVisitorId()
  void supabase.functions
    .invoke('track-visit', {
      body: { visitorId, path, referrer: document.referrer || null },
    })
    .catch(() => {})
}
