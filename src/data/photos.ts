import type { ResortPhoto } from '../types'

// DATA SLOT: resort photos — HARDCODED pics served from /public/photos.
// To change a picture: drop the file in public/photos/banner or public/photos/recent,
// then add/edit its entry here (src + title/tag/description/details). Components never change.
// Captions were written from the actual contents of each image.

/** Build a URL-safe src for a file inside /public/photos (names may contain spaces/%). */
const photo = (folder: 'banner' | 'recent', file: string) =>
  `/photos/${folder}/${encodeURIComponent(file)}`

// ---- Banner row (homepage mid banners): 2025 room-rate cards ----
export const bannerPhotos: ResortPhoto[] = [
  {
    id: 'bamboo-deluxe',
    src: photo('banner', 'ROOMRATE2025_B.DELUXE.jpg'),
    tag: { en: 'Room Rates 2025', ko: '2025 객실 요금' },
    title: { en: 'Bamboo Deluxe', ko: '뱀부 디럭스' },
    description: {
      en: 'Native-style bamboo cottage with a red roof and veranda. Room rate ₱5,600.00 inclusive of 2 pax entrance, plus free breakfast.',
      ko: '빨간 지붕과 베란다가 있는 전통 대나무 코티지. 객실 요금 ₱5,600.00 (입장료 2인 포함), 조식 무료 제공.',
    },
    details: [
      { en: 'Max capacity: 4 pax — Adult ₱1,650/pax · Child (3–12 yrs) ₱1,300/pax', ko: '최대 4인 — 성인 ₱1,650/인 · 어린이(3–12세) ₱1,300/인' },
      { en: '1 king size bed · Air-conditioned · Refrigerator · Bathroom · Cable TV', ko: '킹사이즈 침대 1개 · 에어컨 · 냉장고 · 욕실 · 케이블 TV' },
      { en: 'All room rates are subject to 12% VAT', ko: '모든 객실 요금에 12% VAT 부과' },
    ],
  },
  {
    id: 'bamboo-suite',
    src: photo('banner', 'ROOMRATE2025_B.SUITE.jpg'),
    tag: { en: 'Room Rates 2025', ko: '2025 객실 요금' },
    title: { en: 'Bamboo Suite', ko: '뱀부 스위트' },
    description: {
      en: 'Woven-bamboo suite cottage (rooms 701–709). Room rate ₱5,600.00 inclusive of 2 pax entrance, plus free breakfast.',
      ko: '대나무 스위트 코티지 (701–709호). 객실 요금 ₱5,600.00 (입장료 2인 포함), 조식 무료 제공.',
    },
    details: [
      { en: 'Max capacity: 5 pax — Adult ₱1,650/pax · Child (3–12 yrs) ₱1,300/pax', ko: '최대 5인 — 성인 ₱1,650/인 · 어린이(3–12세) ₱1,300/인' },
      { en: '1 queen + 1 single bed · Air-conditioned · Refrigerator · Bathroom · Cable TV', ko: '퀸 침대 1개 + 싱글 침대 1개 · 에어컨 · 냉장고 · 욕실 · 케이블 TV' },
      { en: 'All room rates are subject to 12% VAT', ko: '모든 객실 요금에 12% VAT 부과' },
    ],
  },
  {
    id: 'executive-room',
    src: photo('banner', 'ROOMRATE2025_EXECUTIVE.jpg'),
    tag: { en: 'Room Rates 2025', ko: '2025 객실 요금' },
    title: { en: 'Executive Room', ko: '이그제큐티브 룸' },
    description: {
      en: 'Spacious executive room (901–902) with wide picture windows and a garden view. Room rate ₱10,000.00 inclusive of 4 pax entrance, plus free breakfast.',
      ko: '넓은 창과 정원 전망의 이그제큐티브 룸 (901–902호). 객실 요금 ₱10,000.00 (입장료 4인 포함), 조식 무료 제공.',
    },
    details: [
      { en: 'Max capacity: 6 pax — Adult ₱1,650/pax · Child (3–12 yrs) ₱1,300/pax', ko: '최대 6인 — 성인 ₱1,650/인 · 어린이(3–12세) ₱1,300/인' },
      { en: '2 queen size beds · Air-conditioned · Refrigerator · Bathroom · Cable TV', ko: '퀸사이즈 침대 2개 · 에어컨 · 냉장고 · 욕실 · 케이블 TV' },
      { en: 'All room rates are subject to 12% VAT', ko: '모든 객실 요금에 12% VAT 부과' },
    ],
  },
  {
    id: 'pension-house',
    src: photo('banner', 'ROOMRATE2025_PENSION.jpg'),
    tag: { en: 'Room Rates 2025', ko: '2025 객실 요금' },
    title: { en: 'Pension House', ko: '펜션 하우스' },
    description: {
      en: 'White cottage row (rooms 511, 513–517) facing the open lawn at the foot of the hills. Room rate ₱6,600.00 inclusive of 2 pax entrance, plus free breakfast.',
      ko: '언덕 아래 잔디밭을 마주한 흰색 코티지 (511, 513–517호). 객실 요금 ₱6,600.00 (입장료 2인 포함), 조식 무료 제공.',
    },
    details: [
      { en: 'Max capacity: 6 pax — Adult ₱1,650/pax · Child (3–12 yrs) ₱1,300/pax', ko: '최대 6인 — 성인 ₱1,650/인 · 어린이(3–12세) ₱1,300/인' },
      { en: '1 queen + 1 single bed · Air-conditioned · Refrigerator · Bathroom · Cable TV', ko: '퀸 침대 1개 + 싱글 침대 1개 · 에어컨 · 냉장고 · 욕실 · 케이블 TV' },
      { en: 'All room rates are subject to 12% VAT', ko: '모든 객실 요금에 12% VAT 부과' },
    ],
  },
  {
    id: 'villa-room',
    src: photo('banner', 'ROOMRATE2025_VILLAROOM.jpg'),
    tag: { en: 'Room Rates 2025', ko: '2025 객실 요금' },
    title: { en: 'Villa Room', ko: '빌라 룸' },
    description: {
      en: 'Orange stone-accented villa (rooms 101–112) surrounded by tropical gardens. Room rate ₱6,600.00 inclusive of 2 pax entrance, plus free breakfast.',
      ko: '열대 정원으로 둘러싸인 오렌지색 석조 빌라 (101–112호). 객실 요금 ₱6,600.00 (입장료 2인 포함), 조식 무료 제공.',
    },
    details: [
      { en: 'Max capacity: 6 pax — Adult ₱1,650/pax · Child (3–12 yrs) ₱1,300/pax', ko: '최대 6인 — 성인 ₱1,650/인 · 어린이(3–12세) ₱1,300/인' },
      { en: '1 queen + 1 single bed · Air-conditioned · Refrigerator · Bathroom · Cable TV', ko: '퀸 침대 1개 + 싱글 침대 1개 · 에어컨 · 냉장고 · 욕실 · 케이블 TV' },
      { en: 'All room rates are subject to 12% VAT', ko: '모든 객실 요금에 12% VAT 부과' },
    ],
  },
]

