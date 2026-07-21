import { useMemo, useState, type KeyboardEvent } from 'react'
import type { AddressOption } from '../lib/phAddress'

/**
 * Type-ahead input for one address level (province/city/barangay): typing
 * always wins (free text is never rejected) while a live-filtered dropdown of
 * known names offers suggestions. Selecting a suggestion reports its `code`
 * (used by the caller to cascade the next level); typing without selecting
 * reports `code: null` — manual entry, no cascade key. Modeled on the
 * combobox in SearchBar.tsx (same a11y wiring, same dropdown-under-input,
 * same onMouseDown-before-blur select pattern).
 */
export default function AddressCombobox({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  id,
}: {
  value: string
  options: AddressOption[]
  onChange: (name: string, code: string | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const matches = useMemo(() => {
    const term = value.trim().toLowerCase()
    const pool = term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options
    return pool.slice(0, 50)
  }, [value, options])

  const select = (opt: AddressOption) => {
    onChange(opt.name, opt.code)
    setOpen(false)
    setActive(-1)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return setOpen(false)
    if (!open || matches.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a <= 0 ? matches.length - 1 : a - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      select(matches[active])
    }
  }

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value, null)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => options.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        className="h-10 w-full px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue disabled:opacity-60 disabled:bg-neutral-97"
      />
      {open && matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto bg-page border border-neutral-90 rounded-m shadow-lg"
        >
          {matches.map((opt, i) => (
            <li key={opt.code}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                // mousedown (not click) so it fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(opt)
                }}
                onMouseEnter={() => setActive(i)}
                className={`w-full px-3 py-2 text-left text-sm truncate ${i === active ? 'bg-neutral-97' : ''}`}
              >
                {opt.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
