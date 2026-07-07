import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import PostCard from '../../components/PostCard/PostCard'
import { postsApi } from '../../api/client'
import './Search.css'

const PAGE_SIZE = 12

/**
 * Dedicated search results page. Matches posts whose place name or caption
 * contains the search term — e.g. searching "Colombo" surfaces every photo
 * AND video whose location/description mentions Colombo, regardless of
 * who posted it. Reuses PostCard, which already renders photos or videos
 * depending on media_type.
 */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [inputValue, setInputValue] = useState(query)

  const [results, setResults] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Guards against React.StrictMode's dev-only double effect invocation.
  const didInitQuery = useRef(null)

  useEffect(() => {
    setInputValue(query)
  }, [query])

  async function loadMore(reset = false) {
    if (!query) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const currentOffset = reset ? 0 : offset
      const data = await postsApi.search(query, undefined, PAGE_SIZE, currentOffset)
      setResults((prev) => {
        if (reset) return data
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...data.filter((p) => !seen.has(p.id))]
      })
      setOffset(currentOffset + data.length)
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      setError(err.message || 'Could not search right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (didInitQuery.current === query) return
    didInitQuery.current = query
    setOffset(0)
    loadMore(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function handleSubmit(e) {
    e.preventDefault()
    const term = inputValue.trim()
    setSearchParams(term ? { q: term } : {})
  }

  return (
    <div className="search-page">
      <h1 className="search-page__title">
        {query ? <>Results for “{query}”</> : 'Search for a place'}
      </h1>

      <form className="search-page__form" onSubmit={handleSubmit}>
        <SearchIcon size={18} className="search-page__form-icon" />
        <input
          type="text"
          className="search-page__form-input"
          placeholder="Search by place name — e.g. Kandy, Ella, Sigiriya…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="search-page__form-submit">
          Search
        </button>
      </form>

      {error && <p style={{ color: '#d3311e' }}>{error}</p>}

      {!loading && query && results.length === 0 && !error && (
        <p className="search-page__empty">
          No photos or videos found for “{query}” yet. Try another place name.
        </p>
      )}

      <div className="search-page__results">
        {results.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center' }}>Loading…</p>}

      {!loading && hasMore && results.length > 0 && (
        <button className="search-page__load-more" onClick={() => loadMore(false)}>
          Load more
        </button>
      )}
    </div>
  )
}
