import type { CategoryGroup, NavLink } from '../types'

// DATA SLOT: the maroon scrolling category bar, re-categorized for 88 Hotspring Resort.
// Parents are resort themes; children link to the matching photo pages (/photo/view?id=…)
// or to the community boards. Same philgo layout: one parent strip + 2 child rows.
export const categoryGroups: CategoryGroup[] = [
  { parent: { label: { en: 'Rooms & Rates', ko: '객실 요금' }, href: '/photo/view?id=bamboo-deluxe' },
    children: [
      { label: { en: 'Bamboo Deluxe', ko: '뱀부 디럭스' }, href: '/photo/view?id=bamboo-deluxe' },
      { label: { en: 'Bamboo Suite', ko: '뱀부 스위트' }, href: '/photo/view?id=bamboo-suite' },
    ] },
  { parent: { label: { en: 'Villas & Executive', ko: '빌라·이그제큐티브' }, href: '/photo/view?id=executive-room' },
    children: [
      { label: { en: 'Executive Room', ko: '이그제큐티브 룸' }, href: '/photo/view?id=executive-room' },
      { label: { en: 'Villa Room', ko: '빌라 룸' }, href: '/photo/view?id=villa-room' },
    ] },
  { parent: { label: { en: 'Garden & Pension', ko: '가든·펜션' }, href: '/photo/view?id=garden-room' },
    children: [
      { label: { en: 'Garden Room', ko: '가든 룸' }, href: '/photo/view?id=garden-room' },
      { label: { en: 'Pension House', ko: '펜션 하우스' }, href: '/photo/view?id=pension-house' },
    ] },
  { parent: { label: { en: 'Promos', ko: '프로모션' }, href: '/photo/view?id=promo-30-off' },
    children: [
      { label: { en: '30% Off Rooms', ko: '객실 30% 할인' }, href: '/photo/view?id=promo-30-off' },
      { label: { en: 'Daytour Rates', ko: '데이투어 요금' }, href: '/photo/view?id=daytour-2026' },
    ] },
  { parent: { label: { en: 'Cottages', ko: '코티지' }, href: '/photo/view?id=cottages' },
    children: [
      { label: { en: 'Cottages for Rent', ko: '대여 코티지' }, href: '/photo/view?id=cottages' },
      { label: { en: 'Free Swing Type', ko: '무료 스윙형' }, href: '/photo/view?id=cottages' },
    ] },
  { parent: { label: { en: 'Tours', ko: '투어' }, href: '/photo/view?id=tour-itineraries' },
    children: [
      { label: { en: 'Tour Itineraries', ko: '투어 일정' }, href: '/photo/view?id=tour-itineraries' },
      { label: { en: 'Manila Tour Getaway', ko: '마닐라 투어' }, href: '/photo/view?id=manila-tour' },
    ] },
  { parent: { label: { en: 'Events', ko: '이벤트' }, href: '/photo/view?id=events-place' },
    children: [
      { label: { en: 'Events Place', ko: '이벤트 플레이스' }, href: '/photo/view?id=events-place' },
      { label: { en: 'Inquiries', ko: '문의' }, href: '/post/list?post_id=qna' },
    ] },
  { parent: { label: { en: 'Dining', ko: '레스토랑' }, href: '/photo/view?id=ihawan-garden' },
    children: [
      { label: { en: 'Ihawan Garden', ko: '이하완 가든' }, href: '/photo/view?id=ihawan-garden' },
      { label: { en: 'Korean Restaurant', ko: '한식당' }, href: '/photo/view?id=brochure' },
    ] },
  { parent: { label: { en: 'Resort Guide', ko: '리조트 안내' }, href: '/photo/view?id=guide-map' },
    children: [
      { label: { en: 'Guide Map', ko: '가이드맵' }, href: '/photo/view?id=guide-map' },
      { label: { en: 'Brochure', ko: '브로슈어' }, href: '/photo/view?id=brochure' },
    ] },
  { parent: { label: { en: 'Policies', ko: '이용 규정' }, href: '/photo/view?id=resort-rules' },
    children: [
      { label: { en: 'Resort Rules', ko: '리조트 규칙' }, href: '/photo/view?id=resort-rules' },
      { label: { en: 'Pet Policy', ko: '반려동물 정책' }, href: '/photo/view?id=pet-policy' },
    ] },
  { parent: { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
    children: [
      { label: { en: 'Free Board', ko: '자유게시판' }, href: '/post/list?post_id=freetalk' },
      { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
    ] },
]

// DATA SLOT: thin top utility bar (left + right link clusters)
export const topBarLeft: NavLink[] = [
  { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
  { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
  { label: { en: 'Chat', ko: '채팅' }, href: '/chat' },
  { label: { en: 'Home', ko: '홈' }, href: '/' },
]

export const topBarRight: NavLink[] = [
  { label: { en: 'Login', ko: '로그인' }, href: '/user/login' },
  { label: { en: 'Ad', ko: '광고' }, href: '/adv/banner' },
  { label: { en: 'Operation Inquiry', ko: '운영자 문의' }, href: '/chat/index' },
  { label: { en: 'Menu', ko: '메뉴' }, href: '/menu' },
]

// Quick links shown to the right of the center search box
export const searchQuickLinks: NavLink[] = [
  { label: { en: 'Encyclopedia', ko: '백과' }, href: '/post/list?post_id=freetalk&category=백과' },
  { label: { en: 'Life Tips', ko: '생활의 팁' }, href: '/post/list?post_id=freetalk&category=생활의팁' },
]
