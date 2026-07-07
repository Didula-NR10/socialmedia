import { Award, TrainFront } from 'lucide-react'
import './FeedCard.css'

const ICONS = {
  award: Award,
  train: TrainFront,
}

function FeedText({ content }) {
  return (
    <p className="feed-card__text">
      {content.before && (
        <span className={content.boldBefore ? 'feed-card__bold' : ''}>
          {content.before}{' '}
        </span>
      )}
      {content.middle && <span>{content.middle} </span>}
      {content.boldMiddle && (
        <span className="feed-card__bold">{content.boldMiddle} </span>
      )}
      {content.link && (
        <a href="#guide" className="feed-card__link">
          {content.link}
        </a>
      )}
      {content.end && <span> {content.end}</span>}
      {content.emoji && <span> {content.emoji}</span>}
    </p>
  )
}

export default function FeedCard({ item }) {
  const IconComponent = item.icon ? ICONS[item.icon] : null

  return (
    <div
      className={`feed-card ${item.highlighted ? 'feed-card--highlighted' : ''}`}
    >
      <div className="feed-card__media">
        {item.avatar ? (
          <img className="feed-card__avatar" src={item.avatar} alt="" />
        ) : (
          IconComponent && (
            <span className="feed-card__icon-badge">
              <IconComponent size={20} />
            </span>
          )
        )}
      </div>

      <div className="feed-card__body">
        <FeedText content={item.content} />

        {item.actions && (
          <div className="feed-card__actions">
            {item.actions.map((action) => (
              <button
                key={action.label}
                className={`feed-card__action feed-card__action--${action.variant}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <span className="feed-card__time">{item.time}</span>
      </div>

      {item.thumbnail && (
        <img className="feed-card__thumbnail" src={item.thumbnail} alt="" />
      )}

      {item.unread && <span className="feed-card__dot" aria-hidden="true" />}
    </div>
  )
}
