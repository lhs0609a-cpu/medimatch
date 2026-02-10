from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    PHARMACIST = "PHARMACIST"
    SALES_REP = "SALES_REP"
    DOCTOR = "DOCTOR"
    LANDLORD = "LANDLORD"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    role: UserRole = UserRole.DOCTOR
    company: Optional[str] = None
    license_number: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    company: Optional[str] = None
    license_number: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    company: Optional[str] = None
    license_number: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    refresh_token: str