// ---- Recent photos (left sidebar grid) ----
export const recentPhotos: ResortPhoto[] = [
  {
    id: 'cottages',
    src: photo('recent', '1.jpg'),
    tag: { en: 'Cottages', ko: '코티지' },
    title: { en: 'Cottages for Rent', ko: '대여 코티지 안내' },
    description: {
      en: 'Kubo-style cottages around the pools, lagoon and open field. Cottages for rent until 8:00 PM only; swing-type cottages until 12:00 midnight.',
      ko: '수영장·라군·잔디밭 주변의 쿠보 스타일 코티지. 대여 코티지는 오후 8시까지, 스윙형 코티지는 자정 12시까지 이용 가능.',
    },
    details: [
      { en: 'Standard Kubo (6–8 pax) ₱1,500 — near the pool area in the open field', ko: '스탠다드 쿠보 (6–8인) ₱1,500 — 잔디밭 수영장 근처' },
      { en: 'Lagoon Cottages (6–8 pax) ₱1,000 — around the lagoon & open field', ko: '라군 코티지 (6–8인) ₱1,000 — 라군 주변 및 잔디밭' },
      { en: 'Big Cottage (12 pax) ₱2,500 — beside Pension House', ko: '빅 코티지 (12인) ₱2,500 — 펜션 하우스 옆' },
      { en: 'Round Table Rental with 6 chairs ₱700', ko: '원형 테이블 대여 (의자 6개 포함) ₱700' },
      { en: 'FREE swing-type open cottages near the pool (first come, first serve)', ko: '수영장 근처 스윙형 오픈 코티지 무료 (선착순)' },
    ],
  },
  {
    id: 'daytour-2026',
    src: photo('recent', '2.jpg'),
    tag: { en: 'Daytour', ko: '데이투어' },
    title: { en: 'Daytour Rates 2026', ko: '2026 데이투어 요금' },
    description: {
      en: 'Daytour admission with lockers and access to all hotspring & swimming pools.',
      ko: '락커와 모든 온천·수영장 이용이 포함된 데이투어 입장 요금.',
    },
    details: [
      { en: 'Entrance only — Adult ₱980 · Kid ₱780 (kubo cottage/table rental required)', ko: '입장만 — 성인 ₱980 · 어린이 ₱780 (쿠보 코티지/테이블 대여 필수)' },
      { en: 'Entrance + cottage — Adult ₱1,200 · Kid ₱900 (swing-type, first come first serve)', ko: '입장 + 코티지 — 성인 ₱1,200 · 어린이 ₱900 (스윙형, 선착순)' },
      { en: 'Mon–Fri 9:00 AM–12:00 MN · Sat & Sun 8:00 AM–12:00 MN', ko: '월–금 오전 9시–자정 · 토·일 오전 8시–자정' },
      { en: 'Contact: 0917-839-8508 / 0917-874-7888 · info@88hotspring.com', ko: '문의: 0917-839-8508 / 0917-874-7888 · info@88hotspring.com' },
    ],
  },
  {
    id: 'promo-30-off',
    src: photo('recent', '20% OFF on all Room rates (2).jpg'),
    tag: { en: 'Promo', ko: '프로모션' },
    title: { en: "It's Raining Discounts — 30% Off All Room Rates", ko: '레이니 시즌 프로모 — 전 객실 30% 할인' },
    description: {
      en: 'Rainy Season Promo: 30% off on all room rates, Sundays to Fridays (except Saturdays & holidays). Promo runs until July 31, 2026 only.',
      ko: '우기 시즌 프로모션: 전 객실 요금 30% 할인, 일–금 적용 (토요일·공휴일 제외). 2026년 7월 31일까지.',
    },
    details: [
      { en: 'Standard Room ₱4,600 → ₱3,220 · Bamboo Deluxe/Suite ₱5,600 → ₱3,920', ko: '스탠다드 룸 ₱4,600 → ₱3,220 · 뱀부 디럭스/스위트 ₱5,600 → ₱3,920' },
      { en: 'Villa/Pension/Garden ₱6,600 → ₱4,620 · Executive ₱10,000 → ₱7,000', ko: '빌라/펜션/가든 ₱6,600 → ₱4,620 · 이그제큐티브 ₱10,000 → ₱7,000' },
      { en: 'All room rates are subject to 12% VAT', ko: '모든 객실 요금에 12% VAT 부과' },
    ],
  },
  {
    id: 'events-place',
    src: photo('recent', 'Event Package_D1.V2.jpg'),
    tag: { en: 'Events', ko: '이벤트' },
    title: { en: 'Events Place — Package Inclusions', ko: '이벤트 플레이스 — 패키지 구성' },
    description: {
      en: 'Your ideal venue for corporate events, team buildings, reunions and special celebrations at #9061 National Highway, Bagong Kalsada, Calamba, Laguna.',
      ko: '기업 행사·팀빌딩·동창회·특별 행사에 이상적인 장소 (#9061 National Highway, Bagong Kalsada, Calamba, Laguna).',
    },
    details: [
      { en: 'Function hall (aircon or non-aircon), tables & chairs, welcome tarpaulin, registration table', ko: '펑션홀(에어컨/비에어컨), 테이블·의자, 환영 현수막, 등록 테이블' },
      { en: 'Accommodation: overnight (check-in 2PM / out 11AM) or daytour 8AM–10PM', ko: '숙박: 1박(체크인 2시/아웃 11시) 또는 데이투어 8AM–10PM' },
      { en: 'Assisted buffet or set meals, AM/PM snacks, meal coupons, water stations', ko: '뷔페 또는 세트 식사, 오전/오후 간식, 식사 쿠폰, 급수대' },
      { en: 'Basic sound system + videoke; live band upon request', ko: '기본 음향 시스템 + 비디오케; 요청 시 라이브 밴드' },
      { en: 'Multiple swimming pools & access to all designated hotsprings', ko: '다수의 수영장 및 지정 온천 이용' },
    ],
  },
  {
    id: 'logo-mark',
    src: photo('recent', 'HIGH RES.jpg'),
    tag: { en: 'About', ko: '소개' },
    title: { en: '88 Hotspring Resort Logo Mark', ko: '88 온천 리조트 로고 마크' },
    description: {
      en: 'The official 4-square mark of 88 Hotspring Resort: golf (green), leisure under the sun (blue), travel (purple) and hot springs (orange).',
      ko: '88 온천 리조트 공식 4-스퀘어 마크: 골프(초록), 태양 아래 레저(파랑), 여행(보라), 온천(주황).',
    },
  },
  {
    id: 'tour-itineraries',
    src: photo('recent', 'INSIDE.jpg'),
    tag: { en: 'Tours', ko: '투어' },
    title: { en: 'Tour Itineraries — Daytour & 2D1N Packages', ko: '투어 일정 — 데이투어 & 1박 2일 패키지' },
    description: {
      en: 'Guided tours with shuttle departure from Mall of Asia, Manila at 9:00 AM. 88 Hotspring Resort sits at the foot of Mt. Makiling with 11 outdoor pools supplied by natural mineral-rich hotspring water.',
      ko: '마닐라 몰오브아시아에서 오전 9시 셔틀 출발 가이드 투어. 88 온천 리조트는 마킬링산 기슭에 있으며 천연 미네랄 온천수가 공급되는 야외 수영장 11개를 갖추고 있습니다.',
    },
    details: [
      { en: '88 Hotspring Resort Daytour — ₱2,150/pax (transport, guide, pool access, lockers, cottages, meal)', ko: '88 온천 리조트 데이투어 — ₱2,150/인 (교통·가이드·수영장·락커·코티지·식사)' },
      { en: '2 Days 1 Night Package — ₱5,900/pax (room, meals, pool access + Pagsanjan boat tour)', ko: '1박 2일 패키지 — ₱5,900/인 (객실·식사·수영장 + 파그산잔 보트 투어)' },
      { en: 'Pagsanjan Falls Daytour — ₱2,150/pax (boat ride tour, lockers, protective equipment, meal)', ko: '파그산잔 폭포 데이투어 — ₱2,150/인 (보트 투어·락커·보호 장비·식사)' },
      { en: 'Reserve by calling before 12 midnight the day before', ko: '전날 자정 이전 전화 예약 필수' },
    ],
  },
  {
    id: 'ihawan-garden',
    src: photo('recent', 'Logo_518x122cm.jpg'),
    tag: { en: 'Dining', ko: '레스토랑' },
    title: { en: 'Makiling 88SPA — Ihawan Garden Restaurant', ko: '마킬링 88스파 — 이하완 가든 레스토랑' },
    description: {
      en: 'Filipino & Korean cuisine (필리핀 전통요리 & 한국요리). A Filipino grill-garden restaurant near Mt. Makiling serving grilled seafood, meat and Korean dishes; open 11:00 AM–11:00 PM.',
      ko: '필리핀 전통요리 & 한국요리. 마킬링산 근처의 필리핀 숯불구이 가든 레스토랑 — 해산물·고기 구이와 한식 제공, 오전 11시–오후 11시 운영.',
    },
  },
  {
    id: 'guide-map',
    src: photo('recent', 'Map_Back.jpg'),
    tag: { en: 'Guide Map', ko: '안내 지도' },
    title: { en: '88 SPA Guide Map', ko: '88 스파 가이드맵' },
    description: {
      en: 'Illustrated resort map with a 46-point legend: entrance tower, reception, Korean restaurant, lockers, karaoke stage, pools (cold/warm/hotspring/octagon/infinity), man-made lagoon, rooms and cottages, Ihawan Garden, function room, KTV and parking.',
      ko: '46개 항목 범례가 있는 리조트 일러스트 지도: 입구 타워, 리셉션, 한식당, 락커, 노래방 무대, 수영장(냉탕/온탕/온천/옥타곤/인피니티), 인공 라군, 객실·코티지, 이하완 가든, 펑션룸, KTV, 주차장.',
    },
    details: [
      { en: 'Tip: try the octagon pools (37–43°C) for 5–10 minutes per pool', ko: '팁: 옥타곤 풀(37–43°C)을 풀당 5–10분씩 이용해 보세요' },
    ],
  },
  {
    id: 'brochure',
    src: photo('recent', 'Map_Front.jpg'),
    tag: { en: 'Brochure', ko: '브로슈어' },
    title: { en: 'Resort Brochure — Healing Facilities & Services', ko: '리조트 브로슈어 — 힐링 시설 & 서비스' },
    description: {
      en: 'Seven hectares at the base of Mt. Makiling, Calamba City, Laguna — 8 natural hot spring pools, octagon chi pools, forest therapy, Korean-style massage, Ihawan Garden restaurant, cocktail bar and 56 furnished accommodations.',
      ko: '라구나 칼람바시 마킬링산 기슭 7헥타르 — 천연 온천풀 8개, 옥타곤 기(氣) 풀, 산림 치유, 한국식 마사지, 이하완 가든 레스토랑, 칵테일 바, 56개 객실.',
    },
    details: [
      { en: 'Check-in 2:00 PM · Check-out 11:00 AM · Daytour 7:00 AM–12:00 MN', ko: '체크인 오후 2시 · 체크아웃 오전 11시 · 데이투어 오전 7시–자정' },
      { en: '#9061 Nat\'l Highway, Bagong Kalsada, Calamba City, 4027 Laguna', ko: '#9061 Nat\'l Highway, Bagong Kalsada, Calamba City, 4027 Laguna' },
      { en: 'Globe 0917-874-7888 · Smart 0920-857-4888 · www.88hotspring.com', ko: 'Globe 0917-874-7888 · Smart 0920-857-4888 · www.88hotspring.com' },
    ],
  },
  {
    id: 'manila-tour',
    src: photo('recent', 'OUTSIDE.jpg'),
    tag: { en: 'Tours', ko: '투어' },
    title: { en: 'Manila Tour Getaway — Shuttle & Booking', ko: '마닐라 투어 게러웨이 — 셔틀 & 예약' },
    description: {
      en: 'Daily shuttle between SM Mall of Asia, 88 Hotspring Resort and Pagsanjan Falls. Pick-up in front of SM Mall of Asia near the fountain at Pacific Drive entrance.',
      ko: 'SM 몰오브아시아 ↔ 88 온천 리조트 ↔ 파그산잔 폭포 데일리 셔틀. 픽업은 SM 몰오브아시아 퍼시픽 드라이브 입구 분수대 앞.',
    },
    details: [
      { en: 'Shuttle: 9AM MOA → 11AM 88 Hotspring → 3PM Pagsanjan → 6PM return', ko: '셔틀: 9시 MOA → 11시 88온천 → 15시 파그산잔 → 18시 복귀' },
      { en: 'Roundtrip fare: 88 Hotspring ₱2,000 · 88 Pagsanjan ₱3,000', ko: '왕복 요금: 88 온천 ₱2,000 · 88 파그산잔 ₱3,000' },
      { en: 'Book by 12 midnight the day before — Globe 0905-466-8886 · Korean 0905-524-1825', ko: '전날 자정까지 예약 — Globe 0905-466-8886 · 한국어 0905-524-1825' },
    ],
  },
  {
    id: 'pet-policy',
    src: photo('recent', 'PET POLICY 2026_NEW.jpg'),
    tag: { en: 'Policy', ko: '정책' },
    title: { en: 'Pet Policy 2026 — Guidelines for Guests', ko: '2026 반려동물 정책 — 이용 안내' },
    description: {
      en: 'Pets are welcome (dogs, cats & birds; max 2 per room) but must be leashed or caged, wear diapers, and are strictly prohibited in the pools and inside the restaurant (₱3,000 fine).',
      ko: '반려동물 동반 가능 (개·고양이·새, 객실당 최대 2마리). 목줄/케이지·기저귀 착용 필수, 수영장과 레스토랑 내부 출입 엄금 (벌금 ₱3,000).',
    },
    details: [
      { en: 'Small pets (≤7kg) ₱500 · Large (8–20kg) ₱800 · Extra large (20kg+) ₱1,000 per pet', ko: '소형(7kg 이하) ₱500 · 대형(8–20kg) ₱800 · 특대형(20kg 이상) ₱1,000 (마리당)' },
      { en: 'Pets 8kg+ allowed in premises until 7:00 PM, then transferred to the pet hotel', ko: '8kg 이상 반려동물은 오후 7시까지만 리조트 내 허용, 이후 펫호텔로 이동' },
      { en: 'Non-compliance fine ₱2,000', ko: '정책 위반 시 벌금 ₱2,000' },
    ],
  },
  {
    id: 'resort-rules',
    src: photo('recent', 'RESORT RULES.jpg'),
    tag: { en: 'Policy', ko: '정책' },
    title: { en: 'Resort Rules and Regulations', ko: '리조트 이용 규칙' },
    description: {
      en: 'Wristband must be worn at all times (no wristband, no entry). Strictly no diving, no littering, no vandalism, no weapons; no swimming under the influence of drugs or alcohol.',
      ko: '손목밴드 상시 착용 필수 (미착용 시 입장 불가). 다이빙·쓰레기 투기·낙서·무기 반입 금지, 음주·약물 상태 수영 금지.',
    },
    details: [
      { en: 'Children/elderlies/PWDs must be supervised by an adult at all times', ko: '어린이·노약자·장애인은 항상 성인 동반 필수' },
      { en: 'No cooking appliances inside; smoking only in designated areas; pets not allowed in pools', ko: '조리기구 반입 금지 · 지정 구역 외 흡연 금지 · 반려동물 수영장 입수 금지' },
      { en: 'Lost room key ₱2,000 · lost daytour locker key ₱500', ko: '객실 열쇠 분실 ₱2,000 · 데이투어 락커 열쇠 분실 ₱500' },
    ],
  },
  {
    id: 'garden-room',
    src: photo('recent', 'ROOMRATE2025_GARDEN ROOM.jpg'),
    tag: { en: 'Room Rates 2025', ko: '2025 객실 요금' },
    title: { en: 'Garden Room', ko: '가든 룸' },
    description: {
      en: 'Newly built native-inspired rooms (801–812) with woven amakan walls and porch. Room rate ₱6,600.00 inclusive of 2 pax entrance, plus free breakfast.',
      ko: '아마칸 짜임 벽과 포치가 있는 신축 전통 스타일 객실 (801–812호). 객실 요금 ₱6,600.00 (입장료 2인 포함), 조식 무료 제공.',
    },
    details: [
      { en: 'Max capacity: 4 pax — Adult ₱1,650/pax · Child (3–12 yrs) ₱1,300/pax', ko: '최대 4인 — 성인 ₱1,650/인 · 어린이(3–12세) ₱1,300/인' },
      { en: '1 queen + 1 single bed · Air-conditioned · Refrigerator · Bathroom · Cable TV', ko: '퀸 침대 1개 + 싱글 침대 1개 · 에어컨 · 냉장고 · 욕실 · 케이블 TV' },
      { en: 'All room rates are subject to 12% VAT', ko: '모든 객실 요금에 12% VAT 부과' },
    ],
  },
]

/** Every photo (banner + recent) — lookup table for /photo/view?id=… */
export const allPhotos: ResortPhoto[] = [...bannerPhotos, ...recentPhotos]
export const findPhoto = (id: string) => allPhotos.find((p) => p.id === id)
