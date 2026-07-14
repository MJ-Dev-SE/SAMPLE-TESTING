import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Profile } from './auth'

/** One conversation, shaped for the UI: the OTHER member + a preview of the latest message. */
export interface ConversationSummary {
  id: string
  updatedAt: string
  otherUser: Profile | null
  lastMessage: { body: string; createdAt: string; senderId: string | null } | null
  /** True when the latest message is newer than this viewer's last_read_at. */
  hasUnread: boolean
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string | null
  body: string
  createdAt: string
  sender?: Profile | null
}

export interface ProfileSearchHit extends Profile {}

const PROFILE_COLS = 'id, username, display_name, avatar_url'

/**
 * This viewer's conversations, newest-active first, each with the other
 * participant's profile and a one-message preview (via PostgREST's per-embed
 * order/limit — see the `{ foreignTable: 'messages' }` options below).
 */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const { data: memberships, error: mErr } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
  if (mErr) throw mErr
  const ids = (memberships ?? []).map((m) => m.conversation_id)
  if (ids.length === 0) return []
  const lastReadByConv = new Map((memberships ?? []).map((m) => [m.conversation_id, m.last_read_at as string | null]))

  const { data, error } = await supabase
    .from('conversations')
    .select(
      `id, updated_at,
       members:conversation_members(user_id, profile:profiles(${PROFILE_COLS})),
       messages(message_body, created_at, sender_id)`,
    )
    .in('id', ids)
    .order('updated_at', { ascending: false })
    .order('created_at', { foreignTable: 'messages', ascending: false })
    .limit(1, { foreignTable: 'messages' })
  if (error) throw error

  return (data ?? []).map((row: any) => {
    const other = (row.members ?? []).find((m: any) => m.user_id !== userId)?.profile ?? null
    const last = (row.messages ?? [])[0] ?? null
    const lastReadAt = lastReadByConv.get(row.id) ?? null
    const hasUnread = !!last && last.sender_id !== userId && (!lastReadAt || last.created_at > lastReadAt)
    return {
      id: row.id,
      updatedAt: row.updated_at,
      otherUser: other,
      lastMessage: last ? { body: last.message_body, createdAt: last.created_at, senderId: last.sender_id } : null,
      hasUnread,
    }
  })
}

/**
 * Total unread MESSAGE count across every conversation this viewer belongs to
 * (messages from others, newer than that conversation's last_read_at). Small
 * client-side join rather than a DB view — fine at this app's scale, and keeps
 * the "unread" definition in one place with listConversations' hasUnread flag.
 */
export async function unreadCount(userId: string): Promise<number> {
  const { data: memberships, error: mErr } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
  if (mErr) throw mErr
  const ids = (memberships ?? []).map((m) => m.conversation_id)
  if (ids.length === 0) return 0
  const lastReadByConv = new Map((memberships ?? []).map((m) => [m.conversation_id, m.last_read_at as string | null]))

  const { data: msgs, error } = await supabase
    .from('messages')
    .select('conversation_id, sender_id, created_at')
    .in('conversation_id', ids)
    .neq('sender_id', userId)
  if (error) throw error

  return (msgs ?? []).filter((m) => {
    const lastReadAt = lastReadByConv.get(m.conversation_id)
    return !lastReadAt || m.created_at > lastReadAt
  }).length
}

/**
 * Finds an existing 1:1 conversation with `otherUserId`, or creates one —
 * server-side, via start_direct_conversation() (supabase/community.sql), so
 * two tabs racing to message the same person can never create duplicates.
 */
export async function getOrCreateDirectConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_direct_conversation', { p_other_user_id: otherUserId })
  if (error) throw error
  return data as string
}

/**
 * Messages for a conversation, OLDEST first (ready to render top-to-bottom).
 * Pass `before` (an ISO timestamp) to load an older page — e.g. the created_at
 * of the currently-earliest-loaded message — for "load older messages".
 */
export async function listMessages(
  conversationId: string,
  opts: { before?: string; limit?: number } = {},
): Promise<ChatMessage[]> {
  let q = supabase
    .from('messages')
    .select(`id, conversation_id, sender_id, message_body, created_at, sender:profiles(${PROFILE_COLS})`)
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 30)
  if (opts.before) q = q.lt('created_at', opts.before)
  const { data, error } = await q
  if (error) throw error
  return ((data ?? []) as any[])
    .map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      body: r.message_body,
      createdAt: r.created_at,
      sender: r.sender,
    }))
    .reverse()
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, message_body: body })
    .select(`id, conversation_id, sender_id, message_body, created_at, sender:profiles(${PROFILE_COLS})`)
    .single()
  if (error) throw error
  const r = data as any
  return { id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, body: r.message_body, createdAt: r.created_at, sender: r.sender }
}

/** Marks this viewer's membership row as read-through-now (clears the unread badge for this thread). */
export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
  if (error) throw error
}

/** Live INSERT delivery for one conversation's messages (Supabase Realtime). */
export function subscribeToMessages(conversationId: string, onInsert: (m: ChatMessage) => void): RealtimeChannel {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const r = payload.new as any
        onInsert({ id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, body: r.message_body, createdAt: r.created_at })
      },
    )
    .subscribe()
}

/**
 * Live user search for "start a new conversation" — partial, case-insensitive
 * match on username/display_name, excluding the current viewer. No
 * blocked/disabled/deleted concept exists in the schema today (public.profiles
 * has no status column), so nothing else is filtered out; this is a documented
 * scope limit, not an oversight — see the community-chat plan notes.
 */
export async function searchProfiles(query: string, excludeUserId: string, limit = 8): Promise<ProfileSearchHit[]> {
  const q = query.trim()
  if (!q) return []
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLS)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq('id', excludeUserId)
    .limit(limit * 2) // fetch a bit extra so client-side ranking has room to work with
  if (error) throw error
  const lower = q.toLowerCase()
  const rank = (p: Profile) => {
    const u = (p.username ?? '').toLowerCase()
    const d = (p.display_name ?? '').toLowerCase()
    if (u === lower || d === lower) return 0
    if (u.startsWith(lower) || d.startsWith(lower)) return 1
    return 2
  }
  return ((data ?? []) as Profile[]).sort((a, b) => rank(a) - rank(b)).slice(0, limit)
}
