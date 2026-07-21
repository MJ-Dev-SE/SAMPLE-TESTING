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
      <div className="relative shrink-0">
        <select
          value={country.iso}
          onChange={(e) => pickCountry(e.target.value)}
          aria-label="Country code"
          className="h-10 pl-2.5 pr-7 bg-neutral-97 text-sm text-text-normal appearance-none outline-none cursor-pointer border-r border-neutral-90"
        >
          {DIAL_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {flagEmoji(c.iso)} {c.dial} {c.name}
            </option>
          ))}
        </select>
        {/* Compact display over the select: flag + dial only, so the field stays narrow. */}
        <span className="pointer-events-none absolute inset-0 flex items-center gap-1 pl-2.5 pr-7 bg-neutral-97 text-sm text-text-normal">
          <span aria-hidden="true">{flagEmoji(country.iso)}</span>
          <span>{country.dial}</span>
          <i className="fa-solid fa-chevron-down absolute right-2.5 text-[10px] text-subtlest" aria-hidden="true" />
        </span>
      </div>
      <input
        type="tel"
        inputMode="tel"
        aria-label={ariaLabel}
        className="h-10 flex-1 min-w-0 px-3 text-sm outline-none"
        value={national}
        onChange={(e) => onChange(joinDial(country, e.target.value))}
        placeholder={placeholder}
      />
    </div>
  )
}

export default memo(PhoneInput)
