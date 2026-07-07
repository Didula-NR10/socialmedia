# Rawana Ceylon

A multi-page React app for the Rawana Ceylon travel platform, with a shared
header + sidebar shell and real client-side routing between pages.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Pages & routing

Routing is handled by `react-router-dom`. The sidebar and header are part of
a persistent `AppShell` in `App.jsx`; only the page content changes as you
navigate.

| Route            | Page            | What's there                                                        |
|-------------------|-----------------|----------------------------------------------------------------------|
| `/`               | Home            | Stories carousel, post feed, "Suggested for you" + "Trending destinations" |
| `/explore`        | Explore         | Category tabs, hero + feature grid, Hidden Gems, trust bar          |
| `/profile`        | Profile         | Cover photo, bio, stats, story highlights, posts/saved/tagged tabs |
| `/notifications`  | Notifications   | "New for you" / "Earlier" activity feed (opened from the bell icon)|
| `/settings`       | Settings        | Account, notifications, privacy, and appearance preferences         |
| `/plan` `/favorites` `/guides` | Coming soon | Placeholder pages for the remaining sidebar links        |

Clicking the bell icon or the avatar in the header routes to Notifications
and Profile respectively; everything else routes from the left sidebar.

## Project structure

```
src/
  components/
    Header/                 top bar: logo, search, notifications, profile
    Sidebar/                 left nav + "Plan your next adventure" promo card
    MobileNav/                bottom nav bar shown under 860px
    FilterTabs/               All / Likes / Follows / Guides pills (Notifications)
    ActivityFeed/             FeedCard + activity list (Notifications)
    RightPanel/               Stay Inspired / Quick Stats / Trending Guides (Notifications)
    Stories/                  home feed stories carousel
    PostCard/                 home feed post card
    SuggestedForYou/          home page right-rail follow suggestions
    TrendingDestinations/     home page right-rail trending places
  pages/
    Home/, Explore/, Profile/, Notifications/, Settings/, ComingSoon/
  data/                       mock content, separated from presentation
  styles/                     design tokens (variables.css) + global layout/reset
  App.jsx                     router + persistent header/sidebar shell
```

Each component/page folder has its own `.jsx` and `.css` file, so you can
restyle or swap out one piece without touching anything else.

## Responsive behavior

- **> 1180px** — full layout; pages with a right rail (Home, Notifications)
  show a 2-column content area.
- **860–1180px** — right rail content drops below the feed as a row of cards.
- **< 860px** — sidebar becomes a slide-in drawer opened via the hamburger
  icon; a bottom nav bar (Explore / Search / Add / Notifications / Profile)
  appears for quick access; right-rail cards stack full width.
- **< 480px** — tighter paddings/thumbnails everywhere; header search bar
  hides in favor of the bottom nav.

## Customizing

- Colors, radii, spacing all live in `src/styles/variables.css`.
- Every page's content is driven by plain arrays in `src/data/` — swap those
  for real API calls when you're ready to wire this up to a backend.
