export const newForYou = [
  {
    id: 'n1',
    type: 'guide-published',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=RawanaCeylon&backgroundColor=7b3fe4',
    content: {
      before: 'Rawana Ceylon',
      boldBefore: true,
      middle: 'published a new travel guide:',
      link: 'The Ethereal Mist of Nuwara Eliya.',
    },
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 'n2',
    type: 'follow',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AriaVenturer',
    content: {
      before: 'Aria_Venturer',
      boldBefore: true,
      middle: 'started following you.',
    },
    time: '5 hours ago',
    unread: true,
    actions: [
      { label: 'Follow Back', variant: 'primary' },
      { label: 'Dismiss', variant: 'secondary' },
    ],
  },
]

export const earlier = [
  {
    id: 'e1',
    type: 'like',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LankaDreamer',
    content: {
      before: 'LankaDreamer',
      boldBefore: true,
      middle: 'and',
      boldMiddle: '4 others',
      end: 'liked your post from Sigiriya.',
    },
    time: 'Yesterday',
    thumbnail:
      'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=200&h=200&fit=crop',
  },
  {
    id: 'e2',
    type: 'follow-multi',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KandyKing',
    content: {
      before: 'Kandy_King',
      boldBefore: true,
      middle: 'and',
      boldMiddle: 'Ceylon_Bound',
      end: 'started following you.',
    },
    time: '2 days ago',
  },
  {
    id: 'e3',
    type: 'badge',
    icon: 'award',
    content: {
      middle: "You've unlocked the",
      link: 'Hill Country Explorer',
      end: 'badge!',
      emoji: '🎉',
    },
    time: '3 days ago',
    highlighted: true,
  },
  {
    id: 'e4',
    type: 'offer',
    icon: 'train',
    content: {
      boldBefore: true,
      before: 'Exclusive Offer:',
      middle: 'Get 20% off your next luxury train journey to Ella. Valid for 48 hours.',
    },
    time: '4 days ago',
  },
]
