import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { timeAgo } from '../../lib/posts'
import { asAnalysis, type AiMessage } from '../../lib/aiAssistant'

/** One labeled list block inside the structured analysis card (Summary has no list, so `items` is optional). */
function Section({ label, icon, text, items }: { label: string; icon: string; text?: string; items?: string[] }) {
  if (!text && (!items || items.length === 0)) return null
  return (
    <div className="mb-3 last:mb-0">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-indigo mb-1">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
        {label}
      </h4>
      {text && <p className="text-sm text-text-normal leading-relaxed">{text}</p>}
      {items && items.length > 0 && (
        <ul className="list-disc pl-4 space-y-0.5">
          {items.map((it, i) => (
            <li key={i} className="text-sm text-text-normal leading-relaxed">{it}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * The AI assistant panel body: the structured initial analysis (rendered as
 * sections, first message only) followed by the ongoing private Q&A thread,
 * then a composer. Purely presentational — AiAssistantButton owns all state.
 */
export default function AiChatPanel({
  messages,
  sending,
  error,
  onSend,
  onAskFollowUp,
}: {
  messages: AiMessage[]
  sending: boolean
  error: string | null
  onSend: (text: string) => void
  onAskFollowUp: (question: string) => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, sending])

  const first = messages[0]
  const analysis = first ? asAnalysis(first) : null
  const chatMessages = analysis ? messages.slice(1) : messages

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value || sending) return
    onSend(value)
    setText('')
  }

  return (
    <div className="border border-neutral-90 rounded-l overflow-hidden bg-neutral-97">
      <div className="max-h-[520px] overflow-y-auto p-l flex flex-col gap-3">
        {analysis && (
          <div className="bg-white border border-chip-indigo rounded-m p-l">
            <div className="flex items-center gap-2 mb-2 text-accent-indigo">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wide">{t('aiAssistant.analysisHeading')}</span>
            </div>
            <Section label={t('aiAssistant.summary')} icon="fa-file-lines" text={analysis.summary} />
            <Section label={t('aiAssistant.mainPoints')} icon="fa-list-check" items={analysis.mainPoints} />
            <Section label={t('aiAssistant.importantDetails')} icon="fa-circle-info" items={analysis.importantDetails} />
            <Section label={t('aiAssistant.issues')} icon="fa-triangle-exclamation" items={analysis.issues} />
            <Section label={t('aiAssistant.suggestions')} icon="fa-lightbulb" items={analysis.suggestions} />
            {analysis.followUpQuestions.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-indigo mb-1.5">
                  <i className="fa-solid fa-comment-dots" aria-hidden="true" />
                  {t('aiAssistant.followUpQuestions')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.followUpQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onAskFollowUp(q)}
                      disabled={sending}
                      className="text-xs text-accent-indigo bg-chip-indigo px-2.5 py-1 rounded-full hover:opacity-80 disabled:opacity-50 text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {chatMessages.map((m) => {
          const mine = m.role === 'user'
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-l px-3.5 py-2.5 text-sm shadow-sm ${
                  mine ? 'bg-accent-blue text-white rounded-br-m' : 'bg-white text-text-normal rounded-bl-m'
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{m.message}</p>
                <span className={`block mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-subtlest'}`}>{timeAgo(m.created_at)}</span>
              </div>
            </div>
          )
        })}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white rounded-l rounded-bl-m px-3.5 py-2.5 text-sm text-subtlest shadow-sm">
              <i className="fa-solid fa-spinner fa-spin mr-1.5" aria-hidden="true" />
              {t('aiAssistant.thinking')}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-accent-pink text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 px-m py-3 border-t border-neutral-90 bg-white">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('aiAssistant.askPlaceholder')}
          disabled={sending}
          className="flex-1 h-10 px-4 border border-neutral-90 rounded-full text-sm outline-none focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/15 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="group relative h-10 w-10 shrink-0 grid place-items-center bg-accent-indigo text-white rounded-full hover:opacity-90 disabled:opacity-60 transition-colors"
          aria-label={t('aiAssistant.send')}
        >
          <i className="fa-solid fa-paper-plane" aria-hidden="true" />
        </button>
      </form>
      <p className="px-m pb-2.5 text-[11px] text-subtlest bg-white">
        <i className="fa-solid fa-lock mr-1" aria-hidden="true" />
        {t('aiAssistant.privacyNote')}
      </p>
    </div>
  )
}
