import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listTravelInfo } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'

/**
 * Travel Information card (right sidebar, between Weather and Business Directory).
 * Content comes from public.travel_info in Supabase.
 */
export default function TravelInfoCard() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { data: items = [] } = useQuery({
    queryKey: ['travel-info'],
    queryFn: () => listTravelInfo(),
    staleTime: STALE.homepageSection,
    gcTime: STALE.homepageSection * 2,
  })

  if (items.length === 0) return null

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-plane-departure mr-2 text-accent-purple" />
          {t('widgets.travelInfo')}
        </h3>
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id} className="border-t border-neutral-90 first:border-t-0">
            <Link to={it.href} className="flex gap-2 px-s py-2 hover:bg-neutral-97 group">
              <span className="w-7 h-7 shrink-0 rounded-m bg-chip-purple grid place-items-center text-accent-purple">
                <i className={`fa-solid ${it.icon} text-xs`} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-normal group-hover:text-accent-blue">
                  {L(it.title)}
                </div>
                <div className="text-[11px] text-subtlest line-clamp-2">{L(it.blurb)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
