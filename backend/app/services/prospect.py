from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_, or_
from datetime import datetime

from ..models.prospect import ProspectLocation, UserAlert, ProspectType, ProspectStatus
from ..schemas.prospect import (
    ProspectLocationResponse, UserAlertCreate, UserAlertUpdate, ProspectReportResponse
)
from .external_api import external_api_service
from ..core.config import settings

import logging
logger = logging.getLogger(__name__)


class ProspectService:
    """잠재 개원지 탐색 서비스 (SalesScanner)"""

    async def get_prospects(
        self,
        db: AsyncSession,
        prospect_type: Optional[ProspectType] = None,
        status: Optional[ProspectStatus] = None,
        clinic_types: Optional[List[str]] = None,
        min_score: Optional[int] = None,
        region_codes: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """잠재 개원지 목록 조회"""
        query = select(ProspectLocation)

        filters = []
        if prospect_type:
            filters.append(ProspectLocation.type == prospect_type)
        if status:
            filters.append(ProspectLocation.status == status)
        if min_score:
            filters.append(ProspectLocation.clinic_fit_score >= min_score)

        if filters:
            query = query.where(and_(*filters))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated items
        offset = (page - 1) * page_size
        query = query.order_by(desc(ProspectLocation.detected_at)).offset(offset).limit(page_size)

        result = await db.execute(query)
        prospects = result.scalars().all()

        return {
            "items": [self._to_response(p) for p in prospects],
            "total": total,
            "page": page,
            "page_size": page_size
        }

    async def get_prospects_map(
        self,
        db: AsyncSession,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
        prospect_type: Optional[ProspectType] = None,
        min_score: Optional[int] = None
    ) -> Dict[str, Any]:
        """지도 기반 조회 (GeoJSON)"""
        query = select(ProspectLocation).where(
            and_(
                ProspectLocation.latitude >= min_lat,
                ProspectLocation.latitude <= max_lat,
                ProspectLocation.longitude >= min_lng,
                ProspectLocation.longitude <= max_lng
            )
        )

        if prospect_type:
            query = query.where(ProspectLocation.type == prospect_type)
        if min_score:
            query = query.where(ProspectLocation.clinic_fit_score >= min_score)

        query = query.limit(500)  # Limit for performance

        result = await db.execute(query)
        prospects = result.scalars().all()

        features = []
        for p in prospects:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [p.longitude, p.latitude]
                },
                "properties": {
                    "id": str(p.id),
                    "address": p.address,
                    "type": p.type.value,
                    "clinic_fit_score": p.clinic_fit_score,
                    "recommended_dept": p.recommended_dept,
                    "status": p.status.value
                }
            })

        return {
            "type": "FeatureCollection",
            "features": features
        }

    async def get_prospect(
        self,
        db: AsyncSession,
        prospect_id: UUID
    ) -> Optional[ProspectLocation]:
        """잠재 개원지 상세 조회"""
        result = await db.execute(
            select(ProspectLocation).where(ProspectLocation.id == prospect_id)
        )
        return result.scalar_one_or_none()

    async def generate_report(
        self,
        db: AsyncSession,
        prospect_id: UUID
    ) -> Optional[ProspectReportResponse]:
        """AI 영업 리포트 생성"""
        prospect = await self.get_prospect(db, prospect_id)
        if not prospect:
            return None

        # 주변 데이터 수집
        nearby_hospitals = await external_api_service.get_nearby_hospitals(
            prospect.latitude,
            prospect.longitude,
            1000
        )

        commercial_data = await external_api_service.get_commercial_data(
            prospect.latitude,
            prospect.longitude
        )

        demographics = await external_api_service.get_demographics(
            prospect.latitude,
            prospect.longitude
        )

        # AI 분석 생성 (실제로는 OpenAI API 호출)
        analysis = self._generate_analysis(
            prospect, nearby_hospitals, commercial_data, demographics
        )

        return ProspectReportResponse(
            id=prospect.id,
            address=prospect.address,
            clinic_fit_score=prospect.clinic_fit_score or 0,
            recommended_dept=prospect.recommended_dept or [],
            analysis=analysis["summary"],
            opportunity_score=analysis["opportunity_score"],
            market_insights=analysis["market_insights"],
            competition_analysis=analysis["competition_analysis"],
            demographic_summary=analysis["demographic_summary"],
            recommended_actions=analysis["recommended_actions"],
            generated_at=datetime.utcnow()
        )

    async def create_alert(
        self,
        db: AsyncSession,
        alert_data: UserAlertCreate,
        user_id: UUID
    ) -> UserAlert:
        """알림 조건 설정"""
        alert = UserAlert(
            user_id=user_id,
            name=alert_data.name,
            region_codes=alert_data.region_codes,
            region_names=alert_data.region_names,
            clinic_types=alert_data.clinic_types,
            min_score=alert_data.min_score,
            prospect_types=alert_data.prospect_types,
            notify_email=alert_data.notify_email,
            notify_push=alert_data.notify_push,
            is_active=True
        )

        db.add(alert)
        await db.commit()
        await db.refresh(alert)

        return alert

    async def get_user_alerts(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> List[UserAlert]:
        """사용자 알림 목록"""
        result = await db.execute(
            select(UserAlert)
            .where(UserAlert.user_id == user_id)
            .order_by(desc(UserAlert.created_at))
        )
        return list(result.scalars().all())

    async def update_alert(
        self,
        db: AsyncSession,
        alert_id: UUID,
        user_id: UUID,
        update_data: UserAlertUpdate
    ) -> Optional[UserAlert]:
        """알림 조건 수정"""
        result = await db.execute(
            select(UserAlert).where(
                UserAlert.id == alert_id,
                UserAlert.user_id == user_id
            )
        )
        alert = result.scalar_one_or_none()
        if not alert:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(alert, key, value)

        await db.commit()
        await db.refresh(alert)

        return alert

    async def delete_alert(
        self,
        db: AsyncSession,
        alert_id: UUID,
        user_id: UUID
    ) -> bool:
        """알림 조건 삭제"""
        result = await db.execute(
            select(UserAlert).where(
                UserAlert.id == alert_id,
                UserAlert.user_id == user_id
            )
        )
        alert = result.scalar_one_or_none()
        if not alert:
            return False

        await db.delete(alert)
        await db.commit()
        return True

    async def export_prospects(
        self,
        db: AsyncSession,
        format: str,  # 'excel' or 'csv'
        filters: Dict[str, Any]
    ) -> bytes:
        """Excel/CSV 내보내기"""
        import pandas as pd
        from io import BytesIO

        # Get prospects based on filters
        prospects_data = await self.get_prospects(
            db,
            prospect_type=filters.get("prospect_type"),
            status=filters.get("status"),
            min_score=filters.get("min_score"),
            page=1,
            page_size=10000  # Max export
        )

        # Convert to DataFrame
        df = pd.DataFrame([
            {
                "주소": p.address,
                "유형": p.type.value if hasattr(p, 'type') else p.get('type'),
                "적합도 점수": p.clinic_fit_score if hasattr(p, 'clinic_fit_score') else p.get('clinic_fit_score'),
                "추천 진료과목": ", ".join(p.recommended_dept or []) if hasattr(p, 'recommended_dept') else ", ".join(p.get('recommended_dept') or []),
                "상태": p.status.value if hasattr(p, 'status') else p.get('status'),
                "탐지일": str(p.detected_at) if hasattr(p, 'detected_at') else str(p.get('detected_at')),
            }
            for p in prospects_data["items"]
        ])

        output = BytesIO()

        if format == "excel":
            df.to_excel(output, index=False, engine="openpyxl")
        else:  # csv
            df.to_csv(output, index=False, encoding="utf-8-sig")

        output.seek(0)
        return output.getvalue()

    def _to_response(self, prospect: ProspectLocation) -> Dict[str, Any]:
        """모델을 응답 형식으로 변환"""
        return {
            "id": prospect.id,
            "building_id": prospect.building_id,
            "address": prospect.address,
            "latitude": prospect.latitude,
            "longitude": prospect.longitude,
            "type": prospect.type,
            "zoning": prospect.zoning,
            "floor_area": prospect.floor_area,
            "floor_info": prospect.floor_info,
            "clinic_fit_score": prospect.clinic_fit_score,
            "recommended_dept": prospect.recommended_dept,
            "previous_clinic": prospect.previous_clinic,
            "rent_estimate": prospect.rent_estimate,
            "description": prospect.description,
            "status": prospect.status,
            "detected_at": prospect.detected_at,
            "created_at": prospect.created_at
        }

    def _generate_analysis(
        self,
        prospect: ProspectLocation,
        hospitals: List[Dict],
        commercial: Dict,
        demographics: Dict
    ) -> Dict[str, Any]:
        """AI 분석 생성 (실제로는 OpenAI/Gemini API 호출)"""

        # 경쟁 분석
        same_area_hospitals = len(hospitals)
        clinic_types_count = {}
        for h in hospitals:
            ct = h.get("clinic_type", "기타")
            clinic_types_count[ct] = clinic_types_count.get(ct, 0) + 1

        # 기회 점수 계산
        opportunity_score = prospect.clinic_fit_score or 70

        # 분석 텍스트 생성
        summary = f"""
해당 위치({prospect.address})는 병원 개원에 {'매우 적합한' if opportunity_score >= 80 else '적합한' if opportunity_score >= 60 else '보통인'} 입지입니다.

현재 반경 1km 내에 {same_area_hospitals}개의 의료기관이 운영 중이며,
{'경쟁이 적어 신규 개원에 유리합니다.' if same_area_hospitals <= 5 else '적정 수준의 경쟁 환경입니다.' if same_area_hospitals <= 15 else '경쟁이 다소 치열한 지역입니다.'}
""".strip()

        market_insights = f"""
- 유동인구: 일 평균 {commercial.get('floating_population', 50000):,}명
- 상권 활성도: {'높음' if commercial.get('floating_population', 50000) > 70000 else '보통' if commercial.get('floating_population', 50000) > 30000 else '낮음'}
- 주변 시설: 상업 밀집 지역
""".strip()

        competition_analysis = f"""
- 반경 1km 내 총 {same_area_hospitals}개 의료기관
- 주요 진료과: {', '.join([f'{k}({v}개)' for k, v in list(clinic_types_count.items())[:5]])}
- 부족 진료과: {', '.join(prospect.recommended_dept or ['내과', '이비인후과'])}
""".strip()

        demographic_summary = f"""
- 반경 1km 인구: {demographics.get('population_1km', 45000):,}명
- 40대 이상 비율: {demographics.get('age_40_plus_ratio', 0.4) * 100:.1f}%
- 주요 연령대: 30-50대 직장인
""".strip()

        recommended_actions = [
            "현장 방문 및 상세 입지 분석 권장",
            "인근 병원 운영 현황 추가 조사",
            f"추천 진료과: {', '.join(prospect.recommended_dept or ['내과'])}",
            "임대 조건 협상 시작 권장"
        ]

        return {
            "summary": summary,
            "opportunity_score": opportunity_score,
            "market_insights": market_insights,
            "competition_analysis": competition_analysis,
            "demographic_summary": demographic_summary,
            "recommended_actions": recommended_actions
        }


prospect_service = ProspectService()
