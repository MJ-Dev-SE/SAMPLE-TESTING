import WeatherCard from './WeatherCard'
import BusinessDirectoryWidget from './BusinessDirectoryWidget'
import RecentBusinessesWidget from './RecentBusinessesWidget'
import StatsCard from './StatsCard'

/** RIGHT sidebar: Weather → Business Directory → Recently registered businesses → Statistics. */
export default function RightSidebar() {
  return (
    <aside className="w-full lg:w-[244px] shrink-0 flex flex-col gap-l">
      <WeatherCard />
      <BusinessDirectoryWidget />
      <RecentBusinessesWidget />
      <StatsCard />
    </aside>
  )
}
