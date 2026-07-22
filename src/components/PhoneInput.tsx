import { memo, useState } from 'react'
import { DIAL_COUNTRIES, flagEmoji, joinDial, splitDial, type DialCountry } from '../lib/dialCodes'

/**
 * International phone field: a country picker showing the flag + dial code
 * (🇵🇭 +63 by default) joined to a plain number input. The two are stored as ONE
 * string — "+63 917 123 4567" — so nothing downstream (DB column, ContactCard,
 * tel: link) needs to know this control exists.
 *
 * The picker is a native <select> on purpose: it opens instantly, is keyboard-
 * and screen-reader-correct for free, and uses the OS's own flag rendering
 * instead of an icon font or image sprite.
 */
function PhoneInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}) {
  // Country lives in local state so picking one sticks even while the number
  // is still empty (an empty number stores "", which carries no dial code).
  const [country, setCountry] = useState<DialCountry>(() => splitDial(value).country)

  const national = value.startsWith(country.dial) ? value.slice(country.dial.length).trim() : splitDial(value).national

  const pickCountry = (iso: string) => {
    const next = DIAL_COUNTRIES.find((c) => c.iso === iso)
    if (!next) return
    setCountry(next)
    onChange(joinDial(next, national))
  }

  return (
    <div className="flex items-stretch rounded-m border border-neutral-90 focus-within:border-accent-blue overflow-hidden">
      {/* Country picker — FIXED WIDTH so the number input always keeps room. The
          native <select> is transparent and laid over a compact flag/code +
          dial display; a too-wide <select> (sized to its longest option text)
          would otherwise squeeze the number input down to nothing. The dropdown
          still shows full country names when opened. On Windows the flag glyph
          renders as the 2-letter code (e.g. "PH") — still clear, no dependency. */}
      <div className="relative shrink-0 w-[96px] bg-neutral-97 border-r border-neutral-90">
        <div className="flex items-center gap-1 h-10 pl-2.5 pr-6 text-sm text-text-normal whitespace-nowrap overflow-hidden">
          <span className="text-xs text-subtlest" aria-hidden="true">{flagEmoji(country.iso)}</span>
          <span className="font-medium">{country.dial}</span>
        </div>
        <i className="fa-solid fa-chevron-down pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-subtlest" aria-hidden="true" />
        <select
          value={country.iso}
          onChange={(e) => pickCountry(e.target.value)}
          aria-label="Country code"
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
        >
          {DIAL_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {flagEmoji(c.iso)} {c.dial} {c.name}
            </option>
          ))}
        </select>
      </div>
      <input
        type="tel"
        inputMode="tel"
        aria-label={ariaLabel}
        className="h-10 flex-1 min-w-0 px-3 text-sm outline-none bg-white"
        value={national}
        onChange={(e) => onChange(joinDial(country, e.target.value))}
        placeholder={placeholder}
      />
    </div>
  )
}

export default memo(PhoneInput)
