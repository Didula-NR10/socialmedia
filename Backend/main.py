import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from Authentication.routers import router as auth_router
from Authentication.models import UserModel

from Social.routers import router as social_router
from Social.webhooks import router as social_webhooks_router
from Social.models import init_social_module
from Social.tasks import start_scheduler

app = FastAPI(title="Social Module - Standalone Test Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UserModel.init_table()
init_social_module()

start_scheduler()

app.include_router(auth_router)
app.include_router(social_router)
app.include_router(social_webhooks_router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "module": "social-standalone"}

@app.get("/{catchall:path}")
def serve_spa(catchall: str):
    file_path = os.path.join("static", catchall)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    return FileResponse("static/index.html")