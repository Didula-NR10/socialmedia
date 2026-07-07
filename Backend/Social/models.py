"""
Social.models
-------------
Owns every table this module needs, including the ALTER on the
pre-existing `users` table (owned by the Auth developer).

Design choice: we do NOT touch Authentication/models.py. Instead this
file adds its own `init_table()` / `alter_users_table()` static methods
that Social/main-wiring calls on startup. When integrating into the real
system, only `alter_users_table()` needs to be run once (as a migration)
against the shared `users` table — everything else here is 100% new
tables that live only in this module.
"""

import psycopg2
from config.database import settings


class UserProfileExtension:
    """
    Not a new table — this documents + applies the ALTER TABLE needed on
    the existing `users` table so profile data (bio, username, avatar)
    can be shown in the Social "profile" tab without creating a second
    user record anywhere.
    """

    @classmethod
    def alter_users_table(cls):
        sql_script = """
        ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS avatar_url TEXT,
            ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;
        """
        try:
            with psycopg2.connect(settings.SUPABASE_DB_URL) as conn:
                conn.autocommit = True
                with conn.cursor() as cur:
                    cur.execute(sql_script)
            print("✅ [SUCCESS] 'users' table extended with Social profile columns.")
        except Exception as e:
            print(f"❌ [ERROR] Could not extend 'users' table: {str(e)}")


class SocialModels:
    """Creates every table owned by the Social module."""

    @classmethod
    def init_all_tables(cls):
        sql_script = """
        -- ============ POSTS (photo/video, 45s max for video) ============
        CREATE TABLE IF NOT EXISTS public.posts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            caption TEXT,
            media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
            media_url TEXT NOT NULL,
            thumbnail_url TEXT,
            media_public_id TEXT NOT NULL,          -- Cloudinary public_id, needed to delete later
            duration_seconds NUMERIC,                 -- NULL for photos, <=45 for videos
            width INTEGER,
            height INTEGER,
            location_name TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            shares_count INTEGER DEFAULT 0,
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

        -- ============ POST LIKES ============
        CREATE TABLE IF NOT EXISTS public.post_likes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            UNIQUE(post_id, user_id)
        );

        -- ============ COMMENTS (with 1-level replies) ============
        CREATE TABLE IF NOT EXISTS public.comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            likes_count INTEGER DEFAULT 0,
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

        -- ============ COMMENT LIKES ============
        CREATE TABLE IF NOT EXISTS public.comment_likes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            UNIQUE(comment_id, user_id)
        );

        -- ============ SHARES ============
        CREATE TABLE IF NOT EXISTS public.shares (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            share_type TEXT DEFAULT 'internal' CHECK (share_type IN ('internal', 'external_link')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- ============ FOLLOWS ============
        CREATE TABLE IF NOT EXISTS public.follows (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            UNIQUE(follower_id, following_id),
            CHECK (follower_id <> following_id)
        );

        -- ============ STORIES (24h, Instagram-style) ============
        CREATE TABLE IF NOT EXISTS public.stories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
            media_url TEXT NOT NULL,
            thumbnail_url TEXT,
            media_public_id TEXT NOT NULL,
            duration_seconds NUMERIC,
            caption TEXT,
            location_name TEXT,
            views_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
        CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);

        -- ============ STORY VIEWS ============
        CREATE TABLE IF NOT EXISTS public.story_views (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
            viewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            UNIQUE(story_id, viewer_id)
        );

        -- ============ NOTIFICATIONS (like/comment/share/follow feed) ============
        CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'share', 'follow', 'story_view')),
            post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
            comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
            story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);

        -- Enable RLS + permissive policy on every new table so local/test
        -- Supabase project behaves the same way Auth's users table does.
        """

        tables = [
            "posts", "post_likes", "comments", "comment_likes",
            "shares", "follows", "stories", "story_views", "notifications"
        ]
        rls_script = "\n".join(
            f"""
            ALTER TABLE public.{t} ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Allow public CRUD" ON public.{t};
            CREATE POLICY "Allow public CRUD" ON public.{t} FOR ALL USING (true) WITH CHECK (true);
            """
            for t in tables
        )

        try:
            with psycopg2.connect(settings.SUPABASE_DB_URL) as conn:
                conn.autocommit = True
                with conn.cursor() as cur:
                    cur.execute(sql_script)
                    cur.execute(rls_script)
            print("✅ [SUCCESS] All Social tables verified/created successfully.")
        except Exception as e:
            print(f"❌ [ERROR] Social table creation failed: {str(e)}")


def init_social_module():
    """Single entrypoint called from main.py on startup."""
    UserProfileExtension.alter_users_table()
    SocialModels.init_all_tables()
