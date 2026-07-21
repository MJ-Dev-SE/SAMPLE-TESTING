import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Tooltip from './Tooltip'
import type { PhotoPick } from '../lib/usePhotoPicker'

/**
 * Logo / Main image / Gallery upload sections of BusinessForm, split out and
 * memoized: these hold blob-URL image previews and a gallery grid, which is
 * the most expensive part of the form to re-render — without this, typing in
 * any OTHER field (name, address, phone…) re-rendered this whole section too
 * on every keystroke, since it used to live inline in the same component.
 */
function BusinessMediaFields({
  logo,
  logoPreview,
  main,
  mainPreview,
  onLogoChange,
  onMainChange,
  gallery,
}: {
  logo: File | null
  logoPreview: string
  main: File | null
  mainPreview: string
  onLogoChange: (file: File | null) => void
  onMainChange: (file: File | null) => void
  gallery: { picks: PhotoPick[]; addFiles: (e: React.ChangeEvent<HTMLInputElement>) => void; removeAt: (i: number) => void }
}) {
  const { t } = useTranslation()
  const uploadBox = 'flex items-center gap-3 border border-dashed border-neutral-90 rounded-m p-2.5'

  return (
    <>
      <h4 className="text-xs font-bold uppercase tracking-wide text-subtlest mt-1">{t('business.sectionImages')}</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-m">
        {/* Logo */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.logo')}</span>
          <div className={uploadBox}>
            {logoPreview ? (
              <img src={logoPreview} alt="" className="h-14 w-14 rounded-m object-cover border border-neutral-90" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-m bg-neutral-95 text-subtlest"><i className="fa-solid fa-image" /></span>
            )}
            <label className="text-xs text-link font-medium cursor-pointer hover:underline">
              {logo ? t('business.changeImage') : t('business.chooseImage')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        {/* Main image */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">{t('business.mainImage')}</span>
          <div className={uploadBox}>
            {mainPreview ? (
              <img src={mainPreview} alt="" className="h-14 w-20 rounded-m object-cover border border-neutral-90" />
            ) : (
              <span className="grid h-14 w-20 place-items-center rounded-m bg-neutral-95 text-subtlest"><i className="fa-solid fa-image" /></span>
            )}
            <label className="text-xs text-link font-medium cursor-pointer hover:underline">
              {main ? t('business.changeImage') : t('business.chooseImage')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onMainChange(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
      </div>

      {/* Additional photos (gallery) */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-normal">{t('business.gallery')}</span>
        <span className="text-xs text-subtlest">{t('business.galleryHint')}</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {gallery.picks.map((p, i) => (
            <span key={p.url} className="relative group">
              <img src={p.url} alt="" className="h-16 w-16 rounded-m object-cover border border-neutral-90" />
              {i === 0 && (
                <span className="absolute left-0 top-0 rounded-br-m rounded-tl-m bg-accent-blue px-1 text-[9px] font-bold text-white">
                  {t('business.galleryMain')}
                </span>
              )}
              <button
                type="button"
                onClick={() => gallery.removeAt(i)}
                aria-label={t('post.removePhoto')}
                className="group absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] opacity-90 hover:opacity-100"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
                <Tooltip label={t('post.removePhoto')} />
              </button>
            </span>
          ))}
          <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-m border border-dashed border-neutral-90 text-subtlest hover:border-accent-blue hover:text-accent-blue">
            <i className="fa-solid fa-plus" aria-hidden="true" />
            <input type="file" accept="image/*" multiple className="hidden" onChange={gallery.addFiles} />
          </label>
        </div>
      </div>
    </>
  )
}

export default memo(BusinessMediaFields)
