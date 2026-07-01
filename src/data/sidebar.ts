import type { EmergencyContact, RecentComment, RecentPhoto } from '../types'
import { avatar, placeholderImg } from '../lib/placeholder'

// DATA SLOT: recentComments=[{avatar, author, timeAgo, snippet, href}]
export const recentComments: RecentComment[] = [
  { avatar: avatar('Minho'), author: 'Minho', timeAgo: { en: '2 hours ago', ko: '2시간 전' }, snippet: { en: 'Thanks for the tip, I exchanged at that rate yesterday and it was great.', ko: '[KO: Thanks for the tip...]' }, href: '#' },
  { avatar: avatar('Jenny'), author: 'Jenny', timeAgo: { en: '3 hours ago', ko: '3시간 전' }, snippet: { en: 'Does anyone know if the embassy is open on Saturdays?', ko: '[KO: Is the embassy open on Saturdays?]' }, href: '#' },
  { avatar: avatar('Carlo'), author: 'Carlo', timeAgo: { en: '5 hours ago', ko: '5시간 전' }, snippet: { en: 'I had the same problem with my visa, here is what worked for me.', ko: '[KO: Same visa problem...]' }, href: '#' },
  { avatar: avatar('Soo'), author: 'Soo-jin', timeAgo: { en: '6 hours ago', ko: '6시간 전' }, snippet: { en: 'The new Korean restaurant in BGC is amazing, highly recommend.', ko: '[KO: New Korean restaurant in BGC...]' }, href: '#' },
  { avatar: avatar('Dave'), author: 'Dave', timeAgo: { en: '8 hours ago', ko: '8시간 전' }, snippet: { en: 'Be careful with that rental company, read the contract twice.', ko: '[KO: Careful with rental company...]' }, href: '#' },
  { avatar: avatar('Hana'), author: 'Hana', timeAgo: { en: '10 hours ago', ko: '10시간 전' }, snippet: { en: 'Anyone going to the language exchange meetup this weekend?', ko: '[KO: Language exchange meetup?]' }, href: '#' },
  { avatar: avatar('Rey'), author: 'Rey', timeAgo: { en: '12 hours ago', ko: '12시간 전' }, snippet: { en: 'Updated the guide with the latest 2026 fees, check it out.', ko: '[KO: Updated guide with 2026 fees...]' }, href: '#' },
  { avatar: avatar('Yuna'), author: 'Yuna', timeAgo: { en: '1 day ago', ko: '1일 전' }, snippet: { en: 'My condo association finally approved fiber internet!', ko: '[KO: Condo approved fiber internet!]' }, href: '#' },
]

// DATA SLOT: recentPhotos=[{thumb, href}]
export const recentPhotos: RecentPhoto[] = Array.from({ length: 9 }, (_, i) => ({
  thumb: placeholderImg(90, 90, `Photo ${i + 1}`),
  href: '#',
}))

// DATA SLOT: emergency=[{label, number, note?, href}]
export const emergencyContacts: EmergencyContact[] = [
  { label: { en: 'Embassy', ko: '대사관' }, number: '+63-2-8856-9210' },
  { label: { en: 'Police / Emergency', ko: '경찰/긴급' }, number: '911' },
  { label: { en: 'Hospital / Emergency', ko: '병원/긴급' }, number: '911' },
  { label: { en: 'Korean Association', ko: '한인회' }, number: '+63-2-8886-4848' },
  { label: { en: 'Consular Call Center', ko: '영사 콜센터' }, number: '00800-2100-0404', note: { en: '24h', ko: '24시간' } },
]
