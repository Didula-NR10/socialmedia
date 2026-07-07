from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class SignupSchema(BaseModel):
    email: EmailStr = Field(..., description="Valid international email address")
    password: str = Field(..., min_length=8, max_length=100, description="Secure password between 8-100 characters")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    role: str = Field(default="user", description="Role for RBAC (e.g., 'admin', 'manager', 'user')")
    #mobile number

class LoginSchema(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True