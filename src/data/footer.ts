import type { FooterGroup, Language, NavLink } from '../types'

// DATA SLOT: footerGroups
export const footerGroups: FooterGroup[] = [
  {
    groupTitle: { en: 'ADVERTISEMENT', ko: '광고' },
    links: [
      { label: { en: 'Banner Ad Information', ko: '배너 광고 안내' }, href: '/adv/banner' },
      { label: { en: 'Massage Advertisement Information', ko: '마사지 광고 안내' }, href: '/adv/massage' },
      { label: { en: 'Point Ad Information', ko: '포인트 광고 안내' }, href: '/adv/point' },
    ],
  },
  {
    groupTitle: { en: 'LINK', ko: '링크' },
    links: [
      { label: { en: 'Business Directory', ko: '업소록' }, href: '/company' },
      { label: { en: 'User Guide', ko: '이용안내' }, href: '/help/guideline' },
      { label: { en: 'About ManilaTour', ko: '필고 소개' }, href: '/help/about' },
      { label: { en: 'Operator Inquiry', ko: '운영자 문의' }, href: '/chat/index' },
    ],
  },
  {
    groupTitle: { en: 'POLICY', ko: '정책' },
    links: [
      { label: { en: 'Terms of Use', ko: '이용약관' }, href: '/help/terms' },
      { label: { en: 'privacy policy', ko: '개인정보처리방침' }, href: '/help/privacy' },
      { label: { en: 'Child safety standards', ko: '아동 안전 기준' }, href: '/help/safety' },
    ],
  },
]

// DATA SLOT: footer policy nav row (· separated)
export const footerPolicyNav: NavLink[] = [
  { label: { en: 'Terms of Use', ko: '이용약관' }, href: '/help/terms' },
  { label: { en: 'privacy policy', ko: '개인정보처리방침' }, href: '/help/privacy' },
  { label: { en: 'Child safety standards', ko: '아동 안전 기준' }, href: '/help/safety' },
]

// DATA SLOT: languages (required working options EN + KO)
export const languages: Language[] = [
  { code: 'en', label: 'EN', href: '/en/' },
  { code: 'ko', label: 'KO', href: '/ko/' },
]

// Visible-but-optional global-site links from the original (JP/CN)
export const optionalGlobalSites: { label: string; href: string }[] = [
  { label: 'JP', href: '/jp/' },
  { label: 'CN', href: '/cn/' },
]

/**
 * DATA SLOT: company (placeholders only).
 * Philgo's real footer does NOT show a physical-address / business-registration block.
 * Provided here for clients who want a traditional company-info footer; not rendered by default.
 */
export const company = {
  name: '[Company Name]',
  address: '[Address]',
  tel: '[Tel]',
  email: '[Email]',
  regNo: '[Business Reg. No.]',
  ceo: '[CEO]',
}
