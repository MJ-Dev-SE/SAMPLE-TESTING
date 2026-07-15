import { supabase } from './supabase'
import { boardTitles } from '../data/boards'
import { businessPath, listAllPhotos, listBusinesses, listNews, listTravelInfo } from './content'
import { fromDbBoard, postPath, toDbBoard } from './posts'
import type { Localized } from '../types'

/**
 * Live search-suggestion layer for the header search box. One query fans out to
 * every content source (posts, businesses, photos, news, travel info); every hit
 * carries the categorization it belongs to so the dropdown can label it.
 * All reads fail soft ([]) — same degradation pattern as posts.ts / content.ts.
 */

export interface SearchHit {
  kind: 'post' | 'business' | 'photo' | 'news' | 'travel'
  title: Localized
  /** Where the hit lives (board / directory / section) — shown as a chip. */
  category: Localized
  href: string
  /** Lowercased text this hit matches against (client-side filtering only). */
  hay: string
}

const CHIP: Record<Exclude<SearchHit['kind'], 'post'>, Localized> = {
  business: { en: 'Business Directory', ko: '업소록' },
  photo: { en: 'Photos', ko: '포토' },
  news: { en: 'News', ko: '뉴스' },
  travel: { en: 'Travel Info', ko: '여행정보' },
}

const same = (s: string): Localized => ({ en: s, ko: s })
const withSub = (base: Localized, sub: string | null): Localized =>
  sub ? { en: `${base.en} · ${sub}`, ko: `${base.ko} · ${sub}` } : base
const hayOf = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(' ').toLowerCase()

/**
 * The curated tables (businesses, photos, news, travel info) are a few dozen rows,
 * so they are fetched once per session and filtered client-side — no Supabase
 * round-trip per keystroke, and Localized en/ko fields both match naturally.
 * Posts are unbounded and searched server-side per query instead.
 */
let poolPromise: Promise<SearchHit[]> | null = null
function staticPool(): Promise<SearchHit[]> {
  if (!poolPromise) {
    poolPromise = Promise.all([
      listBusinesses(null, { pageSize: 200 }).then((p) => p.rows).catch(() => []),
      listAllPhotos().catch(() => []),
      listNews().catch(() => []),
      listTravelInfo().catch(() => []),
    ]).then(([biz, photos, news, travel]) => [
      ...biz.map(
        (b): SearchHit => ({
          kind: 'business',
          title: same(b.name),
          category: withSub(CHIP.business, b.category),
          href: businessPath(b),
          hay: hayOf(b.name, b.region ?? b.location, (b.short_intro ?? b.excerpt).en, (b.short_intro ?? b.excerpt).ko),
        }),
      ),
      ...photos.map(
        (p): SearchHit => ({
          kind: 'photo',
          title: p.title,
          category: CHIP.photo,
          href: `/photo/view?id=${encodeURIComponent(p.slug)}`,
          hay: hayOf(p.title.en, p.title.ko, p.tag.en, p.tag.ko, p.description.en, p.description.ko),
        }),
      ),
      ...news.map(
        (n): SearchHit => ({
          kind: 'news',
          title: n.title,
          category: CHIP.news,
          href: n.href,
          hay: hayOf(n.title.en, n.title.ko),
        }),
      ),
      ...travel.map(
        (t): SearchHit => ({
          kind: 'travel',
          title: t.title,
          category: CHIP.travel,
          href: t.href,
          hay: hayOf(t.title.en, t.title.ko, t.blurb.en, t.blurb.ko),
        }),
      ),
    ])
  }
  return poolPromise
}

/** Server-side title search over this site's posts, newest first. */
async function searchPosts(term: string, limit: number): Promise<SearchHit[]> {
  const like = `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`
  const query = (cols: string) =>
    supabase
      .from('posts')
      .select(cols)
      .like('board_id', toDbBoard('%')) // this site's boards only
      .neq('board_id', toDbBoard('photos')) // hidden photo-comment anchor rows
      .ilike('title', like)
      .order('created_at', { ascending: false })
      .limit(limit)
  let { data, error } = await query('id, board_id, category, title, slug')
  // Pre-migration DB (no posts.slug yet — supabase/seo.sql) → retry without it.
  if (error?.code === '42703') ({ data, error } = await query('id, board_id, category, title'))
  if (error || !data) return []
  type Row = { id: string; board_id: string; category: string | null; title: string; slug?: string | null }
  return (data as unknown as Row[]).map((p) => {
    const boardId = fromDbBoard(p.board_id)
    const board = boardTitles[boardId] ?? { en: 'Board', ko: '게시판' }
    return {
      kind: 'post' as const,
      title: same(p.title),
      category: withSub(board, p.category),
      href: postPath({ id: p.id, board_id: boardId, slug: p.slug ?? null }),
      hay: '',
    }
  })
}

/** All suggestions for a search term, capped at `limit` (posts get priority). */
export async function searchSuggestions(term: string, limit = 8): Promise<SearchHit[]> {
  const q = term.trim()
  if (!q) return []
  const [posts, pool] = await Promise.all([
    searchPosts(q, Math.min(5, limit)).catch(() => []),
    staticPool().catch(() => []),
  ])
  const needle = q.toLowerCase()
  return [...posts, ...pool.filter((h) => h.hay.includes(needle))].slice(0, limit)
}
