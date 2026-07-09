import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en.json'
import ko from '../locales/ko.json'

// Default locale = English. Second locale = Korean.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko'],
    interpolation: { escapeValue: false },
    detection: {
      // persist choice; survives navigation + reload
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
  })

// Keep <html lang> in sync with active locale.
const setHtmlLang = (lng: string) => {
  document.documentElement.lang = lng
}
setHtmlLang(i18n.resolvedLanguage || 'en')
i18n.on('languageChanged', setHtmlLang)

export default i18n
