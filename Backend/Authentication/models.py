import psycopg2
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from config.database import settings  # settings object එක කෙලින්ම ගන්නවා


class UserModel:
    """
    Data model representing a User record in the Supabase PostgreSQL database.
    Includes self-initialization routine for schema generation via direct REST API.
    """

    def __init__(
            self,
            id: UUID,
            email: str,
            password_hash: str,
            full_name: str,
            role: str = "user",
            created_at: Optional[datetime] = None,
            updated_at: Optional[datetime] = None
    ):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.full_name = full_name
        self.role = role
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    @classmethod
    def init_table(cls):
        """
        Creates the 'users' table (if missing) by connecting directly to the
        Postgres database. PostgREST (the Supabase REST client) has no endpoint
        for running arbitrary DDL, so a direct psycopg2 connection is required
        for real auto-creation of tables.
        """
        sql_script = """
        CREATE TABLE IF NOT EXISTS public.users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT DEFAULT 'user' NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Allow public CRUD" ON public.users;
        CREATE POLICY "Allow public CRUD" ON public.users FOR ALL USING (true) WITH CHECK (true);
        """

        try:
            with psycopg2.connect(settings.SUPABASE_DB_URL) as conn:
                conn.autocommit = True
                with conn.cursor() as cur:
                    cur.execute(sql_script)
            print("✅ [SUCCESS] 'users' table verified/created successfully.")
        except Exception as e:
            print(f"❌ [ERROR] Automated table creation failed: {str(e)}")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "email": self.email,
            "password_hash": self.password_hash,
            "full_name": self.full_name,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UserModel":
        raw_id = data.get("id")
        user_id = UUID(raw_id) if isinstance(raw_id, str) else raw_id
        return cls(
            id=user_id,
            email=data.get("email"),
            password_hash=data.get("password_hash"),
            full_name=data.get("full_name"),
            role=data.get("role", "user"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )