# Social Module — Standalone Test Copy

## What's unchanged vs. new
- `config/database.py` — copied as-is, only extended with 3 optional
  Cloudinary settings (defaulted, so it doesn't break Auth/Booking).
- `Authentication/` — copied as-is, untouched. Only here so you can
  signup/login test users and get a JWT to call Social endpoints with.
  **Delete this whole folder when integrating** into the real system —
  it already exists there.
- `Social/` — 100% new, your actual deliverable.

## Run it
```bash
pip install -r requirements.txt
cp .env.example .env   # fill in your own Supabase test project + Cloudinary keys
uvicorn main:app --reload
```
Visit `http://127.0.0.1:8000/docs`.

1. `POST /api/v1/auth/signup` → create a test user
2. `POST /api/v1/auth/login` → get `access_token`
3. Click "Authorize" in Swagger, paste the token
4. Use any `/api/v1/social/*` endpoint

## Integrating into the real system later
1. Copy `Social/` into the real backend, next to `Authentication/` and `Booking/`.
2. In the real `main.py`, add:
   ```python
   from Social.routers import router as social_router
   from Social.webhooks import router as social_webhooks_router
   from Social.models import init_social_module
   from Social.tasks import start_scheduler

   init_social_module()
   start_scheduler()
   app.include_router(social_router)
   app.include_router(social_webhooks_router)
   ```
3. Add the 3 `CLOUDINARY_*` keys to the real `.env`.
4. Run `init_social_module()` once — it ALTERs the shared `users` table
   (adds `username`, `bio`, `avatar_url`, `cover_photo_url`, `is_verified`,
   `followers_count`, `following_count`, `posts_count`) and creates all
   Social tables. It never touches Booking's tables.
