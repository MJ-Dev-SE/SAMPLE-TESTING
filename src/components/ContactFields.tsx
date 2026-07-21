import { useTranslation } from 'react-i18next'
import PhoneInput from './PhoneInput'

export interface ContactValue {
  phone: string
  mobilePhone: string
}

export const emptyContact: ContactValue = { phone: '', mobilePhone: '' }

/** Phone + Mobile phone inputs — both optional. Same shape used by every posting form. */
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
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('contact.phone')}</span>
        <input
          className={field}
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder={t('contact.phonePlaceholder')}
        />
      </label>
      {/* Mobile numbers are international — country flag + dial code picker
          (🇵🇭 +63 by default), stored as one "+63 917 …" string. */}
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
