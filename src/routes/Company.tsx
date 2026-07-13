import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import BusinessCard from '../components/BusinessCard'
import BusinessModal from '../components/BusinessModal'
import Pagination from '../components/Pagination'
import { listBusinesses, listCategories } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import type { BusinessRec, CategoryRec } from '../types'

const PAGE_SIZE = 9 // 3 columns × 3 rows

/** Business Directory (/company) — DB-driven categories, 3×3 paginated cards, "+" posting. */
export default function Company() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params, setParams] = useSearchParams()
  const category = params.get('category')
  const page = Math.max(1, Number(params.get('page') || 1))

  const [categories, setCategories] = useState<CategoryRec[]>([])
  const [items, setItems] = useState<BusinessRec[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const activeCat = categories.find((c) => c.slug === category) ?? null

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const load = () => {
    setLoading(true)
    listBusinesses(category, { page, pageSize: PAGE_SIZE })
      .then(({ rows, total }) => {
        setItems(rows)
        setTotal(total)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    listBusinesses(category, { page, pageSize: PAGE_SIZE })
      .then(({ rows, total }) => {
        if (!alive) return
        setItems(rows)
        setTotal(total)
      })
      .catch(() => alive && (setItems([]), setTotal(0)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [category, page])

  const pageCount = Math.ceil(total / PAGE_SIZE)
  const catById = new Map(categories.map((c) => [c.id, c]))

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setCategory = (slug: string | null) => {
    const next = new URLSearchParams(params)
    if (slug) next.set('category', slug)
    else next.delete('category')
    next.delete('page')
    setParams(next)
  }

  const heading = activeCat ? L(activeCat.name) : t('home.businessDirectory')

  return (
    <Layout>
      {/* Heading + posting action (item 7: "+"/Write beside the child-category heading) */}
      <div className="flex items-center justify-between gap-3 mb-l">
        <h1 className="text-xl font-bold text-text-normal flex items-center gap-2">
          {activeCat?.icon && <i className={`fa-solid ${activeCat.icon} text-accent-blue`} aria-hidden="true" />}
          {heading}
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          {t('company.write')}
        </button>
      </div>

      {/* Category chips (shared source with the posting form) */}
      <div className="flex flex-wrap gap-1.5 mb-l">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`px-2.5 py-1 text-xs border rounded-full transition-colors ${
            !category ? 'border-accent-blue bg-chip-blue text-accent-blue font-semibold' : 'border-neutral-90 text-muted hover:bg-neutral-97'
          }`}
        >
          {t('company.allCategories')}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={`px-2.5 py-1 text-xs border rounded-full transition-colors inline-flex items-center gap-1 ${
              category === c.slug ? 'border-accent-blue bg-chip-blue text-accent-blue font-semibold' : 'border-neutral-90 text-muted hover:bg-neutral-97 hover:text-accent-blue'
            }`}
          >
            {c.icon && <i className={`fa-solid ${c.icon}`} aria-hidden="true" />}
            {L(c.name)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-subtlest">…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-neutral-90 rounded-l p-l text-center">
          <p className="text-sm text-subtlest mb-3">{t('company.empty')}</p>
          <button type="button" onClick={() => setModalOpen(true)} className="text-sm text-link font-medium hover:underline">
            <i className="fa-solid fa-plus mr-1" aria-hidden="true" />
            {t('company.write')}
          </button>
        </div>
      ) : (
        <>
          {/* 3 columns desktop / 2 tablet / 1 mobile, up to 9 per page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-m">
            {items.map((b) => (
              <BusinessCard key={b.id} business={b} category={b.category_id ? catById.get(b.category_id) : undefined} />
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}

      {modalOpen && (
        <BusinessModal
          categories={categories}
          lockedCategory={activeCat}
          onCreated={() => {
            setModalOpen(false)
            // If a category is active, the new record belongs there; reload the list.
            if (page !== 1) setPage(1)
            else load()
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </Layout>
  )
}
