import { useState } from 'react'
import { followApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import './FollowButton.css'

/**
 * Drop-in follow button for anywhere a post/reel author shows up.
 * Hides itself when the author is the logged-in user (can't follow
 * yourself). Optimistically toggles, reverts on failure, and refreshes
 * the logged-in user's own profile counts if they're the one acting.
 */
export default function FollowButton({ userId, initialIsFollowing = false, size = 'sm' }) {
  const { user: currentUser, refreshProfile } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [busy, setBusy] = useState(false)

  if (!userId || userId === currentUser?.id) return null

  async function handleClick(e) {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const next = !isFollowing
    setIsFollowing(next)
    try {
      if (next) await followApi.follow(userId)
      else await followApi.unfollow(userId)
      await refreshProfile()
    } catch (err) {
      setIsFollowing(!next)
      alert(err.message || 'Could not update follow status.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={`follow-btn follow-btn--${size} ${isFollowing ? 'follow-btn--following' : ''}`}
      onClick={handleClick}
      disabled={busy}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
