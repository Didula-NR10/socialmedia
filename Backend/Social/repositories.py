from typing import Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID
from config.database import supabase


# ==================== PROFILE ====================

class ProfileRepository:
    def get_profile(self, user_id: str) -> Optional[dict]:
        res = supabase.table("users").select(
            "id, email, full_name, username, bio, avatar_url, cover_photo_url, "
            "is_verified, followers_count, following_count, posts_count"
        ).eq("id", user_id).execute()
        return res.data[0] if res.data else None

    def update_profile(self, user_id: str, data: dict) -> Optional[dict]:
        res = supabase.table("users").update(data).eq("id", user_id).execute()
        return res.data[0] if res.data else None

    def increment_counter(self, user_id: str, column: str, delta: int):
        # Supabase python client has no atomic increment, so read-modify-write.
        current = supabase.table("users").select(column).eq("id", user_id).execute()
        if current.data:
            new_val = max(0, current.data[0][column] + delta)
            supabase.table("users").update({column: new_val}).eq("id", user_id).execute()

    def get_users_by_ids(self, user_ids: list[str]) -> list[dict]:
        """Batch profile lookup, used for follower/following lists. Two
        separate queries (follows table, then users table) instead of a
        PostgREST embed, since `follows` has two FKs into `users` and
        embedding would need the exact generated constraint name."""
        if not user_ids:
            return []
        res = (
            supabase.table("users")
            .select("id, username, full_name, avatar_url, bio")
            .in_("id", user_ids)
            .execute()
        )
        return res.data or []


# ==================== POSTS ====================

