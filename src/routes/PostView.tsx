import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { STALE } from '../lib/queryClient'
import ImageCarousel from '../components/ImageCarousel'
import PhotoLightbox from '../components/PhotoLightbox'
import CommentItem from '../components/CommentItem'
import {
  authorName,
  createComment,
  deletePost,
  formatDate,
  getPost,
  getPostBySlug,
  invalidatePostLists,
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
import AiAssistantButton from '../components/ai/AiAssistantButton'
import AiAssistantSection from '../components/ai/AiAssistantSection'
import { useAiAssistant } from '../components/ai/useAiAssistant'

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
  const queryClient = useQueryClient()

  const postKey = slug ?? id
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  /** Index of the photo shown full-size in the lightbox; null = closed. */
  const [lightbox, setLightbox] = useState<number | null>(null)
  const recordedViewFor = useRef<string | null>(null)

  const { data: post = null, isLoading } = useQuery({
    queryKey: ['post', postKey],
    queryFn: () => (slug ? getPostBySlug(slug) : getPost(id!)),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
    enabled: !!(slug || id),
  })
  const state: 'loading' | 'ready' | 'missing' = isLoading ? 'loading' : post ? 'ready' : 'missing'

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post?.id ?? null],
    queryFn: () => listComments(post!.id),
    staleTime: STALE.comments,
    gcTime: STALE.comments * 2,
    enabled: !!post?.id,
  })

  const ai = useAiAssistant('post', post?.id ?? '')

  // Slug miss → maybe it was renamed; follow the redirect table (once per key).
  useEffect(() => {
    if (isLoading || post || !slug) return
    let alive = true
    resolveSlugRedirect('post', slug)
      .then((next) => {
        if (alive && next) setRedirectTo(`/posts/${encodeURIComponent(next)}`)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [isLoading, post, slug])

  // Fire-and-forget: dedup happens server-side, so this is safe to call on every
  // mount (including StrictMode's double-invoke in dev) without inflating the
  // count — a repeat call within 24h just re-reads the total. Guarded by a ref
  // (rather than an effect dep on `post`) so a later cache update to `post`
  // doesn't re-trigger it.
  useEffect(() => {
    if (!post || recordedViewFor.current === postKey) return
    recordedViewFor.current = postKey
    recordPostView(post.id)
      .then((views) => {
        queryClient.setQueryData<DbPost | null>(['post', postKey], (prev) => (prev ? { ...prev, views } : prev))
      })
      .catch(() => {})
  }, [post, postKey, queryClient])

  if (redirectTo) return <Navigate to={redirectTo} replace />

  const boardId = post?.board_id ?? queryBoard ?? 'freetalk'
  const board = boardTitles[boardId] ?? { en: 'Board', ko: '게시판' }
  // Community (maroon-bar) posts: the breadcrumb/back link must go to the post's
  // OWN category feed (e.g. /community/mukbang), not the generic unfiltered
  // "Community Categories" board list (/post/list?post_id=maroon) — that page
  // shows every category's posts jumbled together, which reads as "wrong feed".
  const isCommunityBoard = boardId === 'maroon'
  const boardLabel = isCommunityBoard && post?.category_row ? post.category_row.name : board
  const boardHref =
    isCommunityBoard && post?.category_row
      ? post.category_row.parent_slug
        ? `/${post.category_row.parent_slug}/${post.category_row.slug}`
        : `/${post.category_row.slug}`
      : `/post/list?post_id=${boardId}`

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
      queryClient.setQueryData<DbComment[]>(['comments', post.id], (prev) => [...(prev ?? []), created])
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] })
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
  // Edit is OWNER-ONLY (not admin): only the author fixes their own wording.
  // Guest posts (author_id null) are never editable — there's no owner to match.
  const canEdit = !!user && !!post && !!post.author_id && post.author_id === user.id

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
      invalidatePostLists(queryClient)
      toast(t('post.deleted'))
      navigate(boardHref, { replace: true })
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
          { label: L(boardLabel), href: boardHref },
          ...(post ? [{ label: post.title }] : []),
        ]}
      />

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        <header className="p-l border-b border-neutral-90">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-text-normal min-w-0">{post?.title ?? '…'}</h1>
            <div className="shrink-0 flex items-center gap-2">
              {post && <AiAssistantButton open={ai.open} onClick={ai.toggle} />}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => navigate(`/post/write?edit=${post!.id}`)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-link border border-link/40 rounded-m hover:bg-link hover:text-white"
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                  {t('post.edit')}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={removePost}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-accent-pink border border-accent-pink/40 rounded-m hover:bg-accent-pink hover:text-white disabled:opacity-60"
                >
                  <i className="fa-solid fa-trash-can" aria-hidden="true" />
                  {t('post.delete')}
                </button>
              )}
            </div>
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
            <ImageCarousel images={images} onImageClick={setLightbox} />
          </div>
        )}
      </article>

      {/* Click any post photo → full-size, centered, with ‹ › to walk the rest. */}
      <PhotoLightbox
        images={images}
        index={lightbox}
        onIndexChange={setLightbox}
        onClose={() => setLightbox(null)}
        alt={post?.title ?? ''}
      />

      {/* Private AI assistant for this post — see components/ai */}
      <AiAssistantSection ai={ai} />

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
                onDeleted={(cid) => {
                  if (!post) return
                  queryClient.setQueryData<DbComment[]>(['comments', post.id], (prev) =>
                    (prev ?? []).filter((x) => x.id !== cid),
                  )
                }}
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
