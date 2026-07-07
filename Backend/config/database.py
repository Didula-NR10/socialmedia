import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import create_client, Client

# 📂 Go up 2 levels: from 'config/database.py' -> 'config/' -> 'Backend/' (Project Root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    ENVIRONMENT: str
    PROJECT_NAME: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_DB_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str

    # --- Added for Social module only. Auth logic above is untouched. ---
    # Optional + defaulted so this file still works if the real system's
    # .env doesn't define them yet (Auth/Booking never read these).
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # 🔗 Connect strictly using the calculated absolute path
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()


supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


print("🍃 [INFO] Supabase Client Initialized with Project URL Configuration.")