// supabase/functions/track-visit/index.ts
//
// Records one page view into public.page_visits. Deploy with:
//   supabase functions deploy track-visit
//
// Why an Edge Function and not a plain client insert: the browser can never
// read its own public IP, only a server sees it (via the x-forwarded-for
// header on the incoming request) — and page_visits has NO insert policy, so
// this function's service-role client is the only way a row gets written.
// Public endpoint (no auth REQUIRED): anonymous visitors must be trackable
// too. If the caller IS logged in, supabase-js auto-attaches their access
// token, so we opportunistically resolve user_id from it when present.
//
// Request body: { visitorId: string, path: string, referrer?: string }

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Zeroes the last IPv4 octet / last 4 IPv6 groups — "same area", not an address. */
function maskIp(ip: string): string | null {
  const v = ip.trim()
  if (!v) return null
  if (v.includes('.')) {
    const parts = v.split('.')
    if (parts.length !== 4) return null
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`
  }
  if (v.includes(':')) {
    const parts = v.split(':').filter(Boolean)
    if (parts.length < 3) return null
    return `${parts.slice(0, 4).join(':')}::x`
  }
  return null
}

function clientIp(req: Request): string | null {
  // x-forwarded-for can be a comma-separated chain (client, proxy1, proxy2, …) — the
  // first entry is the original client. Supabase's edge runtime sits behind Cloudflare.
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: { visitorId?: string; path?: string; referrer?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  const visitorId = String(payload.visitorId ?? '').trim().slice(0, 100)
  const path = String(payload.path ?? '').trim().slice(0, 500)
  const referrer = payload.referrer ? String(payload.referrer).trim().slice(0, 500) : null
  if (!visitorId || !path) return json({ error: 'visitorId and path are required.' }, 400)

  // Opportunistic: resolve the signed-in user from their own JWT, if any. Never
  // trust a client-supplied user id — an invalid/missing token just means "anonymous".
  let userId: string | null = null
  const authHeader = req.headers.get('Authorization')
  if (authHeader) {
    const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data } = await asUser.auth.getUser()
    userId = data?.user?.id ?? null
  }

  const ip = clientIp(req)
  const userAgent = req.headers.get('user-agent')?.slice(0, 300) ?? null

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { error } = await db.from('page_visits').insert({
    visitor_id: visitorId,
    user_id: userId,
    path,
    referrer,
    user_agent: userAgent,
    ip_masked: ip ? maskIp(ip) : null,
  })
  if (error) return json({ error: error.message }, 500)

  return json({ ok: true })
})
