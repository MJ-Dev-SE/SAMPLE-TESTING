import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/auth'
import { requireLogin, errText } from '../../lib/alert'
import {
  analyzeContent,
  askFollowUp,
  getConversation,
  listMessages,
  type AiContentType,
  type AiMessage,
} from '../../lib/aiAssistant'

/**
 * Owns all state for one record's AI assistant (button + panel). `contentType`
 * mirrors lib/comments.ts's polymorphic model — 'post' also covers photo pages
 * that haven't grown a comment anchor post, via contentType='photo' instead.
 * Split out of the components so the button (header) and panel (below the
 * content) can live in different spots of a page's layout while sharing state.
 */
export function useAiAssistant(contentType: AiContentType, contentId: string) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The raw error (missing table, RLS, Gemini quota, …) is a developer/ops detail —
  // log it for debugging but never show it verbatim to the end user.
  const friendlyError = (err: unknown) => {
    console.error('[ai-assistant]', errText(err))
    return t('aiAssistant.unavailable')
  }

  const ensureLoaded = async () => {
    if (loaded) return
    setLoading(true)
    setError(null)
    try {
      let convo = await getConversation(contentType, contentId)
      let msgs = convo ? await listMessages(convo.id) : []
      if (msgs.length === 0) {
        // No conversation yet, OR one exists but the initial analysis never
        // completed (e.g. a prior Gemini error) — (re)run it via the Edge
        // Function; it retries in place rather than creating a duplicate.
        const created = await analyzeContent(contentType, contentId)
        convo = { id: created.conversationId }
        msgs = await listMessages(convo.id)
      }
      if (!convo) throw new Error('The AI assistant returned an unexpected response.')
      setConversationId(convo.id)
      setMessages(msgs)
      setLoaded(true)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const toggle = async () => {
    if (open) {
      setOpen(false)
      return
    }
    if (!user) {
      const go = await requireLogin(
        t('auth.loginRequiredTitle'),
        t('aiAssistant.loginRequiredText'),
        t('auth.loginRequiredConfirm'),
        t('auth.loginRequiredCancel'),
      )
      if (go) navigate('/user/login', { state: { from: location } })
      return
    }
    setOpen(true)
    void ensureLoaded()
  }

  const send = async (question: string) => {
    if (!conversationId) return
    const optimistic: AiMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      message: question,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setSending(true)
    setError(null)
    try {
      const reply = await askFollowUp(contentType, contentId, question)
      setMessages((prev) => [...prev, reply])
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSending(false)
    }
  }

  return { open, loading, messages, sending, error, toggle, send }
}
