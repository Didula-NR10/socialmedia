from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from typing import Optional
from uuid import UUID

from Authentication.services import AuthService
from Social.schemas import (
    ProfileUpdateSchema, ProfileResponse,
    PostCreateSchema, PostResponse, PostFeedResponse,
    CommentCreateSchema, CommentResponse,
    ShareCreateSchema,
    StoryCreateSchema, StoryResponse, StoryViewersListResponse,
    NotificationResponse, FollowUserResponse,
)
from Social.services import (
    ProfileService, PostService, LikeService, CommentService,
    ShareService, FollowService, StoryService, NotificationService,
)

router = APIRouter(prefix="/api/v1/social", tags=["Social"])

profile_service = ProfileService()
post_service = PostService()
like_service = LikeService()
comment_service = CommentService()
share_service = ShareService()
follow_service = FollowService()
story_service = StoryService()
notification_service = NotificationService()

# Any authenticated user (any role) may use the Social module.
current_user = AuthService.verify_role(["admin", "manager", "user"])


# ==================== PROFILE ====================
# No signup/create-profile route here on purpose — Authentication already
# owns account creation. This just reads/edits the same `users` row.

@router.get("/profile/me", response_model=ProfileResponse)
def get_my_profile(user=Depends(current_user)):
    return profile_service.get_profile(user["sub"])


@router.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: UUID, user=Depends(current_user)):
    return profile_service.get_profile(str(user_id))


@router.patch("/profile/me", response_model=ProfileResponse)
def update_my_profile(data: ProfileUpdateSchema, user=Depends(current_user)):
    return profile_service.update_profile(user["sub"], data)


@router.post("/profile/me/avatar", response_model=ProfileResponse)
def update_avatar(file: UploadFile = File(...), user=Depends(current_user)):
    return profile_service.update_avatar(user["sub"], file)


# ==================== POSTS ====================

@router.post("/posts", response_model=PostFeedResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    location_name: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    user=Depends(current_user),
):
    schema = PostCreateSchema(
        caption=caption, location_name=location_name, latitude=latitude, longitude=longitude
    )
    return post_service.create_post(user["sub"], schema, file)


@router.get("/posts/feed", response_model=list[PostFeedResponse])
def get_feed(
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    media_type: Optional[str] = Query(None, description="Filter by 'photo' or 'video'"),
    user=Depends(current_user),
):
    return post_service.get_feed(user["sub"], limit, offset, media_type)


@router.get("/posts/search", response_model=list[PostFeedResponse])
def search_posts(
    q: str = Query(..., min_length=1, description="Search term matched against place name/caption"),
    media_type: Optional[str] = Query(None, description="Filter by 'photo' or 'video'"),
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    user=Depends(current_user),
):
    return post_service.search_posts(user["sub"], q, limit, offset, media_type)


@router.get("/posts/user/{user_id}", response_model=list[PostResponse])
def get_user_posts(user_id: UUID, limit: int = Query(20, le=50), offset: int = Query(0, ge=0), user=Depends(current_user)):
    return post_service.get_user_posts(str(user_id), limit, offset)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: UUID, user=Depends(current_user)):
    post_service.delete_post(user["sub"], str(post_id))


# ==================== LIKES ====================

@router.post("/posts/{post_id}/like", status_code=status.HTTP_201_CREATED)
def like_post(post_id: UUID, user=Depends(current_user)):
    return like_service.like(str(post_id), user["sub"])


@router.delete("/posts/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(post_id: UUID, user=Depends(current_user)):
    like_service.unlike(str(post_id), user["sub"])


# ==================== COMMENTS ====================

@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(post_id: UUID, data: CommentCreateSchema, user=Depends(current_user)):
    return comment_service.add_comment(str(post_id), user["sub"], data)


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
def get_comments(post_id: UUID, limit: int = Query(50, le=100), offset: int = Query(0, ge=0), user=Depends(current_user)):
    return comment_service.get_comments(str(post_id), limit, offset)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: UUID, user=Depends(current_user)):
    comment_service.delete_comment(user["sub"], str(comment_id))


# ==================== SHARES ====================

@router.post("/posts/{post_id}/share", status_code=status.HTTP_201_CREATED)
def share_post(post_id: UUID, data: ShareCreateSchema, user=Depends(current_user)):
    return share_service.share_post(str(post_id), user["sub"], data)


# ==================== FOLLOWS ====================

@router.post("/follow/{user_id}", status_code=status.HTTP_201_CREATED)
def follow_user(user_id: UUID, user=Depends(current_user)):
    return follow_service.follow(user["sub"], str(user_id))


@router.delete("/follow/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(user_id: UUID, user=Depends(current_user)):
    follow_service.unfollow(user["sub"], str(user_id))


@router.get("/profile/{user_id}/followers", response_model=list[FollowUserResponse])
def get_followers(user_id: UUID, user=Depends(current_user)):
    """People who follow this account. Each row's `is_following` reflects
    whether the *currently logged-in* user follows that person — drives
    the Follow/Following button per row in the list."""
    return follow_service.get_followers(str(user_id), user["sub"])


@router.get("/profile/{user_id}/following", response_model=list[FollowUserResponse])
def get_following(user_id: UUID, user=Depends(current_user)):
    """People this account follows, same viewer-relative Follow button rule."""
    return follow_service.get_following(str(user_id), user["sub"])


# ==================== STORIES ====================

@router.post("/stories", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
def create_story(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    location_name: Optional[str] = Form(None),
    user=Depends(current_user),
):
    schema = StoryCreateSchema(caption=caption, location_name=location_name)
    return story_service.create_story(user["sub"], schema, file)


@router.get("/stories/feed")
def get_story_feed(user=Depends(current_user)):
    """
    Returns active (non-expired) stories from yourself and whoever you
    follow only — not the whole platform. Grouping by user for the "tray"
    UI is left to the frontend, since it's a one-line `groupBy` client-side
    and keeps this endpoint simple to test with curl/Postman.
    """
    return story_service.get_story_feed(user["sub"])


@router.get("/stories/user/{user_id}", response_model=list[StoryResponse])
def get_user_stories(user_id: UUID, user=Depends(current_user)):
    return story_service.get_user_stories(str(user_id))


@router.post("/stories/{story_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def view_story(story_id: UUID, user=Depends(current_user)):
    story_service.view_story(str(story_id), user["sub"])


@router.get("/stories/{story_id}/viewers", response_model=StoryViewersListResponse)
def get_story_viewers(story_id: UUID, user=Depends(current_user)):
    """Owner-only: who watched this story + total view count."""
    return story_service.get_story_viewers(str(story_id), user["sub"])


# ==================== NOTIFICATIONS ====================

@router.get("/notifications", response_model=list[NotificationResponse])
def get_my_notifications(limit: int = Query(30, le=100), user=Depends(current_user)):
    return notification_service.get_my_notifications(user["sub"], limit)
