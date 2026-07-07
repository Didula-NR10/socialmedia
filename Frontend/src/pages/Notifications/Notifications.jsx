import ActivityFeed from '../../components/ActivityFeed/ActivityFeed'
import RightPanel from '../../components/RightPanel/RightPanel'

export default function Notifications() {
  return (
    <div className="page-with-rail">
      <div>
        <ActivityFeed />
      </div>
      <div className="page-with-rail__right">
        <RightPanel />
      </div>
    </div>
  )
}
