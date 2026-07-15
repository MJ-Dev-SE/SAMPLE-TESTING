import { useState } from 'react'

/**
 * Controlled 1–5 star picker (hover preview + click to set). Values outside 1..5
 * are impossible from the UI; the DB CHECK constraint (comments.sql) is the
 * second line of defense.
 */
export function RatingInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label?: string
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(value === n ? 0 : n)}
          className="p-0.5 text-lg leading-none transition-colors"
        >
          <i
            className={`fa-${n <= shown ? 'solid' : 'regular'} fa-star ${
              n <= shown ? 'text-amber-400' : 'text-neutral-90'
            }`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}

/** Read-only star display for a saved rating (supports halves visually via rounding). */
export function StarRating({ value, size = 'text-sm' }: { value: number; size?: string }) {
  const rounded = Math.round(value)
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i
          key={n}
          className={`fa-${n <= rounded ? 'solid' : 'regular'} fa-star ${
            n <= rounded ? 'text-amber-400' : 'text-neutral-90'
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
