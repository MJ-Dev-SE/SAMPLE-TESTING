import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { bizCategories } from '../data/home'
import { listBusinessCategories } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { Localized } from '../types'

/** Parse the `?category=` slug out of a bizCategories href (undefined for "entire"). */
const slugOf = (href: string) => new URLSearchParams(href.split('?')[1] ?? '').get('category')

/**
 * Sidebar Business Directory widget — chips reflect the categories that actually have
 * listings (from Supabase), falling back to the full canonical set while empty/offline.
 */
export default function BusinessDirectoryWidget() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [dbSlugs, setDbSlugs] = useState<string[] | null>(null)

  useEffect(() => {
    let alive = true
    listBusinessCategories()
      .then((s) => alive && setDbSlugs(s))
      .catch(() => alive && setDbSlugs(null))
    return () => {
      alive = false
    }
  }, [])

  // Label lookup keyed by category slug (from the canonical config list).
  const labelBySlug = useMemo(() => {
    const m = new Map<string, Localized>()
    for (const c of bizCategories) {
      const slug = slugOf(c.href)
      if (slug) m.set(slug, c.label)
    }
    return m
  }, [])

  // Chips to show: DB-present categories (mapped to labels) or the full static set.
  const chips =
    dbSlugs && dbSlugs.length > 0
      ? dbSlugs
          .filter((s) => labelBySlug.has(s))
          .map((s) => ({ label: labelBySlug.get(s)!, href: `/company?category=${s}` }))
      : bizCategories

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-store mr-2 text-accent-green" />
          {t('home.businessDirectory')}
        </h3>
        <Link to="/company/register" className="text-xs text-link hover:underline">
          <i className="fa-solid fa-plus mr-1" />
          {t('common.register')}
        </Link>
      </div>
      <div className="p-s flex flex-wrap gap-1">
        {chips.map((c) => (
          <Link
            key={c.href}
            to={c.href}
            className="px-2 py-0.5 text-[11px] border border-neutral-90 rounded-full text-muted hover:bg-neutral-97 hover:text-accent-blue"
          >
            {L(c.label)}
          </Link>
        ))}
      </div>
    </section>
  )
}
