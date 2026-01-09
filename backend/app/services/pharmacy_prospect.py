"""
약국 타겟팅 서비스

심평원 데이터를 분석하여 양도 가능성이 높은 약국을 찾아내고,
아웃바운드 영업 대상으로 분류합니다.
"""

import httpx
import asyncio
from typing import Optional, Dict, List, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.dialects.postgresql import insert
import logging
import uuid
from enum import Enum

from ..core.config import settings
from .external_api import external_api_service

logger = logging.getLogger(__name__)


class ProspectScore(str, Enum):
    """타겟 점수 등급"""
    HOT = "HOT"          # 80점 이상 - 적극 영업
    WARM = "WARM"        # 60-79점 - 일반 영업
    COLD = "COLD"        # 40-59점 - 관심 목록
    INACTIVE = "INACTIVE"  # 40점 미만 - 제외


class PharmacyProspect:
    """약국 잠재 매물 데이터"""
    def __init__(
        self,
        ykiho: str,
        name: str,
        address: str,
        phone: str = "",
        latitude: float = 0,
        longitude: float = 0,
        established_date: str = "",
        pharmacist_count: int = 1,
    ):
        self.ykiho = ykiho
        self.name = name
        self.address = address
        self.phone = phone
        self.latitude = latitude
        self.longitude = longitude
        self.established_date = established_date
        self.pharmacist_count = pharmacist_count

        # 분석 데이터
        self.years_operated: int = 0
        self.est_pharmacist_age: int = 0
        self.monthly_revenue: int = 0
        self.revenue_trend: str = "stable"  # growing, stable, declining
        self.nearby_hospital_count: int = 0
        self.nearby_pharmacy_count: int = 0
        self.competition_score: int = 50  # 경쟁 강도 (낮을수록 좋음)

        # 타겟팅 점수
        self.prospect_score: int = 0
        self.prospect_grade: ProspectScore = ProspectScore.INACTIVE
        self.score_factors: List[str] = []

        # 연락 정보
        self.contact_status: str = "not_contacted"  # not_contacted, contacted, interested, not_interested
        self.last_contact_date: Optional[datetime] = None
        self.notes: str = ""


