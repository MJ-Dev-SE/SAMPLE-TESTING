import { useTranslation } from 'react-i18next'
import AiChatPanel from './AiChatPanel'
import type { useAiAssistant } from './useAiAssistant'

/**
 * The collapsible section a page renders below its main content when the AI
 * assistant is open: loading / error / the chat panel itself. Pair with
 * <AiAssistantButton> (usually placed near the title) sharing the same
 * useAiAssistant() instance. One component so every content type (post,
 * photo, business, ad, news) gets identical AI assistant behavior.
 */
export default function AiAssistantSection({ ai }: { ai: ReturnType<typeof useAiAssistant> }) {
  const { t } = useTranslation()
  if (!ai.open) return null

  return (
    <section className="mt-l">
      <h2 className="text-sm font-semibold text-text-normal mb-s">
        <i className="fa-solid fa-robot mr-2 text-accent-indigo" aria-hidden="true" />
        {t('aiAssistant.panelHeading')}
      </h2>
      {ai.loading ? (
        <p className="border border-neutral-90 rounded-l p-l text-sm text-subtlest text-center">
          <i className="fa-solid fa-spinner fa-spin mr-2 text-accent-indigo" aria-hidden="true" />
          {t('aiAssistant.analyzing')}
        </p>
      ) : ai.error && ai.messages.length === 0 ? (
        <p className="border border-neutral-90 rounded-l p-l text-sm text-accent-pink text-center">{ai.error}</p>
      ) : (
        <AiChatPanel messages={ai.messages} sending={ai.sending} error={ai.error} onSend={ai.send} onAskFollowUp={ai.send} />
      )}
    </section>
  )
}
