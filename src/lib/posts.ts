import { supabase } from './supabase'
import { randomGuestName } from './guestName'

/** Author info embedded from public.profiles (null for guest rows). */
export interface AuthorLite {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export interface DbPost {
  id: string
  board_id: string
  category: string | null
  title: string
  body: string
  author_id: string | null
  guest_name: string | null
  views: number
  created_at: string
  /** Public Storage URLs/paths of attached photos ([] = text-only post). */
  images: string[]
  author?: AuthorLite | null
  /** PostgREST embedded aggregate: [{ count }]. */
  comment_count?: { count: number }[]
  /** Total comments — present on rows from the `popular_posts` view. */
  comment_total?: number
}

export interface DbComment {
  id: string
  post_id: string
  board_id: string
  author_id: string | null
  guest_name: string | null
  body: string
  created_at: string
  author?: AuthorLite | null
  /** Parent post (embedded for the "recent comments" widget). */
  post?: { id: string; title: string; board_id: string } | null
}

/** Display name for a post/comment: member username → guest name → "Guest". */
export function authorName(row: { author?: AuthorLite | null; guest_name: string | null }): string {
  return row.author?.display_name || row.author?.username || row.guest_name || 'Guest'
}

/** Whether a row was written by a guest (no linked account). */
export const isGuest = (row: { author_id: string | null }) => !row.author_id

/** Read the embedded comment count off a post row (0 if absent). */
export const commentCountOf = (p: DbPost) => p.comment_count?.[0]?.count ?? 0

const AUTHOR_SELECT = 'author:profiles(username, display_name, avatar_url)'

// -----------------------------------------------------------------------------
// Board-id separation: this resort site shares the same Supabase project as the
// PhilGo-clone site, but stores its rows under a "resort-" board prefix so the
// two sites never see each other's posts/comments (accounts stay shared).
// UI code keeps using the plain ids (freetalk, qna, …); the mapping lives here.
// -----------------------------------------------------------------------------
const BOARD_PREFIX = 'resort-'
const toDbBoard = (boardId: string) => BOARD_PREFIX + boardId
const fromDbBoard = (boardId: string) =>
  boardId.startsWith(BOARD_PREFIX) ? boardId.slice(BOARD_PREFIX.length) : boardId
const stripPost = <T extends { board_id: string }>(row: T): T => ({
  ...row,
  board_id: fromDbBoard(row.board_id),
})

/**
 * Newest-first posts for one board, with author + comment count.
 * Optional `limit`, and optional `category` to narrow to one sub-category
 * (used by the resort category pages, which group posts by the photo/theme slug).
 */
export async function listPosts(boardId: string, limit?: number, category?: string): Promise<DbPost[]> {
  let q = supabase
    .from('posts')
    .select(`*, ${AUTHOR_SELECT}, comment_count:comments(count)`)
    .eq('board_id', toDbBoard(boardId))
    .order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) throw error
  return ((data ?? []) as unknown as DbPost[]).map(stripPost)
}

/**
 * Popular posts (last 30 days), ranked by views — from the `popular_posts` view.
 * The view already filters to this site's boards and excludes photo anchors.
 */
export async function listPopularPosts(): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from('popular_posts')
    .select(`*, ${AUTHOR_SELECT}`)
  if (error) throw error
  return ((data ?? []) as unknown as DbPost[]).map(stripPost)
}

/** Newest comments across all boards, with author + parent post — for the sidebar widget. */
export async function listRecentComments(limit = 8): Promise<DbComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`*, ${AUTHOR_SELECT}, post:posts(id, title, board_id)`)
    .not('body', 'eq', '')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as unknown as DbComment[]).map((c) => {
    const stripped = stripPost(c)
    if (stripped.post) stripped.post = { ...stripped.post, board_id: fromDbBoard(stripped.post.board_id) }
    return stripped
  })
}

/** A single post by id (for /post/view?id=…). */
export async function getPost(id: string): Promise<DbPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, ${AUTHOR_SELECT}`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? stripPost(data as unknown as DbPost) : null
}

/** Comments for a post, oldest-first. */
export async function listComments(postId: string): Promise<DbComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`*, ${AUTHOR_SELECT}`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as DbComment[]).map(stripPost)
}

interface NewPost {
  boardId: string
  category?: string | null
  title: string
  body: string
  /** Logged-in user's id, or null for a guest post. */
  authorId: string | null
  /** Attached photo paths/URLs (members only; guests stay text-only). */
  images?: string[]
}

export async function createPost(p: NewPost): Promise<DbPost> {
  const row = {
    board_id: toDbBoard(p.boardId),
    category: p.category ?? null,
    title: p.title,
    body: p.body,
    author_id: p.authorId,
    guest_name: p.authorId ? null : randomGuestName(),
    images: p.images ?? [],
  }
  const { data, error } = await supabase.from('posts').insert(row).select().single()
  if (error) throw error
  return stripPost(data as unknown as DbPost)
}

interface NewComment {
  postId: string
  boardId: string
  body: string
  authorId: string | null
}

export async function createComment(c: NewComment): Promise<DbComment> {
  const row = {
    post_id: c.postId,
    board_id: toDbBoard(c.boardId),
    body: c.body,
    author_id: c.authorId,
    guest_name: c.authorId ? null : randomGuestName(),
  }
  const { data, error } = await supabase.from('comments').insert(row).select().single()
  if (error) throw error
  return stripPost(data as unknown as DbComment)
}

/** A member's own posts (newest first) — for the activity/profile page. */
export async function listUserPosts(userId: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as DbPost[]).map(stripPost)
}

/** A member's own comments (newest first) — for the activity/profile page. */
export async function listUserComments(userId: string): Promise<DbComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as DbComment[]).map(stripPost)
}

/* -----------------------------------------------------------------------------
 * Photo pages (/photo/view?id=…): each photo's comments hang off a hidden anchor
 * row in `posts` (board 'photos', category = the photo's slug). The anchor is
 * created lazily on the first comment, so browsing photos writes nothing.
 * --------------------------------------------------------------------------- */

/** The anchor post for a photo, or null if nobody has commented yet. */
export async function getPhotoPost(photoId: string): Promise<DbPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', toDbBoard('photos'))
    .eq('category', photoId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? stripPost(data as unknown as DbPost) : null
}

/** Fetch the photo's anchor post, creating it if this is the first comment. */
export async function getOrCreatePhotoPost(photoId: string, title: string): Promise<DbPost> {
  const existing = await getPhotoPost(photoId)
  if (existing) return existing
  const { data, error } = await supabase
    .from('posts')
    .insert({
      board_id: toDbBoard('photos'),
      category: photoId,
      title,
      body: '',
      author_id: null,
      guest_name: '88 Hotspring Resort',
    })
    .select()
    .single()
  if (error) throw error
  return stripPost(data as unknown as DbPost)
}

/** ISO timestamp → "YYYY.MM.DD" to match the board list style. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

/** ISO timestamp → coarse relative age ("just now", "3h", "2d"). Locale-agnostic. */
export function timeAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d`
  return formatDate(iso)
}
