from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, UploadFile, status

from Social.repositories import (
    ProfileRepository, PostRepository, LikeRepository, CommentRepository,
    ShareRepository, FollowRepository, StoryRepository, StoryViewRepository,
    NotificationRepository,
)
from Social.media_service import MediaService
from Social.schemas import ProfileUpdateSchema, PostCreateSchema, CommentCreateSchema, ShareCreateSchema, StoryCreateSchema

STORY_LIFETIME_HOURS = 24

profile_repo = ProfileRepository()
post_repo = PostRepository()
like_repo = LikeRepository()
comment_repo = CommentRepository()
share_repo = ShareRepository()
follow_repo = FollowRepository()
story_repo = StoryRepository()
story_view_repo = StoryViewRepository()
notif_repo = NotificationRepository()
media_service = MediaService()


# ==================== PROFILE ====================
# NOTE: no "create profile" endpoint exists on purpose — a user's Social
# profile IS their Authentication `users` row. Registering once via
# Authentication/routers.py::signup is enough; Social only reads/extends it.

class ProfileService:
    def get_profile(self, user_id: str) -> dict:
        profile = profile_repo.get_profile(user_id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
        return profile

    def update_profile(self, user_id: str, schema: ProfileUpdateSchema) -> dict:
        data = {k: v for k, v in schema.model_dump().items() if v is not None}
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update.")
        return profile_repo.update_profile(user_id, data)

    def update_avatar(self, user_id: str, file: UploadFile) -> dict:
        uploaded = media_service.upload_media(file, folder="social/avatars")
        return profile_repo.update_profile(user_id, {"avatar_url": uploaded["media_url"]})


# ==================== POSTS ====================

class PostService:
    def create_post(self, user_id: str, schema: PostCreateSchema, file: UploadFile) -> dict:
        uploaded = media_service.upload_media(file, folder="social/posts")
        post_data = {
            "user_id": user_id,
            "caption": schema.caption,
            "media_type": uploaded["media_type"],
            "media_url": uploaded["media_url"],
            "thumbnail_url": uploaded["thumbnail_url"],
            "media_public_id": uploaded["media_public_id"],
            "duration_seconds": uploaded["duration_seconds"],
            "width": uploaded["width"],
            "height": uploaded["height"],
            "location_name": schema.location_name,
            "latitude": schema.latitude,
            "longitude": schema.longitude,
        }
        post = post_repo.create_post(post_data)
        profile_repo.increment_counter(user_id, "posts_count", +1)
        # The insert above returns the raw row with no joined author info
        # (unlike get_feed/search_posts, which select posts.*, users(...)).
        # Attach it here so the response the client uses to render the new
        # post immediately has the real username/avatar instead of falling
        # back to a generic placeholder.
        author = profile_repo.get_profile(user_id) or {}
        post["author_username"] = author.get("username")
        post["author_full_name"] = author.get("full_name")
        post["author_avatar_url"] = author.get("avatar_url")
        post["liked_by_me"] = False
        post["author_is_following"] = False  # can't follow yourself
        return post

    def get_feed(self, viewer_id: str, limit: int, offset: int, media_type: str | None = None) -> list[dict]:
        posts = post_repo.get_feed(limit, offset, media_type)
        return [self._flatten(p, viewer_id) for p in posts]

    def search_posts(
        self, viewer_id: str, query_text: str, limit: int, offset: int, media_type: str | None = None
    ) -> list[dict]:
        posts = post_repo.search_posts(query_text, limit, offset, media_type)
        return [self._flatten(p, viewer_id) for p in posts]

    def get_user_posts(self, user_id: str, limit: int, offset: int) -> list[dict]:
        return post_repo.get_user_posts(user_id, limit, offset)

    @staticmethod
    def _flatten(post: dict, viewer_id: str) -> dict:
        """Supabase nested-select returns author info under post['users'];
        flatten it onto the row and attach whether the viewer liked it,
        so the frontend gets one flat object per post (see PostFeedResponse).
        If the embedded join comes back empty (e.g. the users/posts FK
        relationship isn't set up the way Supabase's PostgREST expects, so
        the nested select silently returns null), fall back to a direct
        profile lookup rather than shipping a post with no author info —
        that's what was causing every post to render as "@traveler"."""
        author = post.pop("users", None) or {}
        if not author.get("username") and not author.get("full_name"):
            author = profile_repo.get_profile(post["user_id"]) or {}
        post["author_username"] = author.get("username")
        post["author_full_name"] = author.get("full_name")
        post["author_avatar_url"] = author.get("avatar_url")
        post["liked_by_me"] = like_repo.has_liked(post["id"], viewer_id)
        post["author_is_following"] = (
            follow_repo.is_following(viewer_id, post["user_id"]) if post["user_id"] != viewer_id else False
        )
        return post

    def delete_post(self, user_id: str, post_id: str) -> None:
        post = post_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        if post["user_id"] != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts.")
        media_service.delete_media(
            post["media_public_id"],
            resource_type="video" if post["media_type"] == "video" else "image",
        )
        post_repo.soft_delete_post(post_id)
        profile_repo.increment_counter(user_id, "posts_count", -1)


# ==================== LIKES ====================

class LikeService:
    def like(self, post_id: str, user_id: str) -> dict:
        post = post_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        result = like_repo.like_post(post_id, user_id)
        if result is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already liked.")
        post_repo.update_counter(post_id, "likes_count", +1)
        if post["user_id"] != user_id:
            notif_repo.create({
                "recipient_id": post["user_id"], "actor_id": user_id,
                "type": "like", "post_id": post_id,
            })
        return result

    def unlike(self, post_id: str, user_id: str) -> None:
        removed = like_repo.unlike_post(post_id, user_id)
        if removed:
            post_repo.update_counter(post_id, "likes_count", -1)


# ==================== COMMENTS ====================

class CommentService:
    def add_comment(self, post_id: str, user_id: str, schema: CommentCreateSchema) -> dict:
        post = post_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        comment = comment_repo.create_comment({
            "post_id": post_id,
            "user_id": user_id,
            "parent_comment_id": str(schema.parent_comment_id) if schema.parent_comment_id else None,
            "content": schema.content,
        })
        post_repo.update_counter(post_id, "comments_count", +1)
        if post["user_id"] != user_id:
            notif_repo.create({
                "recipient_id": post["user_id"], "actor_id": user_id,
                "type": "comment", "post_id": post_id, "comment_id": comment["id"],
            })
        # A fresh insert has no joined profile data — attach it so the
        # frontend can render the commenter's name/avatar immediately
        # without a second round trip.
        author = profile_repo.get_profile(user_id) or {}
        comment["author_username"] = author.get("username")
        comment["author_full_name"] = author.get("full_name")
        comment["author_avatar_url"] = author.get("avatar_url")
        return comment

    def get_comments(self, post_id: str, limit: int, offset: int) -> list[dict]:
        raw = comment_repo.get_comments_for_post(post_id, limit, offset)
        flattened = []
        for comment in raw:
            author = comment.pop("users", None) or {}
            comment["author_username"] = author.get("username")
            comment["author_full_name"] = author.get("full_name")
            comment["author_avatar_url"] = author.get("avatar_url")
            flattened.append(comment)
        return flattened

    def delete_comment(self, user_id: str, comment_id: str) -> None:
        comment = comment_repo.get_comment(comment_id)
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        if comment["user_id"] != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments.")
        comment_repo.soft_delete_comment(comment_id)
        post_repo.update_counter(comment["post_id"], "comments_count", -1)


# ==================== SHARES ====================

class ShareService:
    def share_post(self, post_id: str, user_id: str, schema: ShareCreateSchema) -> dict:
        post = post_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        share = share_repo.create_share({
            "post_id": post_id, "user_id": user_id, "share_type": schema.share_type,
        })
        post_repo.update_counter(post_id, "shares_count", +1)
        if post["user_id"] != user_id:
            notif_repo.create({
                "recipient_id": post["user_id"], "actor_id": user_id,
                "type": "share", "post_id": post_id,
            })
        return share


# ==================== FOLLOWS ====================

class FollowService:
    def follow(self, follower_id: str, following_id: str) -> dict:
        if follower_id == following_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself.")
        result = follow_repo.follow(follower_id, following_id)
        if result is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already following.")
        profile_repo.increment_counter(follower_id, "following_count", +1)
        profile_repo.increment_counter(following_id, "followers_count", +1)
        notif_repo.create({"recipient_id": following_id, "actor_id": follower_id, "type": "follow"})
        return result

    def unfollow(self, follower_id: str, following_id: str) -> None:
        removed = follow_repo.unfollow(follower_id, following_id)
        if removed:
            profile_repo.increment_counter(follower_id, "following_count", -1)
            profile_repo.increment_counter(following_id, "followers_count", -1)

    def get_followers(self, user_id: str, viewer_id: str) -> list[dict]:
        """People who follow `user_id`, each flagged with whether the
        *viewer* (the logged-in user looking at this list) follows them —
        that's what drives the Follow/Following button per row."""
        follower_ids = follow_repo.get_follower_ids(user_id)
        users = profile_repo.get_users_by_ids(follower_ids)
        return self._attach_viewer_follow_state(users, viewer_id)

    def get_following(self, user_id: str, viewer_id: str) -> list[dict]:
        """People `user_id` follows, same viewer-relative flag as above."""
        following_ids = follow_repo.get_following_ids(user_id)
        users = profile_repo.get_users_by_ids(following_ids)
        return self._attach_viewer_follow_state(users, viewer_id)

    @staticmethod
    def _attach_viewer_follow_state(users: list[dict], viewer_id: str) -> list[dict]:
        viewer_following_ids = set(follow_repo.get_following_ids(viewer_id))
        for u in users:
            u["is_following"] = u["id"] in viewer_following_ids
        return users


# ==================== STORIES ====================

class StoryService:
    def create_story(self, user_id: str, schema: StoryCreateSchema, file: UploadFile) -> dict:
        uploaded = media_service.upload_media(file, folder="social/stories")
        now = datetime.now(timezone.utc)
        story_data = {
            "user_id": user_id,
            "media_type": uploaded["media_type"],
            "media_url": uploaded["media_url"],
            "thumbnail_url": uploaded["thumbnail_url"],
            "media_public_id": uploaded["media_public_id"],
            "duration_seconds": uploaded["duration_seconds"],
            "caption": schema.caption,
            "location_name": schema.location_name,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(hours=STORY_LIFETIME_HOURS)).isoformat(),
        }
        return story_repo.create_story(story_data)

    def get_story_feed(self, viewer_id: str) -> list[dict]:
        """Active stories from the viewer + whoever the viewer follows only
        — an unfollowed account's stories never appear here, same as
        Instagram. Author info flattened on; router groups by user for the
        tray UI (see StoryGroupResponse)."""
        visible_user_ids = follow_repo.get_following_ids(viewer_id) + [viewer_id]
        raw = story_repo.get_active_stories_feed(visible_user_ids)
        flattened = []
        for story in raw:
            author = story.pop("users", None) or {}
            story["author_username"] = author.get("username")
            story["author_full_name"] = author.get("full_name")
            story["author_avatar_url"] = author.get("avatar_url")
            flattened.append(story)
        return flattened

    def get_user_stories(self, user_id: str) -> list[dict]:
        return story_repo.get_active_stories_for_user(user_id)

    def view_story(self, story_id: str, viewer_id: str) -> None:
        story = story_repo.get_story(story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or expired.")
        if story["user_id"] == viewer_id:
            # Owner opening their own story isn't a "view" — don't add them
            # to their own viewers list or bump the count.
            return
        added = story_view_repo.add_view(story_id, viewer_id)
        if added:
            from config.database import supabase
            new_count = story.get("views_count", 0) + 1
            supabase.table("stories").update({"views_count": new_count}).eq("id", story_id).execute()
            notif_repo.create({
                "recipient_id": story["user_id"], "actor_id": viewer_id,
                "type": "story_view", "story_id": story_id,
            })

    def get_story_viewers(self, story_id: str, requester_id: str) -> dict:
        """Owner-only 'who watched my story' list + count. Works even after
        the story's own 24h window if the row still exists momentarily
        (cleanup job may not have run yet), since the owner should still be
        able to see who watched right up until it's actually deleted."""
        story = story_repo.get_story(story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or expired.")
        if story["user_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the story's owner can see who watched it.",
            )
        raw = story_view_repo.get_viewers(story_id)
        viewers = []
        for row in raw:
            viewer = row.pop("users", None) or {}
            viewers.append({
                "id": row["id"],
                "viewer_id": row["viewer_id"],
                "viewed_at": row["viewed_at"],
                "username": viewer.get("username"),
                "full_name": viewer.get("full_name"),
                "avatar_url": viewer.get("avatar_url"),
            })
        return {"views_count": story.get("views_count", 0), "viewers": viewers}

    def expire_and_cleanup(self) -> int:
        """Called by Social/tasks.py on a schedule. Deletes expired story rows
        AND their Cloudinary media. Returns number of stories cleaned up."""
        expired = story_repo.get_expired_stories()
        for story in expired:
            media_service.delete_media(
                story["media_public_id"],
                resource_type="video" if story["media_type"] == "video" else "image",
            )
            story_repo.delete_story(story["id"])
        return len(expired)


# ==================== NOTIFICATIONS ====================

class NotificationService:
    def get_my_notifications(self, user_id: str, limit: int = 30) -> list[dict]:
        return notif_repo.get_for_user(user_id, limit)
