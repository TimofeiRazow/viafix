from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.staticfiles import StaticFiles
from database import get_db, engine
from models import Base
from schemas import (
    UserCreate, Token, ComplaintCreate, ComplaintUpdate, 
    ComplaintListResponse, MapPoint, UserLogin, AIDetectionResponse
)
from crud import (
    create_user, get_user_by_username, create_complaint, 
    get_user_complaints, get_complaint, update_complaint, 
    get_complaints_for_map, get_admin_complaints
)
from auth import get_current_user, create_access_token, authenticate_user
from ai_processor import get_ai_detector
from datetime import timedelta
import os
import uuid
from typing import List
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Complaint Management API with AI")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
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
    
    # Инициализируем AI детектор при запуске
    try:
        get_ai_detector()
        logger.info("✅ AI детектор инициализирован")
    except Exception as e:
        logger.error(f"⚠️ AI детектор не удалось инициализировать: {e}")

# Authentication endpoints
@app.post("/auth/register", response_model=Token)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = await create_user(db, user)
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    db_user = await authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(
        data={"sub": db_user.username}, 
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.get("/users/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user

# AI Detection endpoint - только для обработки изображения
@app.post("/ai/detect", response_model=AIDetectionResponse)
async def detect_potholes(
    image: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Обработка изображения нейросетью для обнаружения ям
    Возвращает аннотированное изображение и информацию об обнаружениях
    """
    # Проверка типа файла
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Создание временного файла
    file_extension = image.filename.split(".")[-1]
    temp_filename = f"temp_{uuid.uuid4()}.{file_extension}"
    temp_path = f"uploads/temp/{temp_filename}"
    
    # Создаем директории если их нет
    os.makedirs("uploads/temp", exist_ok=True)
    
    try:
        # Сохраняем временный файл
        with open(temp_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        
        # Обработка изображения AI
        ai_detector = get_ai_detector()
        has_problem, confidence, category, annotated_image = ai_detector.detect_potholes(temp_path)
        
        # Получаем детальную информацию
        details = ai_detector.get_detection_details(temp_path)
        
        # Формируем ответ
        response = AIDetectionResponse(
            has_problem=has_problem,
            confidence=float(confidence),
            category=category,
            annotated_image=annotated_image,
            detection_count=details["total_count"],
            severity=details["severity"],
            detections=details["detections"]
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    finally:
        # Удаляем временный файл
        if os.path.exists(temp_path):
            os.remove(temp_path)

# Complaint endpoints with AI processing
@app.post("/complaints")
async def create_new_complaint(
    image: UploadFile = File(...),
    description: str = Form(None),
    lat: float = Form(...),
    lon: float = Form(...),
    ai_category: str = Form(...),  # Категория от AI
    ai_confidence: float = Form(...),  # Уверенность от AI
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Создание обращения с возможной AI-категоризацией
    """
    print("СЛОВО")
    print(ai_category)
    print(ai_confidence)
    # Save uploaded image
    file_extension = image.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    image_path = f"uploads/{unique_filename}"
    
    os.makedirs("uploads", exist_ok=True)
    
    with open(image_path, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
    
    # Если категория не передана от клиента, используем AI для определения
    if not ai_category:
        try:
            ai_detector = get_ai_detector()
            has_problem, confidence, category, _ = ai_detector.detect_potholes(image_path)
            if has_problem:
                ai_category = category
                ai_confidence = confidence
        except Exception as e:
            logger.warning(f"AI detection failed, proceeding without: {e}")
    
    # Create complaint
    complaint_data = ComplaintCreate(
        image_path=image_path,
        description=description,
        lat=lat,
        lon=lon,
        category=ai_category,
        ai_confidence = ai_confidence,
        status="pending"
    )
    
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

# Admin endpoints
@app.get("/admin/complaints")
async def get_all_complaints_admin(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    complaints, total = await get_admin_complaints(db, status, skip, limit)
    return ComplaintListResponse(complaints=complaints, total=total)

@app.put("/admin/complaints/{complaint_id}")
async def update_complaint_status(
    complaint_id: int,
    complaint_update: ComplaintUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "ai_enabled": True}

# Exception handlers
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)