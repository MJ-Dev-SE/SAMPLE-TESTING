import type {
  Banner,
  Board,
  Business,
  Exchange,
  NewsTab,
  NavLink,
  PopularPost,
  Stats,
  Weather,
} from '../types'
import { placeholderImg } from '../lib/placeholder'

// Real PhilGo route paths (captured from the live site).
export const routes = {
  freetalk: '/post/list?post_id=freetalk',
  qna: '/post/list?post_id=qna',
  news: '/post/list?post_id=news',
  travel: '/post/list?post_id=travel',
  buyandsell: '/post/list?post_id=buyandsell',
  massage: '/post/list?post_id=massage',
  wanted: '/post/list?post_id=wanted',
  boarding: '/post/list?post_id=boarding_house',
  business: '/post/list?post_id=business',
  blog: '/post/list?post_id=blog',
  comments: '/post/comments',
  company: '/company',
  realestate: '/real_estate/list.php',
}

// DATA SLOT: bannersTop = array of {imageUrl, href, alt}
export const bannersTop: Banner[] = [
  { imageUrl: placeholderImg(150, 56, 'Ad 1'), href: '/adv/banner', alt: 'Top banner 1' },
  { imageUrl: placeholderImg(150, 56, 'Ad 2'), href: '/adv/banner', alt: 'Top banner 2' },
]

// DATA SLOT: left-wing / right ad banners — sticky vertical "wing" ads that flank the
// centered content shell (philgo.com style). ~140px wide (a bit smaller than the 230px login
// card) so they tuck into the side gutter: 5 stacked ads on the left, 4 on the right.
// Colored mock creatives so the client sees real-looking ad slots, not empty boxes.
export const bannersLeft: Banner[] = [
  { imageUrl: placeholderImg(140, 100, 'Smile Tour', '#0071ec', '#ffffff'), href: '/adv/banner', alt: 'Left wing banner 1' },
  { imageUrl: placeholderImg(140, 100, 'Manila Clinic', '#00883c', '#ffffff'), href: '/adv/banner', alt: 'Left wing banner 2' },
  { imageUrl: placeholderImg(140, 100, 'Wealth Bank', '#6163f2', '#ffffff'), href: '/adv/banner', alt: 'Left wing banner 3' },
  { imageUrl: placeholderImg(140, 100, 'Cebu Resort', '#dc3146', '#ffffff'), href: '/adv/banner', alt: 'Left wing banner 4' },
  { imageUrl: placeholderImg(140, 100, 'K-Mart PH', '#9951db', '#ffffff'), href: '/adv/banner', alt: 'Left wing banner 5' },
]
export const bannersRight: Banner[] = [
  { imageUrl: placeholderImg(140, 100, 'Subic Yacht', '#078098', '#ffffff'), href: '/adv/banner', alt: 'Right banner 1' },
  { imageUrl: placeholderImg(140, 100, 'Barun Spine', '#dc3146', '#ffffff'), href: '/adv/banner', alt: 'Right banner 2' },
  { imageUrl: placeholderImg(140, 100, 'Noblesse Car', '#00883c', '#ffffff'), href: '/adv/banner', alt: 'Right banner 3' },
  { imageUrl: placeholderImg(140, 100, 'Angeles Spa', '#0071ec', '#ffffff'), href: '/adv/banner', alt: 'Right banner 4' },
]

// DATA SLOT: bannersMid = [{imageUrl, href, alt}] (4 cards)
export const bannersMid: Banner[] = [
  { imageUrl: placeholderImg(200, 120, 'Ad Card 1'), href: '/adv/banner', alt: 'Mid banner 1' },
  { imageUrl: placeholderImg(200, 120, 'Ad Card 2'), href: '/adv/banner', alt: 'Mid banner 2' },
  { imageUrl: placeholderImg(200, 120, 'Ad Card 3'), href: '/adv/banner', alt: 'Mid banner 3' },
  { imageUrl: placeholderImg(200, 120, 'Ad Card 4'), href: '/adv/banner', alt: 'Mid banner 4' },
]

