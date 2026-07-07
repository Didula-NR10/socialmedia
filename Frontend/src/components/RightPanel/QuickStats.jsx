import { quickStats } from '../../data/rightPanelData'
import './QuickStats.css'

export default function QuickStats() {
  return (
    <div className="quick-stats">
      <h3 className="quick-stats__title">Quick Stats</h3>
      <div className="quick-stats__grid">
        {quickStats.map(({ id, label, value, icon: Icon }) => (
          <div className="quick-stats__item" key={id}>
            <span className="quick-stats__icon">
              <Icon size={20} />
            </span>
            <span className="quick-stats__value">{value}</span>
            <span className="quick-stats__label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
