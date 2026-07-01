import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { megaMenuGroups } from '../data/megamenu'
import { useLocalized } from '../lib/useLocalized'

/** Full-width mega-menu overlay opened from the hamburger; closeable. */
export default function MegaMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const L = useLocalized()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        type="button"
        aria-label={t('megaMenu.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      {/* panel */}
      <div className="relative bg-page border-b border-neutral-90 shadow-card">
        <div className="mx-auto max-w-content px-xs py-l">
          <div className="flex items-center justify-between mb-l">
            <span className="text-lg font-bold text-text-normal">{t('brand')}</span>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-muted hover:text-accent-blue"
            >
              <i className="fa-solid fa-xmark" />
              {t('megaMenu.close')}
            </button>
          </div>

          <div className="grid gap-l grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {megaMenuGroups.map((group) => (
              <div key={group.groupTitle.en}>
                <h3 className="text-[12.8px] font-semibold uppercase tracking-[0.5px] text-muted mb-2 pb-1 border-b border-neutral-90">
                  {L(group.groupTitle)}
                </h3>
                <ul className="flex flex-wrap gap-x-3 gap-y-1">
                  {group.items.map((item) => (
                    <li key={item.label.en}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className="text-sm text-body hover:text-accent-blue"
                      >
                        {L(item.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
