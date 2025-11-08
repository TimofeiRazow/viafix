from pydantic import BaseModel, Field
from typing import Optional
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
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    organization_id: Optional[int] = None
    description: Optional[str] = None

class ComplaintListResponse(BaseModel):
    complaints: list[ComplaintResponse]
    total: int

class MapPoint(BaseModel):
    id: int
    lat: float
    lon: float
    category: str
    status: str
    created_at: datetime