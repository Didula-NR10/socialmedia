import { useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import { postsApi } from '../../api/client'
import FollowButton from '../FollowButton/FollowButton'
import CommentsSheet from '../CommentsSheet/CommentsSheet'
import './PostCard.css'

function timeAgo(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(!!post.liked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [busy, setBusy] = useState(false)

  const author = post.author_username || post.author_full_name || 'traveler'
  const isUsername = !!post.author_username
  const avatar =
    post.author_avatar_url ||
    `https://api.dicebear.com/7.x/shapes/svg?seed=${author}&backgroundColor=7b3fe4`

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

  function toggleComments() {
    setShowComments((v) => !v)
  }

  async function handleShare() {
    try {
      await postsApi.share(post.id)
    } catch {
      // ignore
    }
  }

  return (
    <article className="post-card">
      <header className="post-card__header">
        <div className="post-card__author">
          <img className="post-card__avatar" src={avatar} alt="" />
          <div>
            <p className="post-card__author-name">{isUsername ? `@${author}` : author}</p>
            <p className="post-card__location">{post.location_name || timeAgo(post.created_at)}</p>
          </div>
          <FollowButton userId={post.user_id} initialIsFollowing={!!post.author_is_following} size="sm" />
        </div>
        <button className="post-card__more" aria-label="More options">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <div className="post-card__image-wrap">
        {post.media_type === 'video' ? (
          <video className="post-card__image" src={post.media_url} controls poster={post.thumbnail_url} />
        ) : (
          <img className="post-card__image" src={post.media_url} alt="" />
        )}

        <div className="post-card__toolbar">
          <div className="post-card__toolbar-left">
            <button
              className="post-card__icon-btn"
              aria-label="Like"
              onClick={toggleLike}
              style={liked ? { color: '#e0245e' } : undefined}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button className="post-card__icon-btn" aria-label="Comment" onClick={toggleComments}>
              <MessageCircle size={20} />
            </button>
            <button className="post-card__icon-btn" aria-label="Share" onClick={handleShare}>
              <Send size={20} />
            </button>
          </div>
          <button className="post-card__icon-btn" aria-label="Save">
            <Bookmark size={20} />
          </button>
        </div>
      </div>

      <div className="post-card__body">
        <p className="post-card__likes">{likesCount} likes</p>
        {post.caption && (
          <p className="post-card__caption">
            <span className="post-card__caption-author">{isUsername ? `@${author}` : author}</span> {post.caption}
          </p>
        )}
        <button
          className="post-card__comments"
          onClick={toggleComments}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          View all {commentsCount} comments
        </button>

        {showComments && (
          <CommentsSheet
            postId={post.id}
            onClose={() => setShowComments(false)}
            onCommentPosted={() => setCommentsCount((c) => c + 1)}
          />
        )}
      </div>
    </article>
  )
}
