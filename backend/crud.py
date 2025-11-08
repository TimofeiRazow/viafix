from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from models import User, Complaint, Organization
from schemas import UserCreate, ComplaintCreate, ComplaintUpdate
from auth import get_password_hash
from typing import List, Optional

async def create_user(db: AsyncSession, user: UserCreate):
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        language=user.language
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(User).filter(User.username == username))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()

async def create_complaint(db: AsyncSession, complaint: ComplaintCreate, user_id: int):
    db_complaint = Complaint(
        user_id=user_id,
        image_path=complaint.image_path,
        description=complaint.description,
        lat=complaint.lat,
        lon=complaint.lon
    )
    db.add(db_complaint)
    await db.commit()
    await db.refresh(db_complaint)
    return db_complaint

async def get_complaint(db: AsyncSession, complaint_id: int):
    result = await db.execute(select(Complaint).filter(Complaint.id == complaint_id))
    return result.scalar_one_or_none()

async def get_user_complaints(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(Complaint)
        .filter(Complaint.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    complaints = result.scalars().all()
    
    count_result = await db.execute(
        select(Complaint)
        .filter(Complaint.user_id == user_id)
    )
    total = len(count_result.scalars().all())
    
    return complaints, total

async def get_all_complaints(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Complaint).offset(skip).limit(limit))
    complaints = result.scalars().all()
    
    count_result = await db.execute(select(Complaint))
    total = len(count_result.scalars().all())
    
    return complaints, total

async def update_complaint(db: AsyncSession, complaint_id: int, complaint_update: ComplaintUpdate):
    result = await db.execute(select(Complaint).filter(Complaint.id == complaint_id))
    db_complaint = result.scalar_one_or_none()
    
    if db_complaint:
        if complaint_update.status:
            db_complaint.status = complaint_update.status
        if complaint_update.organization_id:
            db_complaint.organization_id = complaint_update.organization_id
        if complaint_update.description:
            db_complaint.description = complaint_update.description
            
        await db.commit()
        await db.refresh(db_complaint)
    
    return db_complaint

async def get_complaints_for_map(db: AsyncSession):
    result = await db.execute(
        select(Complaint.id, Complaint.lat, Complaint.lon, Complaint.category, Complaint.status, Complaint.created_at)
    )
    complaints = result.all()
    
    return [
        {
            "id": complaint.id,
            "lat": complaint.lat,
            "lon": complaint.lon,
            "category": complaint.category,
            "status": complaint.status,
            "created_at": complaint.created_at
        }
        for complaint in complaints
    ]

async def get_admin_complaints(db: AsyncSession, status: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = select(Complaint)
    
    if status:
        query = query.filter(Complaint.status == status)
    
    result = await db.execute(query.offset(skip).limit(limit))
    complaints = result.scalars().all()
    
    count_query = select(Complaint)
    if status:
        count_query = count_query.filter(Complaint.status == status)
    
    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())
    
    return complaints, total