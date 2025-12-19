from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from ...schemas.simulation import (
    SimulationRequest, SimulationResponse, SimulationListResponse,
    CompetitorInfo, ReportPurchaseRequest, ReportResponse
)
from ...services.simulation import simulation_service
from ...models.user import User
from ..deps import get_db, get_current_active_user
from ...core.security import get_current_user, TokenData

router = APIRouter()


@router.post("", response_model=SimulationResponse)
async def create_simulation(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    시뮬레이션 실행

    주소와 진료과목을 입력하면 예상 매출, 비용, 경쟁 현황 등을 분석합니다.

    - **address**: 개원 예정 주소
    - **clinic_type**: 진료과목 (내과, 정형외과, 피부과 등)
    - **size_pyeong**: 면적 (평, 선택)
    - **budget_million**: 예산 (백만원, 선택)
    """
    try:
        user_id = UUID(current_user.user_id) if current_user else None
        result = await simulation_service.create_simulation(
            db=db,
            request=request,
            user_id=user_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(
    simulation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """시뮬레이션 결과 조회"""
    result = await simulation_service.get_simulation(db, simulation_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found"
        )
    return result


@router.get("/{simulation_id}/competitors", response_model=list[CompetitorInfo])
async def get_competitors(
    simulation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """경쟁 병원 상세 정보"""
    competitors = await simulation_service.get_competitors_detail(db, simulation_id)
    return competitors


@router.get("/{simulation_id}/listings")
async def get_matched_listings(
    simulation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """매칭 매물 목록 (부공연 중개 연결)"""
    # This would connect to real estate listings
    # For now, return mock data
    return {
        "simulation_id": str(simulation_id),
        "listings": [
            {
                "id": "listing_001",
                "address": "서울시 강남구 역삼동 123-45",
                "floor": "3층",
                "area_pyeong": 35,
                "rent_deposit": 100000000,
                "rent_monthly": 5000000,
                "premium": 50000000,
                "contact": "부공연 담당자",
                "phone": "02-1234-5678"
            }
        ],
        "total": 1
    }


@router.post("/reports/purchase", response_model=ReportResponse)
async def purchase_report(
    request: ReportPurchaseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    유료 리포트 결제

    상세 분석 리포트를 구매합니다. (건당 3만원)
    """
    # In real implementation, integrate with Toss Payments
    # For now, create a pending report
    from ...models.simulation import SimulationReport
    from sqlalchemy import select

    # Check if simulation exists
    simulation = await simulation_service.get_simulation(db, request.simulation_id)
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found"
        )

    # Check for existing report
    result = await db.execute(
        select(SimulationReport).where(
            SimulationReport.simulation_id == request.simulation_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing and existing.payment_status == "completed":
        return ReportResponse.model_validate(existing)

    # Create new report
    report = SimulationReport(
        simulation_id=request.simulation_id,
        payment_amount=30000,  # 3만원
        payment_status="pending"
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    return ReportResponse.model_validate(report)


@router.get("/reports/{report_id}/download")
async def download_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """PDF 리포트 다운로드"""
    from ...models.simulation import SimulationReport
    from sqlalchemy import select

    result = await db.execute(
        select(SimulationReport).where(SimulationReport.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if report.payment_status != "completed":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Payment required to download report"
        )

    if not report.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report PDF not yet generated"
        )

    return {"download_url": report.pdf_url}


@router.get("/my/simulations", response_model=SimulationListResponse)
async def get_my_simulations(
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """내 시뮬레이션 목록"""
    result = await simulation_service.get_user_simulations(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size
    )
    return result
