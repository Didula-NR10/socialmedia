import { trendingDestinations } from '../../data/discoveryData'
import './TrendingDestinations.css'

export default function TrendingDestinations() {
  return (
    <div className="trending-dest">
      <div className="trending-dest__header">
        <h3 className="trending-dest__title">Trending destinations</h3>
        <a href="#all-destinations" className="trending-dest__see-all">
          See all
        </a>
      </div>

      <div className="trending-dest__list">
        {trendingDestinations.map((dest) => (
          <a href="#destination" className="trending-dest__item" key={dest.id}>
            <img className="trending-dest__thumb" src={dest.image} alt="" />
            <div className="trending-dest__info">
              <span className="trending-dest__name">{dest.name}</span>
              <span className="trending-dest__posts">{dest.posts}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
