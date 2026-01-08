from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
from datetime import datetime
from io import BytesIO

from ...schemas.simulation import (
    SimulationRequest, SimulationResponse, SimulationListResponse,
    CompetitorInfo, ReportPurchaseRequest, ReportResponse
)
from ...services.simulation import simulation_service
from ...services.ai_analysis import ai_analysis_service
from ...services.pdf_generator import pdf_generator_service
from ...models.user import User
from ...models.simulation import Simulation, SimulationReport
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
    radius_km: float = 1.0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    매칭 매물 목록 (부공연 중개 연결)

    시뮬레이션 위치 기준으로 반경 내 적합한 매물을 조회합니다.
    """
    from sqlalchemy import select, and_, func
    from ...models.listing import RealEstateListing, ListingStatus
    from ...models.simulation import Simulation

    # 시뮬레이션 조회
    sim_result = await db.execute(
        select(Simulation).where(Simulation.id == simulation_id)
    )
    simulation = sim_result.scalar_one_or_none()

    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found"
        )

    # 시뮬레이션 위치 기준 매물 조회
    if simulation.latitude and simulation.longitude:
        # Haversine 거리 계산을 위한 쿼리
        # PostgreSQL의 경우 PostGIS 사용 가능, 여기서는 간단한 근사 계산
        lat_range = radius_km / 111.0  # 위도 1도 ≈ 111km
        lng_range = radius_km / (111.0 * abs(float(simulation.latitude)) * 3.14159 / 180)

        listings_result = await db.execute(
            select(RealEstateListing).where(
                and_(
                    RealEstateListing.status == ListingStatus.AVAILABLE,
                    RealEstateListing.latitude.between(
                        simulation.latitude - lat_range,
                        simulation.latitude + lat_range
                    ),
                    RealEstateListing.longitude.between(
                        simulation.longitude - lng_range,
                        simulation.longitude + lng_range
                    )
                )
            ).order_by(
                RealEstateListing.is_featured.desc(),
                RealEstateListing.created_at.desc()
            ).limit(limit)
        )
        listings = listings_result.scalars().all()

        # 진료과목 적합도로 정렬
        clinic_type = simulation.clinic_type
        sorted_listings = sorted(
            listings,
            key=lambda l: (
                l.is_featured,
                1 if l.suitable_for and clinic_type in l.suitable_for else 0,
                -l.view_count if l.view_count else 0
            ),
            reverse=True
        )
    else:
        # 위치 정보 없으면 최신 매물 반환
        listings_result = await db.execute(
            select(RealEstateListing).where(
                RealEstateListing.status == ListingStatus.AVAILABLE
            ).order_by(
                RealEstateListing.is_featured.desc(),
                RealEstateListing.created_at.desc()
            ).limit(limit)
        )
        sorted_listings = listings_result.scalars().all()

    # 응답 형식 변환
    result_listings = []
    for listing in sorted_listings:
        result_listings.append({
            "id": str(listing.id),
            "title": listing.title,
            "address": listing.address,
            "floor": listing.floor,
            "area_pyeong": listing.area_pyeong,
            "rent_deposit": listing.rent_deposit,
            "rent_monthly": listing.rent_monthly,
            "premium": listing.premium,
            "maintenance_fee": listing.maintenance_fee,
            "suitable_for": listing.suitable_for,
            "previous_use": listing.previous_use,
            "has_parking": listing.has_parking,
            "has_elevator": listing.has_elevator,
            "description": listing.description,
            "features": listing.features,
            "contact_name": listing.contact_name,
            "contact_phone": listing.contact_phone,
            "contact_company": listing.contact_company,
            "is_featured": listing.is_featured,
            "latitude": listing.latitude,
            "longitude": listing.longitude,
        })

    return {
        "simulation_id": str(simulation_id),
        "center": {
            "latitude": simulation.latitude,
            "longitude": simulation.longitude,
            "address": simulation.address
        },
        "radius_km": radius_km,
        "listings": result_listings,
        "total": len(result_listings)
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


@router.post("/reports/{simulation_id}/generate")
async def generate_report(
    simulation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI 상권분석 리포트 생성

    시뮬레이션 데이터를 기반으로 AI 분석을 수행하고 PDF 리포트를 생성합니다.
    결제가 완료된 경우에만 전체 리포트에 접근할 수 있습니다.
    """
    # 시뮬레이션 조회
    result = await db.execute(
        select(Simulation).where(Simulation.id == simulation_id)
    )
    simulation = result.scalar_one_or_none()

    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found"
        )

    # 기존 리포트 확인
    report_result = await db.execute(
        select(SimulationReport).where(
            SimulationReport.simulation_id == simulation_id
        )
    )
    report = report_result.scalar_one_or_none()

    # AI 분석 수행
    ai_analysis = await ai_analysis_service.generate_analysis(simulation)

    if report:
        # 기존 리포트 업데이트
        report.report_content = ai_analysis
        report.updated_at = datetime.utcnow()
    else:
        # 새 리포트 생성
        report = SimulationReport(
            simulation_id=simulation_id,
            payment_amount=30000,
            payment_status="pending",
            report_content=ai_analysis
        )
        db.add(report)

    await db.commit()
    await db.refresh(report)

    return {
        "report_id": str(report.id),
        "simulation_id": str(simulation_id),
        "payment_status": report.payment_status,
        "payment_amount": report.payment_amount,
        "has_ai_analysis": bool(report.report_content),
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "message": "리포트가 생성되었습니다. 결제 후 전체 PDF를 다운로드할 수 있습니다."
    }


