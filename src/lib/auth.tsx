import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Row shape of public.profiles (see the SQL in the README / setup notes). */
export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ needsEmailConfirm: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  /** Redirect to Google's consent screen; returns to the app already logged in. */
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  /** Persist a new avatar URL on the user's profile and update context. */
  updateAvatar: (avatarUrl: string) => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  return data ?? null
}

/**
 * Return the user's profile, creating it if missing.
 * Accounts made before the DB trigger existed have no profiles row, which would
 * make member posts fail the author_id → profiles(id) foreign key. This self-heals
 * that: the RLS "insert your own profile" policy lets a signed-in user create it.
 */
async function ensureProfile(user: User): Promise<Profile | null> {
  const existing = await fetchProfile(user.id)
  if (existing) return existing

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>
  const base =
    meta.username || meta.full_name || meta.name || user.email?.split('@')[0] || 'user'

  // Try the natural name first; if the username is taken, fall back to a unique one.
  for (const uname of [base, `${base}_${user.id.slice(0, 4)}`]) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          username: uname,
          display_name: meta.full_name || meta.name || base,
          avatar_url: meta.avatar_url ?? null,
        },
        { onConflict: 'id' },
      )
      .select('id, username, display_name, avatar_url')
      .maybeSingle()
    if (!error) return data ?? null
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Load any persisted session on mount.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) ensureProfile(data.session.user).then(setProfile)
      setLoading(false)
    })

    // 2. React to sign-in / sign-out / token-refresh events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user) ensureProfile(next.user).then(setProfile)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp: AuthState['signUp'] = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // username is stored in user metadata; a DB trigger copies it into public.profiles.
      options: { data: { username } },
    })
    if (error) throw error
    // If email confirmation is ON, there is no session yet until the user confirms.
    return { needsEmailConfirm: !data.session }
  }

  const signIn: AuthState['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInWithGoogle: AuthState['signInWithGoogle'] = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Come back to whatever origin we're on (works for localhost AND the LAN IP).
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  const signOut: AuthState['signOut'] = async () => {
    await supabase.auth.signOut()
  }

  const updateAvatar: AuthState['updateAvatar'] = async (avatarUrl) => {
    const uid = session?.user?.id
    if (!uid) throw new Error('Not signed in')
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', uid)
      .select('id, username, display_name, avatar_url')
      .single()
    if (error) throw error
    setProfile(data as Profile)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/** Access auth state + actions. Must be used under <AuthProvider>. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
