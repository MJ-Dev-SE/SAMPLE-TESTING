import type { BusinessRec, Localized } from '../types'

/**
 * hanin.tv business content — ONE source of truth for the businesses that
 * appear on hanin.tv across three surfaces:
 *   - the Business Directory (injected by category on hanin.tv — routes/Company.tsx),
 *   - the homepage "Featured businesses" showcase grid (HaninShowcase.tsx),
 *   - the side wing banners (their creatives link here — data/haninWings.ts).
 * Every surface links to the SAME business profile page (/business/<slug> →
 * BusinessView), which shows the address + Contact card.
 *
 * This is the static default so hanin.tv works with no DB seeding (I have no
 * Storage/DB credentials). Images live under public/brand/hanin/**. An admin
 * can later add real rows to public.businesses; those are separate and simply
 * appear alongside these.
 *
 * `categorySlug` maps to a Business Directory child category (src/data/manilaSeed.json
 * categories: food, mart, hospital, travel, spa, etc). Address/phone were
 * transcribed from the client's Google-Maps info panels in assetsad/ where the
 * pairing is confident; otherwise left blank for the admin to complete.
 */
export interface HaninBusiness {
  id: string
  slug: string
  name: string
  categorySlug: string
  image: string
  tag: Localized
  region: string | null
  address: string | null
  addressProvince: string | null
  addressCity: string | null
  addressBarangay: string | null
  phone: string | null
  mobilePhone: string | null
  shortIntro: Localized
  detailedIntro: Localized
  /** Show in the homepage showcase grid (HaninShowcase). */
  showcase: boolean
}

