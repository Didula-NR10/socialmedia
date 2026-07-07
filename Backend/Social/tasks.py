"""
Social.tasks
------------
Stories must "vanish" after 24 hours. Two ways this is enforced:

1. READ-TIME (already handled): every query in repositories.py filters
   `expires_at > now`, so an expired story never shows up in the feed
   even if the row/media still physically exist for a few minutes.

2. CLEANUP (this file): a background job that actually deletes expired
   story rows + their Cloudinary media, so storage doesn't grow forever.
   Uses APScheduler so it works with a single `uvicorn main:app` process
   during testing — no separate worker/Redis/Celery needed at this stage.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from Social.services import StoryService

story_service = StoryService()
scheduler = BackgroundScheduler(timezone="UTC")


def cleanup_expired_stories():
    removed = story_service.expire_and_cleanup()
    if removed:
        print(f"🧹 [CLEANUP] Removed {removed} expired stor{'y' if removed == 1 else 'ies'}.")


def start_scheduler():
    """Call once from main.py at startup."""
    # Runs every 15 minutes; expired stories are already invisible to reads
    # in the meantime, so this interval only affects storage cost, not UX.
    scheduler.add_job(cleanup_expired_stories, "interval", minutes=15, id="expire_stories")
    scheduler.start()
    print("⏰ [INFO] Story-expiry scheduler started (every 15 min).")
