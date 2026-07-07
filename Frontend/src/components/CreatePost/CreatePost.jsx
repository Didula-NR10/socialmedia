import { useRef, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { postsApi } from '../../api/client'
import './CreatePost.css'

export default function CreatePost({ onCreated }) {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    setFile(selected || null)
    setPreview(selected ? URL.createObjectURL(selected) : null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Choose a photo or video first (videos max 45s).')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const post = await postsApi.create({ file, caption })
      setFile(null)
      setPreview(null)
      setCaption('')
      onCreated?.(post)
    } catch (err) {
      setError(err.message || 'Could not create post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="create-post" onSubmit={handleSubmit}>
      <div className="create-post__row">
        <button
          type="button"
          className="create-post__media-btn"
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
      </div>

      {preview &&
        (file.type.startsWith('video/') ? (
          <video className="create-post__preview" src={preview} controls />
        ) : (
          <img className="create-post__preview" src={preview} alt="" />
        ))}

      <textarea
        className="create-post__caption"
        placeholder="Write a caption for this place…"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={2}
      />

      {error && <p className="create-post__error">{error}</p>}

      <button type="submit" className="create-post__submit" disabled={submitting}>
        {submitting ? 'Posting…' : 'Post'}
      </button>
    </form>
  )
}
