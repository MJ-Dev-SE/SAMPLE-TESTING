import type { AdvertisementRec } from '../types'

/**
 * hanin.tv wing-banner DEFAULTS — shown until an admin uploads real hanin wing
 * ads (position 'hanin:wing-left' / 'hanin:wing-right'). Images live under
 * public/brand/hanin/wings/. Each wing links to its business profile
 * (/business/<slug> → BusinessView) so clicking a wing shows that business's
 * address + Contact card — the businesses live in src/data/haninBusinesses.ts.
 * WingBanners.tsx uses these only when the DB returns no hanin wing rows.
 */
function wing(id: string, file: string, titleEn: string, linkSlug: string): AdvertisementRec {
  return {
    id,
    title: { en: titleEn, ko: titleEn },
    description: { en: '', ko: '' },
    body: { en: '', ko: '' },
    image_url: `/brand/hanin/wings/${file}`,
    url: `/business/${linkSlug}`,
    position: 'wing-left',
    sort: 0,
    active: true,
    start_date: null,
    end_date: null,
  }
}

export const haninWingsLeft: AdvertisementRec[] = [
  wing('hanin-wing-l1', 'korex.jpg', 'Korex Sea & Air', 'hanin-korex'),
  wing('hanin-wing-l2', 'luckyphilkor.jpg', 'Lucky Phil Kor Logistics', 'hanin-lucky-philkor'),
  wing('hanin-wing-l3', 'yeson.jpg', 'Yeson Travel & Consultancy', 'hanin-yeson-travel'),
  wing('hanin-wing-l4', 'k2tour.jpg', 'K2 Hopping Tour', 'hanin-k2-hopping-tour'),
]

export const haninWingsRight: AdvertisementRec[] = [
  wing('hanin-wing-r1', 'waterpromo.png', 'Cheongho Nice Water', 'hanin-cheongho'),
  wing('hanin-wing-r2', 'lasema.jpg', 'Lasema Jjim Jil Bang Spa', 'hanin-lasema-spa'),
  wing('hanin-wing-r3', 'menu-set.jpg', 'Yedang Korean Restaurant', 'hanin-yedang'),
  wing('hanin-wing-r4', 'yedang.jpg', 'Yedang Korean Restaurant', 'hanin-yedang'),
]