class PharmacyProspectService:
    """약국 타겟팅 서비스"""

    def __init__(self):
        self.hira_base_url = "http://apis.data.go.kr/B551182/pharmacyInfoService"

        # 지역 코드 (시도)
        self.sido_codes = {
            "서울": "110000",
            "부산": "210000",
            "대구": "220000",
            "인천": "230000",
            "광주": "240000",
            "대전": "250000",
            "울산": "260000",
            "세종": "290000",
            "경기": "310000",
            "강원": "320000",
            "충북": "330000",
            "충남": "340000",
            "전북": "350000",
            "전남": "360000",
            "경북": "370000",
            "경남": "380000",
            "제주": "390000",
        }

    async def fetch_pharmacies_by_region(
        self,
        sido_code: str,
        page_no: int = 1,
        num_of_rows: int = 100
    ) -> Tuple[List[PharmacyProspect], int]:
        """
        지역별 약국 목록 조회

        Returns:
            (약국 목록, 전체 건수)
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "sidoCd": sido_code,
                    "pageNo": page_no,
                    "numOfRows": num_of_rows,
                    "_type": "json"
                }

                response = await client.get(
                    f"{self.hira_base_url}/getParmacyBasisList",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                body = data.get("response", {}).get("body", {})
                total_count = body.get("totalCount", 0)
                items = body.get("items", {}).get("item", [])

                if isinstance(items, dict):
                    items = [items]

                prospects = [self._parse_pharmacy(item) for item in items]
                return prospects, total_count

        except Exception as e:
            logger.error(f"Failed to fetch pharmacies: {e}")
            return [], 0

    def _parse_pharmacy(self, item: Dict[str, Any]) -> PharmacyProspect:
        """API 응답 파싱"""
        return PharmacyProspect(
            ykiho=item.get("ykiho", ""),
            name=item.get("yadmNm", ""),
            address=item.get("addr", ""),
            phone=item.get("telno", ""),
            latitude=float(item.get("YPos", 0)),
            longitude=float(item.get("XPos", 0)),
            established_date=item.get("estbDd", ""),
            pharmacist_count=int(item.get("parmCnt", 1))
        )

    async def analyze_prospect(self, prospect: PharmacyProspect) -> PharmacyProspect:
        """
        약국 타겟팅 분석

        분석 요소:
        1. 운영 연수 (오래될수록 점수 높음 - 은퇴 가능성)
        2. 약사 연령 추정 (고령일수록 점수 높음)
        3. 매출 추이 (하락 추세면 점수 높음)
        4. 경쟁 상황 (경쟁 심할수록 양도 의사 높을 수 있음)
        5. 입지 조건 (좋은 입지는 매수 수요 높음)
        """
        score = 0
        factors = []

        # 1. 운영 연수 분석
        if prospect.established_date:
            try:
                est_year = int(prospect.established_date[:4])
                prospect.years_operated = datetime.now().year - est_year

                if prospect.years_operated >= 30:
                    score += 25
                    factors.append(f"장기운영 {prospect.years_operated}년 (은퇴 가능성 높음)")
                elif prospect.years_operated >= 20:
                    score += 20
                    factors.append(f"운영 {prospect.years_operated}년 (양도 고려 시점)")
                elif prospect.years_operated >= 10:
                    score += 10
                    factors.append(f"운영 {prospect.years_operated}년")
                else:
                    factors.append(f"비교적 신규 ({prospect.years_operated}년)")
            except:
                pass

        # 2. 약사 연령 추정 (면허 발급 연도 기반 - 가정)
        # 일반적으로 개국 시 30대 중반 가정
        if prospect.years_operated > 0:
            prospect.est_pharmacist_age = 35 + prospect.years_operated

            if prospect.est_pharmacist_age >= 65:
                score += 20
                factors.append(f"추정 연령 {prospect.est_pharmacist_age}세 (은퇴 시기)")
            elif prospect.est_pharmacist_age >= 55:
                score += 15
                factors.append(f"추정 연령 {prospect.est_pharmacist_age}세")
            elif prospect.est_pharmacist_age >= 50:
                score += 5
                factors.append(f"추정 연령 {prospect.est_pharmacist_age}세")

        # 3. 주변 환경 분석
        if prospect.latitude and prospect.longitude:
            # 주변 병원 수
            nearby_hospitals = await external_api_service.get_nearby_hospitals(
                prospect.latitude,
                prospect.longitude,
                radius_m=500
            )
            prospect.nearby_hospital_count = len(nearby_hospitals)

            if prospect.nearby_hospital_count >= 5:
                score += 15
                factors.append(f"주변 병원 {prospect.nearby_hospital_count}개 (처방전 수요 높음)")
            elif prospect.nearby_hospital_count >= 3:
                score += 10
                factors.append(f"주변 병원 {prospect.nearby_hospital_count}개")
            elif prospect.nearby_hospital_count == 0:
                score -= 5
                factors.append("주변 병원 없음 (입지 불리)")

            # 주변 경쟁 약국 수
            nearby_pharmacies = await external_api_service.get_nearby_pharmacies(
                prospect.latitude,
                prospect.longitude,
                radius_m=300
            )
            # 자기 자신 제외
            prospect.nearby_pharmacy_count = max(0, len(nearby_pharmacies) - 1)

            if prospect.nearby_pharmacy_count == 0:
                score += 10
                factors.append("독점 입지 (경쟁 약국 없음)")
            elif prospect.nearby_pharmacy_count <= 2:
                score += 5
                factors.append(f"경쟁 적음 (인근 {prospect.nearby_pharmacy_count}개)")
            elif prospect.nearby_pharmacy_count >= 5:
                score += 5  # 경쟁 심하면 양도 의사 있을 수 있음
                factors.append(f"경쟁 과다 (인근 {prospect.nearby_pharmacy_count}개) - 양도 의사 가능")

        # 4. 매출 데이터 (심평원 청구 데이터 기반)
        billing_stats = await external_api_service.get_pharmacy_billing_stats(prospect.ykiho)
        if billing_stats:
            prospect.monthly_revenue = billing_stats.get("total_amount", 0)

            # 매출 규모 분석
            if prospect.monthly_revenue >= 100000000:  # 월 1억 이상
                score += 15
                factors.append(f"고매출 약국 (월 {prospect.monthly_revenue/100000000:.1f}억)")
            elif prospect.monthly_revenue >= 50000000:  # 월 5천만 이상
                score += 10
                factors.append(f"중상위 매출 (월 {prospect.monthly_revenue/10000:.0f}만원)")
            elif prospect.monthly_revenue >= 30000000:
                score += 5
                factors.append(f"중간 매출 (월 {prospect.monthly_revenue/10000:.0f}만원)")
            else:
                factors.append(f"저매출 (월 {prospect.monthly_revenue/10000:.0f}만원)")

        # 5. 약사 수 분석
        if prospect.pharmacist_count == 1:
            score += 5
            factors.append("1인 약국 (승계 용이)")
        elif prospect.pharmacist_count >= 3:
            factors.append(f"다인 약국 ({prospect.pharmacist_count}명)")

        # 최종 점수 및 등급 산정
        prospect.prospect_score = min(max(score, 0), 100)
        prospect.score_factors = factors

        if prospect.prospect_score >= 80:
            prospect.prospect_grade = ProspectScore.HOT
        elif prospect.prospect_score >= 60:
            prospect.prospect_grade = ProspectScore.WARM
        elif prospect.prospect_score >= 40:
            prospect.prospect_grade = ProspectScore.COLD
        else:
            prospect.prospect_grade = ProspectScore.INACTIVE

        return prospect

    async def collect_prospects_for_region(
        self,
        sido_name: str,
        min_score: int = 40
    ) -> List[PharmacyProspect]:
        """
        지역별 타겟 약국 수집

        Args:
            sido_name: 시도명 (예: "서울", "경기")
            min_score: 최소 타겟 점수

        Returns:
            타겟 약국 목록 (점수 순 정렬)
        """
        sido_code = self.sido_codes.get(sido_name)
        if not sido_code:
            logger.error(f"Unknown sido: {sido_name}")
            return []

        all_prospects = []
        page_no = 1
        num_of_rows = 100

        while True:
            prospects, total_count = await self.fetch_pharmacies_by_region(
                sido_code, page_no, num_of_rows
            )

            if not prospects:
                break

            # 각 약국 분석
            for prospect in prospects:
                try:
                    analyzed = await self.analyze_prospect(prospect)

                    if analyzed.prospect_score >= min_score:
                        all_prospects.append(analyzed)

                    # Rate limiting
                    await asyncio.sleep(0.2)

                except Exception as e:
                    logger.error(f"Failed to analyze prospect {prospect.ykiho}: {e}")
                    continue

            # 다음 페이지
            if page_no * num_of_rows >= total_count:
                break
            page_no += 1

            # Rate limiting between pages
            await asyncio.sleep(1)

        # 점수 순 정렬
        all_prospects.sort(key=lambda x: x.prospect_score, reverse=True)

        logger.info(f"Collected {len(all_prospects)} prospects for {sido_name}")
        return all_prospects

    async def get_hot_prospects(
        self,
        sido_names: List[str] = None,
        limit: int = 100
    ) -> List[PharmacyProspect]:
        """
        HOT 등급 타겟 약국 조회

        Args:
            sido_names: 대상 지역 (None이면 전국)
            limit: 최대 건수
        """
        if sido_names is None:
            sido_names = list(self.sido_codes.keys())

        all_hot = []

        for sido_name in sido_names:
            prospects = await self.collect_prospects_for_region(sido_name, min_score=80)
            all_hot.extend(prospects)

            if len(all_hot) >= limit:
                break

        return all_hot[:limit]

    def generate_outbound_message(self, prospect: PharmacyProspect) -> str:
        """아웃바운드 메시지 생성"""
        # 지역명 추출
        address_parts = prospect.address.split()
        region = address_parts[1] if len(address_parts) > 1 else ""

        message = f"""안녕하세요, {region} {prospect.name} 원장님