export const haninBusinesses: HaninBusiness[] = [
  {
    id: 'hanin-chuiyoung-salon',
    slug: 'hanin-chuiyoung-salon',
    name: 'Chuiyoung Salon',
    categorySlug: 'food',
    image: '/brand/hanin/showcase/chuiyoung.png',
    tag: { en: 'Korean Restaurant', ko: '한식당' },
    region: 'Parañaque',
    address: 'K1 Center, Prestige Bay, Bradco Ave, Aseana City, Parañaque, 1700 Metro Manila',
    addressProvince: 'Metro Manila',
    addressCity: 'Parañaque',
    addressBarangay: 'Aseana City',
    phone: '0956 867 3549',
    mobilePhone: '0962 589 4755',
    shortIntro: { en: 'Korean cuisine at K1 Center, Aseana City.', ko: 'K1 센터 아세아나시티의 한식 전문.' },
    detailedIntro: {
      en: 'Authentic Korean flavors just like in Korea. Open 10:00 AM – 4:00 AM · ₱500–1,000 per person · LGBTQ+ friendly.',
      ko: '한국에서처럼 정통의 맛. 오전 10시 – 오전 4시 · 1인당 ₱500–1,000 · LGBTQ+ 친화적.',
    },
    showcase: true,
  },
  {
    id: 'hanin-korean-dental',
    slug: 'hanin-korean-dental',
    name: 'Korean Dental Clinic',
    categorySlug: 'hospital',
    image: '/brand/hanin/showcase/dentalclinic.png',
    tag: { en: 'Dental Clinic', ko: '치과' },
    region: 'Parañaque',
    address: "2F Central Square Building, President's Ave, BF Homes, Parañaque, 1700 Metro Manila",
    addressProvince: 'Metro Manila',
    addressCity: 'Parañaque',
    addressBarangay: 'BF Homes',
    phone: '0928 416 4180',
    mobilePhone: null,
    shortIntro: { en: 'Korean-run dental clinic at Central Square, BF Homes.', ko: 'BF홈즈 센트럴스퀘어의 한인 치과.' },
    detailedIntro: {
      en: 'Modern Korean-run dental clinic. Open · Closes 5:30 PM.',
      ko: '현대적인 한인 운영 치과. 영업 · 오후 5시 30분 마감.',
    },
    showcase: true,
  },
  {
    id: 'hanin-k2-hopping-tour',
    slug: 'hanin-k2-hopping-tour',
    name: 'K2 Hopping Tour',
    categorySlug: 'travel',
    image: '/brand/hanin/showcase/k2beach.png',
    tag: { en: 'Island Hopping Tour', ko: '아일랜드 호핑 투어' },
    region: 'Zambales',
    address: 'R79H+F7, Subic Bay Freeport Zone, Zambales',
    addressProvince: 'Zambales',
    addressCity: 'Subic Bay Freeport Zone',
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Island hopping & boat tours out of Subic Bay.', ko: '수빅베이 아일랜드 호핑·보트 투어.' },
    detailedIntro: {
      en: 'Island hopping and boat tours out of Subic Bay Freeport Zone, Zambales. Open · Closes 6:00 PM · jkntree.com',
      ko: '수빅베이 자유무역지대(잠발레스)에서 출발하는 아일랜드 호핑·보트 투어. 영업 · 오후 6시 마감 · jkntree.com',
    },
    showcase: true,
  },
  {
    id: 'hanin-shabu-yaki',
    slug: 'hanin-shabu-yaki',
    name: 'Shabu Yaki',
    categorySlug: 'food',
    image: '/brand/hanin/showcase/shabuyaki.jpg',
    tag: { en: 'Korean Restaurant', ko: '한식당' },
    region: null,
    address: null,
    addressProvince: null,
    addressCity: null,
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Korean hot pot & yakiniku.', ko: '한국식 샤부샤부 & 야키니쿠.' },
    detailedIntro: {
      en: 'Korean hot pot & yakiniku — handmade Korean sausage, chicken soup, chilled buckwheat noodles.',
      ko: '한국식 샤부샤부 & 야키니쿠 — 수제 순대, 닭곰탕, 냉면.',
    },
    showcase: true,
  },
  {
    id: 'hanin-kaya-restaurant',
    slug: 'hanin-kaya-restaurant',
    name: 'Kaya Korean Restaurant',
    categorySlug: 'food',
    image: '/brand/hanin/showcase/kaya.jpg',
    tag: { en: 'Korean Restaurant', ko: '한식당' },
    region: null,
    address: null,
    addressProvince: null,
    addressCity: null,
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Classic home-style Korean dishes.', ko: '정통 가정식 한식.' },
    detailedIntro: { en: 'Korean restaurant serving classic home-style dishes.', ko: '정통 가정식 한식을 제공하는 한식당.' },
    showcase: true,
  },
  {
    id: 'hanin-daraejung',
    slug: 'hanin-daraejung',
    name: 'Daraejung Korean Restaurant',
    categorySlug: 'food',
    image: '/brand/hanin/showcase/daraejung.jpg',
    tag: { en: 'Korean Restaurant', ko: '한식당' },
    region: 'Pasay',
    address: null,
    addressProvince: null,
    addressCity: 'Pasay',
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Branches in Pasay, BGC, Quezon City & Angeles.', ko: '파사이·BGC·케손시티·앙헬레스 지점.' },
    detailedIntro: {
      en: 'Korean restaurant with branches in Pasay (main), BGC, Quezon City and Angeles.',
      ko: '파사이(본점), BGC, 케손시티, 앙헬레스 지점을 둔 한식당.',
    },
    showcase: true,
  },
  {
    id: 'hanin-mega-mart',
    slug: 'hanin-mega-mart',
    name: 'Mega Mart Fresh Food Market',
    categorySlug: 'mart',
    image: '/brand/hanin/showcase/megamart.jpg',
    tag: { en: 'Grocery', ko: '마트' },
    region: null,
    address: null,
    addressProvince: null,
    addressCity: null,
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Fresh food market — seafood, bakery & deli.', ko: '신선식품 마켓 — 해산물, 베이커리·델리.' },
    detailedIntro: { en: 'Fresh food market — seafood & sushi, bakery & deli.', ko: '신선식품 마켓 — 해산물·초밥, 베이커리·델리.' },
    showcase: true,
  },
  {
    id: 'hanin-ssong-mart',
    slug: 'hanin-ssong-mart',
    name: 'Ssong Mart',
    categorySlug: 'mart',
    image: '/brand/hanin/showcase/ssongmart.png',
    tag: { en: 'Grocery', ko: '마트' },
    region: null,
    address: null,
    addressProvince: null,
    addressCity: null,
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Korean grocery & food court.', ko: '한인 식료품점 & 푸드코트.' },
    detailedIntro: { en: 'Korean grocery & food court.', ko: '한인 식료품점 & 푸드코트.' },
    showcase: true,
  },
  // ---- wing-only businesses (link targets for the side banners) ----
  {
    id: 'hanin-korex',
    slug: 'hanin-korex',
    name: 'Korex Sea & Air',
    categorySlug: 'etc',
    image: '/brand/hanin/wings/korex.jpg',
    tag: { en: 'Logistics / Shipping', ko: '물류/해운항공' },
    region: 'Manila',
    address: 'Unit 306 B.F Condo, Soriano Ave, Intramuros, Manila',
    addressProvince: 'Metro Manila',
    addressCity: 'Manila',
    addressBarangay: 'Intramuros',
    phone: '02-5310-0556',
    mobilePhone: '0917-159-6218',
    shortIntro: { en: 'Sea & air freight, customs & door-to-door.', ko: '해상·항공 화물, 통관, 문전배송.' },
    detailedIntro: {
      en: '25 years of fast, accurate customs & forwarding: sea/air cargo, overseas moving, project cargo.',
      ko: '25년 전통의 신속·정확한 통관 및 포워딩: 해상·항공 화물, 해외 이사, 프로젝트 화물.',
    },
    showcase: false,
  },
  {
    id: 'hanin-lucky-philkor',
    slug: 'hanin-lucky-philkor',
    name: 'Lucky Phil Kor Logistics Corp.',
    categorySlug: 'etc',
    image: '/brand/hanin/wings/luckyphilkor.jpg',
    tag: { en: 'Logistics / Shipping', ko: '물류/해운항공' },
    region: 'Parañaque',
    address: 'Tambo, Parañaque City',
    addressProvince: 'Metro Manila',
    addressCity: 'Parañaque',
    addressBarangay: 'Tambo',
    phone: '02-853-7338',
    mobilePhone: null,
    shortIntro: { en: 'Air & sea freight forwarding, 2-day delivery.', ko: '항공·해상 화물 운송, 2일 배송.' },
    detailedIntro: { en: 'Air & sea freight forwarding with fast 2-day delivery.', ko: '빠른 2일 배송의 항공·해상 화물 운송.' },
    showcase: false,
  },
  {
    id: 'hanin-yeson-travel',
    slug: 'hanin-yeson-travel',
    name: 'Yeson Travel & Consultancy',
    categorySlug: 'travel',
    image: '/brand/hanin/wings/yeson.jpg',
    tag: { en: 'Travel Agency', ko: '여행사' },
    region: 'Makati',
    address: '3rd Floor, ECH Building, 100 Jupiter St, cor Makati Ave, Makati City',
    addressProvince: 'Metro Manila',
    addressCity: 'Makati',
    addressBarangay: null,
    phone: '(02) 8828 8877',
    mobilePhone: null,
    shortIntro: { en: 'Travel agency & consultancy in Makati.', ko: '마카티의 여행사·컨설팅.' },
    detailedIntro: { en: 'Travel agency & consultancy. Open · Closes 6 PM · yesontravel.com', ko: '여행사·컨설팅. 영업 · 오후 6시 마감 · yesontravel.com' },
    showcase: false,
  },
  {
    id: 'hanin-cheongho',
    slug: 'hanin-cheongho',
    name: 'Cheongho Nice Water',
    categorySlug: 'etc',
    image: '/brand/hanin/wings/waterpromo.png',
    tag: { en: 'Water Purifier', ko: '정수기' },
    region: null,
    address: null,
    addressProvince: null,
    addressCity: null,
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Water purifier sales, install & service.', ko: '정수기 판매·설치·관리.' },
    detailedIntro: {
      en: 'Water purifiers for home and business — large-capacity commercial units and hotel/school/factory water management, no lock-in period.',
      ko: '가정·업소용 정수기 — 대용량 상업용 및 호텔·학교·공장 음용수 관리, 의무사용기간 없음.',
    },
    showcase: false,
  },
  {
    id: 'hanin-lasema-spa',
    slug: 'hanin-lasema-spa',
    name: 'Lasema Jjim Jil Bang Spa',
    categorySlug: 'spa',
    image: '/brand/hanin/wings/lasema.jpg',
    tag: { en: 'Spa / Jjimjilbang', ko: '스파/찜질방' },
    region: null,
    address: null,
    addressProvince: null,
    addressCity: null,
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Korean jjimjilbang sauna & spa (est. 2005).', ko: '한국식 찜질방 사우나·스파 (2005년 설립).' },
    detailedIntro: { en: 'Korean jjimjilbang sauna & spa, established 2005.', ko: '2005년 설립된 한국식 찜질방 사우나·스파.' },
    showcase: false,
  },
  {
    id: 'hanin-yedang',
    slug: 'hanin-yedang',
    name: 'Yedang Korean Restaurant',
    categorySlug: 'food',
    image: '/brand/hanin/wings/yedang.jpg',
    tag: { en: 'Korean Restaurant', ko: '한식당' },
    region: null,
    address: null,
    addressProvince: null,
    addressCity: null,
    addressBarangay: null,
    phone: null,
    mobilePhone: null,
    shortIntro: { en: 'Korean restaurant — BBQ set menus.', ko: '한식당 — 구이 세트 메뉴.' },
    detailedIntro: { en: 'Korean restaurant with premium and value BBQ couple set menus.', ko: '프리미엄·가성비 커플 세트 메뉴가 있는 한식당.' },
    showcase: false,
  },
]

