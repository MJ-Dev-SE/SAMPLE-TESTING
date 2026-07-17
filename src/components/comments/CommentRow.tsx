import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/auth'
import { authorName, deleteComment, deleteGuestComment, formatDate, isGuest } from '../../lib/posts'
import { updateComment, type CommentRec } from '../../lib/comments'
import { clearGuestCommentToken, getGuestCommentToken } from '../../lib/guestTokens'
import { alertConfirm, alertError, errText, toast } from '../../lib/alert'
import { avatar } from '../../lib/placeholder'
import Tooltip from '../Tooltip'
import { RatingInput, StarRating } from './RatingInput'

/**
 * One comment/review row for the shared CommentsReviewsSection: avatar + author +
 * date + optional star rating + body, with inline EDIT (own member comment) and
 * DELETE (own / guest-token / admin) — deletion mirrors CommentItem.tsx, edit uses
 * updateComment(). `isAdmin` is passed in (computed once by the parent).
 */
export default function CommentRow({
  comment,
  allowRating = false,
  highlighted = false,
  isAdmin = false,
  onDeleted,
  onUpdated,
}: {
  comment: CommentRec
  allowRating?: boolean
  highlighted?: boolean
  isAdmin?: boolean
  onDeleted: (id: string) => void
  onUpdated: (c: CommentRec) => void
}) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const ownedByMember = !!user && comment.author_id === user.id
  const guestToken = isGuest(comment) ? getGuestCommentToken(comment.id) : null
  const canDelete = ownedByMember || isAdmin || !!guestToken
  const canEdit = ownedByMember // guests can't edit (no auth for RLS)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.body)
  const [rating, setRating] = useState(comment.rating ?? 0)
  const [busy, setBusy] = useState(false)

  const name = authorName(comment)

  const remove = async () => {
    const ok = await alertConfirm(
      t('post.deleteCommentConfirmTitle'),
      t('post.deleteCommentConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    try {
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

  const saveEdit = async () => {
    const body = draft.trim()
    if (!body || busy) return
    setBusy(true)
    try {
      const nextRating = allowRating ? (rating > 0 ? rating : null) : comment.rating
      await updateComment(comment.id, { body, rating: nextRating })
      onUpdated({ ...comment, body, rating: nextRating ?? null })
      setEditing(false)
      toast(t('comments.updated'))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li
      id={`comment-${comment.id}`}
      className={`flex gap-3 p-s border-t border-neutral-90 first:border-t-0 scroll-mt-24 transition-colors ${
        highlighted ? 'bg-chip-blue/40 rounded-m' : ''
      }`}
    >
      <img
        src={comment.author?.avatar_url || avatar(name)}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-9 h-9 rounded-full shrink-0 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs min-w-0 flex items-center gap-2 flex-wrap">
            <span className="font-medium text-text-normal">{name}</span>
            {isGuest(comment) && (
              <span className="text-[10px] uppercase bg-neutral-95 rounded px-1">{t('post.guestBadge')}</span>
            )}
            <span className="text-subtlest">{formatDate(comment.created_at)}</span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-subtlest italic">· {t('comments.edited')}</span>
            )}
          </div>
          {!editing && (canEdit || canDelete) && (
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(comment.body)
                    setRating(comment.rating ?? 0)
                    setEditing(true)
                  }}
                  className="group relative text-subtlest hover:text-accent-blue"
                  aria-label={t('comments.edit')}
                >
                  <i className="fa-solid fa-pen text-xs" aria-hidden="true" />
                  <Tooltip label={t('comments.edit')} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={remove}
                  className="group relative text-subtlest hover:text-accent-pink"
                  aria-label={t('post.delete')}
                >
                  <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" />
                  <Tooltip label={t('post.delete')} />
                </button>
              )}
            </div>
          )}
        </div>

        {!editing && comment.rating != null && comment.rating > 0 && (
          <div className="mt-0.5">
            <StarRating value={comment.rating} />
          </div>
        )}

        {editing ? (
          <div className="mt-1 flex flex-col gap-2">
            {allowRating && <RatingInput value={rating} onChange={setRating} label={t('comments.yourRating')} />}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full p-2 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue resize-y"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy || !draft.trim()}
                className="bg-accent-blue text-white text-xs font-semibold px-3 py-1.5 rounded-m hover:bg-[#005bc4] disabled:opacity-60"
              >
                {busy ? t('auth.working') : t('comments.save')}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs text-muted px-3 py-1.5 rounded-m border border-neutral-90 hover:bg-neutral-97"
              >
                {t('post.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-body whitespace-pre-wrap break-words mt-1">{comment.body}</p>
        )}
      </div>
    </li>
  )
}
