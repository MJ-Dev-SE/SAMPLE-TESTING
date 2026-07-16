// supabase/functions/ai-assistant/index.ts
//
// Secure backend for the per-record AI assistant (posts, photo pages,
// businesses, advertisements, news/information articles). Deploy with:
//   supabase functions deploy ai-assistant
//   supabase secrets set GEMINI_API_KEY=your-key-here
//
// This is the ONLY place the Gemini API key is used — it lives in the Edge
// Function's secret store, never in frontend code or a VITE_ env var.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform.
//
// Request body: { contentType, contentId, message?: string }
//   contentType: 'post' | 'photo' | 'business' | 'advertisement' | 'news'
//   - message omitted/empty → run the initial analysis, create the
//     conversation, store the analysis as the first assistant message.
//   - message present       → a follow-up chat turn: store the user's
//     message, ask Gemini (record content + full history + question), store
//     and return the reply.
//
// Every user gets their own conversation row (unique on user_id + content_type
// + content_id) — this function never reads or writes another user's rows,
// and the DB's RLS policies (supabase/ai_assistant.sql) block cross-user
// access even if a client tried to bypass this function entirely.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_BODY_CHARS = 6000 // keep the prompt (and cost) bounded for very long records
const MAX_MESSAGE_CHARS = 2000
const MAX_HISTORY_MESSAGES = 20 // most recent turns sent as context

type ContentType = 'post' | 'photo' | 'business' | 'advertisement' | 'news'
const CONTENT_TYPES: ContentType[] = ['post', 'photo', 'business', 'advertisement', 'news']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** { en, ko } jsonb → one display string (en first), or passes plain strings through untouched. */
function localizedText(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  const o = v as { en?: string; ko?: string }
  return o.en || o.ko || ''
}

interface RecordContent {
  title: string
  body: string
}

/** Fetches the record a conversation is about, from whichever table its content_type lives in. */
async function fetchContent(db: SupabaseClient, contentType: ContentType, contentId: string): Promise<RecordContent | null> {
  if (contentType === 'post') {
    const { data } = await db.from('posts').select('title, body').eq('id', contentId).maybeSingle()
    if (!data) return null
    return { title: data.title, body: data.body ?? '' }
  }
  if (contentType === 'photo') {
    const { data } = await db.from('photos').select('title, description, details').eq('slug', contentId).maybeSingle()
    if (!data) return null
    const details = (data.details ?? []).map((d: unknown) => localizedText(d)).filter(Boolean).join('\n')
    return { title: localizedText(data.title), body: [localizedText(data.description), details].filter(Boolean).join('\n\n') }
  }
  if (contentType === 'business') {
    const { data } = await db
      .from('businesses')
      .select('name, category, address, phone, short_intro, detailed_intro, description')
      .eq('id', contentId)
      .maybeSingle()
    if (!data) return null
    const intro = localizedText(data.detailed_intro) || localizedText(data.description) || localizedText(data.short_intro)
    const facts = [
      data.category && `Category: ${data.category}`,
      data.address && `Address: ${data.address}`,
      data.phone && `Phone: ${data.phone}`,
    ].filter(Boolean)
    return { title: data.name, body: [intro, ...facts].filter(Boolean).join('\n') }
  }
  if (contentType === 'advertisement') {
    const { data } = await db.from('advertisements').select('title, description, body').eq('id', contentId).maybeSingle()
    if (!data) return null
    return {
      title: localizedText(data.title),
      body: [localizedText(data.description), localizedText(data.body)].filter(Boolean).join('\n\n'),
    }
  }
  if (contentType === 'news') {
    const { data } = await db.from('news_items').select('title, body').eq('id', contentId).maybeSingle()
    if (!data) return null
    return { title: localizedText(data.title), body: localizedText(data.body) }
  }
  return null
}

const ANALYSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    mainPoints: { type: 'ARRAY', items: { type: 'STRING' } },
    importantDetails: { type: 'ARRAY', items: { type: 'STRING' } },
    issues: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    followUpQuestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['summary', 'mainPoints', 'importantDetails', 'issues', 'suggestions', 'followUpQuestions'],
}

function systemInstruction(contentType: ContentType, title: string, body: string) {
  return (
    `You are an AI assistant embedded on a single ${contentType} page of a community/tourism website. ` +
    `You must answer using ONLY the following record as your context — do not use outside knowledge about ` +
    `other posts, businesses, ads, articles, other users, or the rest of the website. ` +
    `If the user asks something unrelated to this record, politely explain that you can only help with ` +
    `questions about this specific ${contentType}, and invite them to open that other record's own AI assistant instead.\n\n` +
    `--- TITLE ---\n${title}\n\n--- CONTENT ---\n${body.slice(0, MAX_BODY_CHARS)}`
  )
}

