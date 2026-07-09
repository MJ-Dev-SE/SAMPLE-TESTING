import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exchange, weather } from '../data/home'

/** Sidebar weather + exchange-rate card. */
export default function WeatherCard() {
  const { t } = useTranslation()
  return (
    <section className="border border-neutral-90 rounded-l overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-neutral-90">
        <div className="p-s">
          <div className="text-xs text-muted mb-1">
            <i className="fa-solid fa-cloud-sun mr-1 text-accent-blue" />
            {t('widgets.weather')}
          </div>
          <div className="text-xl font-bold text-text-normal">{weather.temp}</div>
          <Link to={weather.moreHref} className="text-xs text-link hover:underline">
            {t('common.more')}
          </Link>
        </div>
        <div className="p-s">
          <div className="text-xs text-muted mb-1">
            <i className="fa-solid fa-money-bill-transfer mr-1 text-accent-green" />
            {t('widgets.exchange')}
          </div>
          <div className="text-xl font-bold text-text-normal">{exchange.php}</div>
          <div className="text-[11px] text-subtlest">{exchange.usdToKrw}</div>
          <Link to={exchange.calcHref} className="text-xs text-link hover:underline">
            {t('widgets.calculator')}
          </Link>
        </div>
      </div>
    </section>
  )
}
