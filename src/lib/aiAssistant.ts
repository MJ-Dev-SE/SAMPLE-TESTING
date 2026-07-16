import { supabase } from './supabase'

/**
 * Client for the per-record AI assistant (supabase/functions/ai-assistant +
 * supabase/ai_assistant.sql). Works on any center-displayed record — posts
 * (incl. photo pages), businesses, advertisements, news/information articles —
 * the same polymorphic (content_type, content_id) pattern lib/comments.ts uses.
 * Reads go straight to Supabase (RLS scopes every row to `auth.uid()`, so this
 * can never see another user's conversation). Writes — the initial analysis
 * and every chat turn — go through the Edge Function, the only place holding
 * the Gemini API key.
 */

export type AiContentType = 'post' | 'photo' | 'business' | 'advertisement' | 'news'

export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  message: string
  created_at: string
}

/** The structured shape Gemini returns for the FIRST message of a conversation. */
export interface AiAnalysis {
  summary: string
  mainPoints: string[]
  importantDetails: string[]
  issues: string[]
  suggestions: string[]
  followUpQuestions: string[]
}

/** Parses an assistant message as the initial structured analysis, or null if it's an ordinary chat reply. */
export function asAnalysis(m: AiMessage): AiAnalysis | null {
  if (m.role !== 'assistant') return null
  try {
    const parsed = JSON.parse(m.message)
    if (parsed && Array.isArray(parsed.mainPoints) && typeof parsed.summary === 'string') return parsed as AiAnalysis
    return null
  } catch {
    return null
  }
}

/** This user's existing conversation for a record, if any — a direct RLS-scoped read, no Edge Function call. */
export async function getConversation(contentType: AiContentType, contentId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Full message history for a conversation the caller owns (RLS-enforced), oldest first. */
export async function listMessages(conversationId: string): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('id, role, message, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as AiMessage[]
}

async function invoke(body: {
  contentType: AiContentType
  contentId: string
  message?: string
}): Promise<{ conversationId: string; message: AiMessage | null }> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', { body })
  if (error) {
    // FunctionsHttpError carries the function's own JSON error body on `.context`.
    const ctx = (error as { context?: Response }).context
    const parsed = ctx ? await ctx.clone().json().catch(() => null) : null
    throw new Error((parsed as { error?: string } | null)?.error || error.message || 'The AI assistant is unavailable.')
  }
  return data
}

/**
 * First-ever open of a record's AI assistant: creates the conversation and runs
 * the initial analysis (stored as the first message). Callers should follow up
 * with listMessages(conversationId) to load the canonical, persisted result.
 */
export async function analyzeContent(contentType: AiContentType, contentId: string): Promise<{ conversationId: string }> {
  const { conversationId, message } = await invoke({ contentType, contentId })
  if (!message || !asAnalysis(message)) throw new Error('The AI assistant returned an unexpected response.')
  return { conversationId }
}

/** A follow-up question in an existing conversation. Returns the assistant's reply. */
export async function askFollowUp(contentType: AiContentType, contentId: string, question: string): Promise<AiMessage> {
  const { message } = await invoke({ contentType, contentId, message: question })
  if (!message) throw new Error('The AI assistant returned an unexpected response.')
  return message
}