// DATA SLOT: newsTabs — REAL content captured from the live homepage.
// Post titles are user content (Korean original = ko; English = translation).
const makeFeatured = (prefix: string) =>
  Array.from({ length: 9 }, (_, i) => ({
    thumb: placeholderImg(160, 110, `${prefix} ${i + 1}`),
    title: { en: `${prefix} featured story ${i + 1}`, ko: `${prefix} 기사 ${i + 1}` },
    href: '/post/view?idx=' + (1275768648 - i),
  }))

export const newsTabs: NewsTab[] = [
  {
    tabLabel: { en: 'news', ko: '뉴스' },
    icon: 'fa-newspaper',
    featured: makeFeatured('News'),
    headlines: [
      { title: { en: 'Top 10 Philippines News of June 29', ko: '6월 29일 필리핀 10대 뉴스' }, commentCount: 0, href: routes.news },
      { title: { en: 'Drunk Korean crashes into 8 guardrails while driving an SUV', ko: '술에 취한 한국인, SUV 몰다 가드레일 8개 들이받아' }, commentCount: 11, href: routes.news },
      { title: { en: 'Update on the murder case of 37-year-old Korean Mr. Shin Bong-seop (more detailed news)', ko: '37세 한국인 신봉섭씨 살인사건 관련 ( 좀 더 자세한 뉴스 )' }, commentCount: 5, href: routes.news },
      { title: { en: 'Korean fugitive who escaped Leyte prison arrested by PH immigration fugitive unit', ko: '레이테 교도소에서 탈옥한 한국인 도주범, 필리핀 이민국 도주범수사대에 체포' }, commentCount: 10, href: routes.news },
      { title: { en: 'Top 10 Philippines News of June 28', ko: '6월 28일 필리핀 10대 뉴스' }, commentCount: 10, href: routes.news },
      { title: { en: 'Top 10 Philippines News of June 27', ko: '6월 27일 필리핀 10대 뉴스' }, commentCount: 8, href: routes.news },
    ],
  },
  {
    tabLabel: { en: 'travel', ko: '여행' },
    icon: 'fa-plane',
    featured: makeFeatured('Travel'),
    headlines: [
      { title: { en: 'Best beaches near Cebu for a weekend trip', ko: '주말 여행하기 좋은 세부 근교 해변' }, commentCount: 18, href: routes.travel },
      { title: { en: 'Budget guide: Boracay in the off-season', ko: '비수기 보라카이 알뜰 여행 가이드' }, commentCount: 6, href: routes.travel },
      { title: { en: 'How to get an El Nido island-hopping permit', ko: '엘니도 아일랜드 호핑 퍼밋 받는 법' }, commentCount: 3, href: routes.travel },
    ],
  },
  {
    tabLabel: { en: 'information', ko: '정보' },
    icon: 'fa-circle-info',
    featured: makeFeatured('Info'),
    headlines: [
      { title: { en: 'How to open a local bank account as a foreigner', ko: '외국인 현지 은행 계좌 개설 방법' }, commentCount: 21, href: routes.freetalk },
      { title: { en: 'Renewing your ACR I-Card step by step', ko: 'ACR I-Card 갱신 단계별 안내' }, commentCount: 14, href: routes.freetalk },
    ],
  },
  {
    tabLabel: { en: 'Must Read', ko: '필독' },
    icon: 'fa-bookmark',
    featured: makeFeatured('Must Read'),
    headlines: [
      { title: { en: 'Scam warning: fake immigration callers', ko: '사기 주의: 이민국 사칭 전화' }, commentCount: 41, href: routes.freetalk },
      { title: { en: 'Safety tips for new arrivals in Manila', ko: '마닐라 신규 입국자 안전 수칙' }, commentCount: 16, href: routes.freetalk },
    ],
  },
  {
    tabLabel: { en: 'Life Tips', ko: '생활의 팁' },
    icon: 'fa-lightbulb',
    featured: makeFeatured('Life Tips'),
    headlines: [
      { title: { en: 'Where to buy Korean groceries in Angeles', ko: '앙헬레스에서 한국 식료품 사는 곳' }, commentCount: 8, href: routes.freetalk },
      { title: { en: 'Cheap mobile data plans compared', ko: '저렴한 모바일 데이터 요금제 비교' }, commentCount: 12, href: routes.freetalk },
    ],
  },
]

