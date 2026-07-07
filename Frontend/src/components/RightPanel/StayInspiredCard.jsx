import './StayInspiredCard.css'

export default function StayInspiredCard() {
  return (
    <div className="stay-inspired">
      <div className="stay-inspired__illustration">
        <svg viewBox="0 0 320 170" className="stay-inspired__svg" aria-hidden="true">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6f3fe0" />
              <stop offset="100%" stopColor="#3d2470" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="320" height="170" fill="url(#sky)" />
          {[...Array(18)].map((_, i) => (
            <circle
              key={i}
              cx={(i * 47 + 20) % 320}
              cy={(i * 29 + 10) % 90}
              r={i % 3 === 0 ? 1.6 : 1}
              fill="#ffffff"
              opacity={0.5}
            />
          ))}
          <polygon points="0,140 60,80 100,120 150,55 210,120 260,90 320,140 320,170 0,170" fill="#8a68e8" opacity="0.55" />
          <polygon points="0,150 90,100 140,135 190,90 250,135 320,105 320,170 0,170" fill="#5c3bc4" />
          <rect x="0" y="150" width="320" height="20" fill="#432f9c" opacity="0.8" />
        </svg>

        <div className="stay-inspired__pin">
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
            <path
              d="M17 0C7.6 0 0 7.6 0 17c0 11.5 17 25 17 25s17-13.5 17-25C34 7.6 26.4 0 17 0z"
              fill="#6d3ce9"
            />
            <path
              d="M17 8l1.9 5.8H25l-4.9 3.6 1.9 5.8-4.9-3.6-4.9 3.6 1.9-5.8L9.1 13.8h6.1z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </div>

      <div className="stay-inspired__content">
        <h3 className="stay-inspired__title">Stay inspired</h3>
        <p className="stay-inspired__desc">
          Follow guides, explore new places, and unlock exclusive rewards.
        </p>
        <button className="stay-inspired__cta">Explore Guides</button>
      </div>
    </div>
  )
}
