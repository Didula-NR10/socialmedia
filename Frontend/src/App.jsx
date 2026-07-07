import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import MobileNav from './components/MobileNav/MobileNav'
import Home from './pages/Home/Home'
import Explore from './pages/Explore/Explore'
import Search from './pages/Search/Search'
import Profile from './pages/Profile/Profile'
import Notifications from './pages/Notifications/Notifications'
import Settings from './pages/Settings/Settings'
import ComingSoon from './pages/ComingSoon/ComingSoon'
import Login from './pages/Auth/Login'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './context/ProtectedRoute'

function AppShell() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Previously <main> was force-remounted on every route change via
  // key={location.pathname}. That threw away scroll position and caused a
  // visible layout jump/flash whenever a link in the side panel was
  // clicked. Resetting scroll on navigation instead gives a clean page
  // transition without the remount side effects.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="app__body">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="app__main">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route
              path="/plan"
              element={
                <ProtectedRoute>
                  <ComingSoon
                    title="Plan your next adventure"
                    description="Save places, build itineraries, and share unforgettable moments. Trip planning is on its way."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <ComingSoon
                    title="Favorites"
                    description="Guides, posts, and places you've saved will live here."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guides"
              element={
                <ProtectedRoute>
                  <ComingSoon
                    title="Guides"
                    description="Browse and publish travel guides from the community."
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}

function AuthShell() {
  const location = useLocation()
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return (
      <Routes>
        <Route path="/login" element={<Login mode="login" />} />
        <Route path="/signup" element={<Login mode="signup" />} />
      </Routes>
    )
  }
  return <AppShell />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
