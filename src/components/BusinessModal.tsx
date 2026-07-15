import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import BusinessForm from './BusinessForm'
import Tooltip from './Tooltip'
import type { BusinessRec, CategoryRec } from '../types'

/**
 * Modal shell for creating a business listing. Handles the login gate + chrome;
 * the form itself is BusinessForm. Used by the Business Directory "+" action and
 * the sidebar "Recently updated" widget. `lockedCategory` pre-selects and locks
 * the category (item 7).
 */
export default function BusinessModal({
  categories,
  lockedCategory,
  onCreated,
  onClose,
}: {
  categories: CategoryRec[]
  lockedCategory?: CategoryRec | null
  onCreated: (biz: BusinessRec) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[560px] bg-white rounded-l border border-neutral-90 shadow-lg my-auto">
        <div className="px-l py-3 border-b border-neutral-90 flex items-center justify-between gap-3 sticky top-0 bg-white rounded-t-l">
          <h3 className="text-base font-bold text-text-normal">
            <i className="fa-solid fa-store mr-2 text-accent-blue" aria-hidden="true" />
            {t('business.registerTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('post.cancel')}
            className="group relative h-8 w-8 grid place-items-center rounded-m text-muted hover:bg-neutral-97"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
            <Tooltip label={t('post.cancel')} position="bottom" />
          </button>
        </div>
        <div className="p-l">
          {user ? (
            <BusinessForm
              ownerId={user.id}
              categories={categories}
              lockedCategory={lockedCategory}
              onCreated={onCreated}
              onCancel={onClose}
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
  )
}
