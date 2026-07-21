import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en.json'
import ko from '../locales/ko.json'
import { activeBrand } from '../config/brand'

// Default locale is per-hostname (src/config/brand.ts):
//  - manilatour.com (forceDefaultLocale: false) — unchanged: detects the
//    browser's language on a fresh visit, and an explicit language-switcher
//    pick persists in localStorage and wins on every later visit/reload.
//  - hanin.tv (forceDefaultLocale: true) — ALWAYS opens in Korean, full stop:
//    no browser-language detection AND no persistence. The switcher still
//    changes the displayed language for the current page view (i18n stays a
//    normal in-memory state machine either way), but that choice is never
//    written to storage, so the very next reload/visit resets to Korean.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    fallbackLng: activeBrand.defaultLocale,
    supportedLngs: ['en', 'ko'],
    interpolation: { escapeValue: false },
    detection: {
      order: activeBrand.forceDefaultLocale ? [] : ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: activeBrand.forceDefaultLocale ? [] : ['localStorage'],
    },
  })

// Keep <html lang> in sync with active locale.
const setHtmlLang = (lng: string) => {
  document.documentElement.lang = lng
}
setHtmlLang(i18n.resolvedLanguage || 'en')
i18n.on('languageChanged', setHtmlLang)

export default i18n
