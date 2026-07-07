import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReelCard from '../../components/ReelCard/ReelCard'
import { postsApi } from '../../api/client'
import './Explore.css'

const PAGE_SIZE = 10

// Explore only ever shows video posts (max 45s), newest first, from every
// user on the platform. Videos here can be liked/commented just like the
// photo posts on Home.
export default function Explore() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  const [videos, setVideos] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Guards against React.StrictMode's dev-only double effect invocation,
  // which was fetching the same page twice and rendering duplicate videos.
  const didInitQuery = useRef(null)

  async function loadMore(reset = false) {
    setLoading(true)
    setError('')
    try {
      const currentOffset = reset ? 0 : offset
      const data = searchQuery
        ? await postsApi.search(searchQuery, 'video', PAGE_SIZE, currentOffset)
        : await postsApi.getFeed(PAGE_SIZE, currentOffset, 'video')
      setVideos((prev) => {
        if (reset) return data
        const seen = new Set(prev.map((v) => v.id))
        return [...prev, ...data.filter((v) => !seen.has(v.id))]
      })
      setOffset(currentOffset + data.length)
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      setError(err.message || 'Could not load videos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (didInitQuery.current === searchQuery) return
    didInitQuery.current = searchQuery
    setOffset(0)
    loadMore(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  return (
    <div className="explore">
      {searchQuery && (
        <p className="explore__search-label">Video results for “{searchQuery}”</p>
      )}

      <div className="explore__reels">
        {videos.map((video) => (
          <ReelCard key={video.id} post={video} />
        ))}

        {!loading && videos.length === 0 && (
          <div className="explore__empty">
            <p>{error || 'No videos here yet.'}</p>
          </div>
        )}

        {loading && videos.length === 0 && (
          <div className="explore__empty">
            <p>Loading…</p>
          </div>
        )}
      </div>

      {!loading && hasMore && videos.length > 0 && (
        <button className="explore__load-more" onClick={() => loadMore(false)}>
          Load more
        </button>
      )}
    </div>
  )
}
