import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Play, Search, SlidersHorizontal, Bell, ChevronDown, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

export default function Header({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  function handleSearchSubmit(e) {
    e.preventDefault()
    const term = searchTerm.trim()
    if (!term) return
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <header className="header">
      <div className="header__left">
        <button
          className="header__menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/" className="header__logo">
          <Sparkles className="header__logo-icon" size={22} strokeWidth={2.4} />
          <span className="header__logo-text">Rawana Ceylon</span>
          <Play className="header__logo-play" size={16} fill="currentColor" />
        </Link>
      </div>

      <form className="header__search" onSubmit={handleSearchSubmit}>
        <Search size={18} className="header__search-icon" />
        <input
          type="text"
          className="header__search-input"
          placeholder="Explore ancient kingdoms, hidden gems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="header__search-filter" aria-label="Search">
          <SlidersHorizontal size={16} />
        </button>
      </form>

      <div className="header__right">
        <Link to="/notifications" className="header__icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="header__badge">3</span>
        </Link>

        <Link to="/profile" className="header__profile" aria-label="Open your profile">
          <img
            className="header__avatar"
            src={
              user?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name || 'Traveler'}&backgroundColor=ffd5dc`
            }
            alt="Your profile"
          />
          <ChevronDown size={16} className="header__chevron" />
        </Link>
      </div>
    </header>
  )
}
