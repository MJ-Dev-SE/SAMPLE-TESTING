import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { searchQuickLinks } from '../data/categoryBar'
import { useLocalized } from '../lib/useLocalized'

/** Center search box (under the logo) + quick links to the right. */
export default function SearchBar() {
  const { t } = useTranslation()
  const L = useLocalized()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/post/list?post_id=freetalk${q ? `&q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <div className="w-full flex items-center gap-3">
      <form onSubmit={submit} className="flex items-center flex-1 max-w-[420px] h-10 border border-neutral-90 rounded-m overflow-hidden bg-page">
        <button type="submit" aria-label={t('nav.search')} className="px-3 text-muted hover:text-accent-blue">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
          className="flex-1 h-full pr-3 text-sm text-body outline-none bg-transparent"
        />
      </form>
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
