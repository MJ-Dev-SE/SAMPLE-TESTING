import type { EmergencyContact } from '../types'

// Recent Comments moved to Supabase (see src/lib/posts.ts listRecentComments).
// Recent photos moved to Supabase (see src/lib/content.ts listPhotos).

// DATA SLOT: emergency=[{label, number, note?, href}] — structural chrome, stays in code.
// 88 Hotspring Resort's own contact lines (Santa Rosa, Laguna) — number/email
// confirmed with the client; `href` overrides the default `tel:` link (mailto:
// for the email row). Source for the address on file: 9061 National Highway,
// Bagong Kalsada, Santa Rosa, 4030 Laguna, Philippines.
export const emergencyContacts: EmergencyContact[] = [
  { label: { en: 'Front Desk', ko: '프런트 데스크' }, number: '0917-874-7888' },
  // { label: { en: 'Reservations', ko: '예약' }, number: '(049) 536-1088' },
  { label: { en: 'Email', ko: '이메일' }, number: 'info@88hotspring.com', href: 'mailto:pr@88hotspring.com' },
]
