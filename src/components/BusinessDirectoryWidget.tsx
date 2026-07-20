import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listCategories } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'

/**
 * Sidebar Business Directory widget — category chips loaded from public.categories
 * (the same shared source as the /company filter and the posting form).
 */
export default function BusinessDirectoryWidget() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
  })

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-store mr-2 text-accent-green" />
          {t('home.businessDirectory')}
        </h3>
        <Link to="/company/register" className="text-xs text-link hover:underline">
          <i className="fa-solid fa-plus mr-1" />
          {t('common.register')}
        </Link>
      </div>
      <div className="p-s flex flex-wrap gap-1">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/business-directory/${c.slug}`}
            className="px-2 py-0.5 text-[11px] border border-neutral-90 rounded-full text-muted hover:bg-neutral-97 hover:text-accent-blue"
          >
            {L(c.name)}
          </Link>
        ))}
      </div>
    </section>
  )
}
