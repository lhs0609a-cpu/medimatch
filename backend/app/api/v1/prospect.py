"""
약국 타겟팅 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User

router = APIRouter()


# ===== Schemas =====

class ProspectResponse(BaseModel):
    ykiho: str
    name: str
    address: str
    phone: Optional[str] = None
    latitude: float = 0
    longitude: float = 0
    years_operated: int = 0
    est_pharmacist_age: int = 0
    monthly_revenue: int = 0
    nearby_hospital_count: int = 0
    nearby_pharmacy_count: int = 0
    prospect_score: int = 0
    prospect_grade: str = "COLD"
    score_factors: List[str] = []
    contact_status: str = "not_contacted"
    last_contact_date: Optional[datetime] = None
    notes: Optional[str] = None


class ProspectListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ProspectResponse]


class ProspectStatsResponse(BaseModel):
    total: int
    hot: int
    warm: int
    cold: int
    contacted: int
    interested: int
    not_interested: int
    not_contacted: int


class ContactUpdateRequest(BaseModel):
    status: str = Field(..., regex="^(not_contacted|contacted|interested|not_interested)$")
    notes: Optional[str] = None


# ===== Endpoints =====

@router.get("/", response_model=ProspectListResponse)
async def get_prospects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    grade: Optional[str] = Query(None, regex="^(HOT|WARM|COLD)$"),
    contact_status: Optional[str] = None,
    region: Optional[str] = None,
    min_score: Optional[int] = None,
    sort_by: str = Query("prospect_score", regex="^(prospect_score|years_operated|monthly_revenue)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """약국 타겟 목록 조회"""
    try:
        # 동적 쿼리 생성
        where_clauses = []
        params = {"offset": (page - 1) * page_size, "limit": page_size}

        if grade:
            where_clauses.append("prospect_grade = :grade")
            params["grade"] = grade

        if contact_status:
            where_clauses.append("contact_status = :contact_status")
            params["contact_status"] = contact_status

        if region:
            where_clauses.append("address ILIKE :region")
            params["region"] = f"%{region}%"

        if min_score:
            where_clauses.append("prospect_score >= :min_score")
            params["min_score"] = min_score

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        # 전체 개수
        count_query = f"SELECT COUNT(*) FROM pharmacy_prospect_targets WHERE {where_sql}"
        count_result = await db.execute(text(count_query), params)
        total = count_result.scalar() or 0

        # 데이터 조회
        order_dir = "DESC" if sort_order == "desc" else "ASC"
        query = f"""
            SELECT ykiho, name, address, phone, latitude, longitude,
                   years_operated, est_pharmacist_age, monthly_revenue,
                   nearby_hospital_count, nearby_pharmacy_count,
                   prospect_score, prospect_grade, score_factors,
                   contact_status, last_contact_date, notes
            FROM pharmacy_prospect_targets
            WHERE {where_sql}
            ORDER BY {sort_by} {order_dir}
            OFFSET :offset LIMIT :limit
        """

        result = await db.execute(text(query), params)
        rows = result.fetchall()

        items = []
        for row in rows:
            import json
            score_factors = row[13]
            if isinstance(score_factors, str):
                try:
                    score_factors = json.loads(score_factors)
                except:
                    score_factors = []

            items.append(ProspectResponse(
                ykiho=row[0],
                name=row[1],
                address=row[2],
                phone=row[3],
                latitude=row[4] or 0,
                longitude=row[5] or 0,
                years_operated=row[6] or 0,
                est_pharmacist_age=row[7] or 0,
                monthly_revenue=row[8] or 0,
                nearby_hospital_count=row[9] or 0,
                nearby_pharmacy_count=row[10] or 0,
                prospect_score=row[11] or 0,
                prospect_grade=row[12] or "COLD",
                score_factors=score_factors,
                contact_status=row[14] or "not_contacted",
                last_contact_date=row[15],
                notes=row[16],
            ))

        return ProspectListResponse(
            total=total,
            page=page,
            page_size=page_size,
            items=items
        )

    except Exception as e:
        # 테이블이 없으면 빈 결과 반환
        return ProspectListResponse(
            total=0,
            page=page,
            page_size=page_size,
            items=[]
        )


@router.get("/stats", response_model=ProspectStatsResponse)
async def get_prospect_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """약국 타겟 통계"""
    try:
        result = await db.execute(
            text("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN prospect_grade = 'HOT' THEN 1 ELSE 0 END) as hot,
                    SUM(CASE WHEN prospect_grade = 'WARM' THEN 1 ELSE 0 END) as warm,
                    SUM(CASE WHEN prospect_grade = 'COLD' THEN 1 ELSE 0 END) as cold,
                    SUM(CASE WHEN contact_status = 'contacted' THEN 1 ELSE 0 END) as contacted,
                    SUM(CASE WHEN contact_status = 'interested' THEN 1 ELSE 0 END) as interested,
                    SUM(CASE WHEN contact_status = 'not_interested' THEN 1 ELSE 0 END) as not_interested,
                    SUM(CASE WHEN contact_status = 'not_contacted' THEN 1 ELSE 0 END) as not_contacted
                FROM pharmacy_prospect_targets
            """)
        )
        row = result.fetchone()

        return ProspectStatsResponse(
            total=row[0] or 0,
            hot=row[1] or 0,
            warm=row[2] or 0,
            cold=row[3] or 0,
            contacted=row[4] or 0,
            interested=row[5] or 0,
            not_interested=row[6] or 0,
            not_contacted=row[7] or 0,
        )

    except Exception:
        return ProspectStatsResponse(
            total=0, hot=0, warm=0, cold=0,
            contacted=0, interested=0, not_interested=0, not_contacted=0
        )


