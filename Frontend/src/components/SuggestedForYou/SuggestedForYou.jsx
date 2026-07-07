import { useState } from 'react'
import { X } from 'lucide-react'
import { suggestedAccounts } from '../../data/discoveryData'
import './SuggestedForYou.css'

export default function SuggestedForYou() {
  const [dismissed, setDismissed] = useState([])

  const visible = suggestedAccounts.filter((a) => !dismissed.includes(a.id))

  return (
    <div className="suggested">
      <div className="suggested__header">
        <h3 className="suggested__title">Suggested for you</h3>
        <a href="#all-suggestions" className="suggested__see-all">
          See all
        </a>
      </div>

      <div className="suggested__list">
        {visible.map((account) => (
          <div className="suggested__item" key={account.id}>
            <img className="suggested__avatar" src={account.avatar} alt="" />
            <div className="suggested__info">
              <span className="suggested__name">{account.name}</span>
              <span className="suggested__handle">{account.handle}</span>
            </div>
            <button className="suggested__follow">Follow</button>
            <button
              className="suggested__dismiss"
              aria-label={`Dismiss suggestion for ${account.name}`}
              onClick={() => setDismissed((prev) => [...prev, account.id])}
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="suggested__empty">You're all caught up.</p>
        )}
      </div>
    </div>
  )
}
