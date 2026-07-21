// =============================================================================
// PH ADDRESS DATA BUILDER — one-time/occasional script (NOT wired into `npm
// run build`; static geographic data doesn't change often). Downloads the
// official PSGC-derived province/city/barangay dataset once and splits it
// into small static files under public/data/ph-address/, so the running app
// never depends on a third-party host at runtime (see src/lib/phAddress.ts).
//
// Source: https://isaacdarcilla.github.io/philippine-addresses/ (maintained
// static JSON mirror of the PSGC). Re-run this script by hand if the PSGC
// publishes a new revision (new cities/barangays) — output is checked into
// the repo like any other public/ asset.
//
// Usage: node scripts/build-ph-address.mjs
// =============================================================================
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/data/ph-address')
const SOURCE = 'https://isaacdarcilla.github.io/philippine-addresses'

async function fetchJson(name) {
  const res = await fetch(`${SOURCE}/${name}.json`)
  if (!res.ok) throw new Error(`Failed to fetch ${name}.json: ${res.status}`)
  return res.json()
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

async function main() {
  console.log('Fetching province/city/barangay data…')
  const [provinces, cities, barangays] = await Promise.all([
    fetchJson('province'),
    fetchJson('city'),
    fetchJson('barangay'),
  ])

  ensureDir(outDir)
  ensureDir(resolve(outDir, 'cities'))
  ensureDir(resolve(outDir, 'barangays'))

  // provinces.json — one small file, loaded whenever the picker mounts.
  const provinceRows = provinces
    .map((p) => ({ code: p.province_code, name: p.province_name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  writeFileSync(resolve(outDir, 'provinces.json'), JSON.stringify(provinceRows))
  console.log(`Wrote provinces.json (${provinceRows.length} provinces)`)

  // cities/<province_code>.json — grouped, fetched only once a province resolves.
  const citiesByProvince = new Map()
  for (const c of cities) {
    const key = c.province_code
    if (!citiesByProvince.has(key)) citiesByProvince.set(key, [])
    citiesByProvince.get(key).push({ code: c.city_code, name: c.city_name })
  }
  for (const [provinceCode, rows] of citiesByProvince) {
    rows.sort((a, b) => a.name.localeCompare(b.name))
    writeFileSync(resolve(outDir, 'cities', `${provinceCode}.json`), JSON.stringify(rows))
  }
  console.log(`Wrote ${citiesByProvince.size} cities/<province_code>.json files (${cities.length} cities/municipalities total)`)

  // barangays/<city_code>.json — grouped, fetched only once a city resolves.
  const barangaysByCity = new Map()
  for (const b of barangays) {
    const key = b.city_code
    if (!barangaysByCity.has(key)) barangaysByCity.set(key, [])
    barangaysByCity.get(key).push({ code: b.brgy_code, name: b.brgy_name })
  }
  for (const [cityCode, rows] of barangaysByCity) {
    rows.sort((a, b) => a.name.localeCompare(b.name))
    writeFileSync(resolve(outDir, 'barangays', `${cityCode}.json`), JSON.stringify(rows))
  }
  console.log(`Wrote ${barangaysByCity.size} barangays/<city_code>.json files (${barangays.length} barangays total)`)

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
