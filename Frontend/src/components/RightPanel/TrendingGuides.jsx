import { trendingGuides } from '../../data/rightPanelData'
import './TrendingGuides.css'

export default function TrendingGuides() {
  return (
    <div className="trending-guides">
      <div className="trending-guides__header">
        <h3 className="trending-guides__title">Trending Guides</h3>
        <a href="#all-guides" className="trending-guides__view-all">
          View all
        </a>
      </div>

      <div className="trending-guides__list">
        {trendingGuides.map((guide) => (
          <a href="#guide" className="trending-guides__item" key={guide.id}>
            <img
              className="trending-guides__thumb"
              src={guide.thumbnail}
              alt=""
            />
            <div className="trending-guides__info">
              <span className="trending-guides__name">{guide.title}</span>
              <span className="trending-guides__views">{guide.views}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
