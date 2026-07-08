from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

MediaType = Literal["photo", "video"]
MAX_VIDEO_SECONDS = 45


# ---------- PROFILE ----------

class ProfileUpdateSchema(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    bio: Optional[str] = Field(None, max_length=250)


class ProfileResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    is_verified: bool = False
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0

    class Config:
        from_attributes = True


# ---------- POSTS ----------

class PostCreateSchema(BaseModel):
    caption: Optional[str] = Field(None, max_length=2000)
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # media itself arrives as UploadFile in the router (multipart), not here


class PostResponse(BaseModel):
    id: UUID
    user_id: UUID
    caption: Optional[str] = None
    media_type: MediaType
    media_url: str
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PostFeedResponse(PostResponse):
    author_username: Optional[str] = None
    author_full_name: Optional[str] = None
    author_avatar_url: Optional[str] = None
    liked_by_me: bool = False
    author_is_following: bool = False


# ---------- COMMENTS ----------

class CommentCreateSchema(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    parent_comment_id: Optional[UUID] = None


class CommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    parent_comment_id: Optional[UUID] = None
    content: str
    likes_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- SHARES ----------

class ShareCreateSchema(BaseModel):
    share_type: Literal["internal", "external_link"] = "internal"


# ---------- FOLLOWS ----------

class FollowResponse(BaseModel):
    follower_id: UUID
    following_id: UUID
    created_at: datetime


class FollowUserResponse(BaseModel):
    """One row in a Followers/Following list — enough to render an avatar,
    name, and a Follow/Following button relative to whoever is viewing it."""
    id: UUID
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool = False

    class Config:
        from_attributes = True


# ---------- STORIES ----------

class StoryCreateSchema(BaseModel):
    caption: Optional[str] = Field(None, max_length=300)
    location_name: Optional[str] = None


class StoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    media_type: MediaType
    media_url: str
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    caption: Optional[str] = None
    views_count: int = 0
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


# ---------- NOTIFICATIONS ----------

class NotificationResponse(BaseModel):
    id: UUID
    recipient_id: UUID
    actor_id: UUID
    type: Literal["like", "comment", "share", "follow", "story_view"]
    post_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None
    story_id: Optional[UUID] = None
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class StoryGroupResponse(BaseModel):
    """One row per user in the story tray, Instagram-style."""
    user_id: UUID
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    has_unseen: bool = False
    stories: list[StoryResponse]


class StoryViewerResponse(BaseModel):
    """One row in the 'who watched' list, owner-only."""
    id: UUID  # story_view row id
    viewer_id: UUID
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    viewed_at: datetime

    class Config:
        from_attributes = True


class StoryViewersListResponse(BaseModel):
    views_count: int
    viewers: list[StoryViewerResponse]
