import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { storiesApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import './Stories.css'

function groupByUser(stories) {
  const map = new Map()
  for (const story of stories) {
    const key = story.user_id
    if (!map.has(key)) {
      map.set(key, {
        user_id: key,
        username: story.author_username,
        fullName: story.author_full_name,
        avatar_url: story.author_avatar_url,
        stories: [],
      })
    }
    map.get(key).stories.push(story)
  }
  return Array.from(map.values())
}

export default function Stories() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function loadStories() {
    try {
      const raw = await storiesApi.getFeed()
      setGroups(groupByUser(raw))
    } catch {
      setGroups([])
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  function handleAddStoryClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setUploading(true)
    try {
      await storiesApi.create({ file })
      await loadStories()
    } catch (err) {
      alert(err.message || 'Could not upload story.')
    } finally {
      setUploading(false)
    }
  }

  async function handleViewStory(group) {
    // Marks the newest story from this user as viewed. A full story-viewer
    // modal (tap-to-advance, progress bars) is the natural next step here —
    // this wires the "view" call so unseen/seen state works end to end.
    const latest = group.stories[group.stories.length - 1]
    try {
      await storiesApi.view(latest.id)
    } catch {
      // non-fatal
    }
  }

  return (
    <div className="stories">
      <div className="stories__item">
        <button
          className="stories__avatar-btn stories__avatar-btn--self"
          aria-label="Add your story"
          onClick={handleAddStoryClick}
          disabled={uploading}
        >
          <span className="stories__avatar-fallback">
            <Plus size={18} />
          </span>
          <span className="stories__plus">
            <Plus size={12} strokeWidth={3} />
          </span>
        </button>
        <span className="stories__label">{uploading ? 'Uploading…' : 'Your Story'}</span>
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />
      </div>

      {groups
        .filter((g) => g.user_id !== user?.id)
        .map((group) => (
          <div className="stories__item" key={group.user_id}>
            <button className="stories__avatar-btn" onClick={() => handleViewStory(group)}>
              <img
                className="stories__avatar"
                src={
                  group.avatar_url ||
                  `https://api.dicebear.com/7.x/adventurer/svg?seed=${group.username || group.user_id}`
                }
                alt={group.username || 'traveler'}
              />
            </button>
            <span className="stories__label">
              {group.username ? `@${group.username}` : group.fullName || 'traveler'}
            </span>
          </div>
        ))}
    </div>
  )
}
