import type { EmergencyContact } from '../types'

// Recent Comments moved to Supabase (see src/lib/posts.ts listRecentComments).
// Recent photos moved to Supabase (see src/lib/content.ts listPhotos).

// DATA SLOT: emergency=[{label, number, note?, href}] — structural chrome, stays in code.
export const emergencyContacts: EmergencyContact[] = [
  { label: { en: 'Embassy', ko: '대사관' }, number: '+63-2-8856-9210' },
  { label: { en: 'Police / Emergency', ko: '경찰/긴급' }, number: '911' },
  { label: { en: 'Hospital / Emergency', ko: '병원/긴급' }, number: '911' },
  { label: { en: 'Korean Association', ko: '한인회' }, number: '+63-2-8886-4848' },
  { label: { en: 'Consular Call Center', ko: '영사 콜센터' }, number: '00800-2100-0404', note: { en: '24h', ko: '24시간' } },
]
