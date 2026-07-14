import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useIsAdmin } from '../admin/useIsAdmin'
import { useLocalized } from '../lib/useLocalized'
import ImageCarousel from '../components/ImageCarousel'
import CommentItem from '../components/CommentItem'
import {
  authorName,
  createComment,
  deletePost,
  formatDate,
  getPost,
  isGuest,
  listComments,
  recordPostView,
  type DbComment,
  type DbPost,
} from '../lib/posts'
import { saveGuestCommentToken } from '../lib/guestTokens'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'

/** Post view (/post/view?id=<uuid>&post_id=<board>). All posts are Supabase-backed. */
export default function PostView() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const postId = params.get('post_id') || 'freetalk'
  if (!id) return <Navigate to="/" replace />
  return <RealPostView id={id} boardId={postId} />
}

function RealPostView({ id, boardId }: { id: string; boardId: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const board = boardTitles[boardId] ?? { en: 'Board', ko: '게시판' }

  const [post, setPost] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<DbComment[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getPost(id).then((p) => alive && setPost(p)).catch(() => {})
    listComments(id).then((c) => alive && setComments(c)).catch(() => {})
    // Fire-and-forget: dedup happens server-side, so this is safe to call on
    // every mount (including StrictMode's double-invoke in dev) without
    // inflating the count — a repeat call within 24h just re-reads the total.
    recordPostView(id)
      .then((views) => alive && setPost((prev) => (prev ? { ...prev, views } : prev)))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id])

  const submitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try {
      const created = await createComment({
        postId: id,
        boardId,
        body: body.trim(),
        authorId: user?.id ?? null,
      })
      if (!user && created.delete_token) saveGuestCommentToken(created.id, created.delete_token)
      setComments((prev) => [...prev, created])
      setBody('')
      toast(t('post.commentAdded'))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  const images = post?.images ?? []
  // The authoring member (RLS "members delete own posts") OR an admin (RLS "admins
  // manage posts" — covers guest/anyone's posts) may delete this post.
  const canDelete = (!!user && !!post && post.author_id === user.id) || (!!post && isAdmin === true)

  const removePost = async () => {
    const ok = await alertConfirm(
      t('post.deleteConfirmTitle'),
      t('post.deleteConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    setBusy(true)
    try {
      await deletePost(id)
      toast(t('post.deleted'))
      navigate(`/post/list?post_id=${boardId}`, { replace: true })
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to={`/post/list?post_id=${boardId}`} className="text-link">{L(board)}</Link>
      </nav>

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        <header className="p-l border-b border-neutral-90">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-text-normal min-w-0">{post?.title ?? '…'}</h1>
            {canDelete && (
              <button
                type="button"
                onClick={removePost}
                disabled={busy}
                className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-accent-pink border border-accent-pink/40 rounded-m hover:bg-accent-pink hover:text-white disabled:opacity-60"
              >
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
                {t('post.delete')}
              </button>
            )}
          </div>
          {post && (
            <div className="mt-2 flex items-center gap-l text-xs text-subtlest tabular-nums">
              <span className="inline-flex items-center gap-1 not-italic">
                {authorName(post)}
                {isGuest(post) && (
                  <span className="text-[10px] uppercase bg-neutral-95 rounded px-1">{t('post.guestBadge')}</span>
                )}
              </span>
              <span>{formatDate(post.created_at)}</span>
              <span><i className="fa-solid fa-eye mr-1" />{post.views}</span>
              <span><i className="fa-solid fa-comment mr-1" />{comments.length}</span>
            </div>
          )}
        </header>
        <div className="p-l text-sm text-body leading-relaxed whitespace-pre-wrap min-h-[80px]">
          {post?.body || (images.length === 0 && <span className="text-subtlest">—</span>)}
        </div>
        {images.length > 0 && (
          <div className="px-l pb-l">
            <ImageCarousel images={images} />
          </div>
        )}
      </article>

      {/* Comments */}
      <section className="mt-l">
        <h2 className="text-sm font-semibold text-text-normal mb-s">
          <i className="fa-solid fa-comments mr-2 text-accent-blue" />
          {t('post.commentsHeading')} ({comments.length})
        </h2>

        <ul className="border border-neutral-90 rounded-l overflow-hidden mb-m">
          {comments.length === 0 ? (
            <li className="p-m text-sm text-subtlest text-center">{t('post.noComments')}</li>
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                isAdmin={isAdmin === true}
                onDeleted={(id) => setComments((prev) => prev.filter((x) => x.id !== id))}
              />
            ))
          )}
        </ul>

        {/* Comment composer — anyone can comment (guest or member) */}
        <form onSubmit={submitComment} className="flex flex-col gap-2">
          {!user && <p className="text-xs text-subtlest">{t('post.guestNote')}</p>}
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('post.commentPlaceholder')}
            className="p-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue resize-y"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="self-end h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
          >
            {busy ? t('auth.working') : t('post.commentSubmit')}
          </button>
        </form>
      </section>
    </Layout>
  )
}
