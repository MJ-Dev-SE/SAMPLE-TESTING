import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '../lib/auth'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { timeAgo } from '../lib/posts'
import Tooltip from './Tooltip'
import {
  getOrCreateDirectConversation,
  listConversations,
  listMessages,
  markConversationRead,
  searchProfiles,
  sendMessage,
  subscribeToMessages,
  type ChatMessage,
  type ConversationSummary,
  type ProfileSearchHit,
} from '../lib/chat'
import type { Profile } from '../lib/auth'

/** Small circular avatar with an initials/icon fallback — same visual language as LoginCard. */
function Avatar({ profile, size = 36 }: { profile: Profile | null | undefined; size?: number }) {
  const style = { width: size, height: size }
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={style} className="rounded-full object-cover shrink-0" />
  }
  const initial = (profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()
  return (
    <span
      style={style}
      className="shrink-0 rounded-full bg-chip-blue text-accent-blue grid place-items-center text-sm font-semibold"
    >
      {initial}
    </span>
  )
}

const nameOf = (p: Profile | null | undefined) => p?.display_name || p?.username || '—'

/**
 * Shared chat UI: conversation list + live user search (to start a new 1:1) on
 * the left, active thread + composer on the right. Used full-page by
 * routes/Chat.tsx and inside the header slide-over by ChatDrawer.tsx. Realtime
 * message delivery via Supabase Realtime (see subscribeToMessages).
 */
