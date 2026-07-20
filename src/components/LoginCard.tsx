import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { confirmLogout } from '../lib/alert'

/** Sidebar login box — logged-out (login/signup) or logged-in (profile + logout) state. */
export default function LoginCard() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()

  const name = profile?.display_name || profile?.username || user?.email?.split('@')[0]

  const handleLogout = async () => {
    const ok = await confirmLogout(t('auth.logoutConfirmTitle'), t('auth.logoutConfirmText'), t('auth.logout'), t('post.cancel'))
    if (ok) signOut()
  }

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-right-to-bracket mr-2 text-accent-blue" />
          {t('nav.login')}
        </h3>
      </div>

      {user ? (
        /* Logged-in state */
        <div className="p-m flex flex-col items-center gap-3">
          {profile?.avatar_url ? (
            // Deliberately eager (no loading="lazy") — this sidebar card renders
            // above-the-fold on every page, unlike other avatars in the app.
            <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <span className="w-14 h-14 rounded-full bg-chip-blue grid place-items-center text-accent-blue">
              <i className="fa-solid fa-user text-2xl" />
            </span>
          )}
          <p className="text-xs text-muted text-center">
            {t('auth.loggedInAs')}
            <br />
            <span className="text-sm font-semibold text-text-normal break-all">{name}</span>
          </p>
          <Link
            to="/user/settings"
            className="w-full text-center bg-accent-blue text-white text-sm font-semibold py-2 rounded-m hover:bg-[#005bc4]"
          >
            <i className="fa-solid fa-gear mr-2" />
            {t('profile.settings')}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-center border border-neutral-90 text-text-normal text-sm font-semibold py-2 rounded-m hover:bg-neutral-97"
          >
            <i className="fa-solid fa-arrow-right-from-bracket mr-2 text-muted" />
            {t('auth.logout')}
          </button>
        </div>
      ) : (
        /* Logged-out state */
        <div className="p-m flex flex-col items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-neutral-95 grid place-items-center text-subtlest">
            <i className="fa-solid fa-user text-2xl" />
          </span>
          <p className="text-xs text-muted text-center">{t('sidebar.loginPrompt')}</p>
          <Link
            to="/user/login"
            className="w-full text-center bg-accent-blue text-white text-sm font-semibold py-2 rounded-m hover:bg-[#005bc4]"
          >
            {t('nav.login')}
          </Link>
          <Link
            to="/user/register"
            className="w-full text-center border border-neutral-90 text-text-normal text-sm font-semibold py-2 rounded-m hover:bg-neutral-97"
          >
            {t('auth.registerButton')}
          </Link>
        </div>
      )}
    </section>
  )
}
