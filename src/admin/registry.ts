import type { Localized } from '../types'

/**
 * ADMIN DBMS REGISTRY — one entry per managed Supabase table.
 * The point of this module: every dataset DEFINES WHERE IT IS USED in the site
 * (`usedIn` for the whole table, `placement` per row), so an admin always knows
 * which part of the UI a row feeds before editing or deleting it.
 */

export type AdminRow = Record<string, any>

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'localized' // { en, ko } pair of inputs
  | 'localized-textarea'
  | 'json' // raw JSON textarea (validated on save)

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: string[] // for select
  required?: boolean
  hint?: string
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
    listCols: ['slug', 'section', 'title', 'sort'],
    fields: [
      { key: 'slug', label: 'Slug (URL id)', type: 'text', required: true, hint: 'Used as /photo/view?id=<slug>' },
      { key: 'section', label: 'Section', type: 'select', options: ['banner', 'recent'], required: true },
      { key: 'src', label: 'Image path / URL', type: 'text', required: true, hint: 'Path relative to the media bucket (e.g. photos/banner/x.jpg) or a full URL' },
      { key: 'tag', label: 'Tag chip', type: 'localized' },
      { key: 'title', label: 'Title', type: 'localized', required: true },
      { key: 'description', label: 'Description', type: 'localized-textarea' },
      { key: 'details', label: 'Detail bullets', type: 'json', hint: 'JSON array of {"en":"…","ko":"…"}' },
      { key: 'sort', label: 'Sort order', type: 'number' },
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
    listCols: ['slot', 'alt', 'href', 'active', 'sort'],
    fields: [
      { key: 'slot', label: 'Slot (location)', type: 'select', options: ['top', 'mid', 'wing-left', 'wing-right'], required: true },
      { key: 'image_url', label: 'Image path / URL', type: 'text', required: true },
      { key: 'href', label: 'Link (click target)', type: 'text' },
      { key: 'alt', label: 'Alt text', type: 'text' },
      { key: 'active', label: 'Active (shown)', type: 'boolean' },
      { key: 'sort', label: 'Sort order', type: 'number' },
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
    listCols: ['tab', 'kind', 'title', 'sort'],
    fields: [
      { key: 'tab', label: 'Tab name', type: 'text', required: true },
      { key: 'kind', label: 'Kind', type: 'select', options: ['featured', 'headline'], required: true },
      { key: 'title', label: 'Title', type: 'localized', required: true },
      { key: 'thumb_url', label: 'Thumbnail path / URL', type: 'text' },
      { key: 'href', label: 'Link', type: 'text' },
      { key: 'comment_count', label: 'Comment count badge', type: 'number' },
      { key: 'sort', label: 'Sort order', type: 'number' },
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
      { key: 'title', label: 'Title', type: 'localized', required: true },
      { key: 'blurb', label: 'Blurb', type: 'localized-textarea' },
      { key: 'icon', label: 'Icon (fa-*)', type: 'text', hint: 'Font Awesome class, e.g. fa-plane' },
      { key: 'href', label: 'Link', type: 'text' },
      { key: 'sort', label: 'Sort order', type: 'number' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'businesses',
    icon: 'fa-store',
    title: { en: 'Businesses', ko: '업소록' },
    usedIn: {
      en: 'Business Directory page (/company), sidebar Business Directory + "Recently updated" widgets, at header search results.',
      ko: '업소록 페이지(/company), 사이드바 업소록/최근 등록 위젯, 헤더 검색 결과.',
    },
    placement: (r) => (r.category ? `/company?category=${r.category}` : '/company (uncategorized)'),
    listCols: ['name', 'category', 'location', 'updated_at'],
    fields: [
      { key: 'name', label: 'Business name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', hint: 'e.g. spa, hotel, food — feeds the /company chips' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'excerpt', label: 'Card excerpt', type: 'localized' },
      { key: 'description', label: 'Full description', type: 'localized-textarea' },
      { key: 'thumb_url', label: 'Logo / photo path', type: 'text' },
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
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'views', label: 'Views', type: 'number' },
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
    fields: [{ key: 'body', label: 'Comment text', type: 'textarea', required: true }],
    orderBy: { col: 'created_at', ascending: false },
    canCreate: false,
    filter: { col: 'board_id', op: 'like', value: 'resort-%' },
  },
]
