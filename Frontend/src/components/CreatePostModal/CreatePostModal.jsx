import { useRef, useState } from 'react'
import { Image as ImageIcon, X, MapPin } from 'lucide-react'
import { postsApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import './CreatePostModal.css'

const MAX_VIDEO_SECONDS = 45

/**
 * Modal used to create a new post. Only reachable from the Profile page's
 * "+" button now — Home no longer has an inline composer. Accepts a photo
 * or a video (video max 45s, also enforced server-side), a caption, and a
 * place name. The place name is what powers search ("Colombo" etc.), so
 * it's front-and-center here rather than optional/buried.
 */
export default function CreatePostModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const authorName = user?.username || user?.full_name || 'traveler'
  const authorAvatar =
    user?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}&backgroundColor=ffd5dc`
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'photo' | 'video'
  const [caption, setCaption] = useState('')
  const [locationName, setLocationName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setError('')

    if (selected.type.startsWith('video/')) {
      // Check duration client-side too, so the user gets instant feedback
      // instead of waiting on the upload -> server 400 round trip.
      const videoEl = document.createElement('video')
      videoEl.preload = 'metadata'
      videoEl.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoEl.src)
        if (videoEl.duration > MAX_VIDEO_SECONDS) {
          setError(`Videos must be ${MAX_VIDEO_SECONDS}s or shorter (this one is ${Math.round(videoEl.duration)}s).`)
          setFile(null)
          setPreview(null)
          setMediaType(null)
        }
      }
      videoEl.src = URL.createObjectURL(selected)
      setMediaType('video')
    } else if (selected.type.startsWith('image/')) {
      setMediaType('photo')
    } else {
      setError('Only image or video files are supported.')
      return
    }

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Choose a photo or video first (videos max 45s).')
      return
    }
    if (!locationName.trim()) {
      setError('Add the place name so others can find this post by searching for it.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const post = await postsApi.create({ file, caption, locationName: locationName.trim() })
      const enrichedPost = {
        ...post,
        author_username: post.author_username || user?.username || undefined,
        author_full_name: post.author_full_name || user?.full_name || authorName,
        author_avatar_url: post.author_avatar_url || user?.avatar_url,
      }
      onCreated?.(enrichedPost)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Could not create post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-post-modal__backdrop" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-post-modal__header">
          <h2>Create a post</h2>
          <button
            type="button"
            className="create-post-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form className="create-post-modal__form" onSubmit={handleSubmit}>
          <div className="create-post-modal__author">
            <img className="create-post-modal__author-avatar" src={authorAvatar} alt="" />
            <span className="create-post-modal__author-name">@{authorName}</span>
          </div>

          <button
            type="button"
            className="create-post-modal__media-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={18} />
            {file ? file.name : 'Add a photo or video (video max 45s)'}
          </button>
          <input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {preview &&
            (mediaType === 'video' ? (
              <video className="create-post-modal__preview" src={preview} controls />
            ) : (
              <img className="create-post-modal__preview" src={preview} alt="" />
            ))}

          <label className="create-post-modal__field">
            <span className="create-post-modal__field-label">
              <MapPin size={14} /> Place name
            </span>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Colombo, Sigiriya, Ella…"
            />
          </label>

          <textarea
            className="create-post-modal__caption"
            placeholder="Write a caption for this place…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />

          {error && <p className="create-post-modal__error">{error}</p>}

          <button type="submit" className="create-post-modal__submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  )
}
