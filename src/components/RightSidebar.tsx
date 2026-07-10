import WeatherCard from './WeatherCard'
import TravelInfoCard from './TravelInfoCard'
import BusinessDirectoryWidget from './BusinessDirectoryWidget'
import RecentBusinessesWidget from './RecentBusinessesWidget'
import StatsCard from './StatsCard'

/** RIGHT sidebar: Weather → Travel Info → Business Directory → Recently registered businesses → Statistics. */
export default function RightSidebar() {
  return (
    <aside className="w-full lg:w-[244px] shrink-0 flex flex-col gap-l">
      <WeatherCard />
      <TravelInfoCard />
      <BusinessDirectoryWidget />
      <RecentBusinessesWidget />
      <StatsCard />
    </aside>
  )
}
