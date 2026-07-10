import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listRecentBusinesses } from '../lib/content'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'
import type { BusinessRec } from '../types'

/** Sidebar "Recently updated businesses" widget — newest-updated listings from Supabase. */
export default function RecentBusinessesWidget() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [items, setItems] = useState<BusinessRec[]>([])

  useEffect(() => {
    let alive = true
    listRecentBusinesses(6)
      .then((b) => alive && setItems(b))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('home.recentlyUpdated')}</h3>
      </div>
      <ul>
        {items.map((b) => (
          <li key={b.id} className="border-t border-neutral-90 first:border-t-0">
            <Link to={`/company/view?id=${b.id}`} className="flex gap-2 px-s py-2 hover:bg-neutral-97">
              {b.thumb_url && (
                <SmartImage src={b.thumb_url} cover className="w-9 h-9 rounded-m shrink-0 border border-neutral-90" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-normal truncate">{b.name}</div>
                <div className="text-[11px] text-subtlest line-clamp-2">
                  {L(b.excerpt)}
                  {b.location && <span className="text-subtlest"> · {b.location}</span>}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
