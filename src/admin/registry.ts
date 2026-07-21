import type { Localized } from '../types'

/**
 * ADMIN DBMS REGISTRY — one entry per managed Supabase table (Manila Tour).
 * Every dataset DEFINES WHERE IT IS USED in the site (`usedIn` for the whole
 * table, `placement` per row), so an admin always knows which part of the UI a
 * row feeds before editing or deleting it. All labels/hints are Localized so the
 * console EN/KO toggle (src/admin/i18n.ts) covers the forms too.
 */

export type AdminRow = Record<string, any>

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'date' // yyyy-mm-dd
  | 'image' // storage path/URL + upload with current-image & new-image preview
  | 'category' // select whose options load from public.categories (stores category_id)
  | 'localized' // { en, ko } pair of inputs
  | 'localized-textarea'
  | 'json' // raw JSON textarea (validated on save)
  | 'slug' // URL slug: auto-generate button + format validation (lib/seo/slug)
  | 'seo-title' // text + live char counter (recommended 50–60, warn-only)
  | 'seo-description' // textarea + live char counter (recommended 140–160, warn-only)

export interface FieldDef {
  key: string
  label: Localized
  type: FieldType
  options?: string[] // for select
  required?: boolean
  hint?: Localized
  folder?: string // image fields: media-bucket folder for new uploads
  /** Groups the field under the collapsible "SEO" section of the form. */
  seo?: boolean
  /** boolean fields: start a NEW row with this flag off (default is on). */
  defaultOff?: boolean
  /** slug fields: which form value the "generate" button derives from. */
  slugSource?: string
}

export interface TableDef {
  table: string
  icon: string
  title: Localized
  usedIn: Localized
  placement?: (row: AdminRow) => string
  imageCol?: string
  listCols: string[]
  fields: FieldDef[]
  orderBy: { col: string; ascending: boolean }
  canCreate: boolean
  filter?: { col: string; op: 'like'; value: string }
  /** Raw PostgREST `.or()` expression, for filters a single-column `.like()` can't express. */
  orFilter?: string
  injectOnCreate?: (userId: string) => AdminRow
}

/** Shared SEO field block (columns from supabase/seo.sql). `slugKey`/`slugSource`
 *  vary per table; every field is optional — blank values fall back to content. */
function seoFields(opts: { slugKey?: string; slugSource?: string; imageFolder: string }): FieldDef[] {
  const fields: FieldDef[] = []
  if (opts.slugKey) {
    fields.push({
      key: opts.slugKey,
      label: { en: 'URL slug', ko: 'URL 슬러그' },
      type: 'slug',
      seo: true,
      slugSource: opts.slugSource,
    })
  }
  fields.push(
    { key: 'meta_title', label: { en: 'SEO title', ko: 'SEO 제목' }, type: 'seo-title', seo: true },
    { key: 'meta_description', label: { en: 'Meta description', ko: '메타 설명' }, type: 'seo-description', seo: true },
    { key: 'og_image_url', label: { en: 'Social share image', ko: '소셜 공유 이미지' }, type: 'image', folder: opts.imageFolder, seo: true },
    { key: 'is_indexable', label: { en: 'Search indexing', ko: '검색 색인' }, type: 'boolean', seo: true },
  )
  return fields
}

const AD_POSITION_PLACEMENT: Record<string, string> = {
  header: 'Header — top banner strip (Header.tsx)',
  homepage: 'Homepage — ad carousel (BannerRow.tsx)',
  'wing-left': 'LEFT wing banner (WingBanners.tsx)',
  'wing-right': 'RIGHT wing banner (WingBanners.tsx)',
  'footer-info': 'Footer — ADVERTISEMENT column → /ad/view page',
}

const PHOTO_SECTION_PLACEMENT: Record<string, string> = {
  banner: 'Homepage top photo banner (PhotoBanner.tsx) + /photo/view page',
  recent: 'Sidebar "Recent Photos" widget (RecentPhotos.tsx) + /photo/view page',
}

