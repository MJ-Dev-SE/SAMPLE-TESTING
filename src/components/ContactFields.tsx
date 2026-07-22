import { useTranslation } from 'react-i18next'
import PhoneInput from './PhoneInput'

export interface ContactValue {
  phone: string
  mobilePhone: string
}

export const emptyContact: ContactValue = { phone: '', mobilePhone: '' }

/**
 * Two SEPARATE, both-OPTIONAL contact inputs used by every posting form:
 *   • Telephone — a plain landline field (area code + number, e.g. +63 2 …).
 *   • Mobile number — international, with a country flag + dial-code picker
 *     (🇵🇭 +63 by default), stored as one "+63 917 …" string.
 * A listing may supply either, both, or neither — nothing here is required.
 */
export default function ContactFields({
  value,
  onChange,
}: {
  value: ContactValue
  onChange: (value: ContactValue) => void
}) {
  const { t } = useTranslation()
  const field = 'h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue'
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-m">
      {/* Telephone (landline) — plain input, optional */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('contact.phone')}</span>
        <input
          className={field}
          type="tel"
          inputMode="tel"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder={t('contact.phonePlaceholder')}
        />
      </label>
      {/* Mobile number — international flag + dial-code picker, optional */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('contact.mobilePhone')}</span>
        <PhoneInput
          value={value.mobilePhone}
          onChange={(mobilePhone) => onChange({ ...value, mobilePhone })}
          placeholder={t('contact.mobilePhonePlaceholder')}
          ariaLabel={t('contact.mobilePhone')}
        />
      </div>
    </div>
  )
}
