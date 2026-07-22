import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SmartImage from './SmartImage'
import Tooltip from './Tooltip'
import { authorName, commentCountOf, formatDate, isGuest, postPath, type DbPost } from '../lib/posts'
import { avatar } from '../lib/placeholder'

/**
 * One community-list row, PhilGo-style: title + comment/view counts on the left,
 * a photo thumbnail (with a "+N" badge when the post has more than one), then the
 * author avatar + date on the right. Shared by the board list (PostList) and the
 * community feeds (CategoryPage). Clicking the row opens the post.
 *
 * The author's NAME is not printed in the row (a real member's display name can
 * be arbitrarily long, unlike the short generated guest tags, and there's no
 * good width to give it without either clipping or crowding the title). Instead
 * the avatar itself is the identity: hover it (or tap/Tab-focus on touch/keyboard)
 * to reveal who posted, via the existing icon-tooltip pattern (Tooltip.tsx) used
 * elsewhere for icon-only buttons.
 *
 * `categoryChip` is an optional leading chip (the parent feed shows which child
 * category a post belongs to).
 */
export default function PostListItem({ post, categoryChip }: { post: DbPost; categoryChip?: ReactNode }) {
  const { t } = useTranslation()
  const name = authorName(post)
  const authorLabel = isGuest(post) ? `${name} · ${t('post.guestBadge')}` : name
  const comments = commentCountOf(post)
  const thumb = post.images[0]
  const extra = post.images.length - 1

  return (
    <li className="border-t border-neutral-90 first:border-t-0">
      <Link to={postPath(post)} className="group flex items-center gap-3 px-m py-3 hover:bg-neutral-97">
        {/* Title + counts */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {categoryChip}
            <p className="text-[15px] font-medium text-text-normal line-clamp-2 group-hover:text-accent-blue">
              {post.title}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-subtlest tabular-nums">
            {comments > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-accent-blue">
                <i className="fa-solid fa-comment" aria-hidden="true" /> {comments}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <i className="fa-solid fa-eye" aria-hidden="true" /> {post.views}
            </span>
            <span className="sm:hidden">{formatDate(post.created_at)}</span>
          </div>
        </div>

        {/* Thumbnail (first image; +N when there are more) */}
        {thumb && (
          <div className="relative shrink-0">
            <SmartImage src={thumb} cover className="h-16 w-16 rounded-m border border-neutral-90" />
            {extra > 0 && (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-1 text-[10px] font-semibold text-white tabular-nums">
                +{extra}
              </span>
            )}
          </div>
        )}

        {/* Author avatar + date (right rail, hidden on narrow screens). The
            avatar is a real <button> (not part of the row's own <Link>) so
            clicking/tapping it reveals the name via Tooltip instead of
            navigating — stopPropagation keeps the row's own click-to-open
            working everywhere else. */}
        <div className="hidden w-16 shrink-0 flex-col items-end gap-1 sm:flex">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="group/author relative shrink-0"
            aria-label={authorLabel}
          >
            {isGuest(post) ? (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-95 text-xs text-subtlest">
                <i className="fa-solid fa-user" aria-hidden="true" />
              </span>
            ) : (
              <img
                src={post.author?.avatar_url || avatar(name)}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <Tooltip label={authorLabel} position="top" />
          </button>
          <span className="text-[11px] text-subtlest tabular-nums">{formatDate(post.created_at)}</span>
        </div>
      </Link>
    </li>
  )
}
