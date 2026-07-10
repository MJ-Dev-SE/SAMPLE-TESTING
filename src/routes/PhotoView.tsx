import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { listAllPhotos } from '../lib/content'
import SmartImage from '../components/SmartImage'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import {
  authorName,
  createComment,
  createPost,
  formatDate,
  getOrCreatePhotoPost,
  getPhotoPost,
  isGuest,
  listComments,
  listPosts,
  type DbComment,
  type DbPost,
} from '../lib/posts'
import { uploadToMedia } from '../lib/media'
import { avatar } from '../lib/placeholder'
import { alertError, errText, toast } from '../lib/alert'
import { usePhotoPicker } from '../lib/usePhotoPicker'
import PhotoPickerThumbs from '../components/PhotoPickerThumbs'
import ImageCarousel from '../components/ImageCarousel'
import type { PhotoRec } from '../types'

const PHOTOS_CRUMB = { en: 'Resort Photos', ko: '리조트 포토' }

/**
 * Photo page (/photo/view?id=<slug>) — philgo-style: the pic shows centered in the
 * middle column like a post, with its caption/info below and a real comment thread
 * (guest or member) exactly like a board post. ‹ › links walk through all photos.
 */
export default function PhotoView() {
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''
  // Remount per photo so state (comments, composer) resets when navigating ‹ ›.
  return <PhotoPage key={id} photoId={id} />
}

