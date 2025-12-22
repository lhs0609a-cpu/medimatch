from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

from ..deps import get_db
from ...models.hospital import Hospital
from ...models.prospect import ProspectLocation, ProspectStatus
from ...models.pharmacy import PharmacySlot, SlotStatus

router = APIRouter()


class MarkerType(str, Enum):
    HOSPITAL = "hospital"
    PROSPECT = "prospect"
    PHARMACY = "pharmacy"


class MarkerInfo(BaseModel):
    address: Optional[str] = None
    score: Optional[int] = None
    specialty: Optional[str] = None
    previous_clinic: Optional[str] = None
    floor_area: Optional[float] = None
    est_revenue: Optional[int] = None


class MapMarker(BaseModel):
    id: str
    lat: float
    lng: float
    title: str
    type: MarkerType
    info: Optional[MarkerInfo] = None


class MapMarkersResponse(BaseModel):
    markers: List[MapMarker]
    total: int
    bounds: dict


@router.get("/markers", response_model=MapMarkersResponse)
async def get_map_markers(
    min_lat: float = Query(..., description="최소 위도"),
    max_lat: float = Query(..., description="최대 위도"),
    min_lng: float = Query(..., description="최소 경도"),
    max_lng: float = Query(..., description="최대 경도"),
    types: Optional[str] = Query(None, description="마커 타입 (쉼표 구분): hospital,prospect,pharmacy"),
    min_score: int = Query(0, description="최소 적합도 점수"),
    max_score: int = Query(100, description="최대 적합도 점수"),
    clinic_types: Optional[str] = Query(None, description="진료과목 필터 (쉼표 구분)"),
    db: AsyncSession = Depends(get_db)
):
    """
    지도 영역 내 마커 데이터 조회

    병원, 프로스펙트(개원 적합지), 약국 자리를 조회합니다.
    """
    markers = []

    # 타입 파싱
    type_list = types.split(",") if types else ["hospital", "prospect", "pharmacy"]
    clinic_type_list = clinic_types.split(",") if clinic_types else None

    # 1. 병원 마커 조회
    if "hospital" in type_list:
        hospital_query = select(Hospital).where(
            and_(
                Hospital.is_active == True,
                Hospital.latitude.between(min_lat, max_lat),
                Hospital.longitude.between(min_lng, max_lng)
            )
        )

        # 진료과목 필터
        if clinic_type_list:
            clinic_conditions = [
                Hospital.clinic_type.ilike(f"%{ct}%") for ct in clinic_type_list
            ]
            hospital_query = hospital_query.where(or_(*clinic_conditions))

        hospital_result = await db.execute(hospital_query.limit(200))
        hospitals = hospital_result.scalars().all()

        for h in hospitals:
            markers.append(MapMarker(
                id=str(h.id),
                lat=h.latitude,
                lng=h.longitude,
                title=h.name,
                type=MarkerType.HOSPITAL,
                info=MarkerInfo(
                    address=h.address,
                    specialty=h.clinic_type
                )
            ))

    # 2. 프로스펙트 마커 조회
    if "prospect" in type_list:
        prospect_query = select(ProspectLocation).where(
            and_(
                ProspectLocation.status.in_([ProspectStatus.NEW, ProspectStatus.CONTACTED]),
                ProspectLocation.latitude.between(min_lat, max_lat),
                ProspectLocation.longitude.between(min_lng, max_lng)
            )
        )

        # 적합도 점수 필터
        if min_score > 0:
            prospect_query = prospect_query.where(
                ProspectLocation.clinic_fit_score >= min_score
            )
        if max_score < 100:
            prospect_query = prospect_query.where(
                ProspectLocation.clinic_fit_score <= max_score
            )

        prospect_result = await db.execute(prospect_query.limit(200))
        prospects = prospect_result.scalars().all()

        for p in prospects:
            # 타이틀 생성
            if p.previous_clinic:
                title = f"공실 - {p.previous_clinic}"
            elif p.type.value == "NEW_BUILD":
                title = f"신축 건물"
            else:
                title = f"개원 적합지"

            markers.append(MapMarker(
                id=str(p.id),
                lat=p.latitude,
                lng=p.longitude,
                title=title,
                type=MarkerType.PROSPECT,
                info=MarkerInfo(
                    address=p.address,
                    score=p.clinic_fit_score,
                    previous_clinic=p.previous_clinic,
                    floor_area=p.floor_area
                )
            ))

    # 3. 약국 자리 마커 조회
    if "pharmacy" in type_list:
        pharmacy_query = select(PharmacySlot).where(
            and_(
                PharmacySlot.status.in_([SlotStatus.OPEN, SlotStatus.BIDDING]),
                PharmacySlot.latitude.between(min_lat, max_lat),
                PharmacySlot.longitude.between(min_lng, max_lng)
            )
        )

        pharmacy_result = await db.execute(pharmacy_query.limit(100))
        pharmacies = pharmacy_result.scalars().all()

        for ph in pharmacies:
            markers.append(MapMarker(
                id=str(ph.id),
                lat=ph.latitude,
                lng=ph.longitude,
                title=f"약국 자리 ({ph.clinic_name or ph.clinic_type})",
                type=MarkerType.PHARMACY,
                info=MarkerInfo(
                    address=ph.address,
                    specialty=ph.clinic_type,
                    est_revenue=ph.est_monthly_revenue
                )
            ))

    return MapMarkersResponse(
        markers=markers,
        total=len(markers),
        bounds={
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lng": min_lng,
            "max_lng": max_lng
        }
    )


