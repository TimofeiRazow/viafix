from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    user = "user"
    admin = "admin"

class ComplaintStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"

class ComplaintCategory(str, Enum):
    pothole = "pothole"
    multiple_potholes = "multiple_potholes"
    possible_pothole = "possible_pothole"
    manhole = "manhole"
    sidewalk_damage = "sidewalk_damage"
    unknown = "unknown"
    error = "error"

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    language: str = "ru"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    language: str
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ComplaintCreate(BaseModel):
    image_path: str
    description: Optional[str] = None
    lat: float
    lon: float
    category: Optional[str] = None
    ai_confidence: Optional[float] = None

class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    image_path: Optional[str]
    category: Optional[str]
    description: Optional[str]
    lat: float
    lon: float
    status: ComplaintStatus
    organization_id: Optional[int]
    ai_confidence: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    organization_id: Optional[int] = None
    description: Optional[str] = None

class ComplaintListResponse(BaseModel):
    complaints: List[ComplaintResponse]
    total: int

class MapPoint(BaseModel):
    id: int
    lat: float
    lon: float
    category: str
    status: str
    created_at: datetime

# AI Detection models
class Detection(BaseModel):
    id: int
    confidence: float
    bbox: List[float] = Field(..., description="Bounding box coordinates [x1, y1, x2, y2]")
    area: float

class AIDetectionResponse(BaseModel):
    has_problem: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    category: str
    annotated_image: Optional[str] = Field(None, description="Base64 encoded annotated image")
    detection_count: int = Field(..., ge=0)
    severity: str = Field(..., description="none, medium, high, critical, error")
    detections: List[Detection] = Field(default_factory=list)