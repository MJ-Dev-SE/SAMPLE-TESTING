import { useTranslation } from 'react-i18next'

/**
 * Functional pagination bar. `page` is 1-based; `onChange` is called with the new
 * page. Renders up to a small window of numbered buttons plus Prev/Next. Hidden
 * when there is only one page.
 */
export default function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page?: number
  pageCount?: number
  onChange?: (page: number) => void
}) {
  const { t } = useTranslation()

  // Backward-compatible static placeholder (board lists load sequentially).
  if (page == null || pageCount == null || onChange == null) {
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

  if (pageCount <= 1) return null

  // Windowed page numbers around the current page (max 5 shown).
  const start = Math.max(1, Math.min(page - 2, pageCount - 4))
  const end = Math.min(pageCount, start + 4)
  const nums: number[] = []
  for (let n = start; n <= end; n++) nums.push(n)

  return (
    <nav className="flex items-center justify-center gap-1 mt-l" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 text-sm border border-neutral-90 rounded-m text-muted hover:bg-neutral-97 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        {t('list.prev')}
      </button>
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`w-8 h-8 text-sm border rounded-m transition-colors ${
            n === page
              ? 'bg-accent-blue text-white border-accent-blue'
              : 'border-neutral-90 text-muted hover:bg-neutral-97'
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className="px-3 py-1 text-sm border border-neutral-90 rounded-m text-muted hover:bg-neutral-97 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        {t('list.next')}
      </button>
    </nav>
  )
}
