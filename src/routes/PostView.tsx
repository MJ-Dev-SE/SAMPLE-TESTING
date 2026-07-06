import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { boardTitles, getBoardItems } from '../data/boards'
import { recentComments } from '../data/sidebar'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import {
  authorName,
  createComment,
  formatDate,
  getPost,
  isGuest,
  listComments,
  type DbComment,
  type DbPost,
} from '../lib/posts'
import { alertError, errText, toast } from '../lib/alert'

/** Post view (/post/view). Real posts use ?id=<uuid>; hardcoded mockups use ?idx=<n>. */
export default function PostView() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const postId = params.get('post_id') || 'freetalk'
  return id ? <RealPostView id={id} boardId={postId} /> : <LegacyPostView postId={postId} />
}

/* ------------------------- Real (Supabase) post ------------------------- */
function RealPostView({ id, boardId }: { id: string; boardId: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user } = useAuth()
  const board = boardTitles[boardId] ?? { en: 'Board', ko: '게시판' }

  const [post, setPost] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<DbComment[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getPost(id).then((p) => alive && setPost(p)).catch(() => {})
    listComments(id).then((c) => alive && setComments(c)).catch(() => {})
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
      setComments((prev) => [...prev, created])
      setBody('')
      toast(t('post.commentAdded'))
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
          <h1 className="text-lg font-bold text-text-normal">{post?.title ?? '…'}</h1>
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
          {post?.body || <span className="text-subtlest">—</span>}
        </div>
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
              <li key={c.id} className="p-s border-t border-neutral-90 first:border-t-0">
                <div className="text-xs">
                  <span className="font-medium text-text-normal inline-flex items-center gap-1">
                    {authorName(c)}
                    {isGuest(c) && (
                      <span className="text-[10px] uppercase bg-neutral-95 rounded px-1">{t('post.guestBadge')}</span>
                    )}
                  </span>
                  <span className="ml-2 text-subtlest">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-body whitespace-pre-wrap mt-1">{c.body}</p>
              </li>
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

/* ------------------------- Hardcoded mockup post ------------------------- */
function LegacyPostView({ postId }: { postId: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const idx = params.get('idx') || ''

  const board = boardTitles[postId] ?? { en: 'Free Board', ko: '자유게시판' }
  const item =
    getBoardItems(postId).find((p) => p.href.includes(`idx=${idx}`)) ?? getBoardItems(postId)[0]

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to={`/post/list?post_id=${postId}`} className="text-link">{L(board)}</Link>
      </nav>

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        <header className="p-l border-b border-neutral-90">
          <h1 className="text-lg font-bold text-text-normal">{L(item.title)}</h1>
          <div className="mt-2 flex items-center gap-l text-xs text-subtlest tabular-nums">
            <span>{item.author}</span>
            <span>{item.date}</span>
            <span><i className="fa-solid fa-eye mr-1" />{item.views}</span>
            <span><i className="fa-solid fa-comment mr-1" />{item.comments}</span>
          </div>
        </header>
        <div className="p-l text-sm text-body leading-relaxed space-y-3">
          <p>{L(item.title)}</p>
          <p className="text-subtlest">
            {/* Post body is a DATA SLOT — real content drops in here unchanged. */}
            (Post body placeholder — wire real content into the post DATA SLOT.)
          </p>
        </div>
      </article>

      {/* Comments (sample) */}
      <section className="mt-l">
        <h2 className="text-sm font-semibold text-text-normal mb-s">
          <i className="fa-solid fa-comments mr-2 text-accent-blue" />
          {t('widgets.recentComments')} ({item.comments})
        </h2>
        <ul className="border border-neutral-90 rounded-l overflow-hidden">
          {recentComments.slice(0, Math.max(1, item.comments % 6)).map((c, i) => (
            <li key={i} className="flex gap-2 p-s border-t border-neutral-90 first:border-t-0">
              <img src={c.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
              <div>
                <div className="text-xs">
                  <span className="font-medium text-text-normal">{c.author}</span>
                  <span className="ml-2 text-subtlest">{L(c.timeAgo)}</span>
                </div>
                <p className="text-xs text-body">{L(c.snippet)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}
