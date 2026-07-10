import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

/**
 * Whether the logged-in member is listed in public.admins.
 * `null` while checking — callers should show nothing/spinner until resolved.
 * (RLS only lets a user read their OWN admin row, so this leaks nothing.)
 */
export function useIsAdmin(): boolean | null {
  const { user, loading } = useAuth()
  const [admin, setAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setAdmin(false)
      return
    }
    let alive = true
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(
        ({ data, error }) => alive && setAdmin(!!data && !error),
        () => alive && setAdmin(false), // network failure → treat as not admin, never hang
      )
    return () => {
      alive = false
    }
  }, [user, loading])

  return admin
}