export default function ChatPanel({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeConvo = conversations.find((c) => c.id === activeId) ?? null
  // Desktop-only: shrink the conversation list out of the way once you're inside
  // a thread, so the thread gets the room. Mobile already swaps to single-pane.
  const [listCollapsed, setListCollapsed] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [searchResults, setSearchResults] = useState<ProfileSearchHit[]>([])
  const [searching, setSearching] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const loadConversations = useCallback(() => {
    if (!user) return
    setLoadingConvos(true)
    listConversations(user.id)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvos(false))
  }, [user])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Live user search — debounced, ranked, capped (see lib/chat.ts searchProfiles).
  useEffect(() => {
    if (!user) return
    const q = debouncedQuery.trim()
    if (!q) {
      setSearchResults([])
      setSearching(false)
      return
    }
    let alive = true
    setSearching(true)
    searchProfiles(q, user.id)
      .then((rows) => alive && setSearchResults(rows))
      .catch(() => alive && setSearchResults([]))
      .finally(() => alive && setSearching(false))
    return () => {
      alive = false
    }
  }, [debouncedQuery, user])

  // Open a conversation: load its messages, mark read, subscribe to realtime.
  useEffect(() => {
    channelRef.current?.unsubscribe()
    channelRef.current = null
    if (!activeId || !user) {
      setMessages([])
      return
    }
    let alive = true
    setLoadingMessages(true)
    setHasMore(true)
    listMessages(activeId)
      .then((rows) => {
        if (!alive) return
        setMessages(rows)
        setHasMore(rows.length >= 30)
      })
      .catch(() => alive && setMessages([]))
      .finally(() => alive && setLoadingMessages(false))

    markConversationRead(activeId, user.id)
      .then(() => setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, hasUnread: false } : c))))
      .catch(() => {})

    channelRef.current = subscribeToMessages(activeId, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      if (m.senderId !== user.id) markConversationRead(activeId, user.id).catch(() => {})
      loadConversations()
    })

    return () => {
      alive = false
      channelRef.current?.unsubscribe()
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, user])

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (!loadingMessages) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, loadingMessages])

  const openConversation = (id: string) => {
    setActiveId(id)
    setQuery('')
    setSearchResults([])
  }

  const startConversationWith = async (hit: ProfileSearchHit) => {
    if (!user) return
    try {
      const id = await getOrCreateDirectConversation(hit.id)
      setQuery('')
      setSearchResults([])
      loadConversations()
      openConversation(id)
    } catch {
      /* RLS/network failure — the search box just stays as-is */
    }
  }

  const loadOlder = async () => {
    if (!activeId || messages.length === 0) return
    const el = scrollRef.current
    const prevScrollHeight = el?.scrollHeight ?? 0
    setLoadingOlder(true)
    try {
      const older = await listMessages(activeId, { before: messages[0].createdAt })
      setMessages((prev) => [...older, ...prev])
      setHasMore(older.length >= 30)
      // Older messages are prepended ABOVE what's on screen — without this the
      // browser keeps the same scrollTop, which visually yanks the view down to
      // the new (taller) top. Re-anchor on the message the user was looking at.
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight
      })
    } catch {
      setHasMore(false) // can't reach older messages right now — stop offering the button
    } finally {
      setLoadingOlder(false)
    }
  }

  const submit = async () => {
    if (!user || !activeId || !text.trim() || sending) return
    setSending(true)
    const body = text.trim()
    setText('')
    try {
      const sent = await sendMessage(activeId, user.id, body)
      setMessages((prev) => (prev.some((x) => x.id === sent.id) ? prev : [...prev, sent]))
      loadConversations()
    } catch {
      setText(body) // put it back so the user doesn't lose what they typed
    } finally {
      setSending(false)
    }
  }

  if (!user) return null // ChatButton gates this with requireLogin before it ever mounts

  return (
    <div className="flex h-full min-h-0 border border-neutral-90 rounded-l overflow-hidden bg-white">
      {/* LEFT: search + conversation list — collapses to 0 width (desktop only,
          via listCollapsed) once a thread is open, so the thread gets the room. */}
      <div
        className={`${activeId ? 'hidden sm:flex' : 'flex'} shrink-0 flex-col border-r border-neutral-90 overflow-hidden transition-[width] duration-300 ease-in-out w-full ${
          activeId && listCollapsed ? 'sm:w-0 sm:border-r-0' : 'sm:w-[280px]'
        }`}
      >
        {/* Fixed inner width so the search box/list never reflow while the
            outer wrapper is animating its width down to 0. */}
        <div
          className={`w-full sm:w-[280px] h-full flex flex-col transition-opacity duration-200 ${
            activeId && listCollapsed ? 'sm:opacity-0' : 'opacity-100'
          }`}
        >
        <div className="p-s border-b border-neutral-90">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-subtlest text-xs" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('chat.searchPlaceholder')}
              className="w-full h-9 pl-8 pr-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue"
            />
          </div>
          {query.trim() && (
            <div className="mt-2 border border-neutral-90 rounded-m overflow-hidden max-h-[220px] overflow-y-auto">
              {searching ? (
                <p className="p-3 text-xs text-subtlest text-center">{t('chat.searching')}</p>
              ) : searchResults.length === 0 ? (
                <p className="p-3 text-xs text-subtlest text-center">{t('chat.noUsersFound')}</p>
              ) : (
                searchResults.map((hit) => (
                  <button
                    key={hit.id}
                    type="button"
                    onClick={() => startConversationWith(hit)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-97 text-left"
                  >
                    <Avatar profile={hit} size={28} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-text-normal truncate">{nameOf(hit)}</span>
                      {hit.username && <span className="block text-[11px] text-subtlest truncate">@{hit.username}</span>}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loadingConvos ? (
            <p className="p-4 text-xs text-subtlest text-center">{t('chat.loadingConversations')}</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-xs text-subtlest text-center">{t('chat.noConversations')}</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openConversation(c.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 text-left border-b border-neutral-95 transition-colors hover:bg-neutral-97 ${
                  c.id === activeId ? 'bg-chip-blue/50' : ''
                }`}
              >
                <Avatar profile={c.otherUser} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-1">
                    <span className={`text-sm truncate ${c.hasUnread ? 'font-bold text-text-normal' : 'font-medium text-text-normal'}`}>
                      {nameOf(c.otherUser)}
                    </span>
                    {c.lastMessage && <span className="text-[10px] text-subtlest shrink-0">{timeAgo(c.lastMessage.createdAt)}</span>}
                  </span>
                  <span className={`block text-xs truncate ${c.hasUnread ? 'text-text-normal font-medium' : 'text-subtlest'}`}>
                    {c.lastMessage?.body ?? t('chat.noMessagesYet')}
                  </span>
                </span>
                {c.hasUnread && <span className="w-2 h-2 rounded-full bg-accent-blue shrink-0" aria-hidden="true" />}
              </button>
            ))
          )}
        </div>
        </div>
      </div>

      {/* RIGHT: active thread */}
      <div className={`flex-1 min-w-0 flex flex-col ${activeId ? 'flex' : 'hidden sm:flex'}`}>
        {!activeConvo ? (
          <div className="flex-1 grid place-items-center text-center p-6 bg-neutral-97/40">
            <div>
              <span className="mx-auto mb-3 h-16 w-16 rounded-full bg-chip-blue grid place-items-center">
                <i className="fa-solid fa-comments text-2xl text-accent-blue" aria-hidden="true" />
              </span>
              <p className="text-sm text-subtlest max-w-[220px] mx-auto">{t('chat.selectConversation')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-m py-3 border-b border-neutral-90 bg-white shadow-sm relative z-10">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="group relative sm:hidden h-8 w-8 grid place-items-center rounded-m text-muted hover:bg-neutral-97"
                aria-label={t('chat.back')}
              >
                <i className="fa-solid fa-arrow-left" />
                <Tooltip label={t('chat.back')} position="bottom" />
              </button>
              {/* Desktop-only: shrink/restore the conversation list to give the thread more room. */}
              <button
                type="button"
                onClick={() => setListCollapsed((v) => !v)}
                className="group relative hidden sm:grid h-8 w-8 shrink-0 place-items-center rounded-m text-muted hover:bg-neutral-97 hover:text-accent-blue transition-colors"
                aria-label={listCollapsed ? t('chat.showList') : t('chat.hideList')}
              >
                <i className={`fa-solid ${listCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`} aria-hidden="true" />
                <Tooltip label={listCollapsed ? t('chat.showList') : t('chat.hideList')} position="bottom" />
              </button>
              <Avatar profile={activeConvo.otherUser} size={28} />
              <span className="text-sm font-semibold text-text-normal truncate">{nameOf(activeConvo.otherUser)}</span>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="group relative ml-auto h-8 w-8 grid place-items-center rounded-m text-muted hover:bg-neutral-97"
                  aria-label={t('post.cancel')}
                >
                  <i className="fa-solid fa-xmark" />
                  <Tooltip label={t('post.cancel')} position="bottom" />
                </button>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-neutral-97/40 px-m py-4 flex flex-col gap-2.5">
              {hasMore && messages.length > 0 && (
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="self-center inline-flex items-center gap-1.5 rounded-full border border-neutral-90 bg-white px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm hover:border-accent-blue hover:text-accent-blue disabled:opacity-60 transition-colors mb-3"
                >
                  <i className={`fa-solid ${loadingOlder ? 'fa-spinner fa-spin' : 'fa-clock-rotate-left'} text-[11px]`} aria-hidden="true" />
                  {loadingOlder ? t('chat.loading') : t('chat.loadOlder')}
                </button>
              )}
              {loadingMessages ? (
                <p className="text-xs text-subtlest text-center">{t('chat.loading')}</p>
              ) : messages.length === 0 ? (
                <p className="text-xs text-subtlest text-center">{t('chat.noMessagesYet')}</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === user.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-l px-3.5 py-2.5 text-sm shadow-sm ${
                          mine ? 'bg-accent-blue text-white rounded-br-m' : 'bg-white text-text-normal rounded-bl-m'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                        <span className={`block mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-subtlest'}`}>{timeAgo(m.createdAt)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="flex items-center gap-2 px-m py-3 border-t border-neutral-90 bg-white"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('chat.messagePlaceholder')}
                className="flex-1 h-10 px-4 border border-neutral-90 rounded-full text-sm outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/15"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="group relative h-10 w-10 shrink-0 grid place-items-center bg-accent-blue text-white rounded-full hover:bg-[#005bc4] disabled:opacity-60 transition-colors"
                aria-label={t('chat.send')}
              >
                <i className={`fa-solid ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-sm`} aria-hidden="true" />
                <Tooltip label={t('chat.send')} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
