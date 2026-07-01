import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { boardTitles, getBoardItems } from '../data/boards'
import { useLocalized } from '../lib/useLocalized'

/**
 * LIST / BOARD PAGE PATTERN (/post/list?post_id=…&category=…).
 * Reads the real PhilGo query params and renders the matching board's rows sequentially.
 */
export default function PostList() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const postId = params.get('post_id') || 'freetalk'
  const category = params.get('category')

  const title = boardTitles[postId] ?? { en: 'Board', ko: '게시판' }
  const items = getBoardItems(postId)

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">
          {t('menuPage.breadcrumbHome')}
        </Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{L(title)}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-l">
        {L(title)}
        {category && <span className="ml-2 text-sm font-normal text-muted">· {category}</span>}
      </h1>

      <ul className="border border-neutral-90 rounded-l overflow-hidden">
        {/* items load sequentially here */}
        {items.map((item, i) => (
          <li key={i} className="border-t border-neutral-90 first:border-t-0">
            <Link to={item.href} className="flex items-center gap-s px-m py-2.5 text-sm hover:bg-neutral-97">
              <span className="flex-1 min-w-0 text-body truncate">
                {L(item.title)}
                {item.comments > 0 && (
                  <span className="ml-2 text-xs font-semibold text-accent-pink">[{item.comments}]</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-subtlest hidden sm:flex items-center gap-l tabular-nums">
                <span>{item.author}</span>
                <span>{item.date}</span>
                <span>
                  <i className="fa-solid fa-eye mr-1" />
                  {item.views}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Pagination />
    </Layout>
  )
}
