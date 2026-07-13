import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { footerGroups, footerPolicyNav, languages } from '../data/footer'
import { listSiteContent } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { FooterGroup, SiteContentSection } from '../types'
import Logo from './Logo'

/** Footer group headers in display order; items come from site_content rows by section. */
const GROUP_SECTIONS: { section: SiteContentSection; groupTitle: FooterGroup['groupTitle'] }[] = [
  { section: 'footer-advertisement', groupTitle: { en: 'ADVERTISEMENT', ko: '광고' } },
  { section: 'footer-link', groupTitle: { en: 'LINK', ko: '링크' } },
  { section: 'footer-policy', groupTitle: { en: 'POLICY', ko: '정책' } },
]

/** FOOTER (contentinfo) — centered block at the bottom of every page. */
export default function Footer() {
  const { t, i18n } = useTranslation()
  const L = useLocalized()

  // Advertisement / Link / Policy child items come from the site_content table
  // (each opens in the center area via /content/view). Static data/footer.ts
  // groups stay as the fail-soft fallback while the rows load or if none exist.
  const [groups, setGroups] = useState<FooterGroup[]>(footerGroups)
  useEffect(() => {
    let alive = true
    listSiteContent()
      .then((rows) => {
        if (!alive || rows.length === 0) return
        const next = GROUP_SECTIONS.map(({ section, groupTitle }) => ({
          groupTitle,
          links: rows
            .filter((r) => r.section === section)
            .map((r) => ({ label: r.title, href: `/content/view?slug=${r.slug}` })),
        })).filter((g) => g.links.length > 0)
        if (next.length > 0) setGroups(next)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  // Korean has no uppercase and letter-spacing looks off on Hangul, so the column
  // headers use a language-appropriate style instead of the English caps treatment.
  const isKo = (i18n.resolvedLanguage || i18n.language || '').startsWith('ko')

  return (
    <footer className="border-t border-neutral-90 mt-2xl">
      <div className="mx-auto max-w-content px-xs py-xl">
        <div
          className={`flex flex-col gap-l md:flex-row md:items-start ${
            isKo ? 'md:justify-start md:gap-2xl' : 'md:justify-between'
          }`}
        >
          {/* LEFT: brand logo + copyright + policy nav + global-site switcher */}
          <div className="text-left">
            <Logo className="h-[52px]" />
            <p className="text-xs text-muted mt-3 mb-2">{t('footer.copyright')}</p>

            <nav className="flex flex-wrap items-center gap-x-1 text-xs text-muted mb-2">
              {footerPolicyNav.map((link, i) => (
                <span key={link.label.en} className="inline-flex items-center">
                  {i > 0 && <span className="mx-1 text-subtlest">·</span>}
                  <Link to={link.href} className="hover:text-accent-blue">
                    {L(link.label)}
                  </Link>
                </span>
              ))}
            </nav>

            {/* <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
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
            </div> */}
          </div>

          {/* RIGHT: single card holding all three groups (Advertisement / Link / Policy) */}
          <div className="rounded-l border border-neutral-90 bg-neutral-97 p-l md:min-w-[440px] md:shrink-0">
            <div className="grid grid-cols-3 gap-l text-left">
              {groups.map((group) => (
                <div key={group.groupTitle.en}>
                  <h4
                    className={`mb-2 pb-1.5 border-b border-neutral-90 font-semibold ${
                      isKo
                        ? 'text-xs text-text-normal'
                        : 'text-[11px] uppercase tracking-[0.5px] text-subtlest'
                    }`}
                  >
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
          </div>
        </div>

        {/*
          NOTE: Philgo's real footer does NOT show a physical-address / business-registration block.
          DATA SLOT `company` exists in src/data/footer.ts for clients who want a traditional
          Company-Info block — not rendered by default.
        */}
        <span className="sr-only">{languages.map((l) => l.label).join(' ')}</span>
      </div>
    </footer>
  )
}
