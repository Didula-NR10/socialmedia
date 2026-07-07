"""
Social.media_service
---------------------
Thin wrapper around Cloudinary. Cloudinary was picked over raw
Cloudflare R2/Stream for this stage because:

  - It has a genuinely usable free tier (25 credits/mo ~ 25GB storage
    + bandwidth) which is plenty for local/dev testing.
  - It auto-generates video thumbnails, transcodes, and reports back
    exact `duration` / `width` / `height` in the SAME upload response —
    so enforcing the 45s story/post video limit needs zero extra
    tooling (no ffprobe install needed).
  - One SDK call handles both photo and video upload (`resource_type="auto"`).

Cloudflare R2 + Stream is the natural upgrade later (cheaper at scale,
no per-transformation credit cost) — see the README note at the bottom
of this file for that migration path.
"""

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from config.database import settings

MAX_VIDEO_SECONDS = 45

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


class MediaService:

    def upload_media(self, file: UploadFile, folder: str, max_video_seconds: int = MAX_VIDEO_SECONDS) -> dict:
        """
        Uploads a photo or video to Cloudinary.
        `folder` examples: "social/posts", "social/stories".
        Returns a normalized dict the repositories can insert directly.
        """
        content_type = (file.content_type or "").lower()
        if content_type.startswith("image/"):
            media_type = "photo"
        elif content_type.startswith("video/"):
            media_type = "video"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image or video files are supported."
            )

        try:
            result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder=folder,
                eager=[{"width": 400, "height": 400, "crop": "fill"}] if media_type == "photo" else None,
                eager_async=False,
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Media upload failed: {str(e)}"
            )

        duration = result.get("duration")  # only present for video
        if media_type == "video" and duration and duration > max_video_seconds:
            # Clean up the just-uploaded oversized clip so we don't leak storage
            self.delete_media(result.get("public_id"), resource_type="video")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video exceeds the {max_video_seconds}s limit (got {round(duration, 1)}s)."
            )

        thumbnail_url = None
        if media_type == "video":
            # Cloudinary can derive a jpg thumbnail from any uploaded video by
            # swapping the extension + resource type in the delivery URL.
            thumbnail_url = cloudinary.CloudinaryVideo(result["public_id"]).build_url(
                format="jpg", resource_type="video"
            )

        return {
            "media_type": media_type,
            "media_url": result.get("secure_url"),
            "thumbnail_url": thumbnail_url,
            "media_public_id": result.get("public_id"),
            "duration_seconds": duration,
            "width": result.get("width"),
            "height": result.get("height"),
        }

    def delete_media(self, public_id: str, resource_type: str = "image") -> None:
        if not public_id:
            return
        try:
            cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception as e:
            # Non-fatal: log and move on, don't block the DB delete on Cloudinary cleanup
            print(f"⚠️ [WARN] Failed to delete Cloudinary asset {public_id}: {str(e)}")


"""
README — future migration to Cloudflare R2 + Stream
-----------------------------------------------------
Swap this file's internals only; `PostService` / `StoryService` never call
Cloudinary directly, they only call `MediaService.upload_media()` /
`delete_media()`, so the rest of the module doesn't change.

  - Photos -> Cloudflare R2 (S3-compatible `put_object`), serve via a
    custom domain or R2 public bucket URL.
  - Videos -> Cloudflare Stream (`POST /accounts/{id}/stream` with direct
    creator upload URLs), which gives you HLS/DASH playback, thumbnails,
    and duration metadata the same way Cloudinary does.
  - Duration check becomes a webhook (Stream fires `video.ready` async)
    instead of being available synchronously in the upload response —
    see Social/webhooks.py, which already has a stub for this.
"""
