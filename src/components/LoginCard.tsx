import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Sidebar login box (logged-out state) — matches the live philgo.com left rail. */
export default function LoginCard() {
  const { t } = useTranslation()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="bg-neutral-95 px-s py-2">
        <h3 className="text-sm font-semibold text-text-normal">
          <i className="fa-solid fa-right-to-bracket mr-2 text-accent-blue" />
          {t('nav.login')}
        </h3>
      </div>
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
      </div>
    </section>
  )
}
