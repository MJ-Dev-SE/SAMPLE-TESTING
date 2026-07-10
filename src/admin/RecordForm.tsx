import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { alertError } from '../lib/alert'
import type { AdminRow, FieldDef, TableDef } from './registry'

const inputCls =
  'h-9 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue w-full'
const areaCls =
  'p-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue resize-y w-full'

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
      v[f.key] = cur ?? true
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
  onSave: (values: AdminRow) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [values, setValues] = useState<AdminRow>(() => initialValues(def, row))
  const set = (key: string, val: unknown) => setValues((prev) => ({ ...prev, [key]: val }))

  const submit = (e: FormEvent) => {
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
            return void alertError(t('admin.badJsonTitle'), `${f.label}: ${t('admin.badJsonText')}`)
          }
        }
      }
      if (f.type === 'number') val = Number(val) || 0
      out[f.key] = val
    }
    onSave(out)
  }

  const renderField = (f: FieldDef) => {
    const val = values[f.key]
    switch (f.type) {
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
      case 'boolean':
        return (
          <label className="inline-flex items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={!!val} onChange={(e) => set(f.key, e.target.checked)} />
            {t('admin.enabled')}
          </label>
        )
      case 'select':
        return (
          <select value={val ?? ''} onChange={(e) => set(f.key, e.target.value)} className={inputCls}>
            {(f.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
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
    <form onSubmit={submit} className="border border-accent-blue/40 bg-chip-blue/20 rounded-l p-m flex flex-col gap-m mb-m">
      <h3 className="text-sm font-semibold text-text-normal">
        <i className={`fa-solid ${row ? 'fa-pen' : 'fa-plus'} mr-2 text-accent-blue`} />
        {row ? t('admin.editRecord') : t('admin.newRecord')}
      </h3>
      {def.fields.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-normal">
            {f.label}
            {f.required && <span className="text-accent-pink ml-0.5">*</span>}
          </span>
          {renderField(f)}
          {f.hint && <span className="text-xs text-subtlest">{f.hint}</span>}
        </label>
      ))}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
        >
          {busy ? t('auth.working') : t('admin.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 border border-neutral-90 text-text-normal text-sm rounded-m hover:bg-neutral-97"
        >
          {t('post.cancel')}
        </button>
      </div>
    </form>
  )
}