async function callGemini(body: Record<string, unknown>) {
  if (!GEMINI_API_KEY) throw new Error('AI assistant is not configured (missing GEMINI_API_KEY).')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini request failed (${res.status}): ${text.slice(0, 300)}`)
  }
  const respJson = await res.json()
  const parts = respJson?.candidates?.[0]?.content?.parts ?? []
  const text = parts.map((p: { text?: string }) => p.text ?? '').join('')
  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Authenticate the caller from their own JWT — never trust a client-supplied user id.
  const authHeader = req.headers.get('Authorization') ?? ''
  const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userErr } = await asUser.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Sign in required.' }, 401)
  const userId = userData.user.id

  let payload: { contentType?: string; contentId?: string; message?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }
  const contentType = String(payload.contentType ?? '') as ContentType
  const contentId = String(payload.contentId ?? '').trim()
  const message = String(payload.message ?? '').trim().slice(0, MAX_MESSAGE_CHARS)
  if (!CONTENT_TYPES.includes(contentType)) return json({ error: 'Invalid contentType.' }, 400)
  if (!contentId) return json({ error: 'contentId is required.' }, 400)

  // Service-role client for the actual work — RLS is already satisfied because
  // WE verified the user above; this just avoids re-deriving policy checks here.
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const record = await fetchContent(db, contentType, contentId)
  if (!record) return json({ error: 'Record not found.' }, 404)

  // Get-or-create this user's private conversation for this record.
  let { data: convo } = await db
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .maybeSingle()

  if (!convo) {
    const { data: created, error: createErr } = await db
      .from('ai_conversations')
      .insert({ user_id: userId, content_type: contentType, content_id: contentId })
      .select('id')
      .single()
    if (createErr || !created) return json({ error: 'Could not start a conversation.' }, 500)
    convo = created
  }
  const conversationId = convo.id as string

  // Whether the analysis still needs to run — based on whether ANY message
  // exists yet, not whether the conversation ROW is new. A conversation row
  // can exist with zero messages if a previous analysis attempt failed after
  // creating the row but before Gemini succeeded (e.g. a quota error) — this
  // makes that retry-able instead of getting permanently stuck empty.
  const { count: msgCount } = await db
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
  const needsAnalysis = (msgCount ?? 0) === 0

  try {
    if (needsAnalysis) {
      // Initial analysis — one Gemini call, structured JSON output.
      const text = await callGemini({
        systemInstruction: { parts: [{ text: systemInstruction(contentType, record.title, record.body) }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'Analyze this and return: a short summary, the main points, important details, ' +
                  'possible issues or unclear parts, suggestions/recommendations, and relevant follow-up ' +
                  'questions a reader might want to ask.',
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', responseSchema: ANALYSIS_SCHEMA },
      })

      const { data: saved, error: saveErr } = await db
        .from('ai_messages')
        .insert({ conversation_id: conversationId, role: 'assistant', message: text })
        .select('id, role, message, created_at')
        .single()
      if (saveErr) throw saveErr

      return json({ conversationId, message: saved })
    }

    if (!message) {
      // Reopening an existing conversation with no new question — nothing to do,
      // the client should just read ai_messages directly (RLS-protected).
      return json({ conversationId, message: null })
    }

    // Follow-up turn: user message stored, full history + record content resent
    // (Gemini's REST API is stateless — every call must include full context).
    const { error: userMsgErr } = await db
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role: 'user', message })
    if (userMsgErr) throw userMsgErr

    const { data: history } = await db
      .from('ai_messages')
      .select('role, message, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_MESSAGES)

    const ordered = (history ?? []).slice().reverse()
    const contents = ordered.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      // The very first assistant turn is the structured JSON analysis — Gemini
      // can read that fine as prior context, no special-casing needed here.
      parts: [{ text: m.message }],
    }))

    const reply = await callGemini({
      systemInstruction: { parts: [{ text: systemInstruction(contentType, record.title, record.body) }] },
      contents,
    })

    const { data: saved, error: saveErr } = await db
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role: 'assistant', message: reply })
      .select('id, role, message, created_at')
      .single()
    if (saveErr) throw saveErr

    return json({ conversationId, message: saved })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'The AI assistant is temporarily unavailable.'
    return json({ error: msg }, 502)
  }
})
