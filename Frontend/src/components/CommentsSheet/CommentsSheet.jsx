import { useEffect, useRef, useState } from 'react'
import { X, Send } from 'lucide-react'
import { postsApi } from '../../api/client'
import './CommentsSheet.css'

function timeAgo(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/**
 * Bottom-sheet comments panel, shared by PostCard (feed) and ReelCard
 * (Explore). Fetches + owns its own comment list so both callers just
 * mount/unmount it; `onCommentPosted` lets the caller bump its own
 * comments_count badge without refetching the whole post.
 */
export default function CommentsSheet({ postId, onClose, onCommentPosted }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    postsApi
      .getComments(postId)
      .then((data) => {
        if (!cancelled) setComments(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load comments.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function submitComment(e) {
    e.preventDefault()
    const text = commentText.trim()
    if (!text || posting) return
    setPosting(true)
    setError('')
    try {
      const created = await postsApi.addComment(postId, text)
      setComments((prev) => [...prev, created])
      setCommentText('')
      onCommentPosted?.()
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      })
    } catch (err) {
      setError(err.message || 'Could not post your comment.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="comments-sheet__backdrop" onClick={onClose}>
      <div className="comments-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="comments-sheet__header">
          <h3>Comments</h3>
          <button className="comments-sheet__close" onClick={onClose} aria-label="Close comments">
            <X size={20} />
          </button>
        </header>

        <div className="comments-sheet__list" ref={listRef}>
          {loading && <p className="comments-sheet__empty">Loading comments…</p>}
          {!loading && error && <p className="comments-sheet__empty">{error}</p>}
          {!loading && !error && comments.length === 0 && (
            <p className="comments-sheet__empty">No comments yet. Be the first to say something!</p>
          )}
          {!loading &&
            !error &&
            comments.map((c) => {
              const name = c.author_username || c.author_full_name || 'traveler'
              const avatar =
                c.author_avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=ffd5dc`
              return (
                <div className="comments-sheet__row" key={c.id}>
                  <img className="comments-sheet__avatar" src={avatar} alt="" />
                  <div className="comments-sheet__bubble">
                    <span className="comments-sheet__name">
                      {c.author_username ? `@${name}` : name}
                    </span>{' '}
                    <span className="comments-sheet__text">{c.content}</span>
                    <div className="comments-sheet__time">{timeAgo(c.created_at)}</div>
                  </div>
                </div>
              )
            })}
        </div>

        <form className="comments-sheet__form" onSubmit={submitComment}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            disabled={posting}
          />
          <button type="submit" disabled={posting || !commentText.trim()} aria-label="Post comment">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
