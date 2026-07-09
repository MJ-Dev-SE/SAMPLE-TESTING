import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { boardTitles } from '../data/boards'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { formatDate, listUserComments, listUserPosts, type DbComment, type DbPost } from '../lib/posts'

/** Profile + activity page (/user/profile) — the member's own posts and comments. */
export default function Profile() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user, profile, loading } = useAuth()

  const [posts, setPosts] = useState<DbPost[]>([])
  const [comments, setComments] = useState<DbComment[]>([])

  useEffect(() => {
    if (!user) return
    let alive = true
    listUserPosts(user.id).then((p) => alive && setPosts(p)).catch(() => {})
    listUserComments(user.id).then((c) => alive && setComments(c)).catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  if (loading) return <Layout><p className="text-sm text-muted">…</p></Layout>
  if (!user) return <Navigate to="/user/login" replace />

  const name = profile?.display_name || profile?.username || user.email?.split('@')[0]
  const boardName = (boardId: string) => L(boardTitles[boardId] ?? { en: boardId, ko: boardId })

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-l">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <span className="w-14 h-14 rounded-full bg-chip-blue grid place-items-center text-accent-blue">
            <i className="fa-solid fa-user text-2xl" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-normal truncate">{name}</h1>
          <p className="text-xs text-subtlest truncate">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-l">
        {/* My posts */}
        <section>
          <h2 className="text-sm font-semibold text-text-normal mb-s">
            <i className="fa-solid fa-pen-to-square mr-2 text-accent-blue" />
            {t('profile.myPosts')} ({posts.length})
          </h2>
          <ul className="border border-neutral-90 rounded-l overflow-hidden">
            {posts.length === 0 ? (
              <li className="p-m text-sm text-subtlest text-center">{t('profile.noPosts')}</li>
            ) : (
              posts.map((p) => (
                <li key={p.id} className="border-t border-neutral-90 first:border-t-0">
                  <Link to={`/post/view?id=${p.id}&post_id=${p.board_id}`} className="block px-m py-2.5 hover:bg-neutral-97">
                    <span className="text-sm text-body truncate block">{p.title}</span>
                    <span className="text-xs text-subtlest">
                      {t('profile.postedIn')} {boardName(p.board_id)} · {formatDate(p.created_at)}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* My comments */}
        <section>
          <h2 className="text-sm font-semibold text-text-normal mb-s">
            <i className="fa-solid fa-comments mr-2 text-accent-blue" />
            {t('profile.myComments')} ({comments.length})
          </h2>
          <ul className="border border-neutral-90 rounded-l overflow-hidden">
            {comments.length === 0 ? (
              <li className="p-m text-sm text-subtlest text-center">{t('profile.noComments')}</li>
            ) : (
              comments.map((c) => (
                <li key={c.id} className="border-t border-neutral-90 first:border-t-0">
                  <Link to={`/post/view?id=${c.post_id}&post_id=${c.board_id}`} className="block px-m py-2.5 hover:bg-neutral-97">
                    <span className="text-sm text-body line-clamp-2">{c.body}</span>
                    <span className="text-xs text-subtlest">
                      {t('profile.postedIn')} {boardName(c.board_id)} · {formatDate(c.created_at)}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </Layout>
  )
}
