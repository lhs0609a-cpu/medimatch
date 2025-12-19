from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from io import BytesIO

from ...models.prospect import ProspectType, ProspectStatus
from ...services.prospect import prospect_service
from ..deps import get_db, require_sales_rep
from ...core.security import TokenData

router = APIRouter()


@router.get("/excel")
async def export_excel(
    type: Optional[ProspectType] = Query(None, description="잠재지 유형"),
    status: Optional[ProspectStatus] = Query(None, description="상태"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="최소 적합도 점수"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_sales_rep)
):
    """
    Excel 내보내기

    조건에 맞는 잠재 개원지 목록을 Excel 파일로 다운로드합니다.
    """
    filters = {
        "prospect_type": type,
        "status": status,
        "min_score": min_score
    }

    excel_data = await prospect_service.export_prospects(
        db=db,
        format="excel",
        filters=filters
    )

    return StreamingResponse(
        BytesIO(excel_data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=prospects.xlsx"}
    )


@router.get("/csv")
async def export_csv(
    type: Optional[ProspectType] = Query(None, description="잠재지 유형"),
    status: Optional[ProspectStatus] = Query(None, description="상태"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="최소 적합도 점수"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_sales_rep)
):
    """
    CSV 내보내기

    조건에 맞는 잠재 개원지 목록을 CSV 파일로 다운로드합니다.
    """
    filters = {
        "prospect_type": type,
        "status": status,
        "min_score": min_score
    }

    csv_data = await prospect_service.export_prospects(
        db=db,
        format="csv",
        filters=filters
    )

    return StreamingResponse(
        BytesIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prospects.csv"}
    )
