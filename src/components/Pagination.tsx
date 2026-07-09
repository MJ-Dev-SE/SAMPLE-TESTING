import { useTranslation } from 'react-i18next'

/**
 * Placeholder pagination bar — NON-FUNCTIONAL by design.
 * Items load sequentially here; no real paging logic (per spec).
 */
export default function Pagination() {
  const { t } = useTranslation()
  // items load sequentially here
  return (
    <nav className="flex items-center justify-center gap-1 mt-l" aria-label="Pagination (placeholder)">
      <button className="px-3 py-1 text-sm border border-neutral-90 rounded-m text-muted" disabled>
        {t('list.prev')}
      </button>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled
          className={`w-8 h-8 text-sm border border-neutral-90 rounded-m ${
            n === 1 ? 'bg-accent-blue text-white border-accent-blue' : 'text-muted'
          }`}
        >
          {n}
        </button>
      ))}
      <button className="px-3 py-1 text-sm border border-neutral-90 rounded-m text-muted" disabled>
        {t('list.next')}
      </button>
    </nav>
  )
}
