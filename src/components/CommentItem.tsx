import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { authorName, deleteComment, deleteGuestComment, formatDate, isGuest, type DbComment } from '../lib/posts'
import { clearGuestCommentToken, getGuestCommentToken } from '../lib/guestTokens'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'

/**
 * One comment row, with a Delete button when the current visitor is allowed to
 * remove it:
 *   • an ADMIN (isAdmin prop) — may delete ANY comment (RLS "admins manage comments"),
 *   • the authoring MEMBER (RLS "members delete own comments"),
 *   • the GUEST browser that created it (secret token in localStorage → the
 *     delete_guest_comment() RPC; see lib/guestTokens.ts + supabase/content.sql).
 * `isAdmin` is passed in (computed once by the parent) so a long thread doesn't fire
 * one admin-status query per comment.
 */
export default function CommentItem({
  comment,
  onDeleted,
  isAdmin = false,
}: {
  comment: DbComment
  onDeleted: (id: string) => void
  isAdmin?: boolean
}) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const ownedByMember = !!user && comment.author_id === user.id
  const guestToken = isGuest(comment) ? getGuestCommentToken(comment.id) : null
  const canDelete = ownedByMember || isAdmin || !!guestToken

  const remove = async () => {
    const ok = await alertConfirm(
      t('post.deleteCommentConfirmTitle'),
      t('post.deleteCommentConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    try {
      // Admins & the authoring member delete straight through RLS; a guest uses the
      // token RPC (their only path, since they have no auth.uid()).
      if (ownedByMember || isAdmin) {
        await deleteComment(comment.id)
      } else if (guestToken) {
        const removed = await deleteGuestComment(comment.id, guestToken)
        if (removed) clearGuestCommentToken(comment.id)
      }
      onDeleted(comment.id)
      toast(t('post.commentDeleted'))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    }
  }

  return (
    <li className="p-s border-t border-neutral-90 first:border-t-0">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs min-w-0">
          <span className="font-medium text-text-normal inline-flex items-center gap-1">
            {authorName(comment)}
            {isGuest(comment) && (
              <span className="text-[10px] uppercase bg-neutral-95 rounded px-1">{t('post.guestBadge')}</span>
            )}
          </span>
          <span className="ml-2 text-subtlest">{formatDate(comment.created_at)}</span>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={remove}
            className="shrink-0 text-subtlest hover:text-accent-pink"
            aria-label={t('post.delete')}
            title={isAdmin && !ownedByMember && !guestToken ? t('post.delete') : undefined}
          >
            <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="text-sm text-body whitespace-pre-wrap mt-1">{comment.body}</p>
    </li>
  )
}
