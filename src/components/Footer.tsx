import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  footerGroups,
  footerPolicyNav,
  languages,
  optionalGlobalSites,
} from '../data/footer'
import { useLocalized } from '../lib/useLocalized'
import LanguageSwitcher from './LanguageSwitcher'

/** FOOTER (contentinfo) — centered block at the bottom of every page. */
export default function Footer() {
  const { t } = useTranslation()
  const L = useLocalized()

  return (
    <footer className="border-t border-neutral-90 mt-2xl">
      <div className="mx-auto max-w-content px-xs py-xl text-center">
        {/* Logo (links to /help/guideline) */}
        <Link to="/help/guideline" className="inline-block text-xl font-bold text-text-normal mb-3">
          {t('brand')}
        </Link>

        {/* Copyright */}
        <p className="text-xs text-muted mb-3">{t('footer.copyright')}</p>

        {/* Policy nav row (· separated) */}
        <nav className="flex flex-wrap items-center justify-center gap-x-1 text-xs text-muted mb-3">
          {footerPolicyNav.map((link, i) => (
            <span key={link.label.en} className="inline-flex items-center">
              {i > 0 && <span className="mx-1 text-subtlest">·</span>}
              <Link to={link.href} className="hover:text-accent-blue">
                {L(link.label)}
              </Link>
            </span>
          ))}
        </nav>

        {/* Global Site language switcher */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted mb-l">
          <span className="font-medium">{t('footer.globalSite')}</span>
          <LanguageSwitcher />
          {optionalGlobalSites.map((s) => (
            <span key={s.label} className="inline-flex items-center">
              <span className="mx-1 text-subtlest">·</span>
              <a href={s.href} className="text-[#333] hover:text-accent-blue">
                {s.label}
              </a>
            </span>
          ))}
        </div>

        {/* Grouped link navs: ADVERTISEMENT / LINK / POLICY */}
        <div className="grid gap-s sm:gap-l grid-cols-3 text-left max-w-2xl mx-auto">
          {footerGroups.map((group) => (
            <div
              key={group.groupTitle.en}
              className="rounded-l border border-neutral-90 bg-neutral-97 p-s"
            >
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-subtlest mb-2">
                {L(group.groupTitle)}
              </h4>
              <ul className="space-y-1">
                {group.links.map((link) => (
                  <li key={link.label.en}>
                    <Link to={link.href} className="text-xs text-muted hover:text-accent-blue">
                      {L(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/*
          NOTE: Philgo's real footer does NOT show a physical-address / business-registration block.
          DATA SLOT `company` exists in src/data/footer.ts for clients who want a traditional
          Company-Info block ABOVE these nav groups — not rendered by default.
          languages DATA SLOT: {languages.map(l => l.code).join(', ')}
        */}
        <span className="sr-only">{languages.map((l) => l.label).join(' ')}</span>
      </div>
    </footer>
  )
}
