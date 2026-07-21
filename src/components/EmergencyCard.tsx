import { useTranslation } from 'react-i18next'
import { emergencyContacts } from '../data/sidebar'
import { useLocalized } from '../lib/useLocalized'

export default function EmergencyCard() {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-phone-volume mr-2 text-accent-pink" />
          {t('widgets.emergencyContact')}
        </h3>
      </div>
      <ul>
        {emergencyContacts.map((e, i) => (
          <li
            key={i}
            className="flex items-center justify-between px-s py-2 border-t border-neutral-90 first:border-t-0 text-sm"
          >
            <span className="text-muted">
              {L(e.label)}
              {e.note && <span className="ml-1 text-subtlest">({L(e.note)})</span>}
            </span>
            <a href={e.href ?? `tel:${e.number}`} className="font-medium text-text-normal hover:text-accent-blue">
              {e.number}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
