import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { bizCategories } from '../data/home'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { createBusiness } from '../lib/content'
import { uploadToMedia } from '../lib/media'
import { alertError, errText, toast } from '../lib/alert'

/** Category options (slug + label) parsed from the canonical category list. */
const CATEGORY_OPTIONS = bizCategories
  .map((c) => ({ slug: new URLSearchParams(c.href.split('?')[1] ?? '').get('category'), label: c.label }))
  .filter((c): c is { slug: string; label: (typeof bizCategories)[number]['label'] } => !!c.slug)

/** Register a business listing (/company/register) — members only. */
export default function BusinessRegister() {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]?.slug ?? '')
  const [location, setLocation] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <Layout><p className="text-sm text-muted">…</p></Layout>

  if (!user) {
    return (
      <Layout>
        <div className="max-w-[460px] mx-auto border border-neutral-90 rounded-l p-l text-center">
          <p className="text-sm text-muted mb-3">{t('business.memberOnly')}</p>
          <Link to="/user/login" className="text-sm text-link font-medium hover:underline">
            {t('nav.login')}
          </Link>
        </div>
      </Layout>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alertError(t('business.emptyName'))
    setBusy(true)
    try {
      let thumbUrl: string | null = null
      if (file) thumbUrl = await uploadToMedia('businesses', file)
      await createBusiness({
        name: name.trim(),
        category,
        location: location.trim() || null,
        // User enters one language; store it in both slots so L() shows it either way.
        excerpt: { en: excerpt.trim(), ko: excerpt.trim() },
        description: { en: description.trim(), ko: description.trim() },
        thumbUrl,
        ownerId: user.id,
      })
      toast(t('business.created'))
      navigate(`/company?category=${category}`)
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  const field = 'h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue'

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to="/company" className="text-link">{t('home.businessDirectory')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('business.registerTitle')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-l">{t('business.registerTitle')}</h1>

      <form onSubmit={submit} className="border border-neutral-90 rounded-l p-l flex flex-col gap-m max-w-[560px]">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.name')}</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('business.namePlaceholder')} required />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-m">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('business.category')}</span>
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.slug} value={c.slug}>{L(c.label)}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('business.location')}</span>
            <input className={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('business.locationPlaceholder')} />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.excerpt')}</span>
          <input className={field} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder={t('business.excerptPlaceholder')} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.description')}</span>
          <textarea rows={5} className="p-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('business.descriptionPlaceholder')} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.thumbnail')}</span>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </label>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60">
            {busy ? t('auth.working') : t('business.submit')}
          </button>
          <Link to="/company" className="h-10 px-5 grid place-items-center border border-neutral-90 text-text-normal text-sm rounded-m hover:bg-neutral-97">
            {t('post.cancel')}
          </Link>
        </div>
      </form>
    </Layout>
  )
}
