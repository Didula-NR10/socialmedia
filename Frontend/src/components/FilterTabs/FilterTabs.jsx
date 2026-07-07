import './FilterTabs.css'

const TABS = ['All', 'Likes', 'Follows', 'Guides']

export default function FilterTabs({ active, onChange }) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Filter activity">
      {TABS.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          className={`filter-tabs__pill ${
            active === tab ? 'filter-tabs__pill--active' : ''
          }`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
