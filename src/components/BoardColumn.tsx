import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Board } from '../types'
import { useLocalized } from '../lib/useLocalized'

/** A single board card: header (board name + "see more") + list of post-title rows. */
export default function BoardColumn({ board }: { board: Board }) {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">{L(board.boardName)}</h3>
        <Link to={board.seeMoreHref} className="text-xs text-link hover:underline">
          {t('common.seeMore')}
        </Link>
      </div>
      <ul>
        {board.posts.map((p, i) => (
          <li key={i} className="border-t border-neutral-90 first:border-t-0">
            <Link
              to={p.href}
              className="flex items-center justify-between px-s py-2 text-sm hover:bg-neutral-97"
            >
              <span className="text-body truncate">{L(p.title)}</span>
              {p.commentCount > 0 && (
                <span className="ml-2 shrink-0 text-xs font-semibold text-accent-pink">
                  ({p.commentCount})
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
