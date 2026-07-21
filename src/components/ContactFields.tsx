import { useTranslation } from 'react-i18next'

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
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('contact.mobilePhone')}</span>
        <input
          className={field}
          value={value.mobilePhone}
          onChange={(e) => onChange({ ...value, mobilePhone: e.target.value })}
          placeholder={t('contact.mobilePhonePlaceholder')}
        />
      </label>
    </div>
  )
}