class PostRepository:
    def create_post(self, post_data: dict) -> dict:
        res = supabase.table("posts").insert(post_data).execute()
        return res.data[0]

    def get_post(self, post_id: str) -> Optional[dict]:
        res = supabase.table("posts").select("*").eq("id", post_id).eq("is_deleted", False).execute()
        return res.data[0] if res.data else None

    def get_feed(self, limit: int = 20, offset: int = 0, media_type: Optional[str] = None) -> list[dict]:
        query = (
            supabase.table("posts")
            .select("*, users(username, full_name, avatar_url)")
            .eq("is_deleted", False)
        )
        if media_type:
            query = query.eq("media_type", media_type)
        res = (
            query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data or []

    def search_posts(
        self, query_text: str, limit: int = 20, offset: int = 0, media_type: Optional[str] = None
    ) -> list[dict]:
        """
        Matches posts whose location_name OR caption contains the search
        term (case-insensitive). Lets users search "Colombo" and find every
        photo/video whose place name or caption mentions Colombo.
        """
        safe_term = query_text.replace(",", " ").replace("%", "").strip()
        db_query = (
            supabase.table("posts")
            .select("*, users(username, full_name, avatar_url)")
            .eq("is_deleted", False)
            .or_(f"location_name.ilike.%{safe_term}%,caption.ilike.%{safe_term}%")
        )
        if media_type:
            db_query = db_query.eq("media_type", media_type)
        res = (
            db_query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data or []

    def get_user_posts(self, user_id: str, limit: int = 20, offset: int = 0) -> list[dict]:
        res = (
            supabase.table("posts")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_deleted", False)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data or []

    def soft_delete_post(self, post_id: str) -> None:
        supabase.table("posts").update({"is_deleted": True}).eq("id", post_id).execute()

    def update_counter(self, post_id: str, column: str, delta: int):
        current = supabase.table("posts").select(column).eq("id", post_id).execute()
        if current.data:
            new_val = max(0, current.data[0][column] + delta)
            supabase.table("posts").update({column: new_val}).eq("id", post_id).execute()


# ==================== LIKES ====================

class LikeRepository:
    def like_post(self, post_id: str, user_id: str) -> Optional[dict]:
        existing = supabase.table("post_likes").select("id").eq("post_id", post_id).eq("user_id", user_id).execute()
        if existing.data:
            return None  # already liked
        res = supabase.table("post_likes").insert({"post_id": post_id, "user_id": user_id}).execute()
        return res.data[0] if res.data else None

    def unlike_post(self, post_id: str, user_id: str) -> bool:
        res = supabase.table("post_likes").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
        return bool(res.data)

    def has_liked(self, post_id: str, user_id: str) -> bool:
        res = supabase.table("post_likes").select("id").eq("post_id", post_id).eq("user_id", user_id).execute()
        return bool(res.data)


# ==================== COMMENTS ====================

class CommentRepository:
    def create_comment(self, comment_data: dict) -> dict:
        res = supabase.table("comments").insert(comment_data).execute()
        return res.data[0]

    def get_comments_for_post(self, post_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
        res = (
            supabase.table("comments")
            .select("*, users(username, full_name, avatar_url)")
            .eq("post_id", post_id)
            .eq("is_deleted", False)
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data or []

    def soft_delete_comment(self, comment_id: str) -> None:
        supabase.table("comments").update({"is_deleted": True}).eq("id", comment_id).execute()

    def get_comment(self, comment_id: str) -> Optional[dict]:
        res = supabase.table("comments").select("*").eq("id", comment_id).execute()
        return res.data[0] if res.data else None


# ==================== SHARES ====================

class ShareRepository:
    def create_share(self, share_data: dict) -> dict:
        res = supabase.table("shares").insert(share_data).execute()
        return res.data[0]


# ==================== FOLLOWS ====================

class FollowRepository:
    def follow(self, follower_id: str, following_id: str) -> Optional[dict]:
        existing = (
            supabase.table("follows").select("id")
            .eq("follower_id", follower_id).eq("following_id", following_id).execute()
        )
        if existing.data:
            return None
        res = supabase.table("follows").insert(
            {"follower_id": follower_id, "following_id": following_id}
        ).execute()
        return res.data[0] if res.data else None

    def unfollow(self, follower_id: str, following_id: str) -> bool:
        res = (
            supabase.table("follows").delete()
            .eq("follower_id", follower_id).eq("following_id", following_id).execute()
        )
        return bool(res.data)

    def is_following(self, follower_id: str, following_id: str) -> bool:
        res = (
            supabase.table("follows").select("id")
            .eq("follower_id", follower_id).eq("following_id", following_id).execute()
        )
        return bool(res.data)

    def get_following_ids(self, user_id: str) -> list[str]:
        """IDs of everyone `user_id` follows. Used both to filter the story
        feed and to render the "Following" list."""
        res = supabase.table("follows").select("following_id").eq("follower_id", user_id).execute()
        return [row["following_id"] for row in (res.data or [])]

    def get_follower_ids(self, user_id: str) -> list[str]:
        """IDs of everyone who follows `user_id`. Used for the "Followers" list."""
        res = supabase.table("follows").select("follower_id").eq("following_id", user_id).execute()
        return [row["follower_id"] for row in (res.data or [])]


# ==================== STORIES ====================

class StoryRepository:
    def create_story(self, story_data: dict) -> dict:
        res = supabase.table("stories").insert(story_data).execute()
        return res.data[0]

    def get_active_stories_for_user(self, user_id: str) -> list[dict]:
        now = datetime.now(timezone.utc).isoformat()
        res = (
            supabase.table("stories").select("*")
            .eq("user_id", user_id)
            .gt("expires_at", now)
            .order("created_at", desc=False)
            .execute()
        )
        return res.data or []

    def get_active_stories_feed(self, user_ids: list[str]) -> list[dict]:
        """
        Non-expired stories, restricted to `user_ids` (the viewer + whoever
        they follow) so unfollowed accounts' stories never show up in the
        tray. Grouped by user later in the service layer.
        """
        if not user_ids:
            return []
        now = datetime.now(timezone.utc).isoformat()
        res = (
            supabase.table("stories")
            .select("*, users(username, full_name, avatar_url)")
            .in_("user_id", user_ids)
            .gt("expires_at", now)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def get_expired_stories(self) -> list[dict]:
        """Used by Social/tasks.py cleanup job to delete Cloudinary assets + rows."""
        now = datetime.now(timezone.utc).isoformat()
        res = supabase.table("stories").select("*").lte("expires_at", now).execute()
        return res.data or []

    def delete_story(self, story_id: str) -> None:
        supabase.table("stories").delete().eq("id", story_id).execute()

    def get_story(self, story_id: str) -> Optional[dict]:
        res = supabase.table("stories").select("*").eq("id", story_id).execute()
        return res.data[0] if res.data else None


class StoryViewRepository:
    def add_view(self, story_id: str, viewer_id: str) -> Optional[dict]:
        existing = (
            supabase.table("story_views").select("id")
            .eq("story_id", story_id).eq("viewer_id", viewer_id).execute()
        )
        if existing.data:
            return None
        res = supabase.table("story_views").insert(
            {"story_id": story_id, "viewer_id": viewer_id}
        ).execute()
        return res.data[0] if res.data else None

    def has_viewed(self, story_id: str, viewer_id: str) -> bool:
        res = (
            supabase.table("story_views").select("id")
            .eq("story_id", story_id).eq("viewer_id", viewer_id).execute()
        )
        return bool(res.data)

    def get_viewers(self, story_id: str) -> list[dict]:
        """Most-recent-first, with the viewer's profile embedded — same FK
        embed convention as StoryRepository.get_active_stories_feed."""
        res = (
            supabase.table("story_views")
            .select("id, viewer_id, viewed_at, users(username, full_name, avatar_url)")
            .eq("story_id", story_id)
            .order("viewed_at", desc=True)
            .execute()
        )
        return res.data or []


# ==================== NOTIFICATIONS ====================

class NotificationRepository:
    def create(self, notif_data: dict) -> dict:
        res = supabase.table("notifications").insert(notif_data).execute()
        return res.data[0]

    def get_for_user(self, user_id: str, limit: int = 30) -> list[dict]:
        res = (
            supabase.table("notifications").select("*")
            .eq("recipient_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []
