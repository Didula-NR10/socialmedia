import { NavLink } from 'react-router-dom'
import { Home, Compass, Search, Bell, User } from 'lucide-react'
import './MobileNav.css'

const items = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'explore', label: 'Explore', icon: Compass, path: '/explore' },
  { id: 'search', label: 'Search', icon: Search, path: '/search' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
]

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
            }
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
