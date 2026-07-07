import { useEffect, useRef, useState } from 'react'
import Stories from '../../components/Stories/Stories'
import PostCard from '../../components/PostCard/PostCard'
import SuggestedForYou from '../../components/SuggestedForYou/SuggestedForYou'
import TrendingDestinations from '../../components/TrendingDestinations/TrendingDestinations'
import { postsApi } from '../../api/client'

const PAGE_SIZE = 10

// Home only ever shows photo posts, newest first, from every user on the
// platform — video posts live in Explore instead. Posting itself happens
// from the Profile page's "+" button now, not from here.
export default function Home() {
  const [posts, setPosts] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // React.StrictMode intentionally double-invokes effects in development,
  // which was firing loadMore() twice on mount, fetching the same page
  // twice, and appending it twice — the source of both the duplicated
  // posts and the transient "Failed to fetch" flash. This ref makes sure
  // the initial load only ever runs once.
  const didInit = useRef(false)

  async function loadMore() {
    setLoading(true)
    setError('')
    try {
      const data = await postsApi.getFeed(PAGE_SIZE, offset, 'photo')
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        const fresh = data.filter((p) => !seen.has(p.id))
        return [...prev, ...fresh]
      })
      setOffset((prev) => prev + data.length)
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      setError(err.message || 'Could not load the feed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    loadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page-with-rail">
      <div>
        <Stories />

        {error && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ color: '#d3311e', marginBottom: 8 }}>{error}</p>
            <button
              onClick={loadMore}
              style={{
                background: 'none',
                border: '1px solid var(--border-color, #ececf3)',
                borderRadius: 999,
                padding: '8px 20px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {!loading && posts.length === 0 && !error && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No posts yet — be the first to share a place!
          </p>
        )}

        {loading && <p style={{ textAlign: 'center' }}>Loading…</p>}

        {!loading && hasMore && posts.length > 0 && (
          <button
            onClick={loadMore}
            style={{
              display: 'block',
              margin: '12px auto',
              background: 'none',
              border: '1px solid var(--border-color, #ececf3)',
              borderRadius: 999,
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            Load more
          </button>
        )}
      </div>

      <div className="page-with-rail__right">
        <SuggestedForYou />
        <TrendingDestinations />
      </div>
    </div>
  )
}
