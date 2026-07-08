import { useEffect, useRef, useState } from 'react'
import { X, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { storiesApi } from '../../api/client'
import './StoryViewerModal.css'

const PHOTO_DURATION_MS = 5000

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * Props:
 *  - group: { user_id, username, fullName, avatar_url, stories: [...] }
 *  - isOwn: whether the logged-in user owns this story (unlocks the viewers list, skips the /view call)
 *  - onClose()
 */
export default function StoryViewerModal({ group, isOwn, onClose }) {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [viewersOpen, setViewersOpen] = useState(false)
  const [viewers, setViewers] = useState([])
  const [viewersCount, setViewersCount] = useState(0)
  const [viewersLoading, setViewersLoading] = useState(false)

  const rafRef = useRef(null)
  const startRef = useRef(null)
  const elapsedRef = useRef(0)

  const stories = group.stories
  const story = stories[index]
  const durationMs = story.media_type === 'video'
    ? Math.min(Math.max((story.duration_seconds || 5) * 1000, 1000), 45000)
    : PHOTO_DURATION_MS

  function goNext() {
    setViewersOpen(false)
    if (index < stories.length - 1) {
      setIndex((i) => i + 1)
    } else {
      onClose()
    }
  }

  function goPrev() {
    setViewersOpen(false)
    if (index > 0) setIndex((i) => i - 1)
  }

  // Mark viewed (skip for the owner — backend also no-ops this, but skip
  // the network call entirely since it's never meaningful for them).
  useEffect(() => {
    if (!isOwn) {
      storiesApi.view(story.id).catch(() => {})
    }
  }, [story.id, isOwn])

  // Progress bar / auto-advance timer
  useEffect(() => {
    elapsedRef.current = 0
    setProgress(0)
    startRef.current = null

    function tick(ts) {
      if (paused || viewersOpen) {
        startRef.current = null
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      if (startRef.current === null) startRef.current = ts - elapsedRef.current
      elapsedRef.current = ts - startRef.current
      const pct = Math.min((elapsedRef.current / durationMs) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        goNext()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, viewersOpen])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  async function openViewers() {
    setViewersOpen(true)
    setPaused(true)
    setViewersLoading(true)
    try {
      const data = await storiesApi.getViewers(story.id)
      setViewers(data.viewers)
      setViewersCount(data.views_count)
    } catch {
      setViewers([])
      setViewersCount(0)
    } finally {
      setViewersLoading(false)
    }
  }

  function closeViewers() {
    setViewersOpen(false)
    setPaused(false)
  }

  return (
    <div className="story-viewer__backdrop" onClick={onClose}>
      <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="story-viewer__bars">
          {stories.map((s, i) => (
            <div className="story-viewer__bar" key={s.id}>
              <div
                className="story-viewer__bar-fill"
                style={{ width: `${i < index ? 100 : i === index ? progress : 0}%` }}
              />
            </div>
          ))}
        </div>

        <div className="story-viewer__header">
          <img
            className="story-viewer__avatar"
            src={
              group.avatar_url ||
              `https://api.dicebear.com/7.x/adventurer/svg?seed=${group.username || group.user_id}`
            }
            alt=""
          />
          <div className="story-viewer__meta">
            <span className="story-viewer__username">
              {isOwn ? 'Your Story' : group.username ? `@${group.username}` : group.fullName}
            </span>
            <span className="story-viewer__time">{timeAgo(story.created_at)}</span>
          </div>
          <button className="story-viewer__close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div
          className="story-viewer__media"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {story.media_type === 'video' ? (
            <video
              key={story.id}
              src={story.media_url}
              autoPlay
              muted
              playsInline
              className="story-viewer__media-el"
            />
          ) : (
            <img src={story.media_url} alt="" className="story-viewer__media-el" />
          )}

          <button className="story-viewer__nav story-viewer__nav--prev" onClick={goPrev} aria-label="Previous">
            <ChevronLeft size={26} />
          </button>
          <button className="story-viewer__nav story-viewer__nav--next" onClick={goNext} aria-label="Next">
            <ChevronRight size={26} />
          </button>

          {story.caption && <p className="story-viewer__caption">{story.caption}</p>}
        </div>

        {isOwn && (
          <button className="story-viewer__views-pill" onClick={openViewers}>
            <Eye size={16} />
            {story.views_count || 0} {story.views_count === 1 ? 'view' : 'views'}
          </button>
        )}

        {viewersOpen && (
          <div className="story-viewer__viewers-sheet">
            <div className="story-viewer__viewers-header">
              <h3>Viewed by {viewersCount}</h3>
              <button className="story-viewer__close" onClick={closeViewers} aria-label="Close viewers list">
                <X size={18} />
              </button>
            </div>
            <div className="story-viewer__viewers-list">
              {viewersLoading && <p className="story-viewer__viewers-empty">Loading…</p>}
              {!viewersLoading && viewers.length === 0 && (
                <p className="story-viewer__viewers-empty">No views yet.</p>
              )}
              {!viewersLoading &&
                viewers.map((v) => (
                  <div className="story-viewer__viewer-row" key={v.id}>
                    <img
                      className="story-viewer__viewer-avatar"
                      src={
                        v.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.username || v.viewer_id}&backgroundColor=ffd5dc`
                      }
                      alt=""
                    />
                    <span className="story-viewer__viewer-name">
                      @{v.username || v.full_name || 'traveler'}
                    </span>
                    <span className="story-viewer__viewer-time">{timeAgo(v.viewed_at)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
