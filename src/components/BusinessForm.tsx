import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { bizCategories } from '../data/home'
import { useLocalized } from '../lib/useLocalized'
import { createBusiness } from '../lib/content'
import { uploadToMedia } from '../lib/media'
import { alertError, errText, toast } from '../lib/alert'
import type { BusinessRec } from '../types'

/** Category options (slug + label) parsed from the canonical category list. */
const CATEGORY_OPTIONS = bizCategories
  .map((c) => ({ slug: new URLSearchParams(c.href.split('?')[1] ?? '').get('category'), label: c.label }))
  .filter((c): c is { slug: string; label: (typeof bizCategories)[number]['label'] } => !!c.slug)

/**
 * New-business-listing form, shared by the /company/register page and the
 * "+" modal on the Recently updated businesses widget. Shows a live preview
 * of the chosen logo/photo before it is uploaded. Caller must ensure a
 * logged-in user (RLS: owner_id = auth.uid()).
 */
export default function BusinessForm({
  ownerId,
  onCreated,
  onCancel,
}: {
  ownerId: string
  /** Called with the new row after a successful insert (navigate / refresh + close). */
  onCreated: (biz: BusinessRec) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const L = useLocalized()

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]?.slug ?? '')
  const [location, setLocation] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)

  // Live thumbnail preview of the picked image (revoked on change/unmount).
  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return void alertError(t('business.emptyName'))
    setBusy(true)
    try {
      let thumbUrl: string | null = null
      if (file) thumbUrl = await uploadToMedia('businesses', file)
      const biz = await createBusiness({
        name: name.trim(),
        category,
        location: location.trim() || null,
        // User enters one language; store it in both slots so L() shows it either way.
        excerpt: { en: excerpt.trim(), ko: excerpt.trim() },
        description: { en: description.trim(), ko: description.trim() },
        thumbUrl,
        ownerId,
      })
      toast(t('business.created'))
      onCreated(biz)
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  const field = 'h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue'

  return (
    <form onSubmit={submit} className="flex flex-col gap-m">
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
        {preview && (
          <span className="mt-1 inline-flex items-start gap-2">
            <img src={preview} alt="" className="w-20 h-20 object-cover rounded-m border border-neutral-90" />
            <span className="text-xs text-subtlest">{t('business.previewHint')}</span>
          </span>
        )}
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60">
          {busy ? t('auth.working') : t('business.submit')}
        </button>
        <button type="button" onClick={onCancel} className="h-10 px-5 border border-neutral-90 text-text-normal text-sm rounded-m hover:bg-neutral-97">
          {t('post.cancel')}
        </button>
      </div>
    </form>
  )
}
