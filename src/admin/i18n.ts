import { createInstance } from 'i18next'
import en from '../locales/en.json'
import ko from '../locales/ko.json'

/**
 * SEPARATE i18next instance for the /admin console only, supplied to the admin
 * component tree via <I18nextProvider>. English is the default; the header
 * toggle switches to Korean. The choice persists in localStorage['adminLang']
 * and is fully independent from the public site's locale (localStorage['lang'])
 * — flipping the dashboard language never changes the website language.
 *
 * Deliberately NOT registered with initReactI18next: that would overwrite the
 * global default instance the public site uses. Provider-scoped only.
 */
const ADMIN_LANG_KEY = 'adminLang'

const stored = (() => {
  try {
    return localStorage.getItem(ADMIN_LANG_KEY)
  } catch {
    return null
  }
})()

export const adminI18n = createInstance({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: stored === 'ko' ? 'ko' : 'en', // admin default = English
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initImmediate: false, // synchronous init (resources are bundled) — no suspense flash
  react: { useSuspense: false },
})
adminI18n.init()

/** Switch the admin console language and remember it across dashboard visits. */
export function setAdminLanguage(lng: 'en' | 'ko') {
  adminI18n.changeLanguage(lng)
  try {
    localStorage.setItem(ADMIN_LANG_KEY, lng)
  } catch {
    /* storage unavailable — keep in-memory only */
  }
}