export const ADMIN_TABLES: TableDef[] = [
  {
    table: 'categories',
    icon: 'fa-tags',
    title: { en: 'Categories', ko: '카테고리' },
    usedIn: {
      en: 'Business Directory child categories — the shared source for the /company filter chips, the posting form, this admin form and the business cards.',
      ko: '업소록 하위 카테고리 — /company 필터 칩, 업소 등록 폼, 관리자 폼, 업소 카드가 공유하는 소스.',
    },
    placement: (r) => `/company?category=${r.slug}`,
    listCols: ['slug', 'name', 'parent_slug', 'sort'],
    fields: [
      { key: 'slug', label: { en: 'Slug (URL id)', ko: '슬러그 (URL ID)' }, type: 'text', required: true, hint: { en: 'e.g. food, hotel — used as /company?category=<slug>', ko: '예: food, hotel — /company?category=<slug>' } },
      { key: 'parent_slug', label: { en: 'Parent', ko: '상위' }, type: 'text', hint: { en: 'business-directory for a directory child', ko: '업소록 하위면 business-directory' } },
      { key: 'name', label: { en: 'Name', ko: '이름' }, type: 'localized', required: true },
      { key: 'icon', label: { en: 'Icon (fa-*)', ko: '아이콘 (fa-*)' }, type: 'text', hint: { en: 'Font Awesome class, e.g. fa-utensils', ko: 'Font Awesome 클래스 (예: fa-utensils)' } },
      { key: 'sort', label: { en: 'Sort order', ko: '정렬 순서' }, type: 'number' },
      { key: 'active', label: { en: 'Active', ko: '활성' }, type: 'boolean' },
      // Category landing pages (/information, /business-directory/<slug>, …)
      ...seoFields({ imageFolder: 'categories' }),
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'businesses',
    icon: 'fa-store',
    title: { en: 'Businesses', ko: '업소록' },
    usedIn: {
      en: 'Business Directory (/company) 3×3 cards, the /company/view profile page, and the sidebar "Recently updated" widget. On hanin.tv these rows also feed the homepage showcase grid, the Recent Photos widget and the wing-banner link targets.',
      ko: '업소록(/company) 3×3 카드, 업소 상세(/company/view), 사이드바 "최근 등록" 위젯. hanin.tv에서는 홈 쇼케이스 그리드, 최근 사진 위젯, 윙 배너 연결 대상도 이 행에서 나옵니다.',
    },
    placement: (r) =>
      `${r.brand ? `${r.brand}.tv only` : 'all domains'} · ${r.category ? `/company?category=${r.category}` : '/company'}${r.showcase ? ' · showcase' : ''}`,
    imageCol: 'main_image_url',
    listCols: ['name', 'category', 'brand', 'showcase', 'status', 'updated_at'],
    fields: [
      { key: 'name', label: { en: 'Business name', ko: '업소명' }, type: 'text', required: true },
      { key: 'category_id', label: { en: 'Category', ko: '카테고리' }, type: 'category', required: true },
      {
        key: 'brand',
        label: { en: 'Show on domain', ko: '표시 도메인' },
        type: 'select',
        options: ['', 'manilatour', 'hanin'],
        hint: {
          en: 'Blank = every domain. "hanin" = hanin.tv only, "manilatour" = manilatour.com only.',
          ko: '비워두면 모든 도메인. "hanin"은 hanin.tv 전용, "manilatour"는 manilatour.com 전용.',
        },
      },
      {
        key: 'showcase',
        label: { en: 'Feature in home showcase', ko: '홈 쇼케이스에 노출' },
        type: 'boolean',
        defaultOff: true,
        hint: {
          en: 'Big 2-up cards under the News card on this listing’s own domain homepage.',
          ko: '해당 도메인 홈의 뉴스 카드 아래 2단 대형 카드.',
        },
      },
      { key: 'region', label: { en: 'Region', ko: '지역' }, type: 'text' },
      { key: 'address', label: { en: 'Address', ko: '주소' }, type: 'text' },
      { key: 'address_province', label: { en: 'Province', ko: '주(州)' }, type: 'text' },
      { key: 'address_city', label: { en: 'City / Municipality', ko: '시·군' }, type: 'text' },
      { key: 'address_barangay', label: { en: 'Barangay', ko: '바랑가이' }, type: 'text' },
      { key: 'phone', label: { en: 'Phone', ko: '전화번호' }, type: 'text' },
      { key: 'mobile_phone', label: { en: 'Mobile phone', ko: '휴대전화' }, type: 'text' },
      { key: 'short_intro', label: { en: 'One-line intro', ko: '한 줄 소개' }, type: 'localized' },
      { key: 'detailed_intro', label: { en: 'Detailed intro', ko: '상세 소개' }, type: 'localized-textarea' },
      { key: 'logo_url', label: { en: 'Logo image', ko: '로고 이미지' }, type: 'image', folder: 'businesses' },
      { key: 'main_image_url', label: { en: 'Main image', ko: '메인 이미지' }, type: 'image', folder: 'businesses' },
      { key: 'status', label: { en: 'Status', ko: '상태' }, type: 'select', options: ['active', 'inactive'] },
      { key: 'display_order', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
      ...seoFields({ slugKey: 'slug', slugSource: 'name', imageFolder: 'businesses' }),
    ],
    orderBy: { col: 'updated_at', ascending: false },
    canCreate: true,
    injectOnCreate: (userId) => ({ owner_id: userId }),
  },
  {
    table: 'business_images',
    icon: 'fa-images',
    title: { en: 'Business photos', ko: '업소 사진' },
    usedIn: {
      en: 'Gallery photos on a business profile (/company/view). image_type = logo / main / gallery. Link each row to its business by business_id.',
      ko: '업소 상세(/company/view)의 갤러리 사진. image_type = logo / main / gallery. business_id로 업소와 연결.',
    },
    placement: (r) => `${r.image_type} · biz ${String(r.business_id ?? '').slice(0, 8)}`,
    imageCol: 'image_url',
    listCols: ['business_id', 'image_type', 'display_order'],
    fields: [
      { key: 'business_id', label: { en: 'Business ID', ko: '업소 ID' }, type: 'text', required: true, hint: { en: 'The uuid of the business (from the Businesses tab)', ko: '업소 uuid (업소록 탭에서 확인)' } },
      { key: 'image_url', label: { en: 'Image', ko: '이미지' }, type: 'image', folder: 'businesses', required: true },
      { key: 'image_type', label: { en: 'Image type', ko: '이미지 종류' }, type: 'select', options: ['gallery', 'logo', 'main'], required: true },
      { key: 'display_order', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
    ],
    orderBy: { col: 'display_order', ascending: true },
    canCreate: true,
  },
  {
    table: 'advertisements',
    icon: 'fa-rectangle-ad',
    title: { en: 'Advertisements', ko: '광고' },
    usedIn: {
      en: 'position=header → header banner strip; homepage → homepage carousel; wing-left/right → side rails; footer-info → footer ADVERTISEMENT column. Each opens /ad/view (promotional page).',
      ko: 'position=header → 헤더 배너, homepage → 홈 캐러셀, wing-left/right → 사이드, footer-info → 푸터 광고 열. 클릭 시 /ad/view(홍보 페이지).',
    },
    placement: (r) => AD_POSITION_PLACEMENT[r.position as string] ?? String(r.position ?? ''),
    imageCol: 'image_url',
    listCols: ['position', 'title', 'active', 'sort'],
    fields: [
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'description', label: { en: 'Short blurb', ko: '짧은 설명' }, type: 'localized-textarea' },
      { key: 'body', label: { en: 'Full detail text', ko: '상세 본문' }, type: 'localized-textarea', hint: { en: '"## " headings, "- " bullets. Shown on the /ad/view page.', ko: '"## " 소제목, "- " 글머리표. /ad/view 페이지에 표시.' } },
      { key: 'image_url', label: { en: 'Ad image', ko: '광고 이미지' }, type: 'image', folder: 'ads' },
      { key: 'url', label: { en: 'Destination URL', ko: '연결 URL' }, type: 'text' },
      { key: 'position', label: { en: 'Position', ko: '위치' }, type: 'select', options: ['header', 'homepage', 'wing-left', 'wing-right', 'footer-info'], required: true },
      { key: 'sort', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
      { key: 'active', label: { en: 'Active', ko: '활성' }, type: 'boolean' },
      { key: 'start_date', label: { en: 'Start date', ko: '시작일' }, type: 'date' },
      { key: 'end_date', label: { en: 'End date', ko: '종료일' }, type: 'date' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'links',
    icon: 'fa-link',
    title: { en: 'Links', ko: '링크' },
    usedIn: {
      en: 'Footer LINK column — partner websites, tourism resources, references. Each opens /link/view (resource page) or its external URL.',
      ko: '푸터 링크 열 — 파트너 사이트, 관광 리소스, 참고 링크. /link/view(리소스 페이지) 또는 외부 URL로 연결.',
    },
    placement: (r) => (r.slug ? `/link/view?slug=${r.slug}` : String(r.url ?? '')),
    imageCol: 'image_url',
    listCols: ['slug', 'title', 'category', 'sort'],
    fields: [
      { key: 'slug', label: { en: 'Slug (URL id)', ko: '슬러그 (URL ID)' }, type: 'text', required: true, hint: { en: '/link/view?slug=<slug>', ko: '/link/view?slug=<slug>' } },
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'description', label: { en: 'Short description', ko: '짧은 설명' }, type: 'localized-textarea' },
      { key: 'body', label: { en: 'Full page text', ko: '전체 본문' }, type: 'localized-textarea', hint: { en: 'Optional. "## " headings, "- " bullets.', ko: '선택. "## " 소제목, "- " 글머리표.' } },
      { key: 'url', label: { en: 'External / target URL', ko: '외부 URL' }, type: 'text' },
      { key: 'image_url', label: { en: 'Image / logo', ko: '이미지 / 로고' }, type: 'image', folder: 'links' },
      { key: 'category', label: { en: 'Category', ko: '분류' }, type: 'text', hint: { en: 'e.g. resource, partner, reference', ko: '예: resource, partner, reference' } },
      { key: 'section', label: { en: 'Section', ko: '섹션' }, type: 'select', options: ['footer-link'] },
      { key: 'sort', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
      { key: 'active', label: { en: 'Active', ko: '활성' }, type: 'boolean' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'policies',
    icon: 'fa-scale-balanced',
    title: { en: 'Policies', ko: '정책' },
    usedIn: {
      en: 'Footer POLICY column + policy nav — Terms of Use, Privacy Policy, Child Safety Standards. Each opens /policy/view (formal document).',
      ko: '푸터 정책 열 + 정책 내비 — 이용약관, 개인정보처리방침, 아동 안전 기준. /policy/view(공식 문서)로 열림.',
    },
    placement: (r) => `/policy/view?slug=${r.slug}`,
    listCols: ['slug', 'title', 'sort'],
    fields: [
      { key: 'slug', label: { en: 'Slug (URL id)', ko: '슬러그 (URL ID)' }, type: 'text', required: true },
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'summary', label: { en: 'Summary', ko: '요약' }, type: 'localized-textarea' },
      { key: 'body', label: { en: 'Body', ko: '본문' }, type: 'localized-textarea', required: true, hint: { en: '"## " headings, "- " bullets.', ko: '"## " 소제목, "- " 글머리표.' } },
      { key: 'sort', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
      { key: 'active', label: { en: 'Active', ko: '활성' }, type: 'boolean' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'news_items',
    icon: 'fa-newspaper',
    title: { en: 'News & Information', ko: '뉴스 & 정보' },
    usedIn: {
      en: 'Homepage News tabs (NewsTabs.tsx) grouped by "tab" (news / information); kind=featured is the big card, kind=headline the list rows. Each opens /news/view (article).',
      ko: '홈 뉴스 탭(NewsTabs.tsx) — "tab"(news/information)별 그룹, featured는 큰 카드, headline은 목록. /news/view(기사)로 열림.',
    },
    placement: (r) => `News tab "${r.tab}" · ${r.kind === 'featured' ? 'featured card' : 'headline row'}`,
    imageCol: 'image_url',
    listCols: ['tab', 'kind', 'title', 'sort'],
    fields: [
      { key: 'tab', label: { en: 'Tab', ko: '탭' }, type: 'select', options: ['news', 'information'], required: true },
      { key: 'kind', label: { en: 'Kind', ko: '종류' }, type: 'select', options: ['featured', 'headline'], required: true },
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'body', label: { en: 'Article body', ko: '기사 본문' }, type: 'localized-textarea' },
      { key: 'image_url', label: { en: 'Image', ko: '이미지' }, type: 'image', folder: 'news' },
      { key: 'href', label: { en: 'Link', ko: '링크' }, type: 'text' },
      { key: 'comment_count', label: { en: 'Comment badge', ko: '댓글 배지' }, type: 'number' },
      { key: 'sort', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
      // article_slug doubles as the news slug — /news/article/<slug>
      ...seoFields({ slugKey: 'article_slug', slugSource: 'title', imageFolder: 'news' }),
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'travel_info',
    icon: 'fa-route',
    title: { en: 'Travel info', ko: '여행 정보' },
    usedIn: {
      en: 'Sidebar "Travel Information" card (TravelInfoCard.tsx).',
      ko: '사이드바 여행 정보 카드(TravelInfoCard.tsx).',
    },
    listCols: ['title', 'icon', 'href', 'sort'],
    fields: [
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'blurb', label: { en: 'Blurb', ko: '소개 문구' }, type: 'localized-textarea' },
      { key: 'icon', label: { en: 'Icon (fa-*)', ko: '아이콘 (fa-*)' }, type: 'text' },
      { key: 'href', label: { en: 'Link', ko: '링크' }, type: 'text' },
      { key: 'sort', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'photos',
    icon: 'fa-image',
    title: { en: 'Photos', ko: '포토' },
    usedIn: {
      en: 'Homepage photo banner (section=banner), sidebar Recent Photos (section=recent), and /photo/view pages.',
      ko: '홈 포토 배너(section=banner), 사이드바 최근 사진(section=recent), /photo/view 페이지.',
    },
    placement: (r) => PHOTO_SECTION_PLACEMENT[r.section as string] ?? String(r.section ?? ''),
    imageCol: 'src',
    listCols: ['slug', 'section', 'title', 'sort'],
    fields: [
      { key: 'slug', label: { en: 'Slug (URL id)', ko: '슬러그 (URL ID)' }, type: 'text', required: true, hint: { en: '/photo/view?id=<slug>', ko: '/photo/view?id=<slug>' } },
      { key: 'section', label: { en: 'Section', ko: '섹션' }, type: 'select', options: ['banner', 'recent'], required: true },
      { key: 'src', label: { en: 'Image', ko: '이미지' }, type: 'image', folder: 'photos', required: true },
      { key: 'tag', label: { en: 'Tag chip', ko: '태그 칩' }, type: 'localized' },
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'localized', required: true },
      { key: 'description', label: { en: 'Description', ko: '설명' }, type: 'localized-textarea' },
      { key: 'details', label: { en: 'Detail bullets', ko: '상세 항목' }, type: 'json', hint: { en: 'JSON array of {"en":"…","ko":"…"}', ko: '{"en":"…","ko":"…"} JSON 배열' } },
      { key: 'sort', label: { en: 'Display order', ko: '표시 순서' }, type: 'number' },
    ],
    orderBy: { col: 'sort', ascending: true },
    canCreate: true,
  },
  {
    table: 'posts',
    icon: 'fa-pen-to-square',
    title: { en: 'Posts', ko: '게시글' },
    usedIn: {
      en: 'Community board lists (/post/list), post pages (/post/view), homepage Latest + Popular lists, header search. Guest posts are moderated here.',
      ko: '커뮤니티 게시판(/post/list), 글 보기(/post/view), 홈 최신/인기 목록, 헤더 검색. 게스트 글도 여기서 관리.',
    },
    placement: (r) => `board: ${String(r.board_id ?? '')}${r.category ? ` · ${r.category}` : ''}`,
    listCols: ['title', 'board_id', 'category', 'guest_name', 'created_at'],
    fields: [
      { key: 'title', label: { en: 'Title', ko: '제목' }, type: 'text', required: true },
      { key: 'category', label: { en: 'Category', ko: '카테고리' }, type: 'text' },
      { key: 'body', label: { en: 'Body', ko: '본문' }, type: 'textarea' },
      { key: 'views', label: { en: 'Views', ko: '조회수' }, type: 'number' },
      ...seoFields({ slugKey: 'slug', slugSource: 'title', imageFolder: 'posts' }),
    ],
    orderBy: { col: 'created_at', ascending: false },
    canCreate: false,
    filter: { col: 'board_id', op: 'like', value: 'mt-%' },
  },
  {
    table: 'comments',
    icon: 'fa-comments',
    title: { en: 'Comments & Reviews', ko: '댓글 · 리뷰' },
    usedIn: {
      en: 'Comment threads on /post/view + /photo/view, star reviews on Business/Advertisement/News detail pages, and the sidebar "Recent Comments" widget.',
      ko: '/post/view · /photo/view 댓글, 비즈니스/광고/뉴스 상세 별점 리뷰, 사이드바 최근 댓글 위젯.',
    },
    placement: (r) =>
      r.content_type === 'post' ? `board: ${String(r.board_id ?? '')}` : `${String(r.content_type ?? '')} review`,
    listCols: ['body', 'content_type', 'rating', 'board_id', 'guest_name', 'created_at'],
    fields: [{ key: 'body', label: { en: 'Comment text', ko: '댓글 내용' }, type: 'textarea', required: true }],
    orderBy: { col: 'created_at', ascending: false },
    canCreate: false,
    // Manila Tour post comments (board_id like 'mt-%') OR any business/ad/news
    // review (content_type != 'post', board_id null) — excludes the shared
    // PhilGo clone's own post comments either way. A plain .like() can't OR
    // across two columns, hence orFilter (see AdminPage.tsx TablePanel#load).
    orFilter: 'content_type.neq.post,board_id.like.mt-%',
  },
]