// DATA SLOT: boards — REAL Free Board (자유게시판) + Q&A (질문게시판) posts from the live site.
export const boards: Board[] = [
  {
    boardName: { en: 'Free Board', ko: '자유게시판' },
    seeMoreHref: routes.freetalk,
    posts: [
      { title: { en: 'An upbeat song to energize your morning', ko: '아침에 힘차게 기운내라는 신나는 음악한곡' }, commentCount: 2, href: '/post/view?idx=1275768648&post_id=freetalk' },
      { title: { en: 'Edited the post about Mr. Kim (born 83) below — does anyone know what it was about?', ko: '아래 83년생 김 X 관련글 수정 무슨 내용인지 아시는분 궁금합니다.' }, commentCount: 5, href: '/post/view?idx=1275768597&post_id=freetalk' },
      { title: { en: '[Movie] Crush, fight, friendship, love? 🤭 [Grumpy Old Men, 1993]', ko: '[영화소개] 썸, 쌈, 우정, 싸랑?🤭[그럼피 올드 맨(Grumpy Old Men), 1993]' }, commentCount: 3, href: '/post/view?idx=1275768596&post_id=freetalk' },
      { title: { en: 'Park Jin-young High School, Park Jin-young High School.69', ko: '박진영고 박진영고.69' }, commentCount: 3, href: '/post/view?idx=1275768593&post_id=freetalk' },
      { title: { en: 'World No.1 best country to live in after retirement, hmm..', ko: '은퇴하면 살기 좋은 나라 세계 1위 흠..' }, commentCount: 13, href: '/post/view?idx=1275768408&post_id=freetalk' },
    ],
  },
  {
    boardName: { en: 'Q&A board', ko: '질문게시판' },
    seeMoreHref: routes.qna,
    posts: [
      { title: { en: 'Questions about Philippine detention centers and prisons', ko: '필리핀 수용소 및 교도소 질문' }, commentCount: 7, href: '/post/view?idx=1275767000&post_id=qna' },
      { title: { en: 'Seniors, I have a question about getting a marriage visa ㅠㅠ (English interview)', ko: '필고 선배님들 결혼비자 발급 질문 드립니다ㅠㅠ(영어 인터뷰)' }, commentCount: 3, href: '/post/view?idx=1275766000&post_id=qna' },
      { title: { en: 'Could you introduce a Bacolod language school or Korean restaurant contact?', ko: '바콜로드 어학원이나 한인식당 관계자분 소개 부탁드려도 될까요' }, commentCount: 2, href: '/post/view?idx=1275765000&post_id=qna' },
      { title: { en: 'Can you recommend a dentist in Cebu City or Mactan?', ko: '세부시티나 막탄에 치과 소개해 주실수 있나요?' }, commentCount: 3, href: '/post/view?idx=1275764000&post_id=qna' },
      { title: { en: 'Subic Bay 3-bedroom short-term 7-day rental', ko: '수빅베이 방3개 단기 7일 임대' }, commentCount: 3, href: '/post/view?idx=1275763000&post_id=qna' },
    ],
  },
]

