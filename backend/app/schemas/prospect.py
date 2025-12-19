from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class ProspectType(str, Enum):
    NEW_BUILD = "NEW_BUILD"
    VACANCY = "VACANCY"
    RELOCATION = "RELOCATION"


class ProspectStatus(str, Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    CONVERTED = "CONVERTED"
    CLOSED = "CLOSED"


# ProspectLocation Schemas
class ProspectLocationBase(BaseModel):
    address: str
    latitude: float
    longitude: float
    type: ProspectType
    zoning: Optional[str] = None
    floor_area: Optional[float] = None
    floor_info: Optional[str] = None
    clinic_fit_score: Optional[int] = Field(None, ge=0, le=100)
    recommended_dept: Optional[List[str]] = None
    previous_clinic: Optional[str] = None
    rent_estimate: Optional[int] = None
    description: Optional[str] = None


class ProspectLocationResponse(ProspectLocationBase):
    id: UUID
    building_id: Optional[str] = None
    status: ProspectStatus
    detected_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ProspectLocationListResponse(BaseModel):
    items: List[ProspectLocationResponse]
    total: int
    page: int
    page_size: int


class ProspectMapResponse(BaseModel):
    """GeoJSON format for map display"""
    type: str = "FeatureCollection"
    features: List[dict]


class ProspectReportResponse(BaseModel):
    """AI-generated sales report for a prospect location"""
    id: UUID
    address: str
    clinic_fit_score: int
    recommended_dept: List[str]
    analysis: str
    opportunity_score: int
    market_insights: str
    competition_analysis: str
    demographic_summary: str
    recommended_actions: List[str]
    generated_at: datetime


# UserAlert Schemas
class UserAlertBase(BaseModel):
    name: Optional[str] = None
    region_codes: Optional[List[str]] = None
    region_names: Optional[List[str]] = None
    clinic_types: Optional[List[str]] = None
    min_score: int = Field(0, ge=0, le=100)
    prospect_types: Optional[List[str]] = None
    notify_email: bool = True
    notify_push: bool = False


class UserAlertCreate(UserAlertBase):
    pass


class UserAlertUpdate(BaseModel):
    name: Optional[str] = None
    region_codes: Optional[List[str]] = None
    region_names: Optional[List[str]] = None
    clinic_types: Optional[List[str]] = None
    min_score: Optional[int] = Field(None, ge=0, le=100)
    prospect_types: Optional[List[str]] = None
    notify_email: Optional[bool] = None
    notify_push: Optional[bool] = None
    is_active: Optional[bool] = None


class UserAlertResponse(UserAlertBase):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserAlertListResponse(BaseModel):
    items: List[UserAlertResponse]
    total: int
