from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config.database import settings
from Authentication.repositories import AuthRepository

# Setup password hashing configuration using Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
auth_repo = AuthRepository()


class AuthService:

    def hash_password(self, password: str) -> str:
        """Hashes a plain text password using bcrypt."""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain text password against its corresponding hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def create_access_token(self, data: dict) -> str:
        """Generates a secure JSON Web Token (JWT) with an expiration time."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def register_user(self, schema):
        """Validates and registers a new user into the system."""
        existing_user = auth_repo.get_user_by_email(schema.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered."
            )

        hashed_password = self.hash_password(schema.password)

        user_dict = {
            "email": schema.email,
            "password_hash": hashed_password,
            "full_name": schema.full_name,
            "role": schema.role
        }
        return auth_repo.create_user(user_dict)

    def authenticate_user(self, schema):
        """Authenticates a user and returns a signed access token."""
        user = auth_repo.get_user_by_email(schema.email)
        if not user or not self.verify_password(schema.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        token_data = {
            "sub": str(user["id"]),
            "role": user["role"],
            "email": user["email"]
        }
        token = self.create_access_token(token_data)

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user["role"]
        }

    @staticmethod
    def verify_role(required_roles: list[str]):
        """Dependency middleware to protect routes based on specific user roles."""

        def dependency(credentials: HTTPAuthorizationCredentials = Security(security)):
            token = credentials.credentials
            try:
                payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
                user_role = payload.get("role")

                if user_role not in required_roles:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Permission denied. You do not have access to this resource."
                    )
                return payload
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired."
                )
            except jwt.InvalidTokenError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token."
                )

        return dependency