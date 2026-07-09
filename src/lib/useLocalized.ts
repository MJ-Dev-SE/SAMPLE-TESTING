import { useTranslation } from 'react-i18next'
import type { Localized } from '../types'

/**
 * Returns a picker that resolves a {en, ko} DATA SLOT field to the active locale.
 * DATA SLOTs carry localized fields where text differs by language; this reads them.
 */
export function useLocalized() {
  const { i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage || 'en') as keyof Localized
  return (value: Localized) => value[lang] ?? value.en
}
