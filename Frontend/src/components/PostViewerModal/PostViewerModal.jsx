import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2, X } from 'lucide-react'
import { postsApi } from '../../api/client'
import './PostViewerModal.css'

/**
 * Opened when a post is clicked from the Profile page's grid. Deliberately
 * does not show likes or comments — this is the owner's own management
 * view of the post, not the public feed view. The only action available
 * here is deleting the post via the 3-dot menu.
 */
export default function PostViewerModal({ post, author, onClose, onDeleted }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const authorName = author?.username || author?.full_name || 'traveler'
  const avatar =
    author?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}&backgroundColor=ffd5dc`

  async function handleDelete() {
    if (deleting) return
    const confirmed = window.confirm('Delete this post? This cannot be undone.')
    if (!confirmed) return
    setDeleting(true)
    setError('')
    try {
      await postsApi.remove(post.id)
      onDeleted?.(post.id)
    } catch (err) {
      setError(err.message || 'Could not delete this post.')
      setDeleting(false)
    }
  }

  return (
    <div className="post-viewer-modal__backdrop" onClick={onClose}>
      <div className="post-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-viewer-modal__media">
          {post.media_type === 'video' ? (
            <video className="post-viewer-modal__media-el" src={post.media_url} controls autoPlay />
          ) : (
            <img className="post-viewer-modal__media-el" src={post.media_url} alt="" />
          )}
        </div>

        <div className="post-viewer-modal__panel">
          <div className="post-viewer-modal__header">
            <div className="post-viewer-modal__author">
              <img className="post-viewer-modal__avatar" src={avatar} alt="" />
              <div>
                <p className="post-viewer-modal__author-name">@{authorName}</p>
                {post.location_name && (
                  <p className="post-viewer-modal__location">{post.location_name}</p>
                )}
              </div>
            </div>

            <div className="post-viewer-modal__header-actions" ref={menuRef}>
              <button
                type="button"
                className="post-viewer-modal__more"
                aria-label="More options"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={20} />
              </button>
              {menuOpen && (
                <div className="post-viewer-modal__menu">
                  <button
                    type="button"
                    className="post-viewer-modal__menu-item post-viewer-modal__menu-item--danger"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 size={15} /> {deleting ? 'Deleting…' : 'Delete post'}
                  </button>
                </div>
              )}
              <button
                type="button"
                className="post-viewer-modal__close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {post.caption && <p className="post-viewer-modal__caption">{post.caption}</p>}

          {error && <p className="post-viewer-modal__error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
