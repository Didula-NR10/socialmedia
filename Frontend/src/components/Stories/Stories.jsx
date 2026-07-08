import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { storiesApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StoryViewerModal from '../StoryViewerModal/StoryViewerModal'
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
  const [viewerGroup, setViewerGroup] = useState(null) // { group, isOwn }
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

  const myGroup = groups.find((g) => g.user_id === user?.id) || null
  const otherGroups = groups.filter((g) => g.user_id !== user?.id)

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

  function handleYourStoryClick() {
    // Already have an active story -> open it (my-story view with viewers).
    // Otherwise this tile IS the "add a story" button.
    if (myGroup) {
      setViewerGroup({ group: myGroup, isOwn: true })
    } else {
      handleAddStoryClick()
    }
  }

  function handleCloseViewer() {
    setViewerGroup(null)
    // Story count/expiry may have changed while the viewer was open.
    loadStories()
  }

  return (
    <div className="stories">
      <div className="stories__item">
        <button
          className={`stories__avatar-btn stories__avatar-btn--self ${
            myGroup ? 'stories__avatar-btn--has-story' : ''
          }`}
          aria-label={myGroup ? 'View your story' : 'Add your story'}
          onClick={handleYourStoryClick}
          disabled={uploading}
        >
          {myGroup ? (
            <img
              className="stories__avatar"
              src={
                myGroup.avatar_url ||
                user?.avatar_url ||
                `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || user?.id}`
              }
              alt=""
            />
          ) : (
            <span className="stories__avatar-fallback">
              <Plus size={18} />
            </span>
          )}
          <span
            className="stories__plus"
            role="button"
            aria-label="Add another story"
            onClick={(e) => {
              e.stopPropagation()
              handleAddStoryClick()
            }}
          >
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

      {otherGroups.map((group) => (
        <div className="stories__item" key={group.user_id}>
          <button
            className="stories__avatar-btn"
            onClick={() => setViewerGroup({ group, isOwn: false })}
          >
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

      {viewerGroup && (
        <StoryViewerModal
          group={viewerGroup.group}
          isOwn={viewerGroup.isOwn}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  )
}
