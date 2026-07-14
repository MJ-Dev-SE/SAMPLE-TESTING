import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, type Location } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { useAuth } from '../lib/auth'
import { alertError, errText, toast } from '../lib/alert'
import GoogleButton from '../components/GoogleButton'

/**
 * Log-in page (/user/login) — email + password via Supabase auth.
 * Callers that redirected here because an action needed login (see
 * lib/alert.ts requireLogin()) pass `state: { from: location }`; on success
 * we navigate back there instead of always to home. Google's OAuth redirect
 * is a full page reload (redirectTo: origin in lib/auth.tsx), so this
 * "return to where you were" behavior only applies to the email/password path.
 */
export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  // Already logged in → no reason to be on this page.
  if (user) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await signIn(email, password)
      toast(t('auth.loginSuccess'))
      navigate(from ? `${from.pathname}${from.search}` : '/', { replace: true })
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-[420px] mx-auto">
        <h1 className="text-xl font-bold text-text-normal mb-l">
          <i className="fa-solid fa-right-to-bracket mr-2 text-accent-blue" />
          {t('auth.loginTitle')}
        </h1>

        <div className="border border-neutral-90 rounded-l p-l flex flex-col gap-m">
          <GoogleButton />

          <div className="flex items-center gap-3 text-xs text-subtlest">
            <span className="flex-1 h-px bg-neutral-90" />
            {t('auth.or')}
            <span className="flex-1 h-px bg-neutral-90" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-m">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-normal">{t('auth.email')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-normal">{t('auth.password')}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="h-10 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
          >
            {busy ? t('auth.working') : t('auth.loginButton')}
          </button>

          <p className="text-sm text-muted text-center">
            {t('auth.noAccount')}{' '}
            <Link to="/user/register" className="text-link font-medium hover:underline">
              {t('auth.signupLink')}
            </Link>
          </p>
          </form>
        </div>
      </div>
    </Layout>
  )
}