@router.get("/{ykiho}", response_model=ProspectResponse)
async def get_prospect(
    ykiho: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """약국 타겟 상세 조회"""
    try:
        result = await db.execute(
            text("""
                SELECT ykiho, name, address, phone, latitude, longitude,
                       years_operated, est_pharmacist_age, monthly_revenue,
                       nearby_hospital_count, nearby_pharmacy_count,
                       prospect_score, prospect_grade, score_factors,
                       contact_status, last_contact_date, notes
                FROM pharmacy_prospect_targets
                WHERE ykiho = :ykiho
            """),
            {"ykiho": ykiho}
        )
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Prospect not found")

        import json
        score_factors = row[13]
        if isinstance(score_factors, str):
            try:
                score_factors = json.loads(score_factors)
            except:
                score_factors = []

        return ProspectResponse(
            ykiho=row[0],
            name=row[1],
            address=row[2],
            phone=row[3],
            latitude=row[4] or 0,
            longitude=row[5] or 0,
            years_operated=row[6] or 0,
            est_pharmacist_age=row[7] or 0,
            monthly_revenue=row[8] or 0,
            nearby_hospital_count=row[9] or 0,
            nearby_pharmacy_count=row[10] or 0,
            prospect_score=row[11] or 0,
            prospect_grade=row[12] or "COLD",
            score_factors=score_factors,
            contact_status=row[14] or "not_contacted",
            last_contact_date=row[15],
            notes=row[16],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{ykiho}/contact")
async def update_contact_status(
    ykiho: str,
    update_data: ContactUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """타겟 연락 상태 업데이트"""
    try:
        notes_append = ""
        if update_data.notes:
            notes_append = f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {update_data.notes}"

        await db.execute(
            text("""
                UPDATE pharmacy_prospect_targets
                SET contact_status = :status,
                    last_contact_date = NOW(),
                    notes = COALESCE(notes, '') || :notes
                WHERE ykiho = :ykiho
            """),
            {
                "ykiho": ykiho,
                "status": update_data.status,
                "notes": notes_append
            }
        )
        await db.commit()

        return {
            "status": "updated",
            "ykiho": ykiho,
            "new_status": update_data.status
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan")
async def trigger_scan(
    region: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """약국 타겟 스캔 트리거 (관리자용)"""
    from ...tasks.prospect_tasks import run_pharmacy_prospect_scan, scan_region_prospects

    if region:
        task = scan_region_prospects.delay(region)
    else:
        task = run_pharmacy_prospect_scan.delay()

    return {
        "status": "triggered",
        "task_id": task.id,
        "region": region or "all"
    }
