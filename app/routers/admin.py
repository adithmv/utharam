from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response, Request
from app.database import supabase
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
sessions = {}

def is_authenticated(request: Request):
    token = request.cookies.get("session")
    return token and sessions.get(token) == "admin"

@router.post("/login")
def login(response: Response, username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        import secrets
        token = secrets.token_hex(32)
        sessions[token] = "admin"
        response.set_cookie(key="session", value=token, httponly=True)
        return {"message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get("session")
    if token in sessions:
        del sessions[token]
    response.delete_cookie("session")
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
    
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, ZIP allowed")

    file_bytes = await file.read()
    file_path = f"{dept}/{sem}/{subject}/{file.filename}"
    
    supabase.storage.from_("materials").upload(file_path, file_bytes, {"content-type": file.content_type})
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