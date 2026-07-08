import { useRef, useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX } from 'lucide-react'
import { postsApi } from '../../api/client'
import FollowButton from '../FollowButton/FollowButton'
import './ReelCard.css'

/**
 * Renders one video post in the Explore feed. Works exactly like an
 * Instagram Reel: autoplaying muted video, like/comment/share wired to the
 * real backend so if user X posts a video, user Y sees it here (and can
 * like/comment on it) the next time they open Explore.
 */
export default function ReelCard({ post }) {
  const videoRef = useRef(null)
  const [liked, setLiked] = useState(!!post.liked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [muted, setMuted] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  const author = post.author_username || post.author_full_name || 'traveler'
  const isUsername = !!post.author_username
  const avatar =
    post.author_avatar_url ||
    `https://api.dicebear.com/7.x/shapes/svg?seed=${author}&backgroundColor=7b3fe4`

  function toggleMute() {
    setMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m
      return !m
    })
  }

  async function toggleLike() {
    if (busy) return
    setBusy(true)
    const next = !liked
    setLiked(next)
    setLikesCount((c) => c + (next ? 1 : -1))
    try {
      if (next) await postsApi.like(post.id)
      else await postsApi.unlike(post.id)
    } catch {
      setLiked(!next)
      setLikesCount((c) => c - (next ? 1 : -1))
    } finally {
      setBusy(false)
    }
  }

  async function toggleComments() {
    const willShow = !showComments
    setShowComments(willShow)
    if (willShow && comments.length === 0) {
      setLoadingComments(true)
      try {
        const data = await postsApi.getComments(post.id)
        setComments(data)
      } catch {
        setComments([])
      } finally {
        setLoadingComments(false)
      }
    }
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      const created = await postsApi.addComment(post.id, commentText.trim())
      setComments((prev) => [...prev, created])
      setCommentsCount((c) => c + 1)
      setCommentText('')
    } catch {
      // silently ignore for now
    }
  }

  async function handleShare() {
    try {
      await postsApi.share(post.id)
    } catch {
      // ignore
    }
  }

  return (
    <section className="reel">
      <video
        ref={videoRef}
        className="reel__video"
        src={post.media_url}
        poster={post.thumbnail_url}
        autoPlay
        loop
        muted={muted}
        playsInline
        onClick={toggleMute}
      />
      <div className="reel__overlay" />

      {post.location_name && <span className="reel__category">{post.location_name}</span>}

      <button
        className="reel__mute"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <div className="reel__content">
        <div className="reel__info">
          <div className="reel__author-row">
            <img className="reel__avatar" src={avatar} alt="" />
            <div className="reel__author-text">
              <span className="reel__author-name">{isUsername ? `@${author}` : author}</span>
            </div>
            <FollowButton userId={post.user_id} initialIsFollowing={!!post.author_is_following} size="sm" />
          </div>

          {post.caption && <p className="reel__caption">{post.caption}</p>}
        </div>

        <div className="reel__actions">
          <button
            className={`reel__action ${liked ? 'reel__action--liked' : ''}`}
            onClick={toggleLike}
            aria-label="Like"
          >
            <Heart size={26} fill={liked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
          <button className="reel__action" aria-label="Comment" onClick={toggleComments}>
            <MessageCircle size={24} />
            <span>{commentsCount}</span>
          </button>
          <button className="reel__action" aria-label="Share" onClick={handleShare}>
            <Send size={24} />
            <span>{post.shares_count || 0}</span>
          </button>
          <button className="reel__action" aria-label="Save">
            <Bookmark size={24} />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="reel__comments-panel">
          {loadingComments && <p>Loading comments…</p>}
          {!loadingComments &&
            comments.map((c) => (
              <p key={c.id} className="reel__comment">
                {c.content}
              </p>
            ))}
          <form onSubmit={submitComment} className="reel__comment-form">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
            />
            <button type="submit">Post</button>
          </form>
        </div>
      )}
    </section>
  )
}
