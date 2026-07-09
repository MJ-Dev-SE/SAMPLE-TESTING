import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { createPost } from '../lib/posts'
import { alertError, errText, toast } from '../lib/alert'

/**
 * Compose page (/post/write?post_id=…&category=…).
 * Anyone can post: logged-in members post under their username; guests get a random name.
 */
export default function PostWrite() {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, profile } = useAuth()

  const boardId = params.get('post_id') || 'freetalk'
  const category = params.get('category')
  const boardTitle = boardTitles[boardId] ?? { en: 'Board', ko: '게시판' }

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alertError(t('post.emptyTitle'))
    setBusy(true)
    try {
      const created = await createPost({
        boardId,
        category,
        title: title.trim(),
        body: body.trim(),
        authorId: user?.id ?? null,
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
        <Link to={`/post/list?post_id=${boardId}`} className="text-link">{L(boardTitle)}</Link>
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
