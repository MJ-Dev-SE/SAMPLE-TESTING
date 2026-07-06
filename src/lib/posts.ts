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
  author?: AuthorLite | null
  /** PostgREST embedded aggregate: [{ count }]. */
  comment_count?: { count: number }[]
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

/** Newest-first posts for one board, with author + comment count. */
export async function listPosts(boardId: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, ${AUTHOR_SELECT}, comment_count:comments(count)`)
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as DbPost[]
}

/** A single post by id (for /post/view?id=…). */
export async function getPost(id: string): Promise<DbPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, ${AUTHOR_SELECT}`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as DbPost) ?? null
}

/** Comments for a post, oldest-first. */
export async function listComments(postId: string): Promise<DbComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`*, ${AUTHOR_SELECT}`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as DbComment[]
}

interface NewPost {
  boardId: string
  category?: string | null
  title: string
  body: string
  /** Logged-in user's id, or null for a guest post. */
  authorId: string | null
}

export async function createPost(p: NewPost): Promise<DbPost> {
  const row = {
    board_id: p.boardId,
    category: p.category ?? null,
    title: p.title,
    body: p.body,
    author_id: p.authorId,
    guest_name: p.authorId ? null : randomGuestName(),
  }
  const { data, error } = await supabase.from('posts').insert(row).select().single()
  if (error) throw error
  return data as unknown as DbPost
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
    board_id: c.boardId,
    body: c.body,
    author_id: c.authorId,
    guest_name: c.authorId ? null : randomGuestName(),
  }
  const { data, error } = await supabase.from('comments').insert(row).select().single()
  if (error) throw error
  return data as unknown as DbComment
}

/** A member's own posts (newest first) — for the activity/profile page. */
export async function listUserPosts(userId: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as DbPost[]
}

/** A member's own comments (newest first) — for the activity/profile page. */
export async function listUserComments(userId: string): Promise<DbComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as DbComment[]
}

/** ISO timestamp → "YYYY.MM.DD" to match the board list style. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}
