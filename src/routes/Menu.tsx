import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import MenuSection from '../components/MenuSection'
import { menuSections } from '../data/menu'

/** MENU PAGE (/menu) — detailed spec: breadcrumb, header, responsive 1/2/3-col grid of 6 sections. */
export default function Menu() {
  const { t } = useTranslation()
  return (
    <Layout>
      {/* Breadcrumb: home › menu */}
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">
          {t('menuPage.breadcrumbHome')}
        </Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('menuPage.breadcrumbMenu')}</span>
      </nav>

      {/* Page header */}
      <div className="my-l mb-xl">
        <h1 className="flex items-center gap-xs text-2xl font-bold text-text-normal">
          <i className="fa-solid fa-bars text-[0.85em]" />
          {t('menuPage.title')}
        </h1>
        <p className="flex items-center gap-xs text-[0.85em] text-muted mt-1">
          <i className="fa-solid fa-circle-info" />
          {t('menuPage.description')}
        </p>
      </div>

      {/* Menu grid: ≤640 = 1col, 641–991 = 2col, ≥992 = 3col */}
      <div className="grid gap-l grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {menuSections.map((section) => (
          <MenuSection key={section.header.en} section={section} />
        ))}
      </div>
    </Layout>
  )
}
