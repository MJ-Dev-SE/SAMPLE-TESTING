import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import BusinessCard from '../components/BusinessCard'
import { bizCategories } from '../data/home'
import { listBusinesses } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { BusinessRec } from '../types'

/** Business Directory page (/company) — real listings from Supabase, filterable by category. */
export default function Company() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const category = params.get('category')

  const [items, setItems] = useState<BusinessRec[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    listBusinesses(category)
      .then((b) => alive && setItems(b))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [category])

  return (
    <Layout>
      <div className="flex items-center justify-between gap-3 mb-l">
        <h1 className="text-xl font-bold text-text-normal">{t('home.businessDirectory')}</h1>
        <Link
          to="/company/register"
          className="shrink-0 inline-flex items-center gap-2 h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
        >
          <i className="fa-solid fa-plus" />
          {t('company.registerCta')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-l">
        {bizCategories.map((c) => (
          <Link
            key={c.label.en}
            to={c.href}
            className="px-2.5 py-1 text-xs border border-neutral-90 rounded-full text-muted hover:bg-neutral-97 hover:text-accent-blue"
          >
            {L(c.label)}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-subtlest">…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-neutral-90 rounded-l p-l text-center">
          <p className="text-sm text-subtlest mb-3">{t('company.empty')}</p>
          <Link to="/company/register" className="text-sm text-link font-medium hover:underline">
            <i className="fa-solid fa-plus mr-1" />
            {t('company.registerCta')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-s">
          {items.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </Layout>
  )
}
