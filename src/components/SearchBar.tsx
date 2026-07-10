import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { searchQuickLinks } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'
import { searchSuggestions, type SearchHit } from '../lib/search'

/** Center search box (under the logo) + quick links to the right.
 *  Typing shows live suggestions from every content source, each labelled
 *  with the categorization it belongs to (board, directory, photos, …). */
export default function SearchBar() {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const seq = useRef(0)

  // Debounced live suggestions: fan out to all sources 250ms after typing stops.
  useEffect(() => {
    const term = q.trim()
    if (!term) {
      setHits([])
      setOpen(false)
      setActive(-1)
      return
    }
    const mySeq = ++seq.current
    const timer = setTimeout(() => {
      searchSuggestions(term).then((rows) => {
        if (seq.current !== mySeq) return // superseded by a newer keystroke
        setHits(rows)
        setOpen(true)
        setActive(-1)
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [q])

  const go = (hit: SearchHit) => {
    setOpen(false)
    setActive(-1)
    setQ('')
    navigate(hit.href)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (open && active >= 0 && hits[active]) return go(hits[active])
    setOpen(false)
    navigate(`/post/list?post_id=freetalk${q ? `&q=${encodeURIComponent(q)}` : ''}`)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return setOpen(false)
    if (!open || hits.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a <= 0 ? hits.length - 1 : a - 1))
    }
  }

  return (
    <div className="w-full flex items-center gap-3">
      <div
        className="relative flex-1 max-w-[420px]"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
        }}
      >
        <form
          onSubmit={submit}
          className="flex items-center h-10 border border-neutral-90 rounded-m overflow-hidden bg-page"
        >
          <button type="submit" aria-label={t('nav.search')} className="px-3 text-muted hover:text-accent-blue">
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => q.trim() && hits.length > 0 && setOpen(true)}
            placeholder={t('search.placeholder')}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            className="flex-1 h-full pr-3 text-sm text-body outline-none bg-transparent"
          />
        </form>

        {open && (
          <ul
            id="search-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 z-30 bg-page border border-neutral-90 rounded-m shadow-lg overflow-hidden"
          >
            {hits.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-subtlest">{t('search.noResults')}</li>
            ) : (
              hits.map((h, i) => (
                <li key={`${h.kind}:${h.href}:${L(h.title)}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    // mousedown (not click) so it fires before the input's blur closes the list
                    onMouseDown={(e) => {
                      e.preventDefault()
                      go(h)
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${
                      i === active ? 'bg-neutral-97' : ''
                    }`}
                  >
                    <span className="flex-1 min-w-0 truncate text-body">{L(h.title)}</span>
                    <span className="shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-neutral-95 text-subtlest whitespace-nowrap">
                      {L(h.category)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-3 text-xs text-muted">
        {searchQuickLinks.map((l) => (
          <Link key={l.label.en} to={l.href} className="hover:text-accent-blue">
            {L(l.label)}
          </Link>
        ))}
      </div>
    </div>
  )
}
