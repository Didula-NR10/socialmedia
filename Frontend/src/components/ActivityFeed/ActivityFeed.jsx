import { useState } from 'react'
import FilterTabs from '../FilterTabs/FilterTabs'
import FeedCard from './FeedCard'
import { newForYou, earlier } from '../../data/feedData'
import './ActivityFeed.css'

export default function ActivityFeed() {
  const [activeTab, setActiveTab] = useState('All')

  return (
    <section className="activity-feed">
      <FilterTabs active={activeTab} onChange={setActiveTab} />

      <div className="activity-feed__section">
        <h2 className="activity-feed__heading">New for you</h2>
        <div className="activity-feed__list">
          {newForYou.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="activity-feed__section">
        <h2 className="activity-feed__heading">Earlier</h2>
        <div className="activity-feed__list">
          {earlier.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
