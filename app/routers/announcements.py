from fastapi import APIRouter
from app.database import supabase

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("/")
def get_active_announcement():
    response = supabase.table("announcements").select("*").eq("is_active", True).execute()
    return response.data