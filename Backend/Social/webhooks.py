"""
Social.webhooks
----------------
Not needed today: Cloudinary's upload response is synchronous and already
returns duration/thumbnail/dimensions, so media_service.py never has to
wait on a webhook.

This file exists as the pre-built landing spot for when video storage
moves to Cloudflare Stream, which processes uploads asynchronously and
notifies you via a webhook once a video is ready to play. Wiring it in
later is: (1) include this router in main.py, (2) point Cloudflare's
webhook URL at POST /api/v1/social/webhooks/media-status.
"""

from fastapi import APIRouter, Request, status

router = APIRouter(prefix="/api/v1/social/webhooks", tags=["Social - Webhooks"])


@router.post("/media-status", status_code=status.HTTP_200_OK)
async def media_status_webhook(request: Request):
    """
    Stub receiver. When migrated to Cloudflare Stream, this will:
      1. Verify the webhook signature (Cloudflare sends a `Webhook-Signature` header).
      2. Read `uid`, `readyToStream`, `duration` from the payload.
      3. Look up the post/story row by its stored `media_public_id` == `uid`.
      4. If duration > 45s, delete the video + reject the post/story.
      5. Otherwise mark the row as ready and set thumbnail_url.
    """
    payload = await request.json()
    print(f"📩 [WEBHOOK STUB] Received media status payload: {payload}")
    return {"received": True}
