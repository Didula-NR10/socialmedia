"""
Standalone test entrypoint — ONLY for developing/testing the Social
module in isolation from the real system.

It intentionally does NOT import Booking (belongs to another dev, not
needed to test Social) and does NOT touch the real system's Supabase
project (your own .env points at your own test project).

When integrating into the real system: delete this file and
Authentication/ entirely, and instead register `Social.routers.router`
(and, once expiry cleanup should run for real, `Social.tasks.start_scheduler()`)
inside the real main.py.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from Authentication.routers import router as auth_router
from Authentication.models import UserModel

from Social.routers import router as social_router
from Social.webhooks import router as social_webhooks_router
from Social.models import init_social_module
from Social.tasks import start_scheduler

app = FastAPI(title="Social Module - Standalone Test Server")

EXTRA_ORIGINS = [o.strip() for o in os.environ.get("EXTRA_CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    # Vite's default dev port, plus 127.0.0.1 in case that's how you open it.
    # On Hugging Face this normally isn't even hit — frontend + backend are
    # served from the same origin/port — but it's kept for local dev and for
    # the case of hosting the frontend somewhere separate (set
    # EXTRA_CORS_ORIGINS="https://your-frontend-url" as an env var if so).
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *EXTRA_ORIGINS,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- create tables ----
UserModel.init_table()      # Auth's own users table (unchanged, copied as-is)
init_social_module()        # ALTERs users + creates all Social tables

# ---- background jobs ----
start_scheduler()           # expires 24h stories on a 15-min interval

# ---- routers ----
app.include_router(auth_router)          # /api/v1/auth/*  (signup/login, needed to get a JWT to test with)
app.include_router(social_router)        # /api/v1/social/* (your actual deliverable)
app.include_router(social_webhooks_router)


# ---- serve the built React frontend (Hugging Face Docker deploy) ----
# The Dockerfile copies the Vite build output into ./static at image build
# time. Locally (no ./static present, e.g. running `uvicorn main:app --reload`
# for backend-only dev) this whole block is skipped and behavior is unchanged.
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """
        Catch-all registered LAST so it never intercepts /api/... routes
        (Starlette matches routes in registration order, and every API
        router above was already included by this point). Serves a real
        static file if it exists (favicon, manifest, etc.), otherwise falls
        back to index.html so React Router can handle client-side routes
        like /profile or /explore on a hard refresh.
        """
        candidate = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

else:
    @app.get("/")
    def health_check():
        return {"status": "healthy", "module": "social-standalone"}