// DATA SLOT: popularPosts — REAL "Popular Posts (Last 30 days)" list from the live site (all 20).
export const popularPosts: PopularPost[] = [
  { rank: 1, title: { en: 'To prepare for the Philippine rainy season.. (Event chat room)', ko: '필리핀 우기철 대비를 위해서는..(이벤트 수다방)' }, views: 645, comments: 17, date: '2026.06.06', href: '/post/view?idx=1275600001' },
  { rank: 2, title: { en: 'I misunderstood the current recommendation.. (Event chat room)', ko: '현재 추천에 대해 오해 했어요..(이벤트수다방)' }, views: 572, comments: 19, date: '2026.06.03', href: '/post/view?idx=1275600002' },
  { rank: 3, title: { en: 'Is the rainy season starting in the Philippines? (Chit-chat room)', ko: '필리핀에 우기가 시작 되나요? (잡담수다방)' }, views: 161, comments: 14, date: '2026.06.02', href: '/post/view?idx=1275600003' },
  { rank: 4, title: { en: 'Have a good first day of June.. (Chit-chat room)', ko: '6월의 첫날 좋은날 되세요..(잡담수다방)' }, views: 139, comments: 11, date: '2026.06.01', href: '/post/view?idx=1275600004' },
  { rank: 5, title: { en: 'PhilGo event guide and points summary.. (Chit-chat room)', ko: '필고 이벤트 안내와 포인트 관련 총정리..(잡담수다방)' }, views: 89, comments: 13, date: '2026.06.04', href: '/post/view?idx=1275600005' },
  { rank: 6, title: { en: 'You asked what day June 5th is.. (Chit-chat room)', ko: '6월 5일이 무슨 날이냐고요..(잡담수다방)' }, views: 79, comments: 13, date: '2026.06.05', href: '/post/view?idx=1275600006' },
  { rank: 7, title: { en: 'Kimchi song', ko: '김치타령' }, views: 57, comments: 1, date: '2026.06.17', href: '/post/view?idx=1275600007' },
  { rank: 8, title: { en: 'June 8th is World Oceans Day... (Chit-chat room)', ko: '6월 8일은 세계 해양의 날 입니다...(잡담수다방)' }, views: 57, comments: 15, date: '2026.06.08', href: '/post/view?idx=1275600008' },
  { rank: 9, title: { en: 'Things I experienced during the Philippine rainy season... (Chit-chat room)', ko: '필리핀 우기철에 경험 했던 일들...(잡담수다방)' }, views: 46, comments: 11, date: '2026.06.07', href: '/post/view?idx=1275600009' },
  { rank: 10, title: { en: 'In Korea they say "the Philippines is dangerous", "scary for a woman to live alone"...', ko: '저는 한국에서는 "필리핀은 위험하다", "여자가 혼자 살기 무섭다"라는 ...' }, views: 44, comments: 3, date: '2026.06.01', href: '/post/view?idx=1275600010' },
  { rank: 11, title: { en: 'Income of the ladies working at karaoke?', ko: '가라오케 일하는 아가씨들 수입?' }, views: 40, comments: 3, date: '1일 전', href: '/post/view?idx=1275600011' },
  { rank: 12, title: { en: 'I can grow your company but ha....', ko: '회사 키워줄수있는데 하....' }, views: 39, comments: 3, date: '2026.06.18', href: '/post/view?idx=1275600012' },
  { rank: 13, title: { en: 'What day is June 9th? (Chit-chat room)', ko: '6월 9일은 무슨 날인가요? (잡담수다방)' }, views: 39, comments: 13, date: '2026.06.09', href: '/post/view?idx=1275600013' },
  { rank: 14, title: { en: 'Are people still pulling items from PH airport cargo with a master key?', ko: '아직도 필리핀공항화물 마스터키로 물건빼내는게있나보네요' }, views: 32, comments: 3, date: '2026.06.22', href: '/post/view?idx=1275600014' },
  { rank: 15, title: { en: 'I won a PhilGo Starbucks coupon', ko: '필고 스타벅스 이용 쿠폰에 당첨되었습니다' }, views: 32, comments: 12, date: '2026.06.01', href: '/post/view?idx=1275600015' },
  { rank: 16, title: { en: 'Fighting', ko: '화이팅' }, views: 31, comments: 2, date: '2026.06.15', href: '/post/view?idx=1275600016' },
  { rank: 17, title: { en: 'Be careful of local companion-service ads', ko: '현지인 동행서비스 광고글 조심하세요' }, views: 31, comments: 2, date: '2026.06.11', href: '/post/view?idx=1275600017' },
  { rank: 18, title: { en: 'Stories of living in the world', ko: '세상사는 이야기' }, views: 29, comments: 1, date: '2026.06.16', href: '/post/view?idx=1275600018' },
  { rank: 19, title: { en: 'I was scammed by a local companion service after seeing an ad', ko: '광고 글을 보고 현지인 동행 서비스 피해를 입었습니다.' }, views: 29, comments: 1, date: '2026.06.11', href: '/post/view?idx=1275600019' },
  { rank: 20, title: { en: "We've never even met, but the two of them are seducing me", ko: '만난적도 없는데 두분이 저를 유혹하네요' }, views: 28, comments: 7, date: '2026.06.01', href: '/post/view?idx=1275600020' },
]

