import LoginCard from './LoginCard'
import RecentComments from './RecentComments'
import RecentPhotos from './RecentPhotos'
import EmergencyCard from './EmergencyCard'

/** LEFT sidebar: Login → Recent Comments → Recent photos → Emergency contact. */
export default function LeftSidebar() {
  return (
    <aside className="w-full lg:w-[232px] shrink-0 flex flex-col gap-l">
      <LoginCard />
      <RecentComments />
      <RecentPhotos />
      <EmergencyCard />
    </aside>
  )
}