function PhotoPage({ photoId }: { photoId: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user, profile } = useAuth()

  const [all, setAll] = useState<PhotoRec[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let alive = true
    listAllPhotos()
      .then((rows) => {
        if (!alive) return
        setAll(rows)
        if (rows.length > 0 && !rows.some((p) => p.slug === photoId)) setNotFound(true)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [photoId])

  const idx = all.findIndex((p) => p.slug === photoId)
  const photo = idx >= 0 ? all[idx] : null
  const prev = all.length ? all[(idx - 1 + all.length) % all.length] : null
  const next = all.length ? all[(idx + 1) % all.length] : null

  // Comments hang off a hidden anchor post (created on first comment).
  const [anchor, setAnchor] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<DbComment[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  // User posts submitted under THIS category (resort_community board, category = slug).
  // Composed INLINE on this page — no navigation away.
  const [posts, setPosts] = useState<DbPost[]>([])
  const [showForm, setShowForm] = useState(false)
  const [pBody, setPBody] = useState('')
  const { picks, addFiles, removeAt, reset } = usePhotoPicker()
  const [pBusy, setPBusy] = useState(false)

  useEffect(() => {
    let alive = true
    listPosts('resort_community', undefined, photoId)
      .then((p) => alive && setPosts(p))
      .catch(() => alive && setPosts([]))
    return () => {
      alive = false
    }
  }, [photoId])

  const submitPost = async (e: FormEvent) => {
    e.preventDefault()
    const text = pBody.trim()
    if (!text && picks.length === 0) return
    setPBusy(true)
    try {
      // Members may attach photos; guests are text-only (Storage upload needs auth).
      let images: string[] = []
      if (user && picks.length > 0) {
        const paths = await Promise.all(picks.map((p) => uploadToMedia(`posts/${user.id}`, p.file)))
        images = paths
      }
      const title = text ? text.split('\n')[0].slice(0, 80) : L(photo?.title ?? { en: 'Photo', ko: '사진' })
      const created = await createPost({
        boardId: 'resort_community',
        category: photoId,
        title,
        body: text,
        authorId: user?.id ?? null,
        images,
      })
      // Attach the author locally so the new row shows the poster's name immediately
      // (the insert doesn't embed the profile join).
      const optimistic: DbPost = {
        ...created,
        author: profile
          ? { username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url }
          : null,
      }
      setPosts((prev) => [optimistic, ...prev])
      setPBody('')
      reset()
      setShowForm(false)
      toast(t('post.created'))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setPBusy(false)
    }
  }

  useEffect(() => {
    let alive = true
    getPhotoPost(photoId)
      .then(async (p) => {
        if (!alive || !p) return
        setAnchor(p)
        const c = await listComments(p.id)
        if (alive) setComments(c)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [photoId])

  const submitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try {
      const post = anchor ?? (await getOrCreatePhotoPost(photoId, photo?.title.en ?? photoId))
      setAnchor(post)
      const created = await createComment({
        postId: post.id,
        boardId: 'photos',
        body: body.trim(),
        authorId: user?.id ?? null,
      })
      setComments((prevList) => [...prevList, created])
      setBody('')
      toast(t('post.commentAdded'))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  if (notFound) return <Navigate to="/" replace />
  if (!photo) return <Layout><p className="text-sm text-muted">…</p></Layout>

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-text-muted">{L(PHOTOS_CRUMB)}</span>
      </nav>

      {/* UPPER-PART posting area for THIS category — button first, then the inline form */}
      <section className="mb-l">
        <div className="flex items-center justify-between gap-3 mb-s">
          <h2 className="text-sm font-semibold text-text-normal min-w-0 truncate">
            <i className="fa-solid fa-pen-to-square mr-2 text-accent-blue" />
            {L(photo.title)} ({posts.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
          >
            <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-pen'}`} aria-hidden="true" />
            {showForm ? t('post.cancel') : t('post.write')}
          </button>
        </div>

        {/* Inline composer — smooth expand/collapse via the grid-rows trick */}
        <div
          className={`grid transition-all duration-300 ease-out ${
            showForm ? 'grid-rows-[1fr] opacity-100 mb-m' : 'grid-rows-[0fr] opacity-0'
          }`}
          aria-hidden={!showForm}
        >
          <div className="overflow-hidden">
            <form onSubmit={submitPost} className="border border-neutral-90 rounded-l p-m flex flex-col gap-2">
              {!user && <p className="text-xs text-subtlest">{t('post.guestNote')}</p>}
              <textarea
                rows={3}
                value={pBody}
              onChange={(e) => setPBody(e.target.value)}
              placeholder={t('post.bodyPlaceholder')}
              className="p-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue resize-y"
            />
            {user ? (
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs text-link cursor-pointer hover:underline">
                  <i className="fa-solid fa-image" />
                  {t('post.addPhotos')}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={addFiles}
                    className="hidden"
                  />
                </label>
                <PhotoPickerThumbs picks={picks} onRemove={removeAt} thumbClass="w-14 h-14" />
              </div>
            ) : (
              <span className="text-xs text-subtlest">{t('post.photosHint')}</span>
            )}
            <button
              type="submit"
              disabled={pBusy || (!pBody.trim() && picks.length === 0)}
              className="self-end h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
            >
              {pBusy ? t('auth.working') : t('post.submit')}
            </button>
            </form>
          </div>
        </div>

        {/* Inline feed of posts for this category */}
        {posts.length > 0 && (
          <ul className="flex flex-col gap-m">
            {posts.map((p) => (
              <li key={p.id} className="border border-neutral-90 rounded-l p-m">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <img src={p.author?.avatar_url || avatar(authorName(p))} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  <span className="font-medium text-text-normal inline-flex items-center gap-1">
                    {authorName(p)}
                    {isGuest(p) && (
                      <span className="text-[10px] uppercase bg-neutral-95 rounded px-1">{t('post.guestBadge')}</span>
                    )}
                  </span>
                  <span className="text-subtlest">{formatDate(p.created_at)}</span>
                </div>
                {p.body && <p className="text-sm text-body whitespace-pre-wrap">{p.body}</p>}
                {p.images.length > 0 && (
                  <div className="mt-2">
                    <ImageCarousel images={p.images} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        {/* Title header, philgo post style */}
        <header className="p-l border-b border-neutral-90">
          <div className="flex items-center gap-2">
            <span className="rounded-m bg-chip-blue px-2 py-0.5 text-[11px] font-semibold text-accent-blue">
              {L(photo.tag)}
            </span>
            <span className="text-[11px] text-subtlest tabular-nums">
              {idx + 1} / {all.length}
            </span>
          </div>
          <h1 className="mt-1 text-lg font-bold text-text-normal">{L(photo.title)}</h1>
          {anchor && (
            <div className="mt-2 flex items-center gap-l text-xs text-subtlest tabular-nums">
              <span>{formatDate(anchor.created_at)}</span>
              <span><i className="fa-solid fa-comment mr-1" />{comments.length}</span>
            </div>
          )}
        </header>

        {/* The pic, centered in the middle column */}
        <div className="flex justify-center bg-neutral-97 p-s">
          <SmartImage src={photo.src} alt={L(photo.title)} className="w-full max-w-3xl rounded-m" />
        </div>

        {/* Dense caption / info */}
        <div className="p-l border-t border-neutral-90">
          <p className="text-sm text-body leading-relaxed">{L(photo.description)}</p>
          {photo.details && photo.details.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-neutral-95 pt-3">
              {photo.details.map((d, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug text-text-normal">
                  <i className="fa-solid fa-circle-check mt-0.5 shrink-0 text-accent-green" aria-hidden="true" />
                  <span>{L(d)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prev / next photo */}
        {prev && next && (
          <div className="flex items-center justify-between border-t border-neutral-90 bg-neutral-97 px-m py-2 text-[13px]">
            <Link to={`/photo/view?id=${prev.slug}`} className="text-link hover:underline">
              <i className="fa-solid fa-chevron-left mr-1" />
              {L(prev.title)}
            </Link>
            <Link to={`/photo/view?id=${next.slug}`} className="text-link hover:underline text-right">
              {L(next.title)}
              <i className="fa-solid fa-chevron-right ml-1" />
            </Link>
          </div>
        )}
      </article>

      {/* Comments — same real (Supabase) thread as board posts */}
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
