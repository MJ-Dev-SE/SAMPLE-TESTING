import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { supabase } from '../lib/supabase'
import { uploadToMedia, publicUrl } from '../lib/media'
import { deletePost, formatDate, listUserComments, listUserPosts, type DbComment, type DbPost } from '../lib/posts'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'
import Tooltip from '../components/Tooltip'

/**
 * Profile page (/user/profile, also served at /user/settings) — ONE place for
 * everything account-related: avatar upload, password change, and the member's
 * post/comment history with per-post delete.
 */
export default function Profile() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user, profile, loading, updateAvatar } = useAuth()

  // --- settings: avatar upload ---
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [savingPhoto, setSavingPhoto] = useState(false)

  // --- settings: password change ---
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  const [posts, setPosts] = useState<DbPost[]>([])
  const [comments, setComments] = useState<DbComment[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  /** 🗑 on a history row — confirm, delete, drop it from the list. */
  const removePost = async (p: DbPost) => {
    const ok = await alertConfirm(
      t('post.deleteConfirmTitle'),
      t('post.deleteConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    setBusyId(p.id)
    try {
      await deletePost(p.id)
      setPosts((prev) => prev.filter((x) => x.id !== p.id))
      setComments((prev) => prev.filter((c) => c.post_id !== p.id)) // its comments cascade away too
      toast(t('post.deleted'))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => {
    if (!user) return
    let alive = true
    listUserPosts(user.id).then((p) => alive && setPosts(p)).catch(() => {})
    listUserComments(user.id).then((c) => alive && setComments(c)).catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  if (loading) return <Layout><p className="text-sm text-muted">…</p></Layout>
  if (!user) return <Navigate to="/user/login" replace />

  const name = profile?.display_name || profile?.username || user.email?.split('@')[0]
  const boardName = (boardId: string) => L(boardTitles[boardId] ?? { en: boardId, ko: boardId })

  const onPick = (f: File | null) => {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const savePhoto = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setSavingPhoto(true)
    try {
      const path = await uploadToMedia('avatars', file)
      await updateAvatar(publicUrl(path))
      toast(t('settings.photoUpdated'))
      setFile(null)
      setPreview(null)
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setSavingPhoto(false)
    }
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 6) return alertError(t('auth.weakTitle'), t('auth.weakText'))
    if (pw !== pw2) return alertError(t('auth.mismatchTitle'), t('auth.mismatchText'))
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) throw error
      toast(t('settings.passwordUpdated'))
      setPw('')
      setPw2('')
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setSavingPw(false)
    }
  }

  const currentAvatar = preview || profile?.avatar_url
  const field = 'h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue'

  return (
    <Layout>
      <Seo title={t('profile.title')} noindex />
      {/* Header */}
      <div className="flex items-center gap-3 mb-l">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <span className="w-14 h-14 rounded-full bg-chip-blue grid place-items-center text-accent-blue">
            <i className="fa-solid fa-user text-2xl" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-text-normal truncate">{name}</h1>
          <p className="text-xs text-subtlest truncate">{user.email}</p>
        </div>
      </div>

      {/* Settings — avatar + password, same page as the history (one profile hub) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-l mb-l">
        <form onSubmit={savePhoto} className="border border-neutral-90 rounded-l p-l flex flex-col gap-m">
          <h2 className="text-sm font-semibold text-text-normal">
            <i className="fa-solid fa-image-portrait mr-2 text-accent-blue" />
            {t('settings.photoSection')}
          </h2>
          <div className="flex items-center gap-3">
            {currentAvatar ? (
              <img src={currentAvatar} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-chip-blue grid place-items-center text-accent-blue">
                <i className="fa-solid fa-user text-2xl" />
              </span>
            )}
            <input type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0] ?? null)} className="text-sm min-w-0" />
          </div>
          <p className="text-xs text-subtlest">{t('settings.photoHint')}</p>
          <button
            type="submit"
            disabled={!file || savingPhoto}
            className="self-start h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
          >
            {savingPhoto ? t('auth.working') : t('settings.uploadPhoto')}
          </button>
        </form>

        <form onSubmit={savePassword} className="border border-neutral-90 rounded-l p-l flex flex-col gap-m">
          <h2 className="text-sm font-semibold text-text-normal">
            <i className="fa-solid fa-key mr-2 text-accent-blue" />
            {t('settings.passwordSection')}
          </h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('settings.newPassword')}</span>
            <input type="password" autoComplete="new-password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('settings.confirmNewPassword')}</span>
            <input type="password" autoComplete="new-password" className={field} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          <button
            type="submit"
            disabled={savingPw}
            className="self-start h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
          >
            {savingPw ? t('auth.working') : t('settings.updatePassword')}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-l">
        {/* My posts */}
        <section>
          <h2 className="text-sm font-semibold text-text-normal mb-s">
            <i className="fa-solid fa-pen-to-square mr-2 text-accent-blue" />
            {t('profile.myPosts')} ({posts.length})
          </h2>
          <ul className="border border-neutral-90 rounded-l overflow-hidden">
            {posts.length === 0 ? (
              <li className="p-m text-sm text-subtlest text-center">{t('profile.noPosts')}</li>
            ) : (
              posts.map((p) => (
                <li key={p.id} className="border-t border-neutral-90 first:border-t-0 flex items-center">
                  <Link
                    to={`/post/view?id=${p.id}&post_id=${p.board_id}`}
                    className="flex-1 min-w-0 block px-m py-2.5 hover:bg-neutral-97"
                  >
                    <span className="text-sm text-body truncate block">{p.title}</span>
                    <span className="text-xs text-subtlest">
                      {t('profile.postedIn')} {boardName(p.board_id)} · {formatDate(p.created_at)}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={t('post.delete')}
                    disabled={busyId === p.id}
                    onClick={() => removePost(p)}
                    className="group relative shrink-0 h-8 w-8 mx-2 grid place-items-center rounded-m text-subtlest hover:text-white hover:bg-accent-pink disabled:opacity-50"
                  >
                    <i className={`fa-solid ${busyId === p.id ? 'fa-spinner fa-spin' : 'fa-trash-can'}`} aria-hidden="true" />
                    <Tooltip label={t('post.delete')} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* My comments */}
        <section>
          <h2 className="text-sm font-semibold text-text-normal mb-s">
            <i className="fa-solid fa-comments mr-2 text-accent-blue" />
            {t('profile.myComments')} ({comments.length})
          </h2>
          <ul className="border border-neutral-90 rounded-l overflow-hidden">
            {comments.length === 0 ? (
              <li className="p-m text-sm text-subtlest text-center">{t('profile.noComments')}</li>
            ) : (
              comments.map((c) => (
                <li key={c.id} className="border-t border-neutral-90 first:border-t-0">
                  <Link to={`/post/view?id=${c.post_id}&post_id=${c.board_id}`} className="block px-m py-2.5 hover:bg-neutral-97">
                    <span className="text-sm text-body line-clamp-2">{c.body}</span>
                    <span className="text-xs text-subtlest">
                      {t('profile.postedIn')} {boardName(c.board_id)} · {formatDate(c.created_at)}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </Layout>
  )
}
