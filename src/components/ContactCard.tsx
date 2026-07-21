import { useTranslation } from 'react-i18next'
import InfoTile from './InfoTile'

/** Read-only Contact card (Phone / Mobile phone / Address) for a business or post detail page. */
export default function ContactCard({
  phone,
  mobilePhone,
  address,
}: {
  phone?: string | null
  mobilePhone?: string | null
  address?: string | null
}) {
  const { t } = useTranslation()
  if (!phone && !mobilePhone && !address) return null
  return (
    <section className="border border-neutral-90 rounded-l p-l">
      <h2 className="text-[15px] font-bold text-text-normal mb-3">{t('contact.title')}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {phone && (
          <InfoTile
            icon="fa-phone"
            label={t('contact.phone')}
            value={<a href={`tel:${phone}`} className="text-link hover:underline">{phone}</a>}
          />
        )}
        {mobilePhone && (
          <InfoTile
            icon="fa-mobile-screen"
            label={t('contact.mobilePhone')}
            value={<a href={`tel:${mobilePhone}`} className="text-link hover:underline">{mobilePhone}</a>}
          />
        )}
        {address && <InfoTile icon="fa-map" label={t('contact.address')} value={address} />}
      </dl>
    </section>
  )
}