약국 양도 또는 승계에 관심 있으신가요?

메디매치는 약사님들의 안전한 약국 거래를 돕는 플랫폼입니다.

✓ 익명 매물 등록 (개인정보 보호)
✓ 검증된 매수 희망자 매칭
✓ 에스크로 안전 거래
✓ 첫 3개월 수수료 무료!

▶ 무료 상담: mediplaton.kr/pharmacy
▶ 전화 문의: 02-xxxx-xxxx

수신거부: 080-xxxx-xxxx"""

        return message

    def to_dict(self, prospect: PharmacyProspect) -> Dict[str, Any]:
        """PharmacyProspect를 딕셔너리로 변환"""
        return {
            "ykiho": prospect.ykiho,
            "name": prospect.name,
            "address": prospect.address,
            "phone": prospect.phone,
            "latitude": prospect.latitude,
            "longitude": prospect.longitude,
            "established_date": prospect.established_date,
            "pharmacist_count": prospect.pharmacist_count,
            "years_operated": prospect.years_operated,
            "est_pharmacist_age": prospect.est_pharmacist_age,
            "monthly_revenue": prospect.monthly_revenue,
            "revenue_trend": prospect.revenue_trend,
            "nearby_hospital_count": prospect.nearby_hospital_count,
            "nearby_pharmacy_count": prospect.nearby_pharmacy_count,
            "prospect_score": prospect.prospect_score,
            "prospect_grade": prospect.prospect_grade.value,
            "score_factors": prospect.score_factors,
            "contact_status": prospect.contact_status,
            "last_contact_date": prospect.last_contact_date.isoformat() if prospect.last_contact_date else None,
            "notes": prospect.notes,
        }


# 싱글톤 인스턴스
pharmacy_prospect_service = PharmacyProspectService()
