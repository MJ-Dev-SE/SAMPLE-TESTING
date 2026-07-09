import { useTranslation } from 'react-i18next'
import { languages } from '../data/footer'

/** EN / KO toggle. Persists via i18next LanguageDetector (localStorage 'lang') + sets <html lang>. */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const active = i18n.resolvedLanguage || 'en'

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} role="group" aria-label="Language">
      {languages.map((lng, i) => (
        <span key={lng.code} className="inline-flex items-center">
          {i > 0 && <span className="mx-1 text-subtlest">·</span>}
          <button
            type="button"
            onClick={() => i18n.changeLanguage(lng.code)}
            aria-pressed={active === lng.code}
            className={`px-1.5 py-0.5 rounded-m text-[13.6px] transition-colors ${
              active === lng.code
                ? 'font-semibold text-accent-blue'
                : 'text-[#333] hover:text-accent-blue'
            }`}
          >
            {lng.label}
          </button>
        </span>
      ))}
    </div>
  )
}
