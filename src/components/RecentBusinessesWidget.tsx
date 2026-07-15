import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { businessPath, listCategories, listRecentBusinesses } from '../lib/content'
import BusinessModal from './BusinessModal'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'
import Tooltip from './Tooltip'
import type { BusinessRec, CategoryRec } from '../types'

/** Sidebar "Recently updated businesses" widget — newest-updated listings from Supabase.
 *  The "+" in the header opens the new-business modal; on success the list reloads
 *  so the new listing appears immediately. */
export default function RecentBusinessesWidget() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [items, setItems] = useState<BusinessRec[]>([])
  const [categories, setCategories] = useState<CategoryRec[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(() => {
    listRecentBusinesses(6)
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  useEffect(() => {
    load()
    listCategories().then(setCategories).catch(() => setCategories([]))
  }, [load])

  if (items.length === 0) return null

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-normal">{t('home.recentlyUpdated')}</h3>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('home.addBusiness')}
          className="group relative h-5 w-5 grid place-items-center rounded-m text-muted hover:text-white hover:bg-accent-blue transition-colors"
        >
          <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
          <Tooltip label={t('home.addBusiness')} />
        </button>
      </div>
      <ul>
        {items.map((b) => (
          <li key={b.id} className="border-t border-neutral-90 first:border-t-0">
            <Link to={businessPath(b)} className="flex gap-2 px-s py-2 hover:bg-neutral-97">
              {(b.main_image_url || b.thumb_url) && (
                <SmartImage src={(b.main_image_url || b.thumb_url) as string} cover className="w-9 h-9 rounded-m shrink-0 border border-neutral-90" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-normal truncate">{b.name}</div>
                <div className="text-[11px] text-subtlest line-clamp-2">
                  {L(b.short_intro) || L(b.excerpt)}
                  {(b.region || b.location) && <span className="text-subtlest"> · {b.region || b.location}</span>}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {open && (
        <BusinessModal
          categories={categories}
          onCreated={() => {
            setOpen(false)
            load()
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  )
}
