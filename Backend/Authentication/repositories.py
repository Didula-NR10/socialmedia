from typing import Optional, Dict
from config.database import supabase

class AuthRepository:
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """
        Fetches a user record from the database by their unique email.
        """

        response = supabase.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    def create_user(self, user_data: dict) -> Optional[dict]:
        """
        Inserts a new user record into the users table.
        """
        response = supabase.table("users").insert(user_data).execute()
        return response.data[0] if response.data else None