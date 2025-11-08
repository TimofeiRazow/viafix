from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./complaints.db"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    AI_MODEL_PATH: str = "cazzz307/Pothole-Finetuned-YoloV8"
    
    class Config:
        env_file = ".env"

settings = Settings()