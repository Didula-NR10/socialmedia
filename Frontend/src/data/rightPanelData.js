import { Map, Heart, Users } from 'lucide-react'

export const quickStats = [
  { id: 'guides', label: 'Guides', value: 24, icon: Map },
  { id: 'likes', label: 'Likes', value: 128, icon: Heart },
  { id: 'follows', label: 'Follows', value: 89, icon: Users },
]

export const trendingGuides = [
  {
    id: 't1',
    title: 'Scenic Train Journeys',
    views: '1.2K views',
    thumbnail:
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=120&h=120&fit=crop',
  },
  {
    id: 't2',
    title: 'Tropical Beaches',
    views: '982 views',
    thumbnail:
      'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=120&h=120&fit=crop',
  },
  {
    id: 't3',
    title: 'Ancient Heritage',
    views: '764 views',
    thumbnail:
      'https://images.unsplash.com/photo-1580889240911-e0abb93f3184?w=120&h=120&fit=crop',
  },
]
