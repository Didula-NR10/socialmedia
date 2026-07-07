import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, profileApi, getToken, setToken, clearToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const profile = await profileApi.getMine()
      setUser(profile)
    } catch {
      // token invalid/expired
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function login({ email, password }) {
    const { access_token, role } = await authApi.login({ email, password })
    setToken(access_token, role)
    await loadProfile()
  }

  async function signup({ email, password, full_name }) {
    await authApi.signup({ email, password, full_name, role: 'user' })
    // Auth's signup endpoint doesn't return a token, so log in right after.
    await login({ email, password })
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshProfile: loadProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
