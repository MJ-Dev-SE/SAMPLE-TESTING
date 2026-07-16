import { supabase } from './supabase'
import { randomGuestName } from './guestName'
import { saveGuestCommentToken } from './guestTokens'
import { businessPath, newsArticlePath } from './content'
import { type AuthorLite } from './posts'

/**
 * POLYMORPHIC comments/reviews layer. Any center-displayed record — a post, a
 * business, an advertisement, a news/information article — carries comments (and
 * a 1–5 star rating where reviews are appropriate) through the SAME
 * public.comments table, addressed by (content_type, content_id). See
 * supabase/comments.sql. Post + photo threads keep using lib/posts.ts; this
 * module powers the shared CommentsReviewsSection + the unified Recent Comments.
 *
 * All reads fail soft (empty) so the site still works before comments.sql is run.
 */

export type ContentType = 'post' | 'business' | 'advertisement' | 'news'

/** Which content types show a star rating (a "review") vs plain comments. */
export const RATING_TYPES: ReadonlySet<ContentType> = new Set(['business', 'advertisement', 'news'])

export interface CommentRec {
  id: string
  content_type: ContentType
  content_id: string
  body: string
  rating: number | null
  status: string
  created_at: string
  updated_at: string
  author_id: string | null
  guest_name: string | null
  author?: AuthorLite | null
  /** Only present on the creator's own insert response (guests use it to delete later). */
  delete_token?: string
}

// Columns read for a thread — excludes delete_token so it's never exposed by lists.
const COMMENT_COLS =
  'id, content_type, content_id, body, rating, status, created_at, updated_at, author_id, guest_name'
const AUTHOR_SELECT = 'author:profiles(username, display_name, avatar_url)'

export interface CommentPage {
  rows: CommentRec[]
  total: number
  /** Average rating across ALL rated comments for this record (null if none). */
  avgRating: number | null
}

/**
 * One record's comments, newest-first, paginated (default 10/page). Also returns
 * the total count and the average rating (computed from the rated rows on this page's
 * record via a small separate aggregate so it reflects every rating, not just this page).
 */
export async function listComments(
  contentType: ContentType,
  contentId: string,
  opts: { page?: number; pageSize?: number } = {},
): Promise<CommentPage> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = opts.pageSize ?? 10
  const from = (page - 1) * pageSize

  const { data, error, count } = await supabase
    .from('comments')
    .select(`${COMMENT_COLS}, ${AUTHOR_SELECT}`, { count: 'exact' })
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
  if (error) throw error

  const rows = (data ?? []) as unknown as CommentRec[]

  // Average rating over all rated rows for this record (only needed on page 1).
  let avgRating: number | null = null
  if (RATING_TYPES.has(contentType) && page === 1) {
    const { data: rated } = await supabase
      .from('comments')
      .select('rating')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('status', 'active')
      .not('rating', 'is', null)
    const vals = (rated ?? []).map((r) => (r as { rating: number }).rating).filter((n) => n > 0)
    if (vals.length) avgRating = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }

  return { rows, total: count ?? 0, avgRating }
}

export interface NewComment {
  contentType: ContentType
  contentId: string
  body: string
  /** 1–5 for a review, or null/undefined for a plain comment. */
  rating?: number | null
  /** Logged-in user id, or null for a guest. */
  authorId: string | null
}

/** Create a comment/review. Validates body + rating; remembers a guest's delete token. */
export async function createComment(c: NewComment): Promise<CommentRec> {
  const body = c.body.trim()
  if (!body) throw new Error('Comment cannot be empty.')
  const rating = c.rating != null && c.rating >= 1 && c.rating <= 5 ? Math.round(c.rating) : null

  const { data, error } = await supabase
    .from('comments')
    .insert({
      content_type: c.contentType,
      content_id: c.contentId,
      body,
      rating,
      author_id: c.authorId,
      guest_name: c.authorId ? null : randomGuestName(),
    })
    .select(`${COMMENT_COLS}, ${AUTHOR_SELECT}, delete_token`)
    .single()
  if (error) throw error

  const row = data as unknown as CommentRec
  // A guest's browser keeps the secret token so it (only) may delete this row later.
  if (!row.author_id && row.delete_token) saveGuestCommentToken(row.id, row.delete_token)
  return row
}

/** Edit your OWN comment (RLS scopes it). Rating re-validated. */
export async function updateComment(id: string, patch: { body?: string; rating?: number | null }): Promise<void> {
  const next: Record<string, unknown> = {}
  if (patch.body != null) {
    const b = patch.body.trim()
    if (!b) throw new Error('Comment cannot be empty.')
    next.body = b
  }
  if (patch.rating !== undefined) {
    next.rating = patch.rating != null && patch.rating >= 1 && patch.rating <= 5 ? Math.round(patch.rating) : null
  }
  if (Object.keys(next).length === 0) return
  const { error } = await supabase.from('comments').update(next).eq('id', id)
  if (error) throw error
}

/** Active comment counts for many records of one content_type in a single query (list-row badges). */
export async function countCommentsFor(contentType: ContentType, contentIds: string[]): Promise<Record<string, number>> {
  if (contentIds.length === 0) return {}
  const { data, error } = await supabase
    .from('comments')
    .select('content_id')
    .eq('content_type', contentType)
    .eq('status', 'active')
    .in('content_id', contentIds)
  if (error) return {}
  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as { content_id: string }[]) {
    counts[row.content_id] = (counts[row.content_id] ?? 0) + 1
  }
  return counts
}

/* ------------------------------- Recent ------------------------------- */

/** A row from the public.recent_comments_mt view (unified across all types). */
export interface RecentCommentRec {
  id: string
  content_type: ContentType
  content_id: string
  body: string
  rating: number | null
  created_at: string
  author_id: string | null
  guest_name: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  resolved_title: string
  target_slug: string | null
  is_photo: boolean
  photo_slug: string | null
}

/** Newest active comments across the whole site, title-resolved + route-ready. */
export async function listRecentComments(limit = 8, offset = 0): Promise<RecentCommentRec[]> {
  const { data, error } = await supabase
    .from('recent_comments_mt')
    .select('*')
    .range(offset, offset + limit - 1)
  if (error) throw error
  return (data ?? []) as unknown as RecentCommentRec[]
}

/** Display name for a recent-comment row. */
export function recentAuthorName(r: RecentCommentRec): string {
  return r.display_name || r.username || r.guest_name || 'Guest'
}

/**
 * The in-app URL that opens the EXACT record a recent comment belongs to, with
 * ?comment=<id> so the target page can scroll to / highlight it. Resolves by
 * content_type (never a generic post page).
 */
export function commentTargetPath(r: RecentCommentRec): string {
  const q = `comment=${r.id}`
  switch (r.content_type) {
    case 'business':
      return `${businessPath({ id: r.content_id, slug: r.target_slug })}${r.target_slug ? '?' : '&'}${q}`
    case 'advertisement':
      return `/ad/view?id=${r.content_id}&${q}`
    case 'news':
      return r.target_slug ? `${newsArticlePath(r.target_slug)}?${q}` : `/news/view?slug=&${q}`
    case 'post':
    default:
      if (r.is_photo && r.photo_slug) return `/photo/view?id=${encodeURIComponent(r.photo_slug)}&${q}`
      return `/post/view?id=${r.content_id}&${q}`
  }
}
