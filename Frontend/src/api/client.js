// `??` (not `||`) matters here: on Hugging Face the Dockerfile builds this
// with VITE_API_BASE_URL="" on purpose (same-origin — frontend and backend
// share one domain/port). `||` treats "" as falsy and would wrongly fall
// back to localhost in production. `??` only falls back when the variable
// is truly unset (local dev with no .env), which is the intended behavior.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const TOKEN_KEY = 'rawana_access_token'
const ROLE_KEY = 'rawana_role'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token, role) {
  localStorage.setItem(TOKEN_KEY, token)
  if (role) localStorage.setItem(ROLE_KEY, role)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Core request helper. Automatically attaches the JWT (if present) and
 * JSON-encodes plain objects. Pass a FormData body (e.g. file uploads)
 * and it's sent as-is with no Content-Type header, letting the browser
 * set the correct multipart boundary itself.
 *
 * GET requests are retried automatically on a raw network failure (the
 * browser's "Failed to fetch" TypeError, distinct from a normal HTTP error
 * response). This is what happens when the backend is still spinning up
 * (cold start) right when the page first loads — the very first request
 * lands before the server is ready, then a reload succeeds because the
 * server is warm by then. Retrying once or twice with a short backoff
 * papers over that instead of surfacing a scary error to the user.
 */
async function request(path, { method = 'GET', body, params, retries = method === 'GET' ? 2 : 0 } = {}) {
  const url = new URL(BASE_URL + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value)
    })
  }

  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let finalBody = body
  const isFormData = body instanceof FormData
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json'
    finalBody = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, { method, headers, body: finalBody })
  } catch (err) {
    if (retries > 0) {
      await wait(800)
      return request(path, { method, body, params, retries: retries - 1 })
    }
    throw new Error('Could not reach the server. Please check your connection and try again.')
  }

  if (response.status === 204) return null

  let data = null
  try {
    data = await response.json()
  } catch {
    // no body / not JSON
  }

  if (!response.ok) {
    const message = data?.detail || `Request failed (${response.status})`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  return data
}

// ---------------- Auth ----------------
export const authApi = {
  signup: (payload) => request('/api/v1/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/api/v1/auth/login', { method: 'POST', body: payload }),
}

// ---------------- Profile ----------------
export const profileApi = {
  getMine: () => request('/api/v1/social/profile/me'),
  getById: (userId) => request(`/api/v1/social/profile/${userId}`),
  update: (payload) => request('/api/v1/social/profile/me', { method: 'PATCH', body: payload }),
  updateAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request('/api/v1/social/profile/me/avatar', { method: 'POST', body: form })
  },
}

// ---------------- Posts ----------------
export const postsApi = {
  getFeed: (limit = 20, offset = 0, mediaType) =>
    request('/api/v1/social/posts/feed', { params: { limit, offset, media_type: mediaType } }),
  search: (q, mediaType, limit = 20, offset = 0) =>
    request('/api/v1/social/posts/search', { params: { q, media_type: mediaType, limit, offset } }),
  getUserPosts: (userId, limit = 20, offset = 0) =>
    request(`/api/v1/social/posts/user/${userId}`, { params: { limit, offset } }),
  create: ({ file, caption, locationName, latitude, longitude }) => {
    const form = new FormData()
    form.append('file', file)
    if (caption) form.append('caption', caption)
    if (locationName) form.append('location_name', locationName)
    if (latitude !== undefined) form.append('latitude', latitude)
    if (longitude !== undefined) form.append('longitude', longitude)
    return request('/api/v1/social/posts', { method: 'POST', body: form })
  },
  remove: (postId) => request(`/api/v1/social/posts/${postId}`, { method: 'DELETE' }),
  like: (postId) => request(`/api/v1/social/posts/${postId}/like`, { method: 'POST' }),
  unlike: (postId) => request(`/api/v1/social/posts/${postId}/like`, { method: 'DELETE' }),
  getComments: (postId) => request(`/api/v1/social/posts/${postId}/comments`),
  addComment: (postId, content) =>
    request(`/api/v1/social/posts/${postId}/comments`, { method: 'POST', body: { content } }),
  share: (postId) =>
    request(`/api/v1/social/posts/${postId}/share`, { method: 'POST', body: { share_type: 'internal' } }),
}

// ---------------- Follows ----------------
export const followApi = {
  follow: (userId) => request(`/api/v1/social/follow/${userId}`, { method: 'POST' }),
  unfollow: (userId) => request(`/api/v1/social/follow/${userId}`, { method: 'DELETE' }),
}

// ---------------- Stories ----------------
export const storiesApi = {
  getFeed: () => request('/api/v1/social/stories/feed'),
  getUserStories: (userId) => request(`/api/v1/social/stories/user/${userId}`),
  create: ({ file, caption, locationName }) => {
    const form = new FormData()
    form.append('file', file)
    if (caption) form.append('caption', caption)
    if (locationName) form.append('location_name', locationName)
    return request('/api/v1/social/stories', { method: 'POST', body: form })
  },
  view: (storyId) => request(`/api/v1/social/stories/${storyId}/view`, { method: 'POST' }),
}

// ---------------- Notifications ----------------
export const notificationsApi = {
  getMine: (limit = 30) => request('/api/v1/social/notifications', { params: { limit } }),
}
