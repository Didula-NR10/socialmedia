import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { followApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import './FollowListModal.css'

/**
 * `mode`: 'followers' | 'following' — which list to fetch for `userId`.
 * Each row shows a Follow/Following button relative to the *logged-in*
 * user (backend already computes `is_following` that way), so you can
 * follow someone straight from your own — or anyone else's — list.
 */
export default function FollowListModal({ userId, mode, onClose }) {
  const { user: currentUser, refreshProfile } = useAuth()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingIds, setPendingIds] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const fetcher = mode === 'followers' ? followApi.getFollowers : followApi.getFollowing
    fetcher(userId)
      .then((data) => {
        if (!cancelled) setPeople(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load this list.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, mode])

  async function toggleFollow(person) {
    setPendingIds((prev) => new Set(prev).add(person.id))
    const nextFollowing = !person.is_following
    setPeople((prev) =>
      prev.map((p) => (p.id === person.id ? { ...p, is_following: nextFollowing } : p))
    )
    try {
      if (nextFollowing) await followApi.follow(person.id)
      else await followApi.unfollow(person.id)
      // Keep the logged-in user's own followers/following counts in sync
      // if they're looking at their own profile behind this modal.
      if (userId === currentUser?.id) await refreshProfile()
    } catch (err) {
      // revert on failure
      setPeople((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, is_following: !nextFollowing } : p))
      )
      alert(err.message || 'Could not update follow status.')
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(person.id)
        return next
      })
    }
  }

  return (
    <div className="follow-modal__backdrop" onClick={onClose}>
      <div className="follow-modal" onClick={(e) => e.stopPropagation()}>
        <header className="follow-modal__header">
          <h2>{mode === 'followers' ? 'Followers' : 'Following'}</h2>
          <button className="follow-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="follow-modal__body">
          {loading && <p className="follow-modal__empty">Loading…</p>}
          {!loading && error && <p className="follow-modal__empty">{error}</p>}
          {!loading && !error && people.length === 0 && (
            <p className="follow-modal__empty">
              {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          )}

          {!loading &&
            people.map((person) => {
              const isSelf = person.id === currentUser?.id
              return (
                <div className="follow-modal__row" key={person.id}>
                  <img
                    className="follow-modal__avatar"
                    src={
                      person.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username || person.full_name}&backgroundColor=ffd5dc`
                    }
                    alt=""
                  />
                  <div className="follow-modal__info">
                    <p className="follow-modal__username">@{person.username || person.full_name}</p>
                    {person.bio && <p className="follow-modal__bio">{person.bio}</p>}
                  </div>
                  {!isSelf && (
                    <button
                      className={`follow-modal__btn ${person.is_following ? 'follow-modal__btn--following' : ''}`}
                      onClick={() => toggleFollow(person)}
                      disabled={pendingIds.has(person.id)}
                    >
                      {person.is_following ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
