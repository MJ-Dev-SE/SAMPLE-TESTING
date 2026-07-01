import type { CategoryColumn, CategoryGroup, NavLink } from '../types'

// DATA SLOT: flat category columns — parent header (maroon row) + child links (2 rows below).
// One continuous parent strip, horizontally scrollable; matches the live philgo.com bar.
export const categoryGroups: CategoryGroup[] = [
  { parent: { label: { en: 'information', ko: '정보' }, href: '/post/list?post_id=freetalk&category=info' },
    children: [
      { label: { en: 'weather', ko: '날씨' }, href: '/weather' },
      { label: { en: 'experiences', ko: '경험담' }, href: '/post/list?post_id=freetalk&category=경험담' },
    ] },
  { parent: { label: { en: 'news', ko: '뉴스' }, href: '/post/list?post_id=news' },
    children: [
      { label: { en: 'trot', ko: '트로트' }, href: '/post/list?post_id=freetalk&category=트로트' },
      { label: { en: 'Kopino', ko: '코피노' }, href: '/post/list?post_id=freetalk&category=코피노' },
    ] },
  { parent: { label: { en: 'Business Directory', ko: '업소록' }, href: '/company' },
    children: [
      { label: { en: 'notification', ko: '공지사항' }, href: '/post/list?post_id=freetalk&category=공지사항' },
      { label: { en: 'Encyclopedia', ko: '백과' }, href: '/post/list?post_id=freetalk&category=백과' },
    ] },
  { parent: { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
    children: [
      { label: { en: 'Free discussion', ko: '자유게시판' }, href: '/post/list?post_id=freetalk' },
      { label: { en: 'details', ko: '잡담' }, href: '/post/list?post_id=freetalk&category=잡담' },
    ] },
  { parent: { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
    children: [
      { label: { en: 'Manila', ko: '마닐라' }, href: '/post/region?region=마닐라' },
      { label: { en: 'Angeles', ko: '앙헬레스' }, href: '/post/region?region=앙헬레스' },
    ] },
  { parent: { label: { en: "Members' Marketplace", ko: '회원장터' }, href: '/post/list?post_id=buyandsell' },
    children: [
      { label: { en: 'cell phone', ko: '핸드폰' }, href: '/post/list?post_id=buyandsell&category=핸드폰' },
      { label: { en: 'currency exchange', ko: '페소환전' }, href: '/post/list?post_id=buyandsell&category=페소환전' },
    ] },
  { parent: { label: { en: 'Personal Market', ko: '개인장터' }, href: '/post/list?post_id=buyandsell&category=개인장터' },
    children: [
      { label: { en: 'computer', ko: '컴퓨터' }, href: '/post/list?post_id=buyandsell&category=컴퓨터/인터넷' },
      { label: { en: 'Promotion', ko: '홍보' }, href: '/post/list?post_id=buyandsell&category=promotion' },
    ] },
  { parent: { label: { en: 'Job Openings / Job Seeking', ko: '구인구직' }, href: '/post/list?post_id=wanted' },
    children: [
      { label: { en: 'New Member Greetings', ko: '신입인사' }, href: '/post/list?post_id=greeting' },
      { label: { en: 'People search', ko: '사람찾기' }, href: '/post/list?post_id=lookfor' },
    ] },
  { parent: { label: { en: 'travel', ko: '여행' }, href: '/post/list?post_id=travel' },
    children: [
      { label: { en: 'hobby', ko: '취미' }, href: '/post/list?post_id=freetalk&category=취미' },
      { label: { en: 'Mukbang', ko: '먹방' }, href: '/post/list?post_id=freetalk&category=먹방' },
    ] },
  { parent: { label: { en: 'golf', ko: '골프' }, href: '/post/list?post_id=buyandsell&category=골프' },
    children: [
      { label: { en: 'youtube', ko: '유튜브' }, href: '/post/list?post_id=youtube' },
      { label: { en: 'Blog', ko: '블로그' }, href: '/post/list?post_id=blog' },
    ] },
  { parent: { label: { en: 'academy', ko: '학원' }, href: '/post/list?post_id=study' },
    children: [
      { label: { en: 'school', ko: '학교' }, href: '/post/list?post_id=school' },
      { label: { en: 'class', ko: '강좌' }, href: '/post/list?post_id=study' },
    ] },
  { parent: { label: { en: 'immigrant', ko: '이민' }, href: '/post/list?post_id=freetalk&category=이민' },
    children: [
      { label: { en: 'Passport Visa', ko: '여권/비자' }, href: '/post/list?post_id=qna&category=여권/비자' },
      { label: { en: 'marriage', ko: '국제결혼' }, href: '/post/list?post_id=freetalk&category=국제결혼' },
    ] },
  { parent: { label: { en: 'boarding house', ko: '하숙집' }, href: '/post/list?post_id=boarding_house' },
    children: [
      { label: { en: 'Kopil', ko: '코필' }, href: '/post/list?post_id=freetalk&category=코필' },
      { label: { en: 'hotel', ko: '호텔' }, href: '/post/list?post_id=buyandsell&category=호텔' },
    ] },
  { parent: { label: { en: 'rental car', ko: '렌트카' }, href: '/post/list?post_id=buyandsell&category=렌트카' },
    children: [
      { label: { en: 'used cars', ko: '중고차' }, href: '/post/list?post_id=buyandsell&category=중고차' },
      { label: { en: 'partnership', ko: '동업' }, href: '/post/list?post_id=buyandsell&category=사업/동업구함' },
    ] },
  { parent: { label: { en: 'famous restaurants', ko: '맛집' }, href: '/post/list?post_id=freetalk&category=맛집' },
    children: [
      { label: { en: 'Life photo', ko: '생활사진' }, href: '/post/list?post_id=freetalk&category=사진' },
      { label: { en: 'Household goods', ko: '생활용품' }, href: '/post/list?post_id=buyandsell&category=가전/생활용품' },
    ] },
  { parent: { label: { en: 'real estate', ko: '부동산' }, href: '/real_estate/list.php' },
    children: [
      { label: { en: 'AI', ko: 'AI' }, href: '/ai' },
      { label: { en: 'today', ko: '오늘' }, href: '/today' },
    ] },
  { parent: { label: { en: 'massage', ko: '마사지' }, href: '/post/list?post_id=massage' },
    children: [
      { label: { en: 'caution', ko: '주의' }, href: '/post/list?post_id=caution' },
      { label: { en: 'inquiry', ko: '문의' }, href: '/chat/index' },
    ] },
  { parent: { label: { en: 'business', ko: '비즈니스' }, href: '/post/list?post_id=business' },
    children: [
      { label: { en: 'Missing person', ko: '행방불명' }, href: '/post/list?post_id=freetalk&category=행방불명' },
      { label: { en: 'menu', ko: '메뉴' }, href: '/menu' },
    ] },
]

// DATA SLOT: the maroon category bar — EXACT 4-column structure captured from the live philgo.com.
// Each column has bold header links (maroon bar) + sub-item links (light row) beneath.
export const categoryColumns: CategoryColumn[] = [
  {
    headers: [
      { label: { en: 'information', ko: '정보' }, href: '/post/list?post_id=freetalk&category=info' },
      { label: { en: 'news', ko: '뉴스' }, href: '/post/list?post_id=news' },
      { label: { en: 'Business Directory', ko: '업소록' }, href: '/company' },
    ],
    nav: [
      { label: { en: 'weather', ko: '날씨' }, href: '/weather' },
      { label: { en: 'trot', ko: '트로트' }, href: '/post/list?post_id=freetalk&category=트로트' },
      { label: { en: 'notification', ko: '공지사항' }, href: '/post/list?post_id=freetalk&category=공지사항' },
      { label: { en: 'experiences', ko: '경험담' }, href: '/post/list?post_id=freetalk&category=경험담' },
      { label: { en: 'Kopino', ko: '코피노' }, href: '/post/list?post_id=freetalk&category=코피노' },
      { label: { en: 'Encyclopedia', ko: '백과' }, href: '/post/list?post_id=freetalk&category=백과' },
    ],
  },
  {
    headers: [
      { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
      { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
    ],
    nav: [
      { label: { en: 'Free discussion', ko: '자유게시판' }, href: '/post/list?post_id=freetalk' },
      { label: { en: 'Manila', ko: '마닐라' }, href: '/post/region?region=마닐라' },
      { label: { en: 'details', ko: '잡담' }, href: '/post/list?post_id=freetalk&category=잡담' },
      { label: { en: 'Angeles', ko: '앙헬레스' }, href: '/post/region?region=앙헬레스' },
      { label: { en: 'class', ko: '강좌' }, href: '/post/list?post_id=study' },
      { label: { en: 'Column', ko: '칼럼' }, href: '/post/list?post_id=freetalk&category=column' },
    ],
  },
  {
    headers: [
      { label: { en: "Members' Marketplace", ko: '회원장터' }, href: '/post/list?post_id=buyandsell' },
      { label: { en: 'Personal Market', ko: '개인장터' }, href: '/post/list?post_id=buyandsell&category=개인장터' },
    ],
    nav: [
      { label: { en: 'cell phone', ko: '핸드폰' }, href: '/post/list?post_id=buyandsell&category=핸드폰' },
      { label: { en: 'computer', ko: '컴퓨터' }, href: '/post/list?post_id=buyandsell&category=컴퓨터/인터넷' },
      { label: { en: 'currency exchange', ko: '페소환전' }, href: '/post/list?post_id=buyandsell&category=페소환전' },
      { label: { en: 'massage', ko: '마사지' }, href: '/post/list?post_id=massage' },
      { label: { en: 'Promotion', ko: '홍보' }, href: '/post/list?post_id=buyandsell&category=promotion' },
      { label: { en: 'Blog', ko: '블로그' }, href: '/post/list?post_id=blog' },
    ],
  },
  {
    headers: [
      { label: { en: 'Job Openings / Job Seeking', ko: '구인구직' }, href: '/post/list?post_id=wanted' },
      { label: { en: 'travel', ko: '여행' }, href: '/post/list?post_id=travel' },
      { label: { en: 'golf', ko: '골프' }, href: '/post/list?post_id=buyandsell&category=골프' },
      { label: { en: 'academy', ko: '학원' }, href: '/post/list?post_id=study' },
      { label: { en: 'immigrant', ko: '이민' }, href: '/post/list?post_id=freetalk&category=이민' },
      { label: { en: 'boarding house', ko: '하숙집' }, href: '/post/list?post_id=boarding_house' },
      { label: { en: 'rental car', ko: '렌트카' }, href: '/post/list?post_id=buyandsell&category=렌트카' },
      { label: { en: 'famous restaurants', ko: '맛집' }, href: '/post/list?post_id=freetalk&category=맛집' },
      { label: { en: 'real estate', ko: '부동산' }, href: '/real_estate/list.php' },
    ],
    nav: [
      { label: { en: 'New Member Greetings', ko: '신입인사' }, href: '/post/list?post_id=greeting' },
      { label: { en: 'hobby', ko: '취미' }, href: '/post/list?post_id=freetalk&category=취미' },
      { label: { en: 'school', ko: '학교' }, href: '/post/list?post_id=school' },
      { label: { en: 'Passport Visa', ko: '여권/비자' }, href: '/post/list?post_id=qna&category=여권/비자' },
      { label: { en: 'Kopil', ko: '코필' }, href: '/post/list?post_id=freetalk&category=코필' },
      { label: { en: 'marriage', ko: '국제결혼' }, href: '/post/list?post_id=freetalk&category=국제결혼' },
      { label: { en: 'Life photo', ko: '생활사진' }, href: '/post/list?post_id=freetalk&category=사진' },
      { label: { en: 'Mukbang', ko: '먹방' }, href: '/post/list?post_id=freetalk&category=먹방' },
      { label: { en: 'youtube', ko: '유튜브' }, href: '/post/list?post_id=youtube' },
      { label: { en: 'business', ko: '비즈니스' }, href: '/post/list?post_id=business' },
      { label: { en: 'partnership', ko: '동업' }, href: '/post/list?post_id=buyandsell&category=사업/동업구함' },
      { label: { en: 'hotel', ko: '호텔' }, href: '/post/list?post_id=buyandsell&category=호텔' },
      { label: { en: 'used cars', ko: '중고차' }, href: '/post/list?post_id=buyandsell&category=중고차' },
      { label: { en: 'Household goods', ko: '생활용품' }, href: '/post/list?post_id=buyandsell&category=가전/생활용품' },
      { label: { en: 'AI', ko: 'AI' }, href: '/ai' },
      { label: { en: 'today', ko: '오늘' }, href: '/today' },
      { label: { en: 'Missing person', ko: '행방불명' }, href: '/post/list?post_id=freetalk&category=행방불명' },
      { label: { en: 'People search', ko: '사람찾기' }, href: '/post/list?post_id=lookfor' },
      { label: { en: 'caution', ko: '주의' }, href: '/post/list?post_id=caution' },
      { label: { en: 'inquiry', ko: '문의' }, href: '/chat/index' },
      { label: { en: 'menu', ko: '메뉴' }, href: '/menu' },
    ],
  },
]

// DATA SLOT: thin top utility bar (left + right link clusters)
export const topBarLeft: NavLink[] = [
  { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
  { label: { en: 'Community', ko: '커뮤니티' }, href: '/post/list?post_id=freetalk' },
  { label: { en: 'Chat', ko: '채팅' }, href: '/chat' },
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
