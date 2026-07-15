import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listAdvertisements, listLinks, listPolicies } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { AdvertisementRec, LinkRec, PolicyRec } from '../types'
import Logo from './Logo'
import MobileFooterContentCard, { type FooterGroup } from './MobileFooterContentCard'
import FooterCardNavigationButton from './FooterCardNavigationButton'

const NEXT_LABEL_KEY: Record<FooterGroup['kind'], string> = {
  ad: 'footer.showAdvertisements',
  link: 'footer.showLinks',
  policy: 'footer.showPolicies',
}

/** FOOTER (contentinfo) — Manila Tour branding (left) + Advertisement / Link / Policy (right). */
export default function Footer() {
  const { t, i18n } = useTranslation()
  const L = useLocalized()
  const isKo = (i18n.resolvedLanguage || i18n.language || '').startsWith('ko')

  const [groups, setGroups] = useState<FooterGroup[]>([])
  // Mobile-only rotating card: which group is shown + a light fade on swap.
  const [cardIdx, setCardIdx] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([
      listAdvertisements('footer-info').catch((): AdvertisementRec[] => []),
      listLinks('footer-link').catch((): LinkRec[] => []),
      listPolicies().catch((): PolicyRec[] => []),
    ])
      .then(([ads, links, policies]) => {
        if (!alive) return
        const all: FooterGroup[] = [
          {
            kind: 'ad',
            title: { en: 'ADVERTISEMENT', ko: '광고' },
            links: ads.map((a) => ({ key: a.id, label: a.title, href: `/ad/view?id=${a.id}` })),
          },
          {
            kind: 'link',
            title: { en: 'LINK', ko: '링크' },
            links: links.map((l) => ({ key: l.id, label: l.title, href: l.slug ? `/link/view?slug=${l.slug}` : l.url || '#' })),
          },
          {
            kind: 'policy',
            title: { en: 'POLICY', ko: '정책' },
            links: policies.map((p) => ({ key: p.id, label: p.title, href: `/policy/view?slug=${p.slug}` })),
          },
        ]
        const next = all.filter((g) => g.links.length > 0)
        if (next.length) setGroups(next)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  // Advance the mobile card to the next group (Advertisement → Link → Policy → …).
  const nextIdx = groups.length ? (cardIdx + 1) % groups.length : 0
  const cycleCard = () => {
    if (groups.length < 2 || fading) return
    setFading(true)
    window.setTimeout(() => {
      setCardIdx((i) => (i + 1) % groups.length)
      setFading(false)
    }, 160)
  }

  // Policy quick-row under the brand (fixed routes, always available).
  const policyNav = [
    { label: { en: 'Terms of Use', ko: '이용약관' }, href: '/help/terms' },
    { label: { en: 'Privacy Policy', ko: '개인정보처리방침' }, href: '/help/privacy' },
    { label: { en: 'Child Safety Standards', ko: '아동 안전 기준' }, href: '/help/safety' },
  ]

  return (
    <footer className="border-t border-neutral-90 mt-2xl">
      <div className="mx-auto max-w-content px-xs py-xl">
        <div className="flex flex-col gap-l items-center text-center md:flex-row md:items-start md:justify-between md:text-left">
          {/* LEFT: Manila Tour brand + description + copyright + policy nav */}
          <div className="max-w-[360px] flex flex-col items-center md:items-start">
            <Logo className="h-[48px]" />
            <p className="text-xs text-muted mt-3">
              {t('footer.tagline')}
            </p>
            <p className="text-xs text-muted mt-2 mb-2">{t('footer.copyright')}</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-1 text-xs text-muted md:justify-start">
              {policyNav.map((link, i) => (
                <span key={link.label.en} className="inline-flex items-center">
                  {i > 0 && <span className="mx-1 text-subtlest">·</span>}
                  <Link to={link.href} className="hover:text-accent-blue">{L(link.label)}</Link>
                </span>
              ))}
            </nav>
          </div>

          {/* RIGHT: Advertisement / Link / Policy.
              Desktop (sm+): all groups side-by-side (unchanged).
              Mobile (<sm): ONE rotating card (Advertisement first) + a ">" cycle button. */}
          <div className="w-full rounded-l border border-neutral-90 bg-neutral-97 p-l md:w-auto md:min-w-[460px] md:shrink-0">
            {/* Desktop — 3-up columns */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-l text-left">
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

            {/* Mobile — single rotating card */}
            {groups.length > 0 && (
              <div className="sm:hidden flex items-start gap-3 text-left">
                <div className={`flex-1 min-w-0 transition-opacity duration-150 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                  <MobileFooterContentCard group={groups[Math.min(cardIdx, groups.length - 1)]} />
                </div>
                {groups.length > 1 && (
                  <FooterCardNavigationButton nextLabel={t(NEXT_LABEL_KEY[groups[nextIdx].kind])} onClick={cycleCard} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
