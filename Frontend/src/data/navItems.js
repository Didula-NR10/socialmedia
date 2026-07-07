import {
  Home,
  Compass,
  SquarePlus,
  Heart,
  BookOpen,
  User,
  Settings,
} from 'lucide-react'

export const navItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'explore', label: 'Explore', icon: Compass, path: '/explore' },
  { id: 'plan', label: 'Plan', icon: SquarePlus, path: '/plan' },
  { id: 'favorites', label: 'Favorites', icon: Heart, path: '/favorites' },
  { id: 'guides', label: 'Guides', icon: BookOpen, path: '/guides' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]