// DATA SLOT: bizCategories=[{label, href}] — real Business Directory categories from the live site.
export const bizCategories: NavLink[] = [
  { label: { en: 'entire', ko: '전체' }, href: '/company' },
  { label: { en: 'government offices', ko: '관공서' }, href: '/company?category=government' },
  { label: { en: 'education', ko: '교육' }, href: '/company?category=education' },
  { label: { en: 'eating house', ko: '음식점' }, href: '/company?category=food' },
  { label: { en: 'traffic', ko: '교통' }, href: '/company?category=traffic' },
  { label: { en: 'hospital', ko: '병원' }, href: '/company?category=hospital' },
  { label: { en: 'mart', ko: '마트' }, href: '/company?category=mart' },
  { label: { en: 'bank', ko: '은행' }, href: '/company?category=bank' },
  { label: { en: 'electronic products', ko: '전자제품' }, href: '/company?category=electronics' },
  { label: { en: 'travel agency', ko: '여행사' }, href: '/company?category=travel' },
  { label: { en: 'hotel', ko: '호텔' }, href: '/company?category=hotel' },
  { label: { en: 'rental car', ko: '렌트카' }, href: '/company?category=rentcar' },
  { label: { en: 'Beauty', ko: '뷰티' }, href: '/company?category=beauty' },
  { label: { en: 'real estate', ko: '부동산' }, href: '/company?category=realestate' },
  { label: { en: 'KTV', ko: 'KTV' }, href: '/company?category=ktv' },
  { label: { en: 'spa', ko: '스파' }, href: '/company?category=spa' },
  { label: { en: 'etc', ko: '기타' }, href: '/company?category=etc' },
]

// DATA SLOT: recentBusinesses=[{name, excerpt, href, thumb?}] — REAL listings from the live site.
export const recentBusinesses: Business[] = [
  { name: 'Smile Tour', excerpt: { en: 'Smile Tour, a local travel agency in the Philippines (Clark, Angeles). — travel agency · Angeles', ko: '필리핀(클락, 앙헬레스) 현지 여행사 스마일투어입니다. — 여행사 · 앙헬레스' }, href: '/company/view?idx=1', thumb: placeholderImg(64, 64, 'ST') },
  { name: 'Noblesse', excerpt: { en: 'From minor vehicle maintenance to insurance accident processing, all handled at one company. — traffic · Manila', ko: '차량 경정비부터 보험 사고처리까지 한 회사에서 처리합니다. — 교통 · 마닐라' }, href: '/company/view?idx=2', thumb: placeholderImg(64, 64, 'NB') },
  { name: 'Subic Yachts TYLYN TRAVEL & TOURS', excerpt: { en: 'A yacht cruiser company operated by Koreans at Subic Yacht Marina. — travel agency · Subic', ko: '수빅 요트 마리나에서 한국인이 운영하는 요트 크루저 회사입니다. — 여행사 · 수빅' }, href: '/company/view?idx=3', thumb: placeholderImg(64, 64, 'SY') },
  { name: 'Victoria Curium Pool Villa', excerpt: { en: 'Come to Victoria Curium Pool Villa. — hotel · Manila', ko: '빅토리아 큐리움 풀빌라로 오세요. — 호텔 · 마닐라' }, href: '/company/view?idx=4', thumb: placeholderImg(64, 64, 'VC') },
  { name: 'Wealth Development Bank', excerpt: { en: 'A local savings bank in the Philippines affiliated with Woori Bank. — bank · BGC, Angeles, Cebu', ko: '우리은행 제휴 필리핀 현지 저축은행. — 은행 · BGC, 앙헬레스, 세부' }, href: '/company/view?idx=5', thumb: placeholderImg(64, 64, 'WDB') },
  { name: 'Barun Spine Center', excerpt: { en: 'Barun Spine Center. — hospital · Makati City', ko: '바른 척추 센터. — 병원 · 마카티시티' }, href: '/company/view?idx=6', thumb: placeholderImg(64, 64, 'BSC') },
]

// DATA SLOT: stats={subscribers, posts, statsHref}
export const stats: Stats = {
  subscribers: 192614,
  posts: 6983278,
  statsHref: '#',
}

// DATA SLOT: weather={temp, moreHref}; exchange={php, usdToKrw, calcHref}
export const weather: Weather = { temp: '26.4°C', moreHref: '/weather' }
export const exchange: Exchange = { php: '₱25.2', usdToKrw: '$1=1,544원', calcHref: '/currency' }
