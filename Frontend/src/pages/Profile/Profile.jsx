import { useEffect, useState } from 'react'
import { Pencil, Globe, Grid3x3, Bookmark, Tag, Check, X, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { profileApi, postsApi } from '../../api/client'
import CreatePostModal from '../../components/CreatePostModal/CreatePostModal'
import PostViewerModal from '../../components/PostViewerModal/PostViewerModal'
import './Profile.css'

const TABS = [
  { id: 'posts', label: 'Posts', icon: Grid3x3 },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'tagged', label: 'Tagged', icon: Tag },
]

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingPost, setViewingPost] = useState(null)

  useEffect(() => {
    if (!user) return
    setUsername(user.username || '')
    setBio(user.bio || '')
    postsApi
      .getUserPosts(user.id)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false))
  }, [user])

  if (!user) return null

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await profileApi.update({ username: username || undefined, bio: bio || undefined })
      await refreshProfile()
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  function handlePostCreated(post) {
    setPosts((prev) => [post, ...prev])
    refreshProfile()
  }

  function handlePostDeleted(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setViewingPost(null)
    refreshProfile()
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await profileApi.updateAvatar(file)
      await refreshProfile()
    } catch (err) {
      alert(err.message || 'Could not update photo.')
    }
  }

  return (
    <div className="profile">
      <div className="profile__header">
        <label className="profile__avatar-wrap" style={{ cursor: 'pointer' }}>
          <img
            className="profile__avatar"
            src={
              user.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}&backgroundColor=ffd5dc`
            }
            alt={user.username || user.full_name}
          />
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </label>

        <div className="profile__identity">
          <div className="profile__name-row">
            <h1 className="profile__handle">@{user.username || user.full_name}</h1>
            {user.is_verified && <span className="profile__badge">VERIFIED</span>}
          </div>

          {!editing ? (
            <>
              <p className="profile__bio">{user.bio || 'No bio yet.'}</p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                rows={2}
              />
              {error && <p style={{ color: '#d3311e', fontSize: 13 }}>{error}</p>}
            </div>
          )}
        </div>

        <div className="profile__side">
          <div className="profile__actions">
            <button
              className="profile__add-post-btn"
              onClick={() => setShowCreateModal(true)}
              aria-label="Create a new post"
              title="Create a new post"
            >
              <Plus size={20} />
            </button>
            {!editing ? (
              <button className="profile__edit-btn" onClick={() => setEditing(true)}>
                <Pencil size={15} /> Edit Profile
              </button>
            ) : (
              <>
                <button className="profile__edit-btn" onClick={handleSave} disabled={saving}>
                  <Check size={15} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="profile__share-btn" onClick={() => setEditing(false)}>
                  <X size={15} /> Cancel
                </button>
              </>
            )}
          </div>

          <div className="profile__stats">
            <div className="profile__stat">
              <span className="profile__stat-value">{user.posts_count ?? 0}</span>
              <span className="profile__stat-label">Posts</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value">{user.followers_count ?? 0}</span>
              <span className="profile__stat-label">Followers</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value">{user.following_count ?? 0}</span>
              <span className="profile__stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile__tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              className={`profile__tab ${isActive ? 'profile__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'posts' && (
        <div className="profile__grid">
          {loadingPosts && <p className="profile__empty">Loading…</p>}
          {!loadingPosts && posts.length === 0 && (
            <p className="profile__empty">
              You haven't posted anything yet. Tap the + button above to share your first place.
            </p>
          )}
          {!loadingPosts &&
            posts.map((post) => (
              <button
                type="button"
                className="profile__grid-item"
                key={post.id}
                onClick={() => setViewingPost(post)}
                aria-label="View post"
              >
                {post.media_type === 'video' ? (
                  <img src={post.thumbnail_url} alt="" />
                ) : (
                  <img src={post.media_url} alt="" />
                )}
              </button>
            ))}
        </div>
      )}

      {activeTab === 'saved' && (
        <p className="profile__empty">Posts you save will show up here.</p>
      )}

      {activeTab === 'tagged' && (
        <p className="profile__empty">Photos and posts you're tagged in will show up here.</p>
      )}

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={handlePostCreated} />
      )}

      {viewingPost && (
        <PostViewerModal
          post={viewingPost}
          author={user}
          onClose={() => setViewingPost(null)}
          onDeleted={handlePostDeleted}
        />
      )}
    </div>
  )
}
