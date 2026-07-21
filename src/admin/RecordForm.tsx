import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { alertError, errText } from '../lib/alert'
import { listCategories } from '../lib/content'
import { publicUrl, uploadToMedia } from '../lib/media'
import { useLocalized } from '../lib/useLocalized'
import { isValidSlug, slugify } from '../lib/seo/slug'
import { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX, TITLE_MIN } from '../lib/seo/text'
import { SITE_URL } from '../config/site'
import type { CategoryRec } from '../types'
import type { AdminRow, FieldDef, TableDef } from './registry'

// Flux console styling — matches AdminPage's standalone beige/gold theme, not the website's.
const inputCls =
  'h-9 px-3 bg-white border border-[#e7ddca] rounded-xl text-sm text-[#3f382f] outline-none focus:border-[#a98c5a] focus:ring-2 focus:ring-[#a98c5a]/15 w-full'
const areaCls =
  'p-3 bg-white border border-[#e7ddca] rounded-xl text-sm text-[#3f382f] outline-none focus:border-[#a98c5a] focus:ring-2 focus:ring-[#a98c5a]/15 resize-y w-full'
const thumbCls = 'w-28 h-28 object-cover rounded-xl border border-[#e7ddca] bg-[#f5efe4]'

/** Live char counter under seo-title / seo-description inputs — warns (amber)
 *  outside the recommended window, never blocks saving. */
function CharCounter({ value, min, max }: { value: string; min: number; max: number }) {
  const { t } = useTranslation()
  const len = value.length
  const outside = len > 0 && (len < min || len > max)
  return (
    <span className={`text-xs tabular-nums ${outside ? 'text-amber-600' : 'text-[#8a8072]'}`}>
      {len} · {t('admin.recommendedLength', { min, max })}
    </span>
  )
}

/** Build the form's initial values from an existing row (or field defaults). */
function initialValues(def: TableDef, row: AdminRow | null): AdminRow {
  const v: AdminRow = {}
  for (const f of def.fields) {
    const cur = row?.[f.key]
    if (f.type === 'localized' || f.type === 'localized-textarea') {
      v[f.key] = { en: cur?.en ?? '', ko: cur?.ko ?? '' }
    } else if (f.type === 'json') {
      v[f.key] = cur != null ? JSON.stringify(cur, null, 2) : ''
    } else if (f.type === 'boolean') {
      // Most flags (active, indexable…) should start on; opt-in flags declare
      // `defaultOff` so a new row doesn't silently enable them.
      v[f.key] = cur ?? !f.defaultOff
    } else if (f.type === 'number') {
      v[f.key] = cur ?? 0
    } else if (f.type === 'select') {
      v[f.key] = cur ?? f.options?.[0] ?? ''
    } else {
      v[f.key] = cur ?? ''
    }
  }
  return v
}

