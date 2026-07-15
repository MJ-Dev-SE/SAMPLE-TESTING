import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { commentTargetPath, recentAuthorName, type RecentCommentRec } from '../lib/comments'
import { StarRating } from './comments/RatingInput'
import { timeAgo } from '../lib/posts'
import { avatar } from '../lib/placeholder'

const TYPE_LABEL: Record<RecentCommentRec['content_type'], string> = {
  post: 'comments.typePost',
  business: 'comments.typeBusiness',
  advertisement: 'comments.typeAdvertisement',
  news: 'comments.typeNews',
}

const TYPE_CHIP: Record<RecentCommentRec['content_type'], string> = {
  post: 'bg-neutral-95 text-muted',
  business: 'bg-chip-green text-accent-green',
  advertisement: 'bg-chip-pink text-accent-pink',
  news: 'bg-chip-indigo text-accent-indigo',
}

/**
 * One recent-comment row, shared by the sidebar widget (compact) and the full
 * Recent Comments view. Clicking opens the EXACT source record (resolved by
 * content_type + content_id via commentTargetPath), with ?comment= to highlight it.
 */
export default function RecentCommentItem({ row, compact = false }: { row: RecentCommentRec; compact?: boolean }) {
  const { t } = useTranslation()
  const name = recentAuthorName(row)

  return (
    <li className="border-t border-neutral-90 first:border-t-0">
      <Link to={commentTargetPath(row)} className={`flex gap-2.5 group ${compact ? 'px-s py-2' : 'px-l py-3 hover:bg-neutral-97'}`}>
        <img src={row.avatar_url || avatar(name)} alt="" className="w-9 h-9 rounded-full shrink-0 object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-medium text-text-normal truncate">{name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_CHIP[row.content_type]}`}>
              {t(TYPE_LABEL[row.content_type])}
            </span>
            <span className="text-subtlest shrink-0">{timeAgo(row.created_at)}</span>
          </div>
          {row.rating != null && row.rating > 0 && (
            <div className="mt-0.5"><StarRating value={row.rating} size="text-[11px]" /></div>
          )}
          <p className={`text-xs text-body line-clamp-2 group-hover:text-accent-blue ${compact ? '' : 'mt-0.5 text-sm'}`}>
            {row.body}
          </p>
          <p className="text-[11px] text-subtlest truncate mt-0.5">
            {t('comments.on')} <span className="text-muted group-hover:text-accent-blue">{row.resolved_title}</span>
          </p>
        </div>
      </Link>
    </li>
  )
}
