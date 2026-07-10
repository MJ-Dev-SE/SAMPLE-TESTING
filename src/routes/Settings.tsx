import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { uploadToMedia, publicUrl } from '../lib/media'
import { alertError, errText, toast } from '../lib/alert'

/** Profile settings (/user/settings) — change avatar photo and password. */
export default function Settings() {
  const { t } = useTranslation()
  const { user, profile, loading, updateAvatar } = useAuth()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [savingPhoto, setSavingPhoto] = useState(false)

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  if (loading) return <Layout><p className="text-sm text-muted">…</p></Layout>
  if (!user) return <Navigate to="/user/login" replace />

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
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/user/profile" className="text-link">{t('profile.title')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('settings.title')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-l">
        <i className="fa-solid fa-gear mr-2 text-accent-blue" />
        {t('settings.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-l max-w-[720px]">
        {/* Avatar */}
        <form onSubmit={savePhoto} className="border border-neutral-90 rounded-l p-l flex flex-col gap-m">
          <h2 className="text-sm font-semibold text-text-normal">{t('settings.photoSection')}</h2>
          <div className="flex items-center gap-3">
            {currentAvatar ? (
              <img src={currentAvatar} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-chip-blue grid place-items-center text-accent-blue">
                <i className="fa-solid fa-user text-2xl" />
              </span>
            )}
            <input type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
          <p className="text-xs text-subtlest">{t('settings.photoHint')}</p>
          <button type="submit" disabled={!file || savingPhoto} className="self-start h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60">
            {savingPhoto ? t('auth.working') : t('settings.uploadPhoto')}
          </button>
        </form>

        {/* Password */}
        <form onSubmit={savePassword} className="border border-neutral-90 rounded-l p-l flex flex-col gap-m">
          <h2 className="text-sm font-semibold text-text-normal">{t('settings.passwordSection')}</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('settings.newPassword')}</span>
            <input type="password" autoComplete="new-password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('settings.confirmNewPassword')}</span>
            <input type="password" autoComplete="new-password" className={field} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          <button type="submit" disabled={savingPw} className="self-start h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60">
            {savingPw ? t('auth.working') : t('settings.updatePassword')}
          </button>
        </form>
      </div>
    </Layout>
  )
}
