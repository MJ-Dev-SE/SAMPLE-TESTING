import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalized } from '../lib/useLocalized'
import type { Localized } from '../types'

export type FooterGroupKind = 'ad' | 'link' | 'policy'

export interface FooterGroup {
  kind: FooterGroupKind
  title: Localized
  links: { key: string; label: Localized; href: string }[]
}

/**
 * The single rotating footer card shown on mobile (one of Advertisement / Link /
 * Policy at a time). Same DB-backed group data + click behavior as the desktop
 * columns — selecting an item opens it in the center area — just full-width and
 * one group at a time. The rotation/fade is driven by the parent Footer.
 */
export default function MobileFooterContentCard({ group }: { group: FooterGroup }) {
  const { t, i18n } = useTranslation()
  const L = useLocalized()
  const isKo = (i18n.resolvedLanguage || i18n.language || '').startsWith('ko')

  return (
    <div className="min-h-[132px]">
      <h4
        className={`mb-2 pb-1.5 border-b border-neutral-90 font-semibold ${
          isKo ? 'text-xs text-text-normal' : 'text-[11px] uppercase tracking-[0.5px] text-subtlest'
        }`}
      >
        {L(group.title)}
      </h4>
      <ul className="space-y-1.5">
        {group.links.map((link) => (
          <li key={link.key}>
            <Link to={link.href} className="text-sm text-muted hover:text-accent-blue">
              {L(link.label)}
            </Link>
          </li>
        ))}
        {group.links.length === 0 && <li className="text-xs text-subtlest">{t('post.noComments')}</li>}
      </ul>
    </div>
  )
}
