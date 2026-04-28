"""
성장/생존 도구 7개 API 엔드포인트.
"""
from typing import Optional, Dict, List, Any
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.database import get_db
from ...models.simulation import Simulation
from ...services.growth_tools import growth_tools_service

router = APIRouter(prefix="/tools", tags=["Growth Tools"])


# ────────── 요청 모델 ──────────

class MarketingROASRequest(BaseModel):
    clinic_type: str
    monthly_budget: int = Field(..., ge=0)
    channels: Optional[List[str]] = None
    avg_revenue_per_patient: Optional[int] = None
    retention_months: float = 6.0
    region_code: str = ""


class ClosureCasesRequest(BaseModel):
    simulation_id: Optional[UUID] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sido_cd: Optional[str] = None
    sggu_cd: Optional[str] = None
    radius_m: int = 1000
    years: int = 5
    clinic_type_filter: Optional[str] = None


class ProcedureRevenueRequest(BaseModel):
    clinic_type: str
    procedure_volumes: Dict[str, int]
    region_code: str = ""


class PriceOptimizeRequest(BaseModel):
    clinic_type: str
    current_price: int
    current_patients_monthly: int
    price_change_pct: float = 0.0


class HiringROIRequest(BaseModel):
    clinic_type: str
    current_daily_patients: int
    current_staff_count: int
    new_role: str = "간호사"
    new_role_experience: str = "3년차"
    avg_revenue_per_patient: int = 50000
    region_code: str = ""


class WorkingHoursRequest(BaseModel):
    clinic_type: str
    current_monthly_patients: int
    avg_revenue_per_patient: int
    worker_ratio: float = 0.5
    added_hours: Optional[List[str]] = None


class BrandingRequest(BaseModel):
    clinic_type: str
    demographics: Dict[str, Any]
    commercial_data: Optional[Dict[str, Any]] = None
    competitors: Optional[List[Dict[str, Any]]] = None


# ────────── 엔드포인트 ──────────

@router.post("/marketing-roas")
async def calc_marketing_roas(req: MarketingROASRequest):
    """마케팅 채널별 ROAS 계산 + 신환 예측."""
    return growth_tools_service.calculate_marketing_roas(**req.model_dump())


@router.post("/closure-cases")
async def analyze_closure(
    req: ClosureCasesRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    상권 폐업 사례 분석 (지도 + LOCALDATA 실데이터).
    simulation_id 보내면 해당 시뮬의 좌표/지역 자동 사용.
    """
    lat = req.latitude
    lng = req.longitude
    sido_cd = req.sido_cd or ""
    sggu_cd = req.sggu_cd or ""
    clinic_type = req.clinic_type_filter

    if req.simulation_id:
        result = await db.execute(
            select(Simulation).where(Simulation.id == req.simulation_id)
        )
        sim = result.scalar_one_or_none()
        if not sim:
            raise HTTPException(status_code=404, detail="Simulation not found")
        lat = lat or sim.latitude
        lng = lng or sim.longitude
        # demographics_data에서 region_code 추출
        region_code = ""
        if isinstance(sim.demographics_data, dict):
            region_code = sim.demographics_data.get("region_code", "") or ""
        if region_code and len(region_code) >= 5:
            sido_cd = sido_cd or region_code[:2]
            sggu_cd = sggu_cd or region_code[2:5]
        clinic_type = clinic_type or sim.clinic_type

    if not lat or not lng or not sido_cd:
        raise HTTPException(
            status_code=400,
            detail="latitude/longitude/sido_cd 또는 simulation_id 필수",
        )

    return await growth_tools_service.analyze_closure_cases(
        latitude=lat,
        longitude=lng,
        sido_cd=sido_cd,
        sggu_cd=sggu_cd,
        radius_m=req.radius_m,
        years=req.years,
        clinic_type_filter=clinic_type,
    )


@router.post("/procedure-revenue")
async def simulate_procedure(req: ProcedureRevenueRequest):
    """비급여 시술 조합 매출 시뮬."""
    return growth_tools_service.simulate_procedure_revenue(**req.model_dump())


@router.get("/procedure-list/{clinic_type}")
async def list_procedures(clinic_type: str):
    """진료과별 비급여 시술 목록 + 평균 단가."""
    from ...data.growth_reference import NON_COVERED_PROCEDURES
    procedures = NON_COVERED_PROCEDURES.get(clinic_type, [])
    return {
        "clinic_type": clinic_type,
        "available": len(procedures) > 0,
        "procedures": procedures,
    }


@router.post("/price-optimize")
async def optimize_price(req: PriceOptimizeRequest):
    """가격탄력성 모델로 최적 가격 시뮬."""
    return growth_tools_service.optimize_price(**req.model_dump())


@router.post("/hiring-roi")
async def hiring_roi(req: HiringROIRequest):
    """직원 채용 ROI + BEP 계산."""
    return growth_tools_service.calculate_hiring_roi(**req.model_dump())


@router.post("/working-hours")
async def working_hours(req: WorkingHoursRequest):
    """진료시간 추가 시 매출 변화."""
    return growth_tools_service.optimize_working_hours(**req.model_dump())


@router.post("/branding")
async def branding(req: BrandingRequest):
    """브랜딩 페르소나 + 차별화 + 광고 카피."""
    return growth_tools_service.build_branding_strategy(**req.model_dump())


@router.get("/marketing-channels")
async def list_marketing_channels():
    """마케팅 채널 벤치마크 (강남언니/굿닥/네이버 등)."""
    from ...data.growth_reference import MARKETING_CHANNELS
    return {"channels": MARKETING_CHANNELS}
