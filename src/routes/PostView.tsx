import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { boardTitles, getBoardItems } from '../data/boards'
import { recentComments } from '../data/sidebar'
import { useLocalized } from '../lib/useLocalized'

/**
 * Generic post view (/post/view?idx=…&post_id=…).
 * Looks up the post by idx within its board so titles match the lists that link here.
 */
export default function PostView() {
  const { t } = useTranslation()
  const L = useLocalized()
  const [params] = useSearchParams()
  const idx = params.get('idx') || ''
  const postId = params.get('post_id') || 'freetalk'

  const board = boardTitles[postId] ?? { en: 'Free Board', ko: '자유게시판' }
  const item =
    getBoardItems(postId).find((p) => p.href.includes(`idx=${idx}`)) ?? getBoardItems(postId)[0]

  return (
    <Layout>
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <Link to={`/post/list?post_id=${postId}`} className="text-link">{L(board)}</Link>
      </nav>

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        <header className="p-l border-b border-neutral-90">
          <h1 className="text-lg font-bold text-text-normal">{L(item.title)}</h1>
          <div className="mt-2 flex items-center gap-l text-xs text-subtlest tabular-nums">
            <span>{item.author}</span>
            <span>{item.date}</span>
            <span><i className="fa-solid fa-eye mr-1" />{item.views}</span>
            <span><i className="fa-solid fa-comment mr-1" />{item.comments}</span>
          </div>
        </header>
        <div className="p-l text-sm text-body leading-relaxed space-y-3">
          <p>{L(item.title)}</p>
          <p className="text-subtlest">
            {/* Post body is a DATA SLOT — real content drops in here unchanged. */}
            (Post body placeholder — wire real content into the post DATA SLOT.)
          </p>
        </div>
      </article>

      {/* Comments */}
      <section className="mt-l">
        <h2 className="text-sm font-semibold text-text-normal mb-s">
          <i className="fa-solid fa-comments mr-2 text-accent-blue" />
          {t('widgets.recentComments')} ({item.comments})
        </h2>
        <ul className="border border-neutral-90 rounded-l overflow-hidden">
          {recentComments.slice(0, Math.max(1, item.comments % 6)).map((c, i) => (
            <li key={i} className="flex gap-2 p-s border-t border-neutral-90 first:border-t-0">
              <img src={c.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
              <div>
                <div className="text-xs">
                  <span className="font-medium text-text-normal">{c.author}</span>
                  <span className="ml-2 text-subtlest">{L(c.timeAgo)}</span>
                </div>
                <p className="text-xs text-body">{L(c.snippet)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}
