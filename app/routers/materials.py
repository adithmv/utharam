from fastapi import APIRouter, HTTPException
from app.database import supabase

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.get("/")
def get_all_materials():
    response = supabase.table("materials").select("*").order("created_at", desc=True).execute()
    return response.data

@router.get("/dept/{dept}")
def get_by_dept(dept: str):
    response = supabase.table("materials").select("*").eq("dept", dept).execute()
    return response.data

@router.get("/dept/{dept}/sem/{sem}")
def get_by_dept_and_sem(dept: str, sem: str):
    response = supabase.table("materials").select("*").eq("dept", dept).eq("sem", sem).execute()
    return response.data

@router.get("/subject/{subject}")
def get_by_subject(subject: str):
    response = supabase.table("materials").select("*").eq("subject", subject).execute()
    return response.data

@router.get("/search")
def search_materials(q: str):
    response = supabase.table("materials").select("*").ilike("title", f"%{q}%").execute()
    return response.data