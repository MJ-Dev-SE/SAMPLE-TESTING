import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Business } from '../types'
import { useLocalized } from '../lib/useLocalized'

/** Recently-updated business card: name (title) + short excerpt + "see more". */
export default function BusinessCard({ business }: { business: Business }) {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <Link
      to={business.href}
      className="flex gap-s border border-neutral-90 rounded-l p-s hover:shadow-card hover:-translate-y-0.5 transition-all"
    >
      {business.thumb && (
        <img src={business.thumb} alt="" className="w-12 h-12 rounded-m shrink-0 border border-neutral-90" />
      )}
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-text-normal truncate">{business.name}</h4>
        <p className="text-xs text-subtlest line-clamp-2">{L(business.excerpt)}</p>
        <span className="text-xs text-link">{t('common.seeMore')}</span>
      </div>
    </Link>
  )
}
