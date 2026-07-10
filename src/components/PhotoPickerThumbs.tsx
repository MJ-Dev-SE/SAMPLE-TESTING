import { useTranslation } from 'react-i18next'
import type { PhotoPick } from '../lib/usePhotoPicker'

/** Preview thumbnails for picked photos, each with an ✕ badge to remove it. */
export default function PhotoPickerThumbs({
  picks,
  onRemove,
  thumbClass = 'w-20 h-20',
}: {
  picks: PhotoPick[]
  onRemove: (i: number) => void
  thumbClass?: string
}) {
  const { t } = useTranslation()
  if (picks.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {picks.map((p, i) => (
        <div key={p.url} className="relative">
          <img src={p.url} alt="" className={`${thumbClass} object-cover rounded-m border border-neutral-90`} />
          <button
            type="button"
            aria-label={t('post.removePhoto')}
            title={t('post.removePhoto')}
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 grid place-items-center rounded-full bg-black/60 text-white text-[10px] leading-none hover:bg-accent-pink"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