@router.get("/markers/{marker_id}")
async def get_marker_detail(
    marker_id: str,
    marker_type: MarkerType = Query(..., description="마커 타입"),
    db: AsyncSession = Depends(get_db)
):
    """마커 상세 정보 조회"""
    from uuid import UUID

    try:
        uuid_id = UUID(marker_id)
    except ValueError:
        return {"error": "Invalid marker ID"}

    if marker_type == MarkerType.HOSPITAL:
        result = await db.execute(
            select(Hospital).where(Hospital.id == uuid_id)
        )
        hospital = result.scalar_one_or_none()
        if hospital:
            return {
                "id": str(hospital.id),
                "type": "hospital",
                "name": hospital.name,
                "address": hospital.address,
                "latitude": hospital.latitude,
                "longitude": hospital.longitude,
                "clinic_type": hospital.clinic_type,
                "doctor_count": hospital.doctor_count,
                "phone": hospital.phone,
                "established": hospital.established,
                "floor_info": hospital.floor_info,
                "area_pyeong": hospital.area_pyeong,
                "parking_available": hospital.parking_available
            }

    elif marker_type == MarkerType.PROSPECT:
        result = await db.execute(
            select(ProspectLocation).where(ProspectLocation.id == uuid_id)
        )
        prospect = result.scalar_one_or_none()
        if prospect:
            return {
                "id": str(prospect.id),
                "type": "prospect",
                "address": prospect.address,
                "latitude": prospect.latitude,
                "longitude": prospect.longitude,
                "prospect_type": prospect.type.value,
                "zoning": prospect.zoning,
                "floor_area": prospect.floor_area,
                "floor_info": prospect.floor_info,
                "clinic_fit_score": prospect.clinic_fit_score,
                "recommended_dept": prospect.recommended_dept,
                "previous_clinic": prospect.previous_clinic,
                "rent_estimate": prospect.rent_estimate,
                "description": prospect.description,
                "detected_at": prospect.detected_at.isoformat() if prospect.detected_at else None
            }

    elif marker_type == MarkerType.PHARMACY:
        result = await db.execute(
            select(PharmacySlot).where(PharmacySlot.id == uuid_id)
        )
        slot = result.scalar_one_or_none()
        if slot:
            return {
                "id": str(slot.id),
                "type": "pharmacy",
                "address": slot.address,
                "latitude": slot.latitude,
                "longitude": slot.longitude,
                "clinic_type": slot.clinic_type,
                "clinic_name": slot.clinic_name,
                "est_daily_rx": slot.est_daily_rx,
                "est_monthly_revenue": slot.est_monthly_revenue,
                "min_bid_amount": slot.min_bid_amount,
                "floor_info": slot.floor_info,
                "area_pyeong": slot.area_pyeong,
                "description": slot.description,
                "status": slot.status.value,
                "bid_deadline": slot.bid_deadline.isoformat() if slot.bid_deadline else None
            }

    return {"error": "Marker not found"}
