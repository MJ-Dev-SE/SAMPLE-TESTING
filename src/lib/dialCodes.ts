/**
 * Country dial codes for the mobile-number input (components/PhoneInput.tsx).
 *
 * Flags are derived from the ISO-3166 alpha-2 code rather than shipped as
 * images: each letter maps to its Regional Indicator Symbol, which every
 * modern OS renders as that country's flag. No asset, no icon font, no
 * dependency.
 *
 * The list leads with the Philippines (the site's home country) and Korea (its
 * audience), then the rest of the countries a Korean–Philippines community
 * actually dials, alphabetically. Add a row to support another country.
 */
export interface DialCountry {
  /** ISO-3166 alpha-2, uppercase — also the flag source. */
  iso: string
  name: string
  /** International dial prefix, including the leading "+". */
  dial: string
}

export const DIAL_COUNTRIES: DialCountry[] = [
  { iso: 'PH', name: 'Philippines', dial: '+63' },
  { iso: 'KR', name: 'South Korea', dial: '+82' },
  { iso: 'US', name: 'United States', dial: '+1' },
  { iso: 'AU', name: 'Australia', dial: '+61' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'CN', name: 'China', dial: '+86' },
  { iso: 'DE', name: 'Germany', dial: '+49' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso: 'HK', name: 'Hong Kong', dial: '+852' },
  { iso: 'ID', name: 'Indonesia', dial: '+62' },
  { iso: 'IN', name: 'India', dial: '+91' },
  { iso: 'JP', name: 'Japan', dial: '+81' },
  { iso: 'MY', name: 'Malaysia', dial: '+60' },
  { iso: 'NZ', name: 'New Zealand', dial: '+64' },
  { iso: 'RU', name: 'Russia', dial: '+7' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { iso: 'SG', name: 'Singapore', dial: '+65' },
  { iso: 'TH', name: 'Thailand', dial: '+66' },
  { iso: 'TW', name: 'Taiwan', dial: '+886' },
  { iso: 'VN', name: 'Vietnam', dial: '+84' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971' },
]

/** The country a blank input starts on. */
export const DEFAULT_DIAL_COUNTRY = DIAL_COUNTRIES[0] // Philippines, +63

/** "PH" → 🇵🇭 — two Regional Indicator Symbols, rendered as a flag by the OS. */
export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

/**
 * Split a stored number back into { country, national } so editing an existing
 * value re-selects the right flag. Longest dial code wins ("+1" must not steal
 * "+63"'s numbers), and a number with no recognised prefix keeps the default
 * country with the digits left intact.
 */
export function splitDial(value: string): { country: DialCountry; national: string } {
  const trimmed = value.trim()
  if (trimmed.startsWith('+')) {
    const match = [...DIAL_COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => trimmed.startsWith(c.dial))
    if (match) return { country: match, national: trimmed.slice(match.dial.length).trim() }
  }
  return { country: DEFAULT_DIAL_COUNTRY, national: trimmed }
}

/** Recombine into the stored form, e.g. "+63 917 123 4567". Empty in → empty out. */
export function joinDial(country: DialCountry, national: string): string {
  const digits = national.trim()
  return digits ? `${country.dial} ${digits}` : ''
}
