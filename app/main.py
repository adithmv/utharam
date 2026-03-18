from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import materials, requests, announcements, admin
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Utharam API")

# Load allowed origins from .env (comma-separated)
# Example: ALLOWED_ORIGINS=https://utharam.vercel.app,https://mycustomdomain.com
env_origins = os.getenv("ALLOWED_ORIGINS", "")
extra_origins = [o.strip() for o in env_origins.split(",") if o.strip()]

origins = [
    "https://utharam.vercel.app",  # Production
    "http://localhost:5500",       # Local testing
    "http://127.0.0.1:5500",       # Local testing (alternative)
    *extra_origins                 # Any additional origins from .env
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materials.router)
app.include_router(requests.router)
app.include_router(announcements.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "Utharam API is running"}