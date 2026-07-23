import type { MegaMenuGroup } from '../types'

// DATA SLOT: mega-menu = array of {groupTitle, items:[{label, href}]} — REAL PhilGo routes.
export const megaMenuGroups: MegaMenuGroup[] = [
  {
    groupTitle: { en: 'Main', ko: '메인' },
    items: [
      { label: { en: 'home', ko: '홈' }, href: '/' },
      { label: { en: 'Chatting', ko: '채팅' }, href: '/chat' },
      { label: { en: 'Q&A', ko: '질문답변' }, href: '/post/list?post_id=qna' },
      { label: { en: 'experiences', ko: '경험담' }, href: '/post/list?post_id=freetalk&category=경험담' },
      { label: { en: 'Column', ko: '칼럼' }, href: '/post/list?post_id=freetalk&category=column' },
      { label: { en: 'business', ko: '비즈니스' }, href: '/post/list?post_id=business' },
      { label: { en: 'Encyclopedia', ko: '백과' }, href: '/post/list?post_id=freetalk&category=백과' },
      { label: { en: 'Job Openings', ko: '구인구직' }, href: '/post/list?post_id=wanted' },
      { label: { en: 'YouTube', ko: '유튜브' }, href: '/post/list?post_id=youtube' },
      { label: { en: 'Today', ko: '오늘' }, href: '/today' },
    ],
  },
  {
    groupTitle: { en: 'Regional Forum', ko: '지역 게시판' },
    items: [
      { label: { en: 'Angeles', ko: '앙헬레스' }, href: '/post/region?region=앙헬레스' },
      { label: { en: 'Cebu', ko: '세부' }, href: '/post/region?region=세부' },
      { label: { en: 'Manila', ko: '마닐라' }, href: '/post/region?region=마닐라' },
    ],
  },
  {
    groupTitle: { en: "Members' Marketplace", ko: '회원 장터' },
    items: [
      { label: { en: 'peso exchange', ko: '페소환전' }, href: '/post/list?post_id=buyandsell&category=페소환전' },
      { label: { en: 'boarding house', ko: '하숙집' }, href: '/post/list?post_id=boarding_house' },
      { label: { en: 'business / partnership', ko: '사업/동업구함' }, href: '/post/list?post_id=buyandsell&category=사업/동업구함' },
      { label: { en: 'cell phone', ko: '핸드폰' }, href: '/post/list?post_id=buyandsell&category=핸드폰' },
      { label: { en: 'appliances / household', ko: '가전/생활용품' }, href: '/post/list?post_id=buyandsell&category=가전/생활용품' },
      { label: { en: 'computer / internet', ko: '컴퓨터/인터넷' }, href: '/post/list?post_id=buyandsell&category=컴퓨터/인터넷' },
      { label: { en: 'golf', ko: '골프' }, href: '/post/list?post_id=buyandsell&category=골프' },
      { label: { en: 'real estate', ko: '부동산' }, href: '/real_estate/list.php' },
      { label: { en: 'rental car', ko: '렌트카' }, href: '/post/list?post_id=buyandsell&category=렌트카' },
      { label: { en: 'used cars', ko: '중고차' }, href: '/post/list?post_id=buyandsell&category=중고차' },
      { label: { en: 'academy', ko: '학원' }, href: '/post/list?post_id=study' },
      { label: { en: 'personal market', ko: '개인장터' }, href: '/post/list?post_id=buyandsell&category=개인장터' },
    ],
  },
  {
    groupTitle: { en: 'Business Directory', ko: '업소록' },
    items: [
      { label: { en: 'education', ko: '교육' }, href: '/business-directory/education' },
      { label: { en: 'eating house', ko: '음식점' }, href: '/business-directory/food' },
      { label: { en: 'hospital', ko: '병원' }, href: '/business-directory/hospital' },
      { label: { en: 'mart', ko: '마트' }, href: '/business-directory/mart' },
      { label: { en: 'bank', ko: '은행' }, href: '/business-directory/bank' },
      { label: { en: 'electronic products', ko: '전자제품' }, href: '/business-directory/electronics' },
      { label: { en: 'travel agency', ko: '여행사' }, href: '/business-directory/travel' },
      { label: { en: 'hotel', ko: '호텔' }, href: '/business-directory/hotel' },
      { label: { en: 'rental car', ko: '렌트카' }, href: '/business-directory/rentcar' },
      { label: { en: 'Beauty', ko: '뷰티' }, href: '/business-directory/beauty' },
      { label: { en: 'real estate', ko: '부동산' }, href: '/business-directory/realestate' },
      { label: { en: 'KTV', ko: 'KTV' }, href: '/business-directory/ktv' },
      { label: { en: 'spa', ko: '스파' }, href: '/business-directory/spa' },
      { label: { en: 'money changer', ko: '환전소' }, href: '/business-directory/money-changer' },
      { label: { en: 'logistics', ko: '물류' }, href: '/business-directory/logistics' },
      { label: { en: 'religion', ko: '종교' }, href: '/business-directory/religion' },
    ],
  },
  {
    groupTitle: { en: 'Account', ko: '계정' },
    items: [
      { label: { en: 'log in', ko: '로그인' }, href: '/user/login' },
      { label: { en: 'Edit Profile', ko: '프로필 수정' }, href: '/user/profile' },
      { label: { en: 'My points', ko: '내 포인트' }, href: '/point/history' },
      { label: { en: 'settings', ko: '환경설정' }, href: '/user/settings' },
    ],
  },
  {
    groupTitle: { en: 'Etc / Advertisement', ko: '기타 / 광고' },
    items: [
      { label: { en: 'Banner ads', ko: '배너 광고' }, href: '/adv/banner' },
      { label: { en: 'Point advertisements', ko: '포인트 광고' }, href: '/adv/point' },
      { label: { en: 'Massage advertisement', ko: '마사지 광고' }, href: '/post/list?post_id=massage' },
      { label: { en: 'Recent Comments', ko: '최근 댓글' }, href: '/post/comments' },
    ],
  },
]
