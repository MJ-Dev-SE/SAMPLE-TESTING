import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { createPost } from '../lib/posts'
import { uploadToMedia, publicUrl } from '../lib/media'
import { alertError, errText, toast } from '../lib/alert'
import { usePhotoPicker } from '../lib/usePhotoPicker'
import PhotoPickerThumbs from '../components/PhotoPickerThumbs'

/**
 * Compose page (/post/write?post_id=…&category=…).
 * Anyone can post to ANY board (board picker). Members may attach photos; guests are text-only.
 */
export default function PostWrite() {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, profile } = useAuth()

  const category = params.get('category')
  const [boardId, setBoardId] = useState(params.get('post_id') || 'freetalk')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const { picks, addFiles, removeAt } = usePhotoPicker()
  const [busy, setBusy] = useState(false)

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0]
  const boardOptions = Object.entries(boardTitles)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alertError(t('post.emptyTitle'))
    setBusy(true)
    try {
      // Members may attach photos; upload them to Storage first.
      let images: string[] = []
      if (user && picks.length > 0) {
        const paths = await Promise.all(picks.map((p) => uploadToMedia(`posts/${user.id}`, p.file)))
        images = paths.map(publicUrl)
      }
      const created = await createPost({
        boardId,
        category,
        title: title.trim(),
        body: body.trim(),
        authorId: user?.id ?? null,
        images,
      })
      toast(t('post.created'))
      navigate(`/post/view?id=${created.id}&post_id=${boardId}`)
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
        <Link to={`/post/list?post_id=${boardId}`} className="text-link">{L(boardTitles[boardId] ?? { en: 'Board', ko: '게시판' })}</Link>
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
        {/* Board / category picker — post under any board, not just Community */}
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
            to={`/post/list?post_id=${boardId}`}
            className="h-10 px-5 grid place-items-center border border-neutral-90 text-text-normal text-sm rounded-m hover:bg-neutral-97"
          >
            {t('post.cancel')}
          </Link>
        </div>
      </form>
    </Layout>
  )
}