/**
 * Adapt a static hanin business to a BusinessRec so it renders through the same
 * BusinessCard / BusinessView / directory code as DB rows. `categoryId` is the
 * resolved category row id (looked up by categorySlug at the call site) so the
 * card's category chip resolves; null is fine (chip just hides).
 */
export function toBusinessRec(hb: HaninBusiness, categoryId: string | null): BusinessRec {
  return {
    id: hb.id,
    slug: hb.slug,
    name: hb.name,
    category: hb.categorySlug,
    category_id: categoryId,
    location: hb.region,
    region: hb.region,
    address: hb.address,
    address_province: hb.addressProvince,
    address_city: hb.addressCity,
    address_barangay: hb.addressBarangay,
    phone: hb.phone,
    mobile_phone: hb.mobilePhone,
    short_intro: hb.shortIntro,
    detailed_intro: hb.detailedIntro,
    excerpt: hb.shortIntro,
    description: hb.detailedIntro,
    thumb_url: hb.image,
    logo_url: null,
    main_image_url: hb.image,
    status: 'active',
    display_order: 0,
    updated_at: '',
    images: [],
  }
}

/** Businesses for a directory category slug (undefined/'all' = every hanin business). */
export function haninBusinessesForCategory(categorySlug?: string | null): HaninBusiness[] {
  if (!categorySlug || categorySlug === 'all') return haninBusinesses
  return haninBusinesses.filter((b) => b.categorySlug === categorySlug)
}

/** Look up a hanin business by slug or id (BusinessView resolution). */
export function findHaninBusiness(slugOrId: string | null | undefined): HaninBusiness | null {
  if (!slugOrId) return null
  return haninBusinesses.find((b) => b.slug === slugOrId || b.id === slugOrId) ?? null
}
