---
title: Rawana Ceylon
emoji: 🏝️
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Rawana Ceylon — Frontend + Backend, connected

This zip contains both halves already wired together over HTTP:

```
Backend/    ← FastAPI (Auth + Social), unchanged from before except the notes below
Frontend/   ← the React/Vite app, now calling the real API instead of mock data
```

## What's actually wired now

| Screen | Backend endpoint(s) | Notes |
|---|---|---|
| Login / Signup (`/login`, `/signup`) | `POST /api/v1/auth/signup`, `POST /api/v1/auth/login` | New pages — didn't exist before. All other routes now redirect here if you're not logged in. |
| Home feed | `GET /api/v1/social/posts/feed`, likes, comments, share | Stories tray, "create post" composer, like/comment/share all hit real endpoints. |
| Stories tray | `GET/POST /api/v1/social/stories/*` | Grouped by user, upload via the "Your Story" button, marks stories viewed. |
| Profile | `GET/PATCH /api/v1/social/profile/me`, `POST /api/v1/social/profile/me/avatar`, `GET /api/v1/social/posts/user/{id}` | Inline edit for username/bio, avatar upload, real post grid. |
| Header | uses the logged-in user's real avatar; adds a working Logout button | |

## What's still on mock data (on purpose, flagged so nothing is silently broken)

- **Explore** (`/explore`) — reels/discovery browsing. No backend endpoint exists yet for
  a curated/algorithmic reels feed, so this still reads from `data/reelsData.js`.
- **Notifications** (`/notifications`) — the backend now has
  `GET /api/v1/social/notifications`, but its shape (`type`, `actor_id`, `post_id`, `is_read`)
  is much rawer than what `ActivityFeed`/`FeedCard` render (pre-composed sentences like
  "X and 4 others liked your post"). Wiring this properly means also fetching each actor's
  username/avatar and composing that sentence client-side — left as the next step rather
  than half-done.
- **Settings** (`/settings`) — all toggles (email updates, private profile, etc.) are UI-only;
  there's no backend column for any of them yet.

## Running it

**Backend**
```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # or source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
copy .env.example .env       # fill in your Supabase + Cloudinary values
uvicorn main:app --reload
```
Runs at `http://127.0.0.1:8000`.

**Frontend**
```bash
cd Frontend
npm install
copy .env.example .env       # defaults to http://127.0.0.1:8000, change if needed
npm run dev
```
Runs at `http://localhost:5173`. CORS on the backend is already set to allow this origin
(see `Backend/main.py`).

## How the connection works

- `Frontend/src/api/client.js` is the single place that knows the backend's base URL
  (from `VITE_API_BASE_URL`) and attaches the JWT to every request.
- `Frontend/src/context/AuthContext.jsx` calls `login`/`signup`, stores the token, and
  loads the profile via `GET /api/v1/social/profile/me` — this is the "no separate social
  signup" behavior you asked for: one account, fetched into the Social profile section.
- `Frontend/src/context/ProtectedRoute.jsx` bounces anyone without a valid token to `/login`.

## Deploying to Hugging Face Spaces (free tier)

This repo is set up as a **single Docker Space**: one container builds the
React frontend and serves it, alongside the FastAPI API, from one process
on port 7860 (the only port HF Spaces exposes on the free tier).

### 1. Create the Space
- huggingface.co → New Space → pick a name → **SDK: Docker** → **Hardware: CPU basic (free)**.
- Push/upload this repo's contents to the Space (git remote, same as pushing to GitHub) —
  the `Dockerfile` and this `README.md` (with the YAML block at the very top) must sit
  at the **repo root**.

### 2. Add your Secrets
In the Space → **Settings → Variables and secrets**, add these as **Secrets**
(never commit them — `.env` is git-ignored and Docker-ignored on purpose):

```
SUPABASE_URL
SUPABASE_KEY
SUPABASE_DB_URL
JWT_SECRET
ENVIRONMENT
PROJECT_NAME
SMTP_USER
SMTP_PASSWORD
SMTP_FROM_EMAIL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```
Same values as your local `Backend/.env` — `config/database.py`'s pydantic
`Settings` reads from real environment variables automatically (the `.env`
file is just a *local* convenience; on HF, Secrets ARE the environment).

### 3. Build
HF builds the `Dockerfile` automatically on every push. Build logs are visible
in the Space's **"Logs"** tab — watch for the same `✅ [SUCCESS] '...' table
verified/created` lines you see locally, confirming it reached your Supabase
project.

### What changed in the code for this to work
- **`Backend/main.py`** — now also serves the built frontend (`./static`,
  copied in by the Dockerfile) and falls back to `index.html` for any
  non-`/api/...` path, so React Router's client-side routes (`/profile`,
  `/explore`, etc.) work on a hard refresh instead of 404ing.
- **`Frontend/src/api/client.js`** — the base-URL fallback used `||`, which
  treats an intentionally-empty string (same-origin mode) as "unset" and
  silently redirected every request to `http://127.0.0.1:8000`. Changed to
  `??` so an explicitly empty `VITE_API_BASE_URL` (set by the Dockerfile
  build arg) is respected, letting the frontend call relative paths that
  resolve to the same container.

### Free tier notes
- The Space **sleeps after inactivity** and cold-starts on the next visit
  (typically 20–60s) — this is exactly what `client.js`'s GET-retry-with-backoff
  logic already covers, so the first request after a sleep won't show a raw error.
- Storage is **ephemeral** — the container's filesystem resets on every
  rebuild/restart. This doesn't affect you: all real data lives in Supabase
  (DB) and Cloudinary (media), never on the container disk.
- No custom domain/HTTPS setup needed — HF gives you `https://<you>-<space-name>.hf.space` for free.

## Try it end to end
1. Start the backend, then the frontend.
2. Go to `http://localhost:5173/signup`, create an account.
3. You'll land on the Home feed (empty at first).
4. Use the composer at the top to post a photo/video (video max 45s — the backend rejects longer ones).
5. Like/comment/share it, check your Profile tab to see it in the grid, post a Story and watch it show in the tray.
