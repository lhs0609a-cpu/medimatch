from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class SlotStatus(str, Enum):
    OPEN = "OPEN"
    BIDDING = "BIDDING"
    MATCHED = "MATCHED"
    CLOSED = "CLOSED"


class BidStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


# PharmacySlot Schemas
class PharmacySlotBase(BaseModel):
    address: str = Field(..., max_length=500)
    latitude: float
    longitude: float
    clinic_type: str = Field(..., max_length=50)
    clinic_name: Optional[str] = None
    est_daily_rx: Optional[int] = None
    est_monthly_revenue: Optional[int] = None
    min_bid_amount: int = Field(..., gt=0)
    floor_info: Optional[str] = None
    area_pyeong: Optional[float] = None
    description: Optional[str] = None
    bid_deadline: Optional[datetime] = None


class PharmacySlotCreate(PharmacySlotBase):
    pass


class PharmacySlotUpdate(BaseModel):
    clinic_name: Optional[str] = None
    est_daily_rx: Optional[int] = None
    est_monthly_revenue: Optional[int] = None
    min_bid_amount: Optional[int] = None
    floor_info: Optional[str] = None
    area_pyeong: Optional[float] = None
    description: Optional[str] = None
    status: Optional[SlotStatus] = None
    bid_deadline: Optional[datetime] = None


class PharmacySlotResponse(PharmacySlotBase):
    id: UUID
    status: SlotStatus
    created_at: datetime
    updated_at: datetime
    bid_count: Optional[int] = 0
    highest_bid: Optional[int] = None

    class Config:
        from_attributes = True


class PharmacySlotListResponse(BaseModel):
    items: List[PharmacySlotResponse]
    total: int
    page: int
    page_size: int


# Bid Schemas
class BidBase(BaseModel):
    bid_amount: int = Field(..., gt=0)
    message: Optional[str] = None
    experience_years: Optional[int] = None
    pharmacy_name: Optional[str] = None


class BidCreate(BidBase):
    pass


class BidUpdate(BaseModel):
    bid_amount: Optional[int] = None
    message: Optional[str] = None


class BidResponse(BidBase):
    id: UUID
    slot_id: UUID
    pharmacist_id: UUID
    status: BidStatus
    created_at: datetime
    pharmacist_name: Optional[str] = None
    pharmacist_email: Optional[str] = None

    class Config:
        from_attributes = True


class BidListResponse(BaseModel):
    items: List[BidResponse]
    total: int
