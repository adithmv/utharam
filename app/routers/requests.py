from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import supabase

router = APIRouter(prefix="/requests", tags=["Requests"])

class RequestCreate(BaseModel):
    content: str

@router.get("/")
def get_all_requests():
    response = supabase.table("requests").select("*").order("upvotes", desc=True).execute()
    return response.data

@router.post("/")
def create_request(request: RequestCreate):
    response = supabase.table("requests").insert({"content": request.content}).execute()
    return response.data

@router.patch("/{request_id}/upvote")
def upvote_request(request_id: str):
    current = supabase.table("requests").select("upvotes").eq("id", request_id).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Request not found")
    new_count = current.data[0]["upvotes"] + 1
    response = supabase.table("requests").update({"upvotes": new_count}).eq("id", request_id).execute()
    return response.data