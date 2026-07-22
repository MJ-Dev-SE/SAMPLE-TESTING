import { useRef, useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { NotFoundBody } from './NotFound'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'
import { createPost, getPost, updatePost, postPath, invalidatePostLists } from '../lib/posts'
import { getCategoryBySlug } from '../lib/content'
import { uploadToMedia, publicUrl } from '../lib/media'
import { alertError, errText, toast } from '../lib/alert'
import { usePhotoPicker } from '../lib/usePhotoPicker'
import { useFormDraft } from '../lib/useFormDraft'
import PhotoPickerThumbs from '../components/PhotoPickerThumbs'
import SmartImage from '../components/SmartImage'

/**
 * Compose page (/post/write?post_id=…&category=…, or /post/write?maroon=<slug>).
 * Anyone can post to ANY board (board picker). Members may attach photos; guests are text-only.
 *
 * When opened with `?maroon=<slug>` (the "Write" button on a community feed
 * page — CategoryPage.tsx), the board picker is replaced entirely: there is NO
 * sub-category picker. The slug in the URL IS the designated feed — whichever
 * tab the user was on when they clicked Write (a specific child like "Mukbang",
 * or the parent's own "Overall" view) — resolved once and used as-is. The form
 * itself is just title + details + photo(s); board is fixed to the synthetic
 * 'maroon' board and posts.category_id is the resolved category's id.
 */
export default function PostWrite() {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const { user, profile } = useAuth()

  // Edit mode: /post/write?edit=<id> reuses this whole form to update an
  // existing post in place. Only the owner may edit (RLS enforces it too), and
  // the board/category stay fixed — editing fixes content, it doesn't move a
  // post between boards.
  const editId = params.get('edit')
  const isEditing = !!editId

  const maroonSlug = params.get('maroon')
  const isCommunityPost = !isEditing && !!maroonSlug
  const category = params.get('category')
  const [boardId, setBoardId] = useState(params.get('post_id') || 'freetalk')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const { picks, addFiles, removeAt } = usePhotoPicker()
  /** Already-uploaded photos on the post being edited, kept unless removed here. */
  const [keptImages, setKeptImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const { data: editPost = null, isLoading: editLoading } = useQuery({
    queryKey: ['post', editId],
    queryFn: () => getPost(editId!),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
    enabled: isEditing,
  })

  // Prefill once from the post being edited (board/category shown read-only).
  const prefilled = useRef(false)
  useEffect(() => {
    if (!isEditing || !editPost || prefilled.current) return
    prefilled.current = true
    setBoardId(editPost.board_id)
    setTitle(editPost.title)
    setBody(editPost.body)
    setKeptImages(editPost.images ?? [])
  }, [isEditing, editPost])

  // The community feed this post belongs to — resolved ONCE, directly from the
  // URL's maroon slug. No manual parent/child picking: whatever feed the user
  // was viewing when they clicked "Write" is the destination, full stop.
  const { data: maroonCategory, isLoading: maroonCategoryLoading } = useQuery({
    queryKey: ['category', 'community', maroonSlug],
    queryFn: () => getCategoryBySlug(maroonSlug!, 'community'),
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
    enabled: isCommunityPost,
  })

  // Keep what the user typed if they leave the page or reload mid-compose —
  // restored when they come back. Scoped to the write context (community vs a
  // specific board) so drafts don't bleed across unrelated boards/feeds.
  const draftKey = `post-write:${maroonSlug ? `maroon:${maroonSlug}` : `board:${params.get('post_id') || 'freetalk'}`}`
  const { clearDraft } = useFormDraft({
    key: draftKey,
    snapshot: { title, body },
    // No draft autosave while editing — an edit isn't a "new post" draft, and
    // its prefilled values must not leak into the next fresh compose.
    enabled: !isEditing,
    isEmpty: (s) => !s.title.trim() && !s.body.trim(),
    restore: (s) => {
      setTitle(s.title ?? '')
      setBody(s.body ?? '')
    },
  })

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0]
  const boardOptions = Object.entries(boardTitles).filter(([id]) => id !== 'maroon')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alertError(t('post.emptyTitle'))
    // Defensive only — the render guard below already refuses to show the form
    // until the feed resolves, so this should be unreachable in practice.
    if (isCommunityPost && !maroonCategory) return alertError(t('post.communityCategoryRequired'))
    setBusy(true)
    try {
      // Members may attach photos; upload them to Storage first.
      let images: string[] = []
      if (user && picks.length > 0) {
        const paths = await Promise.all(picks.map((p) => uploadToMedia(`posts/${user.id}`, p.file)))
        images = paths.map(publicUrl)
      }

      // ---- Edit path: update the existing post in place (board/category fixed) ----
      if (isEditing && editPost) {
        const updated = await updatePost(editPost.id, {
          title: title.trim(),
          body: body.trim(),
          images: [...keptImages, ...images], // kept existing + newly uploaded
        })
        invalidatePostLists(queryClient)
        toast(t('post.updated'))
        navigate(postPath(updated))
        return
      }

      const created = await createPost({
        boardId: isCommunityPost ? 'maroon' : boardId,
        category,
        categoryId: isCommunityPost ? maroonCategory?.id ?? null : null,
        title: title.trim(),
        body: body.trim(),
        authorId: user?.id ?? null,
        images,
      })
      invalidatePostLists(queryClient)
      clearDraft() // submitted for real — discard the saved draft
      toast(t('post.created'))
      navigate(`/post/view?id=${created.id}&post_id=${isCommunityPost ? 'maroon' : boardId}`)
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  const boardLabel =
    isCommunityPost && maroonCategory ? maroonCategory.name : boardTitles[boardId] ?? { en: 'Board', ko: '게시판' }
  // The crawlable feed URL this post belongs to (e.g. /community/mukbang, or
  // /community itself for a parent-level "Overall" post) — same scheme as
  // CategoryPage.tsx's own routes, so Cancel/breadcrumb land exactly where the
  // post will actually show up.
  const boardBackHref =
    isEditing && editPost
      ? postPath(editPost)
      : isCommunityPost && maroonCategory
        ? maroonCategory.parent_slug
          ? `/${maroonCategory.parent_slug}/${maroonCategory.slug}`
          : `/${maroonCategory.slug}`
        : `/post/list?post_id=${boardId}`

  // --- Edit-mode guards (owner-only) -------------------------------------
  if (isEditing) {
    // Still loading the post to edit.
    if (editLoading) return <Layout><p className="text-sm text-subtlest p-l">…</p></Layout>
    // Gone, or not the owner → never show the edit form. RLS would block the
    // write anyway; this stops a non-owner from even opening it.
    if (!editPost) return <Navigate to="/" replace />
    if (!user || editPost.author_id !== user.id) return <Navigate to={postPath(editPost)} replace />
  }

  // --- Community-feed guard: resolve straight from the URL, no manual picking.
  // A slug that fails to resolve means a stale/broken link, not something the
  // user can fix by choosing differently — show the honest 404 instead of a form
  // that would silently post nowhere.
  if (isCommunityPost) {
    if (maroonCategoryLoading) return <Layout><p className="text-sm text-subtlest p-l">…</p></Layout>
    if (!maroonCategory) {
      return (
        <Layout>
          <Seo title={t('notFound.title')} noindex />
          <NotFoundBody />
        </Layout>
      )
    }
  }

  const heading = isEditing ? t('post.editPost') : t('post.newPost')

  return (
    <Layout>
      <Seo title={heading} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to={boardBackHref} className="text-link">{L(boardLabel)}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{heading}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-l">{heading}</h1>

      {/* Who is posting */}
      <div className="mb-m text-sm">
        {user ? (
          <span className="text-muted">
            {t('post.postingAs')}{' '}
            <span className="font-semibold text-text-normal">{displayName}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-muted bg-neutral-95 rounded-m px-3 py-2">
            <i className="fa-solid fa-user-secret text-subtlest" />
            {t('post.guestNote')}
          </span>
        )}
      </div>

      <form onSubmit={submit} className="border border-neutral-90 rounded-l p-l flex flex-col gap-m animate-modal-in">
        {isEditing || isCommunityPost ? (
          /* Editing keeps the post in its board/category; a community post's
             feed is whatever tab "Write" was clicked from — both read-only,
             no picker. */
          <p className="text-xs text-muted">
            {t('post.postingTo')}: <span className="font-medium text-text-normal">{L(boardLabel)}</span>
          </p>
        ) : (
          /* Board / category picker — post under any board, not just Community */
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('post.boardLabel')}</span>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue"
            >
              {boardOptions.map(([id, label]) => (
                <option key={id} value={id}>{L(label)}</option>
              ))}
            </select>
          </label>
        )}

        {category && (
          <p className="text-xs text-muted">
            {t('post.categoryLabel')}: <span className="font-medium text-text-normal">{category}</span>
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('post.titleLabel')}</span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('post.titlePlaceholder')}
            className="h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('post.bodyLabel')}</span>
          <textarea
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('post.bodyPlaceholder')}
            className="p-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue resize-y"
          />
        </label>

        {/* Photos — members only (Storage upload needs auth); text-only stays valid */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('post.addPhotos')}</span>
          {/* When editing: current photos, each removable; anything left here is kept. */}
          {isEditing && keptImages.length > 0 && (
            <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {keptImages.map((src) => (
                <div key={src} className="relative group">
                  <SmartImage src={src} cover className="aspect-square rounded-m border border-neutral-90" />
                  <button
                    type="button"
                    onClick={() => setKeptImages((prev) => prev.filter((s) => s !== src))}
                    aria-label={t('post.removePhoto')}
                    className="absolute -top-1.5 -right-1.5 h-6 w-6 grid place-items-center rounded-full bg-black/70 text-white text-xs hover:bg-red-500"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {user ? (
            <>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={addFiles}
                className="text-sm"
              />
              <span className="text-xs text-subtlest">{t('post.photosMemberHint')}</span>
              {picks.length > 0 && (
                <div className="mt-2">
                  <PhotoPickerThumbs picks={picks} onRemove={removeAt} />
                </div>
              )}
            </>
          ) : (
            <span className="text-xs text-subtlest">{t('post.photosHint')}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
          >
            {busy ? t('auth.working') : isEditing ? t('post.saveChanges') : t('post.submit')}
          </button>
          <Link
            to={boardBackHref}
            className="h-10 px-5 grid place-items-center border border-neutral-90 text-text-normal text-sm rounded-m hover:bg-neutral-97"
          >
            {t('post.cancel')}
          </Link>
        </div>
      </form>
    </Layout>
  )
}
