import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { STALE } from '../lib/queryClient'
import { createPost, getPost, updatePost, postPath } from '../lib/posts'
import { getCategoryBySlug, listCategories } from '../lib/content'
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
 * When opened with `?maroon=<slug>` (the maroon-bar "Write" button — from a
 * category feed page), the board picker is replaced by a parent→child community
 * category cascade instead: board is fixed to the synthetic 'maroon' board and
 * posts.category_id is what actually places the post in its feeds. The incoming
 * slug (parent or child) is auto-detected and pre-filled (4.1); submission is
 * blocked until a specific child is chosen — a post is never saved parent-only (4).
 */
export default function PostWrite() {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
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

  // Community category cascade (only relevant when isCommunityPost).
  const [parentSlug, setParentSlug] = useState<string | null>(null)
  const [childId, setChildId] = useState<string>('')
  const autoFilled = useRef(false)

  const { data: parents = [] } = useQuery({
    queryKey: ['categories', 'community', null],
    queryFn: () => listCategories(null, 'community'),
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
    enabled: isCommunityPost,
  })

  // Auto-detect parent (+ child, if the incoming slug is itself a child) once.
  useEffect(() => {
    if (!isCommunityPost || !maroonSlug || autoFilled.current) return
    autoFilled.current = true
    getCategoryBySlug(maroonSlug, 'community')
      .then((cat) => {
        if (!cat) return
        if (cat.parent_slug === null) {
          setParentSlug(cat.slug)
        } else {
          setParentSlug(cat.parent_slug)
          setChildId(cat.id)
        }
      })
      .catch(() => {})
  }, [isCommunityPost, maroonSlug])

  // Reload children whenever the parent changes.
  const { data: children = [] } = useQuery({
    queryKey: ['categories', 'community', parentSlug],
    queryFn: () => listCategories(parentSlug, 'community'),
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
    enabled: !!parentSlug,
  })

  // Keep what the user typed if they leave the page or reload mid-compose —
  // restored when they come back. Scoped to the write context (community vs a
  // specific board) so drafts don't bleed across unrelated boards. Board/
  // category selectors and photo picks are re-chosen; the TEXT is what's kept.
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
  const communityBoard = boardTitles.maroon

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alertError(t('post.emptyTitle'))
    if (isCommunityPost && !childId) return alertError(t('post.communityCategoryRequired'))
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
        toast(t('post.updated'))
        navigate(postPath(updated))
        return
      }

      const created = await createPost({
        boardId: isCommunityPost ? 'maroon' : boardId,
        category,
        categoryId: isCommunityPost ? childId : null,
        title: title.trim(),
        body: body.trim(),
        authorId: user?.id ?? null,
        images,
      })
      clearDraft() // submitted for real — discard the saved draft
      toast(t('post.created'))
      navigate(`/post/view?id=${created.id}&post_id=${isCommunityPost ? 'maroon' : boardId}`)
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  const boardLabel = isCommunityPost ? communityBoard : (boardTitles[boardId] ?? { en: 'Board', ko: '게시판' })
  // Reflects whatever the user has ACTUALLY selected right now (not just the
  // slug the form was opened with) so Cancel/breadcrumb always lands correctly,
  // even after switching parent/child away from the auto-filled starting point.
  const effectiveMaroonSlug = children.find((c) => c.id === childId)?.slug ?? parentSlug ?? maroonSlug
  const boardBackHref = isEditing && editPost
    ? postPath(editPost)
    : isCommunityPost && effectiveMaroonSlug
      ? `/post/list?maroon=${effectiveMaroonSlug}`
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
        {isEditing ? (
          /* Editing keeps the post in its board/category — shown read-only. */
          <p className="text-xs text-muted">
            {t('post.boardLabel')}: <span className="font-medium text-text-normal">{L(boardLabel)}</span>
          </p>
        ) : isCommunityPost ? (
          /* Community (maroon-bar) category cascade — replaces the board picker */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-m">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-normal">
                {t('post.communityParent')}<span className="text-red-500 ml-0.5">*</span>
              </span>
              <select
                value={parentSlug ?? ''}
                onChange={(e) => {
                  setParentSlug(e.target.value || null)
                  setChildId('')
                }}
                className="h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue"
              >
                <option value="" disabled>{t('post.communityParentPlaceholder')}</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.slug}>{L(p.name)}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-normal">
                {t('post.communityChild')}<span className="text-red-500 ml-0.5">*</span>
              </span>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                disabled={!parentSlug}
                className="h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue disabled:opacity-60"
              >
                <option value="" disabled>{t('post.communityChildPlaceholder')}</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{L(c.name)}</option>
                ))}
              </select>
            </label>
          </div>
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
