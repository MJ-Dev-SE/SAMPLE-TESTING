import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { bizCategories } from '../data/home'
import { useLocalized } from '../lib/useLocalized'

/** Sidebar Business Directory widget — header + wrapping category chips + register action. */
export default function BusinessDirectoryWidget() {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-store mr-2 text-accent-green" />
          {t('home.businessDirectory')}
        </h3>
        <Link to="/adv/banner" className="text-xs text-link hover:underline">
          <i className="fa-solid fa-plus mr-1" />
          {t('common.register')}
        </Link>
      </div>
      <div className="p-s flex flex-wrap gap-1">
        {bizCategories.map((c) => (
          <Link
            key={c.label.en}
            to={c.href}
            className="px-2 py-0.5 text-[11px] border border-neutral-90 rounded-full text-muted hover:bg-neutral-97 hover:text-accent-blue"
          >
            {L(c.label)}
          </Link>
        ))}
      </div>
    </section>
  )
}
