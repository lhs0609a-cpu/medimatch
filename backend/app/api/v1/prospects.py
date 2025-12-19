from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID

from ...schemas.prospect import (
    ProspectLocationResponse, ProspectLocationListResponse,
    ProspectMapResponse, ProspectReportResponse
)
from ...models.prospect import ProspectType, ProspectStatus
from ...services.prospect import prospect_service
from ...models.user import User
from ..deps import get_db, get_current_active_user, require_sales_rep
from ...core.security import TokenData

router = APIRouter()


@router.get("", response_model=ProspectLocationListResponse)
async def get_prospects(
    type: Optional[ProspectType] = Query(None, description="잠재지 유형"),
    status: Optional[ProspectStatus] = Query(None, description="상태"),
    clinic_types: Optional[str] = Query(None, description="추천 진료과목 (쉼표 구분)"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="최소 적합도 점수"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_sales_rep)
):
    """
    잠재 개원지 목록 조회

    - **type**: NEW_BUILD (신축), VACANCY (공실), RELOCATION (이전예정)
    - **status**: NEW, CONTACTED, CONVERTED, CLOSED
    - **clinic_types**: 추천 진료과목 필터 (쉼표 구분)
    - **min_score**: 최소 적합도 점수 (0-100)
    """
    clinic_type_list = clinic_types.split(",") if clinic_types else None

    result = await prospect_service.get_prospects(
        db=db,
        prospect_type=type,
        status=status,
        clinic_types=clinic_type_list,
        min_score=min_score,
        page=page,
        page_size=page_size
    )
    return result


@router.get("/map", response_model=ProspectMapResponse)
async def get_prospects_map(
    min_lat: float = Query(..., description="최소 위도"),
    max_lat: float = Query(..., description="최대 위도"),
    min_lng: float = Query(..., description="최소 경도"),
    max_lng: float = Query(..., description="최대 경도"),
    type: Optional[ProspectType] = None,
    min_score: Optional[int] = Query(None, ge=0, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_sales_rep)
):
    """
    지도 기반 조회 (GeoJSON)

    지정된 영역 내의 잠재 개원지를 GeoJSON 형식으로 반환합니다.
    """
    result = await prospect_service.get_prospects_map(
        db=db,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lng=min_lng,
        max_lng=max_lng,
        prospect_type=type,
        min_score=min_score
    )
    return result


@router.get("/{prospect_id}", response_model=ProspectLocationResponse)
async def get_prospect(
    prospect_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_sales_rep)
):
    """잠재 개원지 상세 정보"""
    prospect = await prospect_service.get_prospect(db, prospect_id)
    if not prospect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prospect not found"
        )
    return prospect


@router.get("/{prospect_id}/report", response_model=ProspectReportResponse)
async def get_prospect_report(
    prospect_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_sales_rep)
):
    """
    AI 영업 리포트 생성

    해당 잠재 개원지에 대한 AI 분석 리포트를 생성합니다.
    - 시장 인사이트
    - 경쟁 분석
    - 인구통계 요약
    - 추천 액션
    """
    report = await prospect_service.generate_report(db, prospect_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prospect not found"
        )
    return report
