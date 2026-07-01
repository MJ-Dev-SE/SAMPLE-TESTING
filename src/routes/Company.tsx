import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import BusinessCard from '../components/BusinessCard'
import Pagination from '../components/Pagination'
import { bizCategories, recentBusinesses } from '../data/home'
import { useLocalized } from '../lib/useLocalized'

/** Business Directory page (/company) — reuses shell + category chips + business cards. */
export default function Company() {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <Layout>
      <h1 className="text-xl font-bold text-text-normal mb-l">{t('home.businessDirectory')}</h1>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-s">
        {/* items load sequentially here */}
        {[...recentBusinesses, ...recentBusinesses].map((b, i) => (
          <BusinessCard key={i} business={b} />
        ))}
      </div>

      <Pagination />
    </Layout>
  )
}
