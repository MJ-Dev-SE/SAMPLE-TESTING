import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listRecentBusinesses } from '../lib/content'
import { useAuth } from '../lib/auth'
import BusinessForm from './BusinessForm'
import SmartImage from './SmartImage'
import { useLocalized } from '../lib/useLocalized'
import type { BusinessRec } from '../types'

/** Sidebar "Recently updated businesses" widget — newest-updated listings from Supabase.
 *  The "+" in the header opens the new-business form in a modal; on success the
 *  list reloads so the new listing appears immediately. */
export default function RecentBusinessesWidget() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user } = useAuth()
  const [items, setItems] = useState<BusinessRec[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(() => {
    listRecentBusinesses(6)
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  useEffect(() => {
    load()
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
          title={t('home.addBusiness')}
          className="h-5 w-5 grid place-items-center rounded-m text-muted hover:text-white hover:bg-accent-blue transition-colors"
        >
          <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
        </button>
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

      {/* New-business modal — same form as /company/register */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-[520px] bg-white rounded-l border border-neutral-90 shadow-lg">
            <div className="px-l py-3 border-b border-neutral-90 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-text-normal">
                <i className="fa-solid fa-store mr-2 text-accent-blue" aria-hidden="true" />
                {t('business.registerTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('post.cancel')}
                className="h-8 w-8 grid place-items-center rounded-m text-muted hover:bg-neutral-97"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className="p-l">
              {user ? (
                <BusinessForm
                  ownerId={user.id}
                  onCreated={() => {
                    setOpen(false)
                    load() // refresh so the new listing shows up immediately
                  }}
                  onCancel={() => setOpen(false)}
                />
              ) : (
                <div className="text-center py-l">
                  <p className="text-sm text-muted mb-3">{t('business.memberOnly')}</p>
                  <Link to="/user/login" className="text-sm text-link font-medium hover:underline">
                    {t('nav.login')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
