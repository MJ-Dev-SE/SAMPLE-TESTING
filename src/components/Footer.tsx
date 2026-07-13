import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listAdvertisements, listLinks, listPolicies } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { AdvertisementRec, LinkRec, PolicyRec } from '../types'
import Logo from './Logo'

interface Group {
  title: { en: string; ko: string }
  links: { key: string; label: { en: string; ko: string }; href: string }[]
}

/** FOOTER (contentinfo) — Manila Tour branding (left) + Advertisement / Link / Policy (right). */
export default function Footer() {
  const { t, i18n } = useTranslation()
  const L = useLocalized()
  const isKo = (i18n.resolvedLanguage || i18n.language || '').startsWith('ko')

  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    let alive = true
    Promise.all([
      listAdvertisements('footer-info').catch((): AdvertisementRec[] => []),
      listLinks('footer-link').catch((): LinkRec[] => []),
      listPolicies().catch((): PolicyRec[] => []),
    ])
      .then(([ads, links, policies]) => {
        if (!alive) return
        const next: Group[] = [
          {
            title: { en: 'ADVERTISEMENT', ko: '광고' },
            links: ads.map((a) => ({ key: a.id, label: a.title, href: `/ad/view?id=${a.id}` })),
          },
          {
            title: { en: 'LINK', ko: '링크' },
            links: links.map((l) => ({ key: l.id, label: l.title, href: l.slug ? `/link/view?slug=${l.slug}` : l.url || '#' })),
          },
          {
            title: { en: 'POLICY', ko: '정책' },
            links: policies.map((p) => ({ key: p.id, label: p.title, href: `/policy/view?slug=${p.slug}` })),
          },
        ].filter((g) => g.links.length > 0)
        if (next.length) setGroups(next)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  // Policy quick-row under the brand (fixed routes, always available).
  const policyNav = [
    { label: { en: 'Terms of Use', ko: '이용약관' }, href: '/help/terms' },
    { label: { en: 'Privacy Policy', ko: '개인정보처리방침' }, href: '/help/privacy' },
    { label: { en: 'Child Safety Standards', ko: '아동 안전 기준' }, href: '/help/safety' },
  ]

  return (
    <footer className="border-t border-neutral-90 mt-2xl">
      <div className="mx-auto max-w-content px-xs py-xl">
        <div className="flex flex-col gap-l md:flex-row md:items-start md:justify-between">
          {/* LEFT: Manila Tour brand + description + copyright + policy nav */}
          <div className="text-left max-w-[360px]">
            <Logo className="h-[48px]" />
            <p className="text-xs text-muted mt-3">
              {t('footer.tagline')}
            </p>
            <p className="text-xs text-muted mt-2 mb-2">{t('footer.copyright')}</p>
            <nav className="flex flex-wrap items-center gap-x-1 text-xs text-muted">
              {policyNav.map((link, i) => (
                <span key={link.label.en} className="inline-flex items-center">
                  {i > 0 && <span className="mx-1 text-subtlest">·</span>}
                  <Link to={link.href} className="hover:text-accent-blue">{L(link.label)}</Link>
                </span>
              ))}
            </nav>
          </div>

          {/* RIGHT: Advertisement / Link / Policy groups (stack on mobile) */}
          <div className="rounded-l border border-neutral-90 bg-neutral-97 p-l md:min-w-[460px] md:shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-l text-left">
              {groups.map((group) => (
                <div key={group.title.en}>
                  <h4
                    className={`mb-2 pb-1.5 border-b border-neutral-90 font-semibold ${
                      isKo ? 'text-xs text-text-normal' : 'text-[11px] uppercase tracking-[0.5px] text-subtlest'
                    }`}
                  >
                    {L(group.title)}
                  </h4>
                  <ul className="space-y-1">
                    {group.links.map((link) => (
                      <li key={link.key}>
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
      </div>
    </footer>
  )
}
