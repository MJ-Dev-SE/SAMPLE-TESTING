import { useEffect, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocalized } from '../lib/useLocalized'
import { createBusiness } from '../lib/content'
import { uploadToMedia } from '../lib/media'
import { usePhotoPicker } from '../lib/usePhotoPicker'
import { alertError, errText, toast } from '../lib/alert'
import PostingAddressFields, { composeAddress, emptyAddress, isAddressComplete, type PostingAddressValue } from './PostingAddressFields'
import ContactFields, { emptyContact, type ContactValue } from './ContactFields'
import BusinessMediaFields from './BusinessMediaFields'
import type { BusinessRec, CategoryRec } from '../types'

/**
 * Full business-posting form (item 8). Basic info + three image-upload sections
 * — Logo, Main image, and Additional photos (multi, with previews + remove). The
 * category is either locked to the child category the user posted from, or chosen
 * from the shared `categories` list. Caller ensures a logged-in user (RLS).
 */
export default function BusinessForm({
  ownerId,
  categories,
  lockedCategory,
  onCreated,
  onCancel,
}: {
  ownerId: string
  categories: CategoryRec[]
  /** When set, the category field is locked to this child category (item 7). */
  lockedCategory?: CategoryRec | null
  onCreated: (biz: BusinessRec) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const L = useLocalized()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(lockedCategory?.id ?? categories[0]?.id ?? '')
  const [shortIntro, setShortIntro] = useState('')
  const [detailedIntro, setDetailedIntro] = useState('')
  const [region, setRegion] = useState('')
  const [address, setAddress] = useState<PostingAddressValue>(emptyAddress)
  const [contact, setContact] = useState<ContactValue>(emptyContact)

  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [main, setMain] = useState<File | null>(null)
  const [mainPreview, setMainPreview] = useState('')
  const gallery = usePhotoPicker() // additional photos: multi, previews, remove

  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  useEffect(() => {
    if (!logo) return setLogoPreview('')
    const u = URL.createObjectURL(logo)
    setLogoPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [logo])
  useEffect(() => {
    if (!main) return setMainPreview('')
    const u = URL.createObjectURL(main)
    setMainPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [main])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return void alertError(t('business.emptyName'))
    if (!categoryId) return void alertError(t('business.emptyCategory'))
    if (!isAddressComplete(address)) return void alertError(t('address.required'))
    setBusy(true)
    try {
      const folder = 'businesses'
      let logoUrl: string | null = null
      let mainUrl: string | null = null
      const galleryUrls: string[] = []
      if (logo) {
        setProgress(t('business.uploadingLogo'))
        logoUrl = await uploadToMedia(folder, logo)
      }
      if (main) {
        setProgress(t('business.uploadingMain'))
        mainUrl = await uploadToMedia(folder, main)
      }
      for (let i = 0; i < gallery.picks.length; i++) {
        setProgress(`${t('business.uploadingGallery')} (${i + 1}/${gallery.picks.length})`)
        galleryUrls.push(await uploadToMedia(folder, gallery.picks[i].file))
      }
      setProgress(t('business.saving'))
      const cat = categories.find((c) => c.id === categoryId) ?? null
      const biz = await createBusiness({
        name: name.trim(),
        categoryId,
        categorySlug: cat?.slug ?? null,
        region: region.trim() || null,
        address: composeAddress(address) || null,
        addressProvince: address.province.trim() || null,
        addressCity: address.city.trim() || null,
        addressBarangay: address.barangay.trim() || null,
        phone: contact.phone.trim() || null,
        mobilePhone: contact.mobilePhone.trim() || null,
        shortIntro: { en: shortIntro.trim(), ko: shortIntro.trim() },
        detailedIntro: { en: detailedIntro.trim(), ko: detailedIntro.trim() },
        logoUrl,
        mainImageUrl: mainUrl,
        galleryUrls,
        ownerId,
      })
      // The new listing must show up in the directory + widgets right away.
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      toast(t('business.created'))
      onCreated(biz)
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  const field = 'h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue'

  return (
    <form onSubmit={submit} className="flex flex-col gap-m">
      {/* Basic information */}
      <h4 className="text-xs font-bold uppercase tracking-wide text-subtlest">{t('business.sectionBasic')}</h4>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('business.name')}<span className="text-red-500 ml-0.5">*</span></span>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('business.namePlaceholder')} required />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-m">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.category')}<span className="text-red-500 ml-0.5">*</span></span>
          {lockedCategory ? (
            <div className={`${field} flex items-center gap-2 bg-neutral-97 text-muted`}>
              {lockedCategory.icon && <i className={`fa-solid ${lockedCategory.icon} text-accent-blue`} aria-hidden="true" />}
              {L(lockedCategory.name)}
              <i className="fa-solid fa-lock ml-auto text-subtlest text-xs" aria-hidden="true" title={t('business.categoryLocked')} />
            </div>
          ) : (
            <select className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{L(c.name)}</option>
              ))}
            </select>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.region')}</span>
          <input className={field} value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('business.locationPlaceholder')} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('business.excerpt')}</span>
        <input className={field} value={shortIntro} onChange={(e) => setShortIntro(e.target.value)} placeholder={t('business.excerptPlaceholder')} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('business.description')}</span>
        <textarea rows={4} className="p-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue resize-y" value={detailedIntro} onChange={(e) => setDetailedIntro(e.target.value)} placeholder={t('business.descriptionPlaceholder')} />
      </label>

      <PostingAddressFields value={address} onChange={setAddress} />
      <ContactFields value={contact} onChange={setContact} />

      <BusinessMediaFields
        logo={logo}
        logoPreview={logoPreview}
        main={main}
        mainPreview={mainPreview}
        onLogoChange={setLogo}
        onMainChange={setMain}
        gallery={gallery}
      />

      {/* Actions + progress */}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={busy} className="h-10 px-5 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60">
          {busy ? (
            <span><i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden="true" />{progress || t('auth.working')}</span>
          ) : (
            t('business.submit')
          )}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="h-10 px-5 border border-neutral-90 text-text-normal text-sm rounded-m hover:bg-neutral-97 disabled:opacity-60">
          {t('post.cancel')}
        </button>
      </div>
    </form>
  )
}
