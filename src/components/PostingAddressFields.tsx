import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AddressCombobox from './AddressCombobox'
import { loadProvinces, loadCities, loadBarangays, type AddressOption } from '../lib/phAddress'

export interface PostingAddressValue {
  province: string
  city: string
  barangay: string
  line: string
}

export const emptyAddress: PostingAddressValue = { province: '', city: '', barangay: '', line: '' }

/** Single composed address string — what businesses.address / posts.address store and display. */
export function composeAddress(v: PostingAddressValue): string {
  return [v.line, v.barangay, v.city, v.province].map((s) => s.trim()).filter(Boolean).join(', ')
}

export function isAddressComplete(v: PostingAddressValue): boolean {
  // Barangay + street line are optional; province and city are the required minimum.
  return !!(v.province.trim() && v.city.trim())
}

/**
 * Rebuild the picker value when EDITING an existing post/business. The structured
 * parts come straight from their own columns; the free-text `line` is recovered
 * by stripping the known "barangay, city, province" tail off the composed
 * `address` string (composeAddress puts `line` first), so the street/unit the
 * user typed reappears in its field. Missing parts just come back empty.
 */
export function decomposeAddress(src: {
  address?: string | null
  address_province?: string | null
  address_city?: string | null
  address_barangay?: string | null
}): PostingAddressValue {
  const province = (src.address_province ?? '').trim()
  const city = (src.address_city ?? '').trim()
  const barangay = (src.address_barangay ?? '').trim()
  let line = (src.address ?? '').trim()
  const tail = [barangay, city, province].map((s) => s.trim()).filter(Boolean).join(', ')
  if (tail && line.endsWith(tail)) line = line.slice(0, line.length - tail.length).replace(/,\s*$/, '').trim()
  return { province, city, barangay, line }
}

/**
 * Province → City/Municipality → Barangay cascade + a free-text street/unit
 * line. Each level is a type-ahead (AddressCombobox): picking a suggestion
 * loads the next level's options; typing manually is always accepted and
 * never clears what's already been typed in a later field — only that
 * field's SUGGESTION list resets (see phAddress.ts for the underlying
 * lazy, cached province/city/barangay data).
 */
export default function PostingAddressFields({
  value,
  onChange,
}: {
  value: PostingAddressValue
  onChange: (value: PostingAddressValue) => void
}) {
  const { t } = useTranslation()
  const [provinceCode, setProvinceCode] = useState<string | null>(null)
  const [cityCode, setCityCode] = useState<string | null>(null)

  const [provinces, setProvinces] = useState<AddressOption[]>([])
  const [cities, setCities] = useState<AddressOption[]>([])
  const [barangays, setBarangays] = useState<AddressOption[]>([])

  useEffect(() => {
    loadProvinces().then(setProvinces)
  }, [])

  useEffect(() => {
    if (!provinceCode) return setCities([])
    loadCities(provinceCode).then(setCities)
  }, [provinceCode])

  useEffect(() => {
    if (!cityCode) return setBarangays([])
    loadBarangays(cityCode).then(setBarangays)
  }, [cityCode])

  const field = 'flex flex-col gap-1'
  const label = 'text-sm font-medium text-text-normal'
  const required = <span className="text-red-500 ml-0.5">*</span>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-m">
      <label className={field}>
        <span className={label}>{t('address.province')}{required}</span>
        <AddressCombobox
          value={value.province}
          options={provinces}
          placeholder={t('address.provincePlaceholder')}
          onChange={(name, code) => {
            onChange({ ...value, province: name })
            setProvinceCode(code)
            setCityCode(null)
          }}
        />
      </label>
      <label className={field}>
        <span className={label}>{t('address.city')}{required}</span>
        <AddressCombobox
          value={value.city}
          options={cities}
          placeholder={t('address.cityPlaceholder')}
          onChange={(name, code) => {
            onChange({ ...value, city: name })
            setCityCode(code)
          }}
        />
      </label>
      <label className={field}>
        <span className={label}>{t('address.barangay')}</span>
        <AddressCombobox
          value={value.barangay}
          options={barangays}
          placeholder={t('address.barangayPlaceholder')}
          onChange={(name) => onChange({ ...value, barangay: name })}
        />
      </label>
      <label className={`${field} sm:col-span-3`}>
        <span className={label}>{t('address.line')}</span>
        <input
          value={value.line}
          onChange={(e) => onChange({ ...value, line: e.target.value })}
          placeholder={t('address.linePlaceholder')}
          className="h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue"
        />
      </label>
    </div>
  )
}
