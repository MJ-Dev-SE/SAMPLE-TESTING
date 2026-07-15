import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { createPost } from '../lib/posts'
import { getCategoryBySlug, listCategories } from '../lib/content'
import { uploadToMedia, publicUrl } from '../lib/media'
import { alertError, errText, toast } from '../lib/alert'
import { usePhotoPicker } from '../lib/usePhotoPicker'
import PhotoPickerThumbs from '../components/PhotoPickerThumbs'
import type { CategoryRec } from '../types'

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

  const maroonSlug = params.get('maroon')
  const isCommunityPost = !!maroonSlug
  const category = params.get('category')
  const [boardId, setBoardId] = useState(params.get('post_id') || 'freetalk')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const { picks, addFiles, removeAt } = usePhotoPicker()
  const [busy, setBusy] = useState(false)

  // Community category cascade (only relevant when isCommunityPost).
  const [parents, setParents] = useState<CategoryRec[]>([])
  const [parentSlug, setParentSlug] = useState<string | null>(null)
  const [children, setChildren] = useState<CategoryRec[]>([])
  const [childId, setChildId] = useState<string>('')
  const autoFilled = useRef(false)

  useEffect(() => {
    if (!isCommunityPost) return
    listCategories(null, 'community').then(setParents).catch(() => setParents([]))
  }, [isCommunityPost])

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
  useEffect(() => {
    if (!parentSlug) return setChildren([])
    listCategories(parentSlug, 'community').then(setChildren).catch(() => setChildren([]))
  }, [parentSlug])

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
      const created = await createPost({
        boardId: isCommunityPost ? 'maroon' : boardId,
        category,
        categoryId: isCommunityPost ? childId : null,
        title: title.trim(),
        body: body.trim(),
        authorId: user?.id ?? null,
        images,
      })
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
  const boardBackHref = isCommunityPost && effectiveMaroonSlug
    ? `/post/list?maroon=${effectiveMaroonSlug}`
    : `/post/list?post_id=${boardId}`

  return (
    <Layout>
      <Seo title={t('post.write')} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to={boardBackHref} className="text-link">{L(boardLabel)}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('post.newPost')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-l">{t('post.newPost')}</h1>

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

      <form onSubmit={submit} className="border border-neutral-90 rounded-l p-l flex flex-col gap-m">
        {isCommunityPost ? (
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
            {busy ? t('auth.working') : t('post.submit')}
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
