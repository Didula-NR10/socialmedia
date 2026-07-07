from fastapi import APIRouter, Depends, status
from Authentication.schemas import SignupSchema, LoginSchema, TokenResponse, UserResponse
from Authentication.services import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
auth_service = AuthService()

@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
def signup(data: SignupSchema):
    """Endpoint for new user self-registration."""
    return auth_service.register_user(data)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginSchema):
    """Endpoint to exchange user credentials for an access token."""
    return auth_service.authenticate_user(data)

# ---- EXAMPLES OF ROLE-BASED PROTECTED ROUTES ----

@router.get("/admin-only", dependencies=[Depends(AuthService.verify_role(["admin"]))])
def admin_route():
    """Secure endpoint accessible only by users with the 'admin' role."""
    return {"status": "success", "data": "Welcome to the Admin Management Dashboard"}

@router.get("/dashboard")
def general_dashboard(current_user: dict = Depends(AuthService.verify_role(["admin", "manager", "user"]))):
    """Secure endpoint accessible by admin, manager, and regular users."""
    return {
        "status": "success",
        "message": "Welcome to the application dashboard",
        "user_email": current_user.get("email"),
        "user_role": current_user.get("role")
    }