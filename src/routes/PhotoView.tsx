import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import Breadcrumbs from '../components/seo/Breadcrumbs'
import { NotFoundBody } from './NotFound'
import { metaDescription } from '../lib/seo/text'
import { touristAttractionLd } from '../lib/seo/structuredData'
import { listAllPhotos } from '../lib/content'
import { STALE } from '../lib/queryClient'
import SmartImage from '../components/SmartImage'
import Tooltip from '../components/Tooltip'
import { useAuth } from '../lib/auth'
import { useIsAdmin } from '../admin/useIsAdmin'
import { useLocalized } from '../lib/useLocalized'
import {
  authorName,
  createComment,
  createPost,
  deletePost,
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
import { alertConfirm, alertError, errText, toast } from '../lib/alert'
import { usePhotoPicker } from '../lib/usePhotoPicker'
import PhotoPickerThumbs from '../components/PhotoPickerThumbs'
import ImageCarousel from '../components/ImageCarousel'
import CommentItem from '../components/CommentItem'
import Collapse from '../components/Collapse'
import { saveGuestCommentToken } from '../lib/guestTokens'
import AiAssistantButton from '../components/ai/AiAssistantButton'
import AiAssistantSection from '../components/ai/AiAssistantSection'
import { useAiAssistant } from '../components/ai/useAiAssistant'

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
  const isAdmin = useIsAdmin()
  const ai = useAiAssistant('photo', photoId)
  const queryClient = useQueryClient()

  const { data: all = [] } = useQuery({
    queryKey: ['photos', 'all'],
    queryFn: () => listAllPhotos(),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
  })
  const notFound = all.length > 0 && !all.some((p) => p.slug === photoId)

  const idx = all.findIndex((p) => p.slug === photoId)
  const photo = idx >= 0 ? all[idx] : null
  const prev = all.length ? all[(idx - 1 + all.length) % all.length] : null
  const next = all.length ? all[(idx + 1) % all.length] : null

  // Comments hang off a hidden anchor post (created on first comment).
  const { data: anchor = null } = useQuery({
    queryKey: ['photoPost', photoId],
    queryFn: () => getPhotoPost(photoId),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
    enabled: !!photoId,
  })
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', anchor?.id ?? null],
    queryFn: () => listComments(anchor!.id),
    staleTime: STALE.comments,
    gcTime: STALE.comments * 2,
    enabled: !!anchor?.id,
  })
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  // User posts submitted under THIS category (resort_community board, category = slug).
  // Composed INLINE on this page — no navigation away.
  const { data: posts = [] } = useQuery({
    queryKey: ['posts', 'resort_community', photoId],
    queryFn: () => listPosts('resort_community', undefined, photoId),
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
    enabled: !!photoId,
  })
  const [showForm, setShowForm] = useState(false)
  const [pBody, setPBody] = useState('')
  const { picks, addFiles, removeAt, reset } = usePhotoPicker()
  const [pBusy, setPBusy] = useState(false)

  // Delete a post from the inline category feed — the authoring member or an admin.
  const removeFeedPost = async (p: DbPost) => {
    const ok = await alertConfirm(
      t('post.deleteConfirmTitle'),
      t('post.deleteConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    try {
      await deletePost(p.id)
      queryClient.setQueryData<DbPost[]>(['posts', 'resort_community', photoId], (prev) =>
        (prev ?? []).filter((x) => x.id !== p.id),
      )
      toast(t('post.deleted'))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    }
  }

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
      queryClient.setQueryData<DbPost[]>(['posts', 'resort_community', photoId], (prev) => [optimistic, ...(prev ?? [])])
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

  const submitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try {
      const post = anchor ?? (await getOrCreatePhotoPost(photoId, photo?.title.en ?? photoId))
      queryClient.setQueryData(['photoPost', photoId], post)
      const created = await createComment({
        postId: post.id,
        boardId: 'photos',
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

  if (notFound) {
    return (
      <Layout>
        <Seo title={t('notFound.title')} noindex />
        <NotFoundBody />
      </Layout>
    )
  }
  if (!photo) return <Layout><p className="text-sm text-muted">…</p></Layout>

  const photoPath = `/photo/view?id=${encodeURIComponent(photo.slug)}`
  const photoDescription = metaDescription(L(photo.description), L(photo.title))

  return (
    <Layout>
      <Seo
        title={L(photo.title)}
        description={photoDescription}
        path={photoPath}
        image={photo.src}
        jsonLd={touristAttractionLd({
          name: L(photo.title),
          description: photoDescription,
          image: photo.src,
          url: photoPath,
        })}
      />
      <Breadcrumbs
        items={[
          { label: t('menuPage.breadcrumbHome'), href: '/' },
          { label: L(PHOTOS_CRUMB) },
          { label: L(photo.title) },
        ]}
      />

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

        {/* Inline composer — smooth expand/collapse (JS-measured height animation) */}
        <Collapse open={showForm}>
          <div className="pb-m">
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
        </Collapse>

        {/* Inline feed of posts for this category */}
        {posts.length > 0 && (
          <ul className="flex flex-col gap-m">
            {posts.map((p) => (
              <li key={p.id} className="border border-neutral-90 rounded-l p-m">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <img
                    src={p.author?.avatar_url || avatar(authorName(p))}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="font-medium text-text-normal inline-flex items-center gap-1">
                    {authorName(p)}
                    {isGuest(p) && (
                      <span className="text-[10px] uppercase bg-neutral-95 rounded px-1">{t('post.guestBadge')}</span>
                    )}
                  </span>
                  <span className="text-subtlest">{formatDate(p.created_at)}</span>
                  {(isAdmin === true || (!!user && p.author_id === user.id)) && (
                    <button
                      type="button"
                      onClick={() => removeFeedPost(p)}
                      className="group relative ml-auto shrink-0 text-subtlest hover:text-accent-pink"
                      aria-label={t('post.delete')}
                    >
                      <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" />
                      <Tooltip label={t('post.delete')} />
                    </button>
                  )}
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-m bg-chip-blue px-2 py-0.5 text-[11px] font-semibold text-accent-blue">
                {L(photo.tag)}
              </span>
              <span className="text-[11px] text-subtlest tabular-nums">
                {idx + 1} / {all.length}
              </span>
            </div>
            <AiAssistantButton open={ai.open} onClick={ai.toggle} />
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

      {/* Private AI assistant for this photo — see components/ai */}
      <AiAssistantSection ai={ai} />

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
              <CommentItem
                key={c.id}
                comment={c}
                isAdmin={isAdmin === true}
                onDeleted={(cid) => {
                  if (!anchor) return
                  queryClient.setQueryData<DbComment[]>(['comments', anchor.id], (prev) =>
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
