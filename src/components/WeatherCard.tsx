import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWeather } from '../lib/weather'
import { useFx } from '../lib/fx'

/** Sidebar weather + exchange-rate card — both are live (Open-Meteo / open.er-api). */
export default function WeatherCard() {
  const { t } = useTranslation()
  const weather = useWeather()
  const fx = useFx()

  const php = fx ? `₱${fx.php.toFixed(2)}` : '…'
  const krw = fx ? `$1=${Math.round(fx.krw).toLocaleString()}원` : '…'

  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-neutral-90">
        <div className="p-s">
          <div className="text-xs text-muted mb-1">
            <i className={`fa-solid ${weather?.icon ?? 'fa-cloud-sun'} mr-1 text-accent-blue`} />
            {t('widgets.weather')}
          </div>
          <div className="text-xl font-bold text-text-normal">{weather ? weather.temp : '…'}</div>
          <Link to="/weather" className="text-xs text-link hover:underline">
            {t('common.more')}
          </Link>
        </div>
        <div className="p-s">
          <div className="text-xs text-muted mb-1">
            <i className="fa-solid fa-money-bill-transfer mr-1 text-accent-green" />
            {t('widgets.exchange')}
          </div>
          <div className="text-xl font-bold text-text-normal">{php}</div>
          <div className="text-[11px] text-subtlest">{krw}</div>
          <Link to="/currency" className="text-xs text-link hover:underline">
            {t('widgets.calculator')}
          </Link>
        </div>
      </div>
    </section>
  )
}
