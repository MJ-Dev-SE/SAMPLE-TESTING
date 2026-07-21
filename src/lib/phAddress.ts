/**
 * Philippines address data — province/city/barangay, served from our own
 * public/data/ph-address/** static files (generated once by
 * scripts/build-ph-address.mjs, never fetched from a third-party host at
 * runtime). Each loader is memoized so switching fields or reopening a
 * posting form never refetches the same file twice in a session.
 */
export interface AddressOption {
  code: string
  name: string
}

const provincesCache = new Map<string, Promise<AddressOption[]>>()
const citiesCache = new Map<string, Promise<AddressOption[]>>()
const barangaysCache = new Map<string, Promise<AddressOption[]>>()

async function fetchJson(path: string): Promise<AddressOption[]> {
  const res = await fetch(path)
  if (!res.ok) return []
  return res.json() as Promise<AddressOption[]>
}

export function loadProvinces(): Promise<AddressOption[]> {
  const key = 'provinces'
  if (!provincesCache.has(key)) {
    provincesCache.set(key, fetchJson('/data/ph-address/provinces.json'))
  }
  return provincesCache.get(key)!
}

export function loadCities(provinceCode: string): Promise<AddressOption[]> {
  if (!citiesCache.has(provinceCode)) {
    citiesCache.set(provinceCode, fetchJson(`/data/ph-address/cities/${provinceCode}.json`))
  }
  return citiesCache.get(provinceCode)!
}

export function loadBarangays(cityCode: string): Promise<AddressOption[]> {
  if (!barangaysCache.has(cityCode)) {
    barangaysCache.set(cityCode, fetchJson(`/data/ph-address/barangays/${cityCode}.json`))
  }
  return barangaysCache.get(cityCode)!
}
