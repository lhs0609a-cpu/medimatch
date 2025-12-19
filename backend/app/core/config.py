from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MediMatch API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/medimatch"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT Authentication
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Public Data APIs
    HIRA_API_KEY: str = ""  # 건강보험심사평가원
    BUILDING_API_KEY: str = ""  # 국토교통부 건축물대장
    COMMERCIAL_API_KEY: str = ""  # 소상공인진흥공단 상권정보
    MOIS_API_KEY: str = ""  # 행정안전부

    # Map APIs
    KAKAO_MAP_API_KEY: str = ""
    NAVER_MAP_API_KEY: str = ""

    # AI APIs
    OPENAI_API_KEY: str = ""
    GOOGLE_AI_API_KEY: str = ""

    # AWS
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-northeast-2"
    S3_BUCKET_NAME: str = "medimatch-files"

    # Payment (Toss Payments)
    TOSS_CLIENT_KEY: str = ""
    TOSS_SECRET_KEY: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
