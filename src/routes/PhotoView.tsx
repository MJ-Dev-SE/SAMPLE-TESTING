import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { allPhotos, findPhoto } from '../data/photos'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import {
  authorName,
  createComment,
  formatDate,
  getOrCreatePhotoPost,
  getPhotoPost,
  isGuest,
  listComments,
  type DbComment,
  type DbPost,
} from '../lib/posts'
import { alertError, errText, toast } from '../lib/alert'

const PHOTOS_CRUMB = { en: 'Resort Photos', ko: '리조트 포토' }

/**
 * Photo page (/photo/view?id=<slug>) — philgo-style: the pic shows centered in the
 * middle column like a post, with its caption/info below and a real comment thread
 * (guest or member) exactly like a board post. ‹ › links walk through all photos.
 */
export default function PhotoView() {
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''
  const photo = findPhoto(id)
  // Remount per photo so state (comments, composer) resets when navigating ‹ ›.
  return photo ? <PhotoPage key={id} photoId={id} /> : <Navigate to="/" replace />
}

function PhotoPage({ photoId }: { photoId: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user } = useAuth()
  const photo = findPhoto(photoId)!

  const idx = allPhotos.findIndex((p) => p.id === photoId)
  const prev = allPhotos[(idx - 1 + allPhotos.length) % allPhotos.length]
  const next = allPhotos[(idx + 1) % allPhotos.length]

  // Comments hang off a hidden anchor post (created on first comment).
  const [anchor, setAnchor] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<DbComment[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

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
      const post = anchor ?? (await getOrCreatePhotoPost(photoId, photo.title.en))
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

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-text-muted">{L(PHOTOS_CRUMB)}</span>
      </nav>

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        {/* Title header, philgo post style */}
        <header className="p-l border-b border-neutral-90">
          <div className="flex items-center gap-2">
            <span className="rounded-m bg-chip-blue px-2 py-0.5 text-[11px] font-semibold text-accent-blue">
              {L(photo.tag)}
            </span>
            <span className="text-[11px] text-subtlest tabular-nums">
              {idx + 1} / {allPhotos.length}
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
          <img src={photo.src} alt={L(photo.title)} className="max-w-full h-auto rounded-m" />
        </div>

        {/* Dense caption / info */}
        <div className="p-l border-t border-neutral-90">
          <p className="text-sm text-body leading-relaxed">{L(photo.description)}</p>
          {photo.details && (
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
        <div className="flex items-center justify-between border-t border-neutral-90 bg-neutral-97 px-m py-2 text-[13px]">
          <Link to={`/photo/view?id=${prev.id}`} className="text-link hover:underline">
            <i className="fa-solid fa-chevron-left mr-1" />
            {L(prev.title)}
          </Link>
          <Link to={`/photo/view?id=${next.id}`} className="text-link hover:underline text-right">
            {L(next.title)}
            <i className="fa-solid fa-chevron-right ml-1" />
          </Link>
        </div>
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
