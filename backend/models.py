from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    language = Column(String(5), default='ru')
    role = Column(String(16), default='user')  # 'user' or 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    complaints = relationship("Complaint", back_populates="user")

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    contact_email = Column(String(128))
    contact_phone = Column(String(64))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    complaints = relationship("Complaint", back_populates="organization")

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String(255))
    category = Column(String(64))  # 'pothole', 'multiple_potholes', 'possible_pothole', etc.
    description = Column(Text)
    lat = Column(Float)
    lon = Column(Float)
    status = Column(String(32), default='pending')  # 'pending', 'processing', 'in_progress', 'resolved', 'rejected'
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    ai_confidence = Column(Float, nullable=True)  # Уверенность AI в обнаружении (0.0-1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="complaints")
    organization = relationship("Organization", back_populates="complaints")