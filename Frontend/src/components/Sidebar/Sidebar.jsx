import { NavLink, Link } from 'react-router-dom'
import { X, MapPin } from 'lucide-react'
import { navItems } from '../../data/navItems'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onClose} />}

      <nav className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__mobile-header">
          <span className="sidebar__mobile-title">Menu</span>
          <button
            className="sidebar__close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <ul className="sidebar__list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                  }
                >
                  <Icon size={20} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>

        <div className="sidebar__promo">
          <h3 className="sidebar__promo-title">Plan your next adventure</h3>
          <p className="sidebar__promo-desc">
            Save places, create itineraries and share unforgettable moments.
          </p>
          <Link to="/plan" className="sidebar__promo-cta" onClick={onClose}>
            Create a Trip
          </Link>

          <svg className="sidebar__promo-art" viewBox="0 0 220 120" aria-hidden="true">
            <polygon points="0,110 40,55 70,90 110,35 150,90 180,60 220,110" fill="#c9b8f5" opacity="0.55" />
            <polygon points="0,120 55,70 95,100 135,60 175,100 220,75 220,120" fill="#7b3fe4" opacity="0.85" />
          </svg>
          <span className="sidebar__promo-pin">
            <MapPin size={16} fill="#7b3fe4" color="#ffffff" />
          </span>
        </div>
      </nav>
    </>
  )
}
