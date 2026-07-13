import type { Localized } from '../types'

/**
 * ADMIN DBMS REGISTRY — one entry per managed Supabase table.
 * The point of this module: every dataset DEFINES WHERE IT IS USED in the site
 * (`usedIn` for the whole table, `placement` per row), so an admin always knows
 * which part of the UI a row feeds before editing or deleting it.
 * All labels/hints are Localized so the console language toggle (EN/KO) covers
 * the forms too — see src/admin/i18n.ts.
 */

export type AdminRow = Record<string, any>

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'image' // storage path/URL + file upload with current-image & new-image preview
  | 'localized' // { en, ko } pair of inputs
  | 'localized-textarea'
  | 'json' // raw JSON textarea (validated on save)

export interface FieldDef {
  key: string
  label: Localized
  type: FieldType
  options?: string[] // for select
  required?: boolean
  hint?: Localized
  /** image fields: media-bucket folder new uploads are stored under. */
  folder?: string
}

export interface TableDef {
  /** Supabase table name (also the tab id). */
  table: string
  icon: string
  title: Localized
  /** WHERE this dataset shows up in the site. */
  usedIn: Localized
  /** Per-row placement (e.g. an ad's slot → which exact UI region). */
  placement?: (row: AdminRow) => string
  /** Column holding the row's image — shown as a thumbnail in the list view. */
  imageCol?: string
  /** Columns shown in the list view (in order). */
  listCols: string[]
  /** Editable fields for the create/edit form. */
  fields: FieldDef[]
  orderBy: { col: string; ascending: boolean }
  /** false → rows come from site users; admin only edits/deletes. */
  canCreate: boolean
  /** Narrow the listing (e.g. only this site's boards). */
  filter?: { col: string; op: 'like'; value: string }
  /** Extra values injected on INSERT (e.g. required owner id). */
  injectOnCreate?: (userId: string) => AdminRow
}

const AD_SLOT_PLACEMENT: Record<string, string> = {
  top: 'Header — top banner row (Header.tsx)',
  mid: 'Homepage — mid ad carousel (AdCarousel.tsx)',
  'wing-left': 'LEFT wing banner, gilid ng page (WingBanners.tsx)',
  'wing-right': 'RIGHT wing banner, gilid ng page (WingBanners.tsx)',
}

const PHOTO_SECTION_PLACEMENT: Record<string, string> = {
  banner: 'Homepage top photo banner (PhotoBanner.tsx) + /photo/view page',
  recent: 'Sidebar "Recent Photos" widget (RecentPhotos.tsx) + /photo/view page',
}

const CONTENT_SECTION_PLACEMENT: Record<string, string> = {
  'footer-advertisement': 'Footer — ADVERTISEMENT column → /content/view page',
  'footer-link': 'Footer — LINK column → /content/view page',
  'footer-policy': 'Footer — POLICY column + policy nav row → /content/view page',
}

