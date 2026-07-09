import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client (singleton). Reads the project URL + anon key from Vite env.
 * The anon key is public-safe — it only grants what Row-Level Security allows.
 * Configure the keys in `.env.local` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Surfaced early in the console so a missing .env.local is obvious during dev.
  console.error('[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true, // keep the user logged in across reloads (localStorage)
    autoRefreshToken: true,
    detectSessionInUrl: true, // handles email-confirmation / magic-link redirects
  },
})
