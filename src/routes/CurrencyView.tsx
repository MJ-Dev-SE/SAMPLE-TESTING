import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import { convertAmount, useFx, type Currency } from '../lib/fx'

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'PHP', label: 'Philippine Peso', symbol: '₱' },
  { code: 'KRW', label: 'Korean Won', symbol: '₩' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
]

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 })

/**
 * /currency — the sidebar Exchange card's "calculator" target. Converts
 * Philippine peso ↔ Korean won ↔ US dollar from live rates (lib/fx.ts,
 * open.er-api.com — free, no API key). Defaults to converting FROM peso.
 */
export default function CurrencyView() {
  const { t } = useTranslation()
  const fx = useFx()
  const [amount, setAmount] = useState('1000')
  const [from, setFrom] = useState<Currency>('PHP')

  const amountNum = Number(amount)
  const targets = CURRENCIES.filter((c) => c.code !== from)

  return (
    <Layout>
      <Seo title={t('currency.title')} noindex />
      <nav className="text-[12.48px] mb-2" aria-label="Breadcrumb">
        <Link to="/" className="text-link font-medium">{t('menuPage.breadcrumbHome')}</Link>
        <span className="mx-1 text-subtlest">›</span>
        <span className="text-muted">{t('currency.title')}</span>
      </nav>

      <h1 className="text-xl font-bold text-text-normal mb-1">
        <i className="fa-solid fa-money-bill-transfer mr-2 text-accent-green" aria-hidden="true" />
        {t('currency.title')}
      </h1>
      <p className="text-sm text-muted mb-l">{t('currency.subtitle')}</p>

      {!fx ? (
        <div className="border border-neutral-90 rounded-l p-2xl grid place-items-center text-muted">
          <p className="text-sm">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-accent-green" aria-hidden="true" />
            {t('currency.loading')}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-neutral-90 rounded-l p-l mb-l">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-l">
              <label className="flex-1">
                <span className="block text-xs text-muted mb-1">{t('currency.amount')}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-m border border-neutral-90 px-3 py-2 text-lg font-semibold text-text-normal focus:outline-none focus:border-accent-blue"
                />
              </label>
              <label className="sm:w-48">
                <span className="block text-xs text-muted mb-1">{t('currency.from')}</span>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value as Currency)}
                  className="w-full rounded-m border border-neutral-90 px-3 py-2 text-sm text-text-normal focus:outline-none focus:border-accent-blue"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {targets.map((c) => {
                const result = Number.isFinite(amountNum) ? convertAmount(amountNum, from, c.code, fx) : 0
                return (
                  <div key={c.code} className="rounded-m bg-neutral-97 border border-neutral-90 p-l text-center">
                    <div className="text-xs text-muted mb-1">{c.label}</div>
                    <div className="text-2xl font-bold text-text-normal">{c.symbol}{fmt(result)}</div>
                    <div className="text-[11px] text-subtlest mt-0.5">{c.code}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border border-neutral-90 rounded-l p-l">
            <h2 className="text-xs font-semibold text-muted mb-2">{t('currency.liveRates')}</h2>
            <ul className="text-sm text-text-normal space-y-1">
              <li>$1 = ₱{fmt(fx.php)} = ₩{fmt(fx.krw)}</li>
              <li>₱1 = ₩{fmt(fx.krw / fx.php)} = ${fmt(1 / fx.php)}</li>
              <li>₩1 = ₱{fmt(fx.php / fx.krw)} = ${fmt(1 / fx.krw)}</li>
            </ul>
          </div>
        </>
      )}
    </Layout>
  )
}
