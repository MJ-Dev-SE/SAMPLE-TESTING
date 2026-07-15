import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/auth'
import { requireLogin } from '../../lib/alert'
import { RatingInput } from './RatingInput'

/**
 * Composer for a new comment / review. Logged-out submit triggers the shared
 * SweetAlert login prompt (then routes to /user/login, preserving where the user
 * was). Empty/whitespace bodies are rejected before we ever call the API.
 */
export default function CommentForm({
  allowRating = false,
  busy = false,
  onSubmit,
}: {
  allowRating?: boolean
  busy?: boolean
  onSubmit: (body: string, rating: number | null) => void
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [body, setBody] = useState('')
  const [rating, setRating] = useState(0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!user) {
      const go = await requireLogin(
        t('auth.loginRequiredTitle'),
        t('comments.loginRequiredComment'),
        t('auth.loginRequiredConfirm'),
        t('auth.loginRequiredCancel'),
      )
      if (go) navigate('/user/login', { state: { from: location } })
      return
    }
    const text = body.trim()
    if (!text) return
    onSubmit(text, allowRating && rating > 0 ? rating : null)
    setBody('')
    setRating(0)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {allowRating && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">{t('comments.yourRating')}</span>
          <RatingInput value={rating} onChange={setRating} label={t('comments.yourRating')} />
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={allowRating ? t('comments.writeReview') : t('comments.writeComment')}
        rows={3}
        className="w-full p-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/15 resize-y"
      />
      <div className="flex items-center justify-between gap-2">
        {!user && <p className="text-xs text-subtlest">{t('comments.loginToComment')}</p>}
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="ml-auto inline-flex items-center gap-1.5 bg-accent-blue text-white text-sm font-semibold px-4 py-2 rounded-m hover:bg-[#005bc4] disabled:opacity-60 transition-colors"
        >
          <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} aria-hidden="true" />
          {allowRating ? t('comments.submitReview') : t('comments.submit')}
        </button>
      </div>
    </form>
  )
}
