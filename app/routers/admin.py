from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response, Request
from app.database import supabase
from dotenv import load_dotenv
import os
import re
import jwt
from datetime import datetime, timezone, timedelta

load_dotenv()

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET", "changeme-use-a-strong-secret-in-env")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 12

def create_jwt_token() -> str:
    payload = {
        "sub": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def is_authenticated(request: Request) -> bool:
    token = request.cookies.get("session")
    if not token:
        return False
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub") == "admin"
    except jwt.ExpiredSignatureError:
        return False
    except jwt.InvalidTokenError:
        return False

@router.post("/login")
def login(response: Response, username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = create_jwt_token()
        response.set_cookie(
            key="session",
            value=token,
            httponly=True,
            samesite="none",
            secure=True,
            max_age=JWT_EXPIRE_HOURS * 3600
        )
        return {"message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="session",
        samesite="none",
        secure=True
    )
    return {"message": "Logged out"}

@router.post("/materials/upload")
async def upload_material(
    request: Request,
    title: str = Form(...),
    dept: str = Form(...),
    sem: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    file: UploadFile = File(...)
):
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    clean_name = re.sub(r'[^a-zA-Z0-9.-]', '_', file.filename)
    file_path = f"{dept}/{sem}/{subject}/{clean_name}"

    file_bytes = await file.read()

    supabase.storage.from_("materials").upload(
        file_path, file_bytes, {"content-type": file.content_type}
    )
    file_url = supabase.storage.from_("materials").get_public_url(file_path)

    supabase.table("materials").insert({
        "title": title,
        "dept": dept,
        "sem": sem,
        "subject": subject,
        "description": description,
        "date": date,
        "file_url": file_url
    }).execute()

    return {"message": "Material uploaded successfully"}

@router.delete("/materials/{material_id}")
def delete_material(material_id: str, request: Request):
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Unauthorized")
    supabase.table("materials").delete().eq("id", material_id).execute()
    return {"message": "Deleted successfully"}

@router.post("/announcements")
def add_announcement(request: Request, message: str = Form(...)):
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Unauthorized")
    supabase.table("announcements").update({"is_active": False}).eq("is_active", True).execute()
    supabase.table("announcements").insert({"message": message, "is_active": True}).execute()
    return {"message": "Announcement updated"}

@router.delete("/requests/{request_id}")
def delete_request(request_id: str, request: Request):
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Unauthorized")
    supabase.table("requests").delete().eq("id", request_id).execute()
    return {"message": "Request deleted"}