/** Create/edit form for one row, driven entirely by the table's field defs. */
export default function RecordForm({
  def,
  row,
  busy,
  onSave,
  onCancel,
}: {
  def: TableDef
  row: AdminRow | null // null = creating
  busy: boolean
  onSave: (values: AdminRow) => void | Promise<void>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const L = useLocalized()
  const [values, setValues] = useState<AdminRow>(() => initialValues(def, row))
  /** Newly picked files for image fields, keyed by field key (uploaded on save). */
  const [picks, setPicks] = useState<Record<string, File>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<CategoryRec[]>([])
  const working = busy || uploading

  // Load categories once if any field is a category selector (businesses).
  useEffect(() => {
    if (def.fields.some((f) => f.type === 'category')) {
      listCategories().then(setCategories).catch(() => setCategories([]))
    }
  }, [def])

  const set = (key: string, val: unknown) => setValues((prev) => ({ ...prev, [key]: val }))

  // Revoke preview object-URLs when the form unmounts.
  const previewsRef = useRef(previews)
  previewsRef.current = previews
  useEffect(() => () => Object.values(previewsRef.current).forEach((u) => URL.revokeObjectURL(u)), [])

  const pickImage = (key: string, file: File | null) => {
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key])
      const next = { ...prev }
      if (file) next[key] = URL.createObjectURL(file)
      else delete next[key]
      return next
    })
    setPicks((prev) => {
      const next = { ...prev }
      if (file) next[key] = file
      else delete next[key]
      return next
    })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const out: AdminRow = {}
    for (const f of def.fields) {
      let val = values[f.key]
      if (f.type === 'json') {
        const text = String(val ?? '').trim()
        if (!text) {
          val = null
        } else {
          try {
            val = JSON.parse(text)
          } catch {
            return void alertError(t('admin.badJsonTitle'), `${L(f.label)}: ${t('admin.badJsonText')}`)
          }
        }
      }
      if (f.type === 'number') val = Number(val) || 0
      // An untouched optional date input keeps its initial '' value (from
      // initialValues) — Postgres rejects "" for a date column, so blank → null.
      if (f.type === 'date' && !val) val = null
      // SEO fields: blank means "derive from content" → store null, not ''.
      // A blank slug on INSERT lets the DB trigger generate one; on UPDATE the
      // trigger keeps the old slug (slugs are never removed, only changed).
      if ((f.type === 'slug' || f.type === 'seo-title' || f.type === 'seo-description') && !String(val ?? '').trim()) {
        val = null
      }
      if (f.type === 'slug' && val) val = slugify(String(val)) || null
      out[f.key] = val
    }
    // Upload newly picked images, then store their media-bucket paths.
    if (Object.keys(picks).length > 0) {
      setUploading(true)
      try {
        for (const f of def.fields) {
          const file = picks[f.key]
          if (f.type === 'image' && file) {
            out[f.key] = await uploadToMedia(f.folder ?? def.table, file)
          }
        }
      } catch (err) {
        setUploading(false)
        return void alertError(t('auth.errorTitle'), errText(err))
      }
      setUploading(false)
    }
    await onSave(out)
  }

  /** Image DATA SLOT: current image (what the position shows today) + new-file preview. */
  const renderImage = (f: FieldDef) => {
    const current = String(values[f.key] ?? '')
    const preview = previews[f.key]
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start gap-4">
          {/* CURRENT image assigned to this position (edit mode, before replacing) */}
          <figure className="flex flex-col gap-1">
            {current ? (
              <img src={publicUrl(current)} alt="" className={thumbCls} />
            ) : (
              <span className={`${thumbCls} grid place-items-center text-[#a89e8c]`}>
                <i className="fa-regular fa-image text-xl" aria-hidden="true" />
              </span>
            )}
            <figcaption className="text-[11px] font-medium text-[#8a8072]">
              {current ? t('admin.currentImage') : t('admin.noImage')}
            </figcaption>
          </figure>
          {/* NEW image preview (before saving) */}
          {preview && (
            <figure className="flex flex-col gap-1">
              <img src={preview} alt="" className={`${thumbCls} ring-2 ring-[#a98c5a]`} />
              <figcaption className="text-[11px] font-medium text-[#a98c5a]">
                {t('admin.newImagePreview')}
              </figcaption>
            </figure>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 h-8 px-4 rounded-[18px] border border-[#e7ddca] bg-white text-xs font-medium text-[#8a8072] hover:text-[#a98c5a] hover:bg-[#efe7d5] transition-colors cursor-pointer">
            <i className="fa-solid fa-upload" aria-hidden="true" />
            {t('admin.uploadImage')}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(f.key, e.target.files?.[0] ?? null)}
            />
          </label>
          {preview && (
            <button
              type="button"
              onClick={() => pickImage(f.key, null)}
              className="text-xs text-[#8a8072] hover:text-red-500 transition-colors"
            >
              <i className="fa-solid fa-xmark mr-1" aria-hidden="true" />
              {t('admin.discardNewImage')}
            </button>
          )}
        </div>
        {/* Advanced: the stored path/URL stays editable by hand */}
        <input
          type="text"
          value={current}
          onChange={(e) => set(f.key, e.target.value)}
          placeholder={t('admin.imagePathPlaceholder')}
          className={`${inputCls} font-mono text-xs`}
        />
        <span className="text-xs text-[#8a8072]">{t('admin.imageHint')}</span>
      </div>
    )
  }

  /** Best-effort plain string for a form value (localized objects → EN side). */
  const textOf = (v: unknown): string =>
    typeof v === 'string' ? v : v && typeof v === 'object' ? String((v as { en?: string }).en ?? '') : ''

  const renderField = (f: FieldDef) => {
    const val = values[f.key]
    switch (f.type) {
      case 'image':
        return renderImage(f)
      case 'slug': {
        const text = String(val ?? '')
        const invalid = !!text && !isValidSlug(text)
        const source = f.slugSource ? textOf(values[f.slugSource]) : ''
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder="my-page-url"
                className={`${inputCls} font-mono text-xs`}
              />
              {source && (
                <button
                  type="button"
                  onClick={() => set(f.key, slugify(source))}
                  className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-[18px] border border-[#e7ddca] bg-white text-xs font-medium text-[#8a8072] hover:text-[#a98c5a] hover:bg-[#efe7d5] transition-colors"
                >
                  <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
                  {t('admin.generateSlug')}
                </button>
              )}
            </div>
            {invalid && <span className="text-xs text-amber-600">{t('admin.slugInvalid')}</span>}
            {row && <span className="text-xs text-[#8a8072]">{t('admin.slugStableHint')}</span>}
          </div>
        )
      }
      case 'seo-title': {
        const text = String(val ?? '')
        return (
          <div className="flex flex-col gap-1">
            <input type="text" value={text} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
            <CharCounter value={text} min={TITLE_MIN} max={TITLE_MAX} />
          </div>
        )
      }
      case 'seo-description': {
        const text = String(val ?? '')
        return (
          <div className="flex flex-col gap-1">
            <textarea rows={3} value={text} onChange={(e) => set(f.key, e.target.value)} className={areaCls} />
            <CharCounter value={text} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />
          </div>
        )
      }
      case 'localized':
      case 'localized-textarea':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(['en', 'ko'] as const).map((lng) =>
              f.type === 'localized' ? (
                <input
                  key={lng}
                  type="text"
                  value={val?.[lng] ?? ''}
                  onChange={(e) => set(f.key, { ...val, [lng]: e.target.value })}
                  placeholder={lng.toUpperCase()}
                  className={inputCls}
                />
              ) : (
                <textarea
                  key={lng}
                  rows={3}
                  value={val?.[lng] ?? ''}
                  onChange={(e) => set(f.key, { ...val, [lng]: e.target.value })}
                  placeholder={lng.toUpperCase()}
                  className={areaCls}
                />
              ),
            )}
          </div>
        )
      case 'textarea':
        return <textarea rows={4} value={val ?? ''} onChange={(e) => set(f.key, e.target.value)} className={areaCls} />
      case 'json':
        return (
          <textarea
            rows={4}
            value={val ?? ''}
            onChange={(e) => set(f.key, e.target.value)}
            spellCheck={false}
            className={`${areaCls} font-mono text-xs`}
          />
        )
      case 'number':
        return <input type="number" value={val ?? 0} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
      case 'date':
        return <input type="date" value={val ?? ''} onChange={(e) => set(f.key, e.target.value || null)} className={inputCls} />
      case 'category':
        return (
          <select value={val ?? ''} onChange={(e) => set(f.key, e.target.value || null)} className={inputCls}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{L(c.name)}</option>
            ))}
          </select>
        )
      case 'boolean':
        return (
          <label className="inline-flex items-center gap-2 text-sm text-[#57503f]">
            <input type="checkbox" checked={!!val} onChange={(e) => set(f.key, e.target.checked)} className="accent-[#a98c5a] w-4 h-4" />
            {t('admin.enabled')}
          </label>
        )
      case 'select':
        return (
          <select value={val ?? ''} onChange={(e) => set(f.key, e.target.value)} className={inputCls}>
            {(f.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o === '' ? '—' : o}
              </option>
            ))}
          </select>
        )
      default:
        return (
          <input
            type="text"
            required={f.required}
            value={val ?? ''}
            onChange={(e) => set(f.key, e.target.value)}
            className={inputCls}
          />
        )
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-[18px] border border-[#e7ddca] shadow-[0_1px_3px_0_rgba(107,90,60,0.07),0_8px_24px_0_rgba(107,90,60,0.09)] p-5 flex flex-col gap-4"
    >
      <h3 className="text-base font-semibold text-[#3f382f]">
        <i className={`fa-solid ${row ? 'fa-pen' : 'fa-plus'} mr-2 text-[#a98c5a]`} />
        {row ? t('admin.editRecord') : t('admin.newRecord')}
      </h3>

      {/* LIVE placement: where this record will show on the site, following the form values. */}
      {def.placement && (
        <p className="flex items-center gap-2 text-xs text-[#6b5a3c] bg-[#f5efe4] border border-[#e7ddca] rounded-xl px-3 py-2">
          <i className="fa-solid fa-location-crosshairs text-[#a98c5a]" aria-hidden="true" />
          <span>
            <span className="font-semibold">{t('admin.willAppear')}:</span> {def.placement(values)}
          </span>
        </p>
      )}

      {def.fields.map((f) => (
        <div key={f.key} className="contents">
          {/* SEO section divider + live search preview, once before the first SEO field */}
          {f.seo && f.key === def.fields.find((x) => x.seo)?.key && (
            <div className="mt-2 border-t border-[#e7ddca] pt-4 flex flex-col gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#3f382f]">
                  <i className="fa-solid fa-magnifying-glass-chart mr-2 text-[#a98c5a]" aria-hidden="true" />
                  {t('admin.seoSection')}
                </h4>
                <p className="text-xs text-[#8a8072] mt-0.5">{t('admin.seoSectionHint')}</p>
              </div>
              {(() => {
                // Google-style snippet preview from the live form values.
                const slugField = def.fields.find((x) => x.type === 'slug')
                const slugVal = slugField ? String(values[slugField.key] ?? '') : ''
                const fallbackTitle = textOf(values.name) || textOf(values.title)
                const previewTitle = String(values.meta_title ?? '') || fallbackTitle || L(def.title)
                const previewDesc = String(values.meta_description ?? '')
                return (
                  <figure className="rounded-xl border border-[#e7ddca] bg-white px-4 py-3">
                    <figcaption className="text-[11px] uppercase tracking-wide text-[#8a8072] mb-1.5">
                      {t('admin.seoPreview')}
                    </figcaption>
                    <p className="text-xs text-[#0a6a30] truncate">
                      {SITE_URL}{slugVal ? `/…/${slugVal}` : ''}
                    </p>
                    <p className="text-[15px] leading-5 text-[#1a0dab] truncate">{previewTitle}</p>
                    <p className="text-xs text-[#57503f] line-clamp-2">
                      {previewDesc || <span className="italic text-[#8a8072]">{t('admin.seoSectionHint')}</span>}
                    </p>
                  </figure>
                )
              })()}
            </div>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#57503f]">
              {L(f.label)}
              {f.required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            {renderField(f)}
            {f.hint && <span className="text-xs text-[#8a8072]">{L(f.hint)}</span>}
          </label>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={working}
          className="inline-flex items-center h-8 px-4 rounded-[18px] bg-gradient-to-r from-[#a98c5a] to-[#6b5a3c] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {working ? t('auth.working') : t('admin.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center h-8 px-4 rounded-[18px] border border-[#e7ddca] bg-white text-xs font-medium text-[#8a8072] hover:text-[#a98c5a] hover:bg-[#efe7d5] transition-colors"
        >
          {t('post.cancel')}
        </button>
      </div>
    </form>
  )
}
