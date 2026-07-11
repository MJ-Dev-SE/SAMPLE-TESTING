import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { authorName, deleteComment, deleteGuestComment, formatDate, isGuest, type DbComment } from '../lib/posts'
import { clearGuestCommentToken, getGuestCommentToken } from '../lib/guestTokens'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'

/**
 * One comment row, with a Delete button when the current visitor is allowed to
 * remove it: the authoring member (RLS-enforced), or the guest browser that
 * created it (matched via a secret token stored in localStorage — see
 * lib/guestTokens.ts + delete_guest_comment() in supabase/content.sql).
 */
export default function CommentItem({
  comment,
  onDeleted,
}: {
  comment: DbComment
  onDeleted: (id: string) => void
}) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const guestToken = isGuest(comment) ? getGuestCommentToken(comment.id) : null
  const canDelete = (!!user && comment.author_id === user.id) || !!guestToken

  const remove = async () => {
    const ok = await alertConfirm(
      t('post.deleteCommentConfirmTitle'),
      t('post.deleteCommentConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    try {
      if (guestToken) {
        const removed = await deleteGuestComment(comment.id, guestToken)
        if (removed) clearGuestCommentToken(comment.id)
      } else {
        await deleteComment(comment.id)
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
          >
            <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="text-sm text-body whitespace-pre-wrap mt-1">{comment.body}</p>
    </li>
  )
}
