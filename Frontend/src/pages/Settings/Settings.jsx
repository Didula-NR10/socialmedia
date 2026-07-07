import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Bell, Shield, Palette, ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Settings.css'

const initialToggles = {
  emailUpdates: true,
  pushLikes: true,
  pushFollows: true,
  privateProfile: false,
  showActivityStatus: true,
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      className={`settings-toggle ${checked ? 'settings-toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span className="settings-toggle__thumb" />
    </button>
  )
}

export default function Settings() {
  const [toggles, setToggles] = useState(initialToggles)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const flip = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }))

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>
      <p className="settings__subtitle">Manage your account, notifications, and privacy.</p>

      <section className="settings__section">
        <div className="settings__section-header">
          <User size={18} />
          <h2>Account</h2>
        </div>
        <button className="settings__row settings__row--link">
          <div>
            <p className="settings__row-label">Personal information</p>
            <p className="settings__row-desc">Name, username, bio, and website</p>
          </div>
          <ChevronRight size={18} />
        </button>
        <button className="settings__row settings__row--link">
          <div>
            <p className="settings__row-label">Password and security</p>
            <p className="settings__row-desc">Change your password, enable two-factor login</p>
          </div>
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="settings__section">
        <div className="settings__section-header">
          <Bell size={18} />
          <h2>Notifications</h2>
        </div>
        <div className="settings__row">
          <div>
            <p className="settings__row-label">Email updates</p>
            <p className="settings__row-desc">Guide publishes and weekly digests</p>
          </div>
          <Toggle
            checked={toggles.emailUpdates}
            onChange={() => flip('emailUpdates')}
            label="Email updates"
          />
        </div>
        <div className="settings__row">
          <div>
            <p className="settings__row-label">Likes</p>
            <p className="settings__row-desc">When someone likes your post</p>
          </div>
          <Toggle
            checked={toggles.pushLikes}
            onChange={() => flip('pushLikes')}
            label="Likes notifications"
          />
        </div>
        <div className="settings__row">
          <div>
            <p className="settings__row-label">New followers</p>
            <p className="settings__row-desc">When someone follows you</p>
          </div>
          <Toggle
            checked={toggles.pushFollows}
            onChange={() => flip('pushFollows')}
            label="Follow notifications"
          />
        </div>
      </section>

      <section className="settings__section">
        <div className="settings__section-header">
          <Shield size={18} />
          <h2>Privacy</h2>
        </div>
        <div className="settings__row">
          <div>
            <p className="settings__row-label">Private profile</p>
            <p className="settings__row-desc">Only approved followers can see your posts</p>
          </div>
          <Toggle
            checked={toggles.privateProfile}
            onChange={() => flip('privateProfile')}
            label="Private profile"
          />
        </div>
        <div className="settings__row">
          <div>
            <p className="settings__row-label">Show activity status</p>
            <p className="settings__row-desc">Let others see when you're active</p>
          </div>
          <Toggle
            checked={toggles.showActivityStatus}
            onChange={() => flip('showActivityStatus')}
            label="Show activity status"
          />
        </div>
      </section>

      <section className="settings__section">
        <div className="settings__section-header">
          <Palette size={18} />
          <h2>Appearance</h2>
        </div>
        <button className="settings__row settings__row--link">
          <div>
            <p className="settings__row-label">Theme</p>
            <p className="settings__row-desc">Light</p>
          </div>
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="settings__section">
        <button className="settings__logout-btn" onClick={handleLogout}>
          <LogOut size={17} /> Log out
        </button>
      </section>
    </div>
  )
}