@router.get("/reports/{report_id}/preview")
async def preview_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    리포트 미리보기

    결제 전에도 일부 분석 내용을 미리볼 수 있습니다.
    전체 내용은 결제 후 확인 가능합니다.
    """
    result = await db.execute(
        select(SimulationReport).where(SimulationReport.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # 시뮬레이션 정보 조회
    sim_result = await db.execute(
        select(Simulation).where(Simulation.id == report.simulation_id)
    )
    simulation = sim_result.scalar_one_or_none()

    ai_analysis = report.report_content or {}
    is_paid = report.payment_status == "completed"

    # 기본 정보 (항상 공개)
    preview = {
        "report_id": str(report.id),
        "simulation_id": str(report.simulation_id),
        "payment_status": report.payment_status,
        "payment_amount": report.payment_amount,
        "is_paid": is_paid,

        # 시뮬레이션 기본 정보
        "address": simulation.address if simulation else None,
        "clinic_type": simulation.clinic_type if simulation else None,
        "recommendation": simulation.recommendation.value if simulation and simulation.recommendation else None,
        "confidence_score": simulation.confidence_score if simulation else None,

        # 미리보기 (일부 마스킹)
        "preview": {
            "executive_summary": ai_analysis.get("executive_summary", "분석 결과를 생성 중입니다..."),
            "recommendation": simulation.recommendation.value if simulation and simulation.recommendation else "NEUTRAL",
        }
    }

    if is_paid:
        # 결제 완료: 전체 분석 내용 포함
        preview["full_analysis"] = ai_analysis
        preview["pdf_url"] = report.pdf_url
    else:
        # 미결제: 일부만 공개
        preview["locked_sections"] = [
            "location_analysis",
            "market_potential",
            "competition_analysis",
            "financial_outlook",
            "swot",
            "risk_factors",
            "success_strategies",
            "action_plan",
            "final_recommendation"
        ]
        preview["message"] = "전체 분석 내용을 보려면 결제가 필요합니다."

    return preview


@router.post("/reports/{report_id}/pay")
async def pay_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    리포트 결제 처리

    토스페이먼츠 결제 완료 후 호출됩니다.
    결제가 확인되면 PDF를 생성하고 다운로드 URL을 반환합니다.
    """
    result = await db.execute(
        select(SimulationReport).where(SimulationReport.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if report.payment_status == "completed":
        return {
            "status": "already_paid",
            "pdf_url": report.pdf_url,
            "message": "이미 결제가 완료된 리포트입니다."
        }

    # 시뮬레이션 조회
    sim_result = await db.execute(
        select(Simulation).where(Simulation.id == report.simulation_id)
    )
    simulation = sim_result.scalar_one_or_none()

    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found"
        )

    # 결제 상태 업데이트 (실제로는 토스페이먼츠 웹훅에서 처리)
    report.payment_status = "completed"
    report.paid_at = datetime.utcnow()

    # AI 분석이 없으면 생성
    if not report.report_content:
        ai_analysis = await ai_analysis_service.generate_analysis(simulation)
        report.report_content = ai_analysis
    else:
        ai_analysis = report.report_content

    # PDF 생성
    try:
        pdf_bytes = pdf_generator_service.generate_simulation_report_pdf(
            simulation, ai_analysis
        )

        # S3 업로드 시도
        filename = f"medimatch_report_{report.simulation_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_url = await pdf_generator_service.upload_to_s3(pdf_bytes, filename)

        if not pdf_url:
            # S3 실패 시 로컬 저장 (개발 환경)
            local_path = pdf_generator_service.save_locally(pdf_bytes, filename)
            pdf_url = f"/tmp/reports/{filename}"

        report.pdf_url = pdf_url

    except Exception as e:
        # PDF 생성 실패해도 결제는 완료 처리
        print(f"PDF 생성 실패: {e}")
        report.pdf_url = None

    await db.commit()
    await db.refresh(report)

    return {
        "status": "success",
        "report_id": str(report.id),
        "payment_status": report.payment_status,
        "pdf_url": report.pdf_url,
        "message": "결제가 완료되었습니다. PDF를 다운로드할 수 있습니다."
    }


@router.get("/reports/{report_id}/download/pdf")
async def download_report_pdf(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    PDF 리포트 직접 다운로드

    결제 완료된 리포트의 PDF를 직접 다운로드합니다.
    """
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

    # 시뮬레이션 조회
    sim_result = await db.execute(
        select(Simulation).where(Simulation.id == report.simulation_id)
    )
    simulation = sim_result.scalar_one_or_none()

    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found"
        )

    # PDF 재생성 (항상 최신 버전)
    ai_analysis = report.report_content or {}
    pdf_bytes = pdf_generator_service.generate_simulation_report_pdf(
        simulation, ai_analysis
    )

    filename = f"MediMatch_상권분석_{simulation.clinic_type}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename}"
        }
    )
