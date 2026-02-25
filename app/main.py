from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import materials, requests, announcements, admin

app = FastAPI(title="Utharam API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://utharam.vercel.app"],
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