export const ADMIN_TABLES: TableDef[] = [
  {
    table: 'photos',
    icon: 'fa-images',
    title: { en: 'Photos', ko: '포토' },
    usedIn: {
      en: 'Homepage photo banner (section=banner), sidebar Recent Photos widget (section=recent), and every /photo/view category page.',
      ko: '홈페이지 포토 배너(section=banner), 사이드바 최근 사진 위젯(section=recent), 모든 /photo/view 카테고리 페이지.',
    },
    placement: (r) => PHOTO_SECTION_PLACEMENT[r.section as string] ?? String(r.section ?? ''),
    imageCol: 'src',
    listCols: ['slug', 'section', 'title', 'sort'],
    fields: [
      { key: 'slug', label: { en: 'Slug (URL id)', ko: '슬러그 (URL ID)' }, type: 'text', required: true, hint: { en: 'Used as /photo/view?id=<slug>', ko: '/photo/view?id=<slug> 로 사용됩니다' } },
      { key: 'section', label: { en: 'Section', ko: '섹션' }, type: 'select', options: ['banner', 'recent'], required: true },
      { key: 'src', label: { en: 'Image', ko: '이미지' }, type: 'image', folder: 'photos/admin', required: true },
      { key: 'tag', label: { en: 'Tag chip', ko: '태그 칩' }, type: 'localized' },
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'description', label: { en: 'Description', ko: '설명' }, type: 'localized-textarea' },
      { key: 'details', label: { en: 'Detail bullets', ko: '상세 항목' }, type: 'json', hint: { en: 'JSON array of {"en":"…","ko":"…"}', ko: '{"en":"…","ko":"…"} 형식의 JSON 배열' } },
      { key: 'sort', label: { en: 'Sort order', ko: '정렬 순서' }, type: 'number' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'ads',
    icon: 'fa-rectangle-ad',
    title: { en: 'Ads / Banners', ko: '광고 / 배너' },
    usedIn: {
      en: 'slot=top → header banner row; slot=mid → homepage ad carousel; slot=wing-left / wing-right → the wing banners sa gilid ng page.',
      ko: 'slot=top → 헤더 배너, slot=mid → 홈페이지 광고 캐러셀, slot=wing-left/right → 페이지 양옆 윙 배너.',
    },
    placement: (r) => AD_SLOT_PLACEMENT[r.slot as string] ?? String(r.slot ?? ''),
    imageCol: 'image_url',
    listCols: ['slot', 'alt', 'href', 'active', 'sort'],
    fields: [
      { key: 'slot', label: { en: 'Slot (location)', ko: '슬롯 (위치)' }, type: 'select', options: ['top', 'mid', 'wing-left', 'wing-right'], required: true },
      { key: 'image_url', label: { en: 'Ad image', ko: '광고 이미지' }, type: 'image', folder: 'ads', required: true },
      { key: 'href', label: { en: 'Link (click target)', ko: '링크 (클릭 대상)' }, type: 'text' },
      { key: 'alt', label: { en: 'Alt text', ko: '대체 텍스트' }, type: 'text' },
      { key: 'active', label: { en: 'Active (shown)', ko: '활성 (노출)' }, type: 'boolean' },
      { key: 'sort', label: { en: 'Sort order', ko: '정렬 순서' }, type: 'number' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'site_content',
    icon: 'fa-file-lines',
    title: { en: 'Site pages (footer)', ko: '사이트 페이지 (푸터)' },
    usedIn: {
      en: 'The footer\'s ADVERTISEMENT / LINK / POLICY child items (Banner Ad Information, Business Directory, Terms of Use, …). Each row is a full page shown in the center area at /content/view?slug=…, styled by its content type.',
      ko: '푸터의 광고/링크/정책 하위 항목 (배너 광고 안내, 업소록, 이용약관 등). 각 행은 /content/view?slug=… 로 중앙 영역에 열리는 페이지이며 콘텐츠 유형에 따라 표시 방식이 달라집니다.',
    },
    placement: (r) => CONTENT_SECTION_PLACEMENT[r.section as string] ?? String(r.section ?? ''),
    imageCol: 'image_url',
    listCols: ['slug', 'content_type', 'section', 'title', 'active', 'sort'],
    fields: [
      { key: 'slug', label: { en: 'Slug (URL id)', ko: '슬러그 (URL ID)' }, type: 'text', required: true, hint: { en: 'Used as /content/view?slug=<slug>', ko: '/content/view?slug=<slug> 로 사용됩니다' } },
      { key: 'content_type', label: { en: 'Content type', ko: '콘텐츠 유형' }, type: 'select', options: ['advertisement', 'link', 'policy'], required: true, hint: { en: 'Controls the page presentation: promotional (advertisement), recommended resource (link) or formal document (policy).', ko: '페이지 표시 방식을 결정합니다: 홍보형(advertisement), 추천 리소스형(link), 공식 문서형(policy).' } },
      { key: 'section', label: { en: 'Section (position)', ko: '섹션 (위치)' }, type: 'select', options: ['footer-advertisement', 'footer-link', 'footer-policy'], required: true },
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'summary', label: { en: 'Summary (one line under the title)', ko: '요약 (제목 아래 한 줄)' }, type: 'localized-textarea' },
      { key: 'body', label: { en: 'Body', ko: '본문' }, type: 'localized-textarea', hint: { en: 'Lines starting "## " become headings, lines starting "- " become bullets.', ko: '"## "로 시작하는 줄은 소제목, "- "로 시작하는 줄은 글머리표가 됩니다.' } },
      { key: 'image_url', label: { en: 'Image', ko: '이미지' }, type: 'image', folder: 'content' },
      { key: 'url', label: { en: 'Related URL (button)', ko: '관련 URL (버튼)' }, type: 'text', hint: { en: 'Internal path (/company) or external https:// link shown as the page\'s action button.', ko: '내부 경로(/company) 또는 외부 https:// 링크 — 페이지의 버튼으로 표시됩니다.' } },
      { key: 'sort', label: { en: 'Sort order', ko: '정렬 순서' }, type: 'number' },
      { key: 'active', label: { en: 'Active (shown)', ko: '활성 (노출)' }, type: 'boolean' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'news_items',
    icon: 'fa-newspaper',
    title: { en: 'News items', ko: '뉴스' },
    usedIn: {
      en: 'Homepage News tabs (NewsTabs.tsx) — grouped by "tab"; kind=featured is the big card, kind=headline are the list rows. Also searchable sa header search bar.',
      ko: '홈페이지 뉴스 탭(NewsTabs.tsx) — "tab"별 그룹, featured는 큰 카드, headline은 목록. 헤더 검색에도 노출.',
    },
    placement: (r) => `News tab "${r.tab}" · ${r.kind === 'featured' ? 'big featured card' : 'headline row'}`,
    imageCol: 'thumb_url',
    listCols: ['tab', 'kind', 'title', 'sort'],
    fields: [
      { key: 'tab', label: { en: 'Tab name', ko: '탭 이름' }, type: 'text', required: true },
      { key: 'kind', label: { en: 'Kind', ko: '종류' }, type: 'select', options: ['featured', 'headline'], required: true },
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'thumb_url', label: { en: 'Thumbnail', ko: '썸네일' }, type: 'image', folder: 'news' },
      { key: 'href', label: { en: 'Link', ko: '링크' }, type: 'text' },
      { key: 'comment_count', label: { en: 'Comment count badge', ko: '댓글 수 배지' }, type: 'number' },
      { key: 'sort', label: { en: 'Sort order', ko: '정렬 순서' }, type: 'number' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'travel_info',
    icon: 'fa-route',
    title: { en: 'Travel info', ko: '여행 정보' },
    usedIn: {
      en: 'Sidebar "Travel Information" card (TravelInfoCard.tsx). Also searchable sa header search bar.',
      ko: '사이드바 여행 정보 카드(TravelInfoCard.tsx). 헤더 검색에도 노출.',
    },
    listCols: ['title', 'icon', 'href', 'sort'],
    fields: [
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'blurb', label: { en: 'Blurb', ko: '소개 문구' }, type: 'localized-textarea' },
      { key: 'icon', label: { en: 'Icon (fa-*)', ko: '아이콘 (fa-*)' }, type: 'text', hint: { en: 'Font Awesome class, e.g. fa-plane', ko: 'Font Awesome 클래스 (예: fa-plane)' } },
      { key: 'href', label: { en: 'Link', ko: '링크' }, type: 'text' },
      { key: 'sort', label: { en: 'Sort order', ko: '정렬 순서' }, type: 'number' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'businesses',
    icon: 'fa-store',
    title: { en: 'Businesses', ko: '업소록' },
    usedIn: {
      en: 'Business Directory page (/company), the /company/view detail page, sidebar Business Directory + "Recently updated" widgets, at header search results.',
      ko: '업소록 페이지(/company), 업소 상세(/company/view), 사이드바 업소록/최근 등록 위젯, 헤더 검색 결과.',
    },
    placement: (r) => (r.category ? `/company?category=${r.category}` : '/company (uncategorized)'),
    imageCol: 'thumb_url',
    listCols: ['name', 'category', 'location', 'updated_at'],
    fields: [
      { key: 'name', label: { en: 'Business name', ko: '업소명' }, type: 'text', required: true },
      { key: 'category', label: { en: 'Category', ko: '카테고리' }, type: 'text', hint: { en: 'e.g. spa, hotel, food — feeds the /company chips', ko: '예: spa, hotel, food — /company 카테고리 칩에 사용' } },
      { key: 'location', label: { en: 'Location', ko: '위치' }, type: 'text' },
      { key: 'excerpt', label: { en: 'Card excerpt', ko: '카드 요약' }, type: 'localized' },
      { key: 'description', label: { en: 'Full description', ko: '상세 설명' }, type: 'localized-textarea' },
      { key: 'thumb_url', label: { en: 'Logo / photo', ko: '로고 / 사진' }, type: 'image', folder: 'businesses' },
    ],
    orderBy: { col: 'updated_at', ascending: false },
    canCreate: true,
    injectOnCreate: (userId) => ({ owner_id: userId }),
  },
  {
    table: 'posts',
    icon: 'fa-pen-to-square',
    title: { en: 'Posts', ko: '게시글' },
    usedIn: {
      en: 'Board lists (/post/list), post pages (/post/view), inline category feeds (/photo/view), homepage Latest + Popular lists, header search. Guest posts na walang may-ari ay DITO na madedelete.',
      ko: '게시판 목록(/post/list), 글 보기(/post/view), 카테고리 피드(/photo/view), 홈 최신/인기 목록, 헤더 검색. 주인 없는 게스트 글도 여기서 삭제 가능.',
    },
    placement: (r) => `board: ${String(r.board_id ?? '')}${r.category ? ` · category: ${r.category}` : ''}`,
    listCols: ['title', 'board_id', 'category', 'guest_name', 'created_at'],
    fields: [
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'text', required: true },
      { key: 'category', label: { en: 'Category', ko: '카테고리' }, type: 'text' },
      { key: 'body', label: { en: 'Body', ko: '본문' }, type: 'textarea' },
      { key: 'views', label: { en: 'Views', ko: '조회수' }, type: 'number' },
    ],
    orderBy: { col: 'created_at', ascending: false },
    canCreate: false,
    filter: { col: 'board_id', op: 'like', value: 'resort-%' },
  },
  {
    table: 'comments',
    icon: 'fa-comments',
    title: { en: 'Comments', ko: '댓글' },
    usedIn: {
      en: 'Comment threads sa /post/view at /photo/view, and the sidebar "Recent Comments" widget (RecentComments.tsx).',
      ko: '/post/view · /photo/view 댓글 스레드, 사이드바 최근 댓글 위젯.',
    },
    placement: (r) => `board: ${String(r.board_id ?? '')}`,
    listCols: ['body', 'board_id', 'guest_name', 'created_at'],
    fields: [{ key: 'body', label: { en: 'Comment text', ko: '댓글 내용' }, type: 'textarea', required: true }],
    orderBy: { col: 'created_at', ascending: false },
    canCreate: false,
    filter: { col: 'board_id', op: 'like', value: 'resort-%' },
  },
]
