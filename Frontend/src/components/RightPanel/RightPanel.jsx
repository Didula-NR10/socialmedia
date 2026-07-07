import StayInspiredCard from './StayInspiredCard'
import QuickStats from './QuickStats'
import TrendingGuides from './TrendingGuides'
import './RightPanel.css'

export default function RightPanel() {
  return (
    <aside className="right-panel">
      <StayInspiredCard />
      <QuickStats />
      <TrendingGuides />
    </aside>
  )
}
