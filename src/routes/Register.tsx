import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { useAuth } from '../lib/auth'
import { scorePassword } from '../lib/password'
import { alertError, alertSuccess, errText, toast } from '../lib/alert'
import GoogleButton from '../components/GoogleButton'

const inputCls =
  'h-10 px-3 border border-neutral-90 rounded-m text-sm outline-none focus:border-accent-blue'

/** Sign-up page (/user/register) — email + password (+ confirm) or Google. No email verification. */
export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp, user } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const strength = scorePassword(password)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return alertError(t('auth.weakTitle'), t('auth.weakText'))
    if (password !== confirm) return alertError(t('auth.mismatchTitle'), t('auth.mismatchText'))

    setBusy(true)
    try {
      const { needsEmailConfirm } = await signUp(email, password, username)
      if (needsEmailConfirm) {
        // Only reached if "Confirm email" is still ON in Supabase — nudge to log in.
        await alertSuccess(t('auth.checkEmailTitle'), t('auth.checkEmail'))
        navigate('/user/login', { replace: true })
      } else {
        toast(t('auth.signupSuccess'))
        navigate('/', { replace: true })
      }
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
          <i className="fa-solid fa-user-plus mr-2 text-accent-blue" />
          {t('auth.registerTitle')}
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
              <span className="text-sm font-medium text-text-normal">{t('auth.username')}</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-normal">{t('auth.email')}</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-normal">{t('auth.password')}</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
              {password ? (
                <div className="mt-1">
                  <div className="h-1.5 rounded-full bg-neutral-90 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${strength.ratio * 100}%`, backgroundColor: strength.color }}
                    />
                  </div>
                  <span className="text-xs mt-1 inline-block" style={{ color: strength.color }}>
                    {t('auth.strength.label')}: {t(`auth.strength.${strength.labelKey}`)}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-subtlest">{t('auth.passwordHint')}</span>
              )}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-normal">{t('auth.confirmPassword')}</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className={`${inputCls} ${confirm && confirm !== password ? 'border-accent-pink' : ''}`}
              />
              {confirm && confirm !== password && (
                <span className="text-xs text-accent-pink">{t('auth.mismatchTitle')}</span>
              )}
            </label>

            <button
              type="submit"
              disabled={busy}
              className="h-10 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4] disabled:opacity-60"
            >
              {busy ? t('auth.working') : t('auth.registerButton')}
            </button>
          </form>

          <p className="text-sm text-muted text-center">
            {t('auth.haveAccount')}{' '}
            <Link to="/user/login" className="text-link font-medium hover:underline">
              {t('auth.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
