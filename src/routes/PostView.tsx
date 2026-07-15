import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import Breadcrumbs from '../components/seo/Breadcrumbs'
import { NotFoundBody } from './NotFound'
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
  getPostBySlug,
  isGuest,
  listComments,
  postPath,
  recordPostView,
  type DbComment,
  type DbPost,
} from '../lib/posts'
import { resolveSlugRedirect } from '../lib/slugRedirects'
import { metaDescription } from '../lib/seo/text'
import { articleLd } from '../lib/seo/structuredData'
import { saveGuestCommentToken } from '../lib/guestTokens'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'

/**
 * Post view. Two URL shapes resolve here:
 *   /posts/<slug>                — canonical, slug-based (routes in App.tsx)
 *   /post/view?id=<uuid>&post_id=<board> — legacy; still works, canonicalises
 *                                  to the slug URL via <link rel=canonical>.
 * Renamed slugs are looked up in slug_redirects and client-redirected.
 */
export default function PostView() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const id = params.get('id')
  const queryBoard = params.get('post_id')
  if (!slug && !id) return <Navigate to="/" replace />
  return <RealPostView key={slug ?? id} slug={slug ?? null} id={id} queryBoard={queryBoard} />
}

function RealPostView({ slug, id, queryBoard }: { slug: string | null; id: string | null; queryBoard: string | null }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()

  const [post, setPost] = useState<DbPost | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [comments, setComments] = useState<DbComment[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    setState('loading')
    const load = slug ? getPostBySlug(slug) : getPost(id!)
    load
      .then(async (p) => {
        if (!alive) return
        if (!p && slug) {
          // Slug miss → maybe it was renamed; follow the redirect table.
          const next = await resolveSlugRedirect('post', slug)
          if (!alive) return
          if (next) return setRedirectTo(`/posts/${encodeURIComponent(next)}`)
        }
        setPost(p)
        setState(p ? 'ready' : 'missing')
        if (!p) return
        listComments(p.id).then((c) => alive && setComments(c)).catch(() => {})
        // Fire-and-forget: dedup happens server-side, so this is safe to call on
        // every mount (including StrictMode's double-invoke in dev) without
        // inflating the count — a repeat call within 24h just re-reads the total.
        recordPostView(p.id)
          .then((views) => alive && setPost((prev) => (prev ? { ...prev, views } : prev)))
          .catch(() => {})
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
    }
  }, [slug, id])

  if (redirectTo) return <Navigate to={redirectTo} replace />

  const boardId = post?.board_id ?? queryBoard ?? 'freetalk'
  const board = boardTitles[boardId] ?? { en: 'Board', ko: '게시판' }

  const submitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !post) return
    setBusy(true)
    try {
      const created = await createComment({
        postId: post.id,
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
    if (!post) return
    const ok = await alertConfirm(
      t('post.deleteConfirmTitle'),
      t('post.deleteConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    setBusy(true)
    try {
      await deletePost(post.id)
      toast(t('post.deleted'))
      navigate(`/post/list?post_id=${boardId}`, { replace: true })
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  if (state === 'missing') {
    return (
      <Layout>
        <Seo title={t('notFound.title')} noindex />
        <NotFoundBody />
      </Layout>
    )
  }

  // DB-driven metadata with safe fallbacks: meta_title → title,
  // meta_description → excerpt(body), OG image → first attached photo,
  // canonical → slug URL, index → is_indexable.
  const canonicalPath = post ? post.canonical_url || postPath(post) : undefined
  const seo = post ? (
    <Seo
      title={post.meta_title || post.title}
      description={metaDescription(post.meta_description, post.body, post.title)}
      path={canonicalPath}
      image={post.og_image_url || images[0] || null}
      type="article"
      publishedTime={post.created_at}
      noindex={post.is_indexable === false}
      jsonLd={articleLd({
        headline: post.title,
        description: metaDescription(post.meta_description, post.body),
        image: post.og_image_url || images[0] || null,
        url: canonicalPath!,
        datePublished: post.created_at,
        authorName: authorName(post),
      })}
    />
  ) : (
    <Seo noindex />
  )

  return (
    <Layout>
      {seo}
      <Breadcrumbs
        items={[
          { label: t('menuPage.breadcrumbHome'), href: '/' },
          { label: L(board), href: `/post/list?post_id=${boardId}` },
          ...(post ? [{ label: post.title }] : []),
        ]}
      />

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
            disabled={busy || !body.trim() || !post}
            className="self-end h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
          >
            {busy ? t('auth.working') : t('post.commentSubmit')}
          </button>
        </form>
      </section>
    </Layout>
  )
}
