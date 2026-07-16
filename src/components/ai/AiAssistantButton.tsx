import { useTranslation } from 'react-i18next'
import Tooltip from '../Tooltip'

/**
 * Temporarily hidden site-wide (Gemini quota issue while sourcing a provider) —
 * flip to true (or just say "/backai") to bring the button + panel back on all
 * 5 wired pages (post, photo, business, ad, news). Nothing else needs to change:
 * AiAssistantSection never shows because ai.open can never become true without
 * this button, so gating here alone hides the whole feature end-to-end.
 */
const AI_ASSISTANT_ENABLED = false

/** Header icon button that opens/closes a post's private AI assistant panel (see useAiAssistant). */
export default function AiAssistantButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  if (!AI_ASSISTANT_ENABLED) return null
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={t('aiAssistant.buttonLabel')}
      className={`group relative shrink-0 inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-m border transition-colors ${
        open
          ? 'bg-accent-indigo text-white border-accent-indigo'
          : 'text-accent-indigo border-accent-indigo/40 hover:bg-chip-indigo'
      }`}
    >
      <i className="fa-solid fa-robot" aria-hidden="true" />
      {t('aiAssistant.buttonLabel')}
      <Tooltip label={t('aiAssistant.buttonTooltip')} position="bottom" />
    </button>
  )
}
