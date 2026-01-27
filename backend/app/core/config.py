from pydantic_settings import BaseSettings
from pydantic import field_validator
import warnings
from typing import List, Optional, Union
from functools import lru_cache
import os
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "메디플라톤 API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8080

    # Database - fly.io uses DATABASE_URL with postgres:// prefix
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/mediplaton"
    DATABASE_ECHO: bool = False

    @property
    def async_database_url(self) -> str:
        """Convert postgres:// to postgresql+asyncpg:// for SQLAlchemy async"""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Remove sslmode parameter if present (not supported by asyncpg directly)
        if "?sslmode=" in url:
            url = url.split("?sslmode=")[0]
        return url

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT Authentication
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_SECRET_KEY: str = ""  # Falls back to SECRET_KEY
    JWT_ALGORITHM: str = "HS256"
    ALGORITHM: str = "HS256"  # Alias for JWT_ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def get_jwt_secret(self) -> str:
        """Get JWT secret key, falling back to SECRET_KEY"""
        return self.JWT_SECRET_KEY or self.SECRET_KEY

    # Public Data APIs
    HIRA_API_KEY: str = ""  # 건강보험심사평가원
    BUILDING_API_KEY: str = ""  # 국토교통부 건축물대장
    COMMERCIAL_API_KEY: str = ""  # 소상공인진흥공단 상권정보
    MOIS_API_KEY: str = ""  # 행정안전부
    REALESTATE_API_KEY: str = ""  # 국토교통부 부동산 실거래가
    VWORLD_API_KEY: str = ""  # 브이월드 (공간정보)

    # SMS API (Solapi)
    SOLAPI_API_KEY: str = ""
    SOLAPI_API_SECRET: str = ""
    SOLAPI_SENDER_PHONE: str = ""  # 발신번호

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
    S3_BUCKET_NAME: str = "mediplaton-files"

    # Payment (Toss Payments) - 결제위젯 연동 키
    TOSS_CLIENT_KEY: str = ""
    TOSS_SECRET_KEY: str = ""

    # Toss Payments - 자동결제(빌링) 키
    TOSS_BILLING_MID: str = ""
    TOSS_BILLING_CLIENT_KEY: str = ""
    TOSS_BILLING_SECRET_KEY: str = ""

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://medimatch-sooty-two-82.vercel.app",
    ]
    FRONTEND_URL: str = "http://localhost:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS_ORIGINS from environment variable (JSON list or comma-separated string)"""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # Try JSON list first
            if v.startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Fall back to comma-separated string
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@mediplaton.kr"
    SMTP_FROM_NAME: str = "메디플라톤"

    # FCM (Firebase Cloud Messaging)
    FCM_SERVER_KEY: str = ""
    FCM_PROJECT_ID: str = ""

    # Twilio (SMS)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Kakao Alimtalk
    KAKAO_ALIMTALK_API_KEY: str = ""
    KAKAO_SENDER_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
