from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, engine
from models import Base
from schemas import UserCreate, Token, ComplaintCreate, ComplaintUpdate, ComplaintListResponse, MapPoint
from crud import create_user, get_user_by_username, create_complaint, get_user_complaints, get_complaint, update_complaint, get_complaints_for_map, get_admin_complaints
from auth import create_access_token, get_password_hash, get_current_user, authenticate_user
from ai_processor import get_ai_detector
from datetime import timedelta
import os
import uuid
from typing import List

app = FastAPI(title="Complaint Management API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Authentication endpoints
@app.post("/auth/register", response_model=Token)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    db_user = await create_user(db, user)
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(username: str, password: str, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.get("/users/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user

# Complaint endpoints
@app.post("/complaints")
async def create_new_complaint(
    image: UploadFile = File(...),
    description: str = Form(None),
    lat: float = Form(...),
    lon: float = Form(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Save uploaded image
    file_extension = image.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    image_path = f"uploads/{unique_filename}"
    
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    
    with open(image_path, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
    
    # Process with AI
    ai_detector = get_ai_detector()
    has_problem, confidence, category = ai_detector.detect_potholes(image_path)
    
    if not has_problem:
        # If no problem detected, we might want to return an error
        # or handle this differently based on your requirements
        pass
    
    # Create complaint
    complaint_data = ComplaintCreate(
        image_path=image_path,
        description=description,
        lat=lat,
        lon=lon
    )
    
    # Override category if AI detected something
    if has_problem and category:
        complaint_data.category = category
    
    complaint = await create_complaint(db, complaint_data, current_user.id)
    
    return complaint

@app.get("/complaints/my", response_model=ComplaintListResponse)
async def get_my_complaints(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    complaints, total = await get_user_complaints(db, current_user.id, skip, limit)
    return ComplaintListResponse(complaints=complaints, total=total)

@app.get("/complaints/{complaint_id}")
async def get_complaint_by_id(
    complaint_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    complaint = await get_complaint(db, complaint_id)
    if not complaint or complaint.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

# Admin endpoints (only for admin users)
@app.get("/admin/complaints")
async def get_all_complaints(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    complaints, total = await get_admin_complaints(db, status, skip, limit)
    return ComplaintListResponse(complaints=complaints, total=total)

@app.put("/admin/complaints/{complaint_id}")
async def update_complaint_status(
    complaint_id: int,
    complaint_update: ComplaintUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    updated_complaint = await update_complaint(db, complaint_id, complaint_update)
    if not updated_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return updated_complaint

# Map endpoints
@app.get("/map/complaints", response_model=List[MapPoint])
async def get_complaints_for_map_view(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    complaints = await get_complaints_for_map(db)
    return complaints

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)