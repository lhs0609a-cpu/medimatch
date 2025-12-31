"""
부동산 매물 수집 서비스

공공데이터 API를 통해 의료시설 적합 부동산 매물을 수집하고 분석합니다.
- 국토교통부 실거래가 API
- 건축물대장 API
- 상가정보시스템 API
"""

import httpx
import asyncio
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging
import uuid

from ..core.config import settings
from ..models.listing import RealEstateListing, ListingStatus, ListingType
from .external_api import external_api_service

logger = logging.getLogger(__name__)


class RealEstateCrawlerService:
    """부동산 매물 크롤러 서비스"""

    def __init__(self):
        self.realestate_base_url = "http://openapi.molit.go.kr"
        self.building_base_url = "http://apis.data.go.kr/1613000/BldRgstService_v2"
        self.commercial_base_url = "http://apis.data.go.kr/B553077/api/open/sdsc2"

        # 시도 코드 (국토교통부 API용)
        self.sido_codes = {
            "서울특별시": "11",
            "부산광역시": "26",
            "대구광역시": "27",
            "인천광역시": "28",
            "광주광역시": "29",
            "대전광역시": "30",
            "울산광역시": "31",
            "세종특별자치시": "36",
            "경기도": "41",
            "강원도": "42",
            "충청북도": "43",
            "충청남도": "44",
            "전라북도": "45",
            "전라남도": "46",
            "경상북도": "47",
            "경상남도": "48",
            "제주특별자치도": "50",
        }

        # 의료시설 적합 용도 코드
        self.medical_suitable_codes = [
            "04000",  # 제2종근린생활시설
            "03000",  # 제1종근린생활시설
            "05000",  # 문화및집회시설
            "10000",  # 교육연구시설
            "09000",  # 의료시설 (이미 의료용)
        ]

    async def fetch_commercial_listings(
        self,
        sido_code: str,
        sigungu_code: str,
        deal_ymd: str = None,
    ) -> List[Dict[str, Any]]:
        """
        상업용 부동산 실거래가 조회 (국토교통부 API)

        Args:
            sido_code: 시도 코드
            sigungu_code: 시군구 코드
            deal_ymd: 거래년월 (YYYYMM)
        """
        if not deal_ymd:
            deal_ymd = datetime.now().strftime("%Y%m")

        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.REALESTATE_API_KEY,
                    "LAWD_CD": f"{sido_code}{sigungu_code}",
                    "DEAL_YMD": deal_ymd,
                    "_type": "json",
                    "numOfRows": 1000,
                }

                # 상업용 부동산 매매 실거래가
                response = await client.get(
                    f"{self.realestate_base_url}/OpenAPI_ToolInstall498/service/rest/RTMSOBJSvc/getRTMSDataSvcNrgTrade",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                return [self._parse_commercial_listing(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to fetch commercial listings: {e}")
            return []

    async def fetch_rental_listings(
        self,
        sido_code: str,
        sigungu_code: str,
        deal_ymd: str = None,
    ) -> List[Dict[str, Any]]:
        """상업용 부동산 임대차 실거래 조회"""
        if not deal_ymd:
            deal_ymd = datetime.now().strftime("%Y%m")

        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.REALESTATE_API_KEY,
                    "LAWD_CD": f"{sido_code}{sigungu_code}",
                    "DEAL_YMD": deal_ymd,
                    "_type": "json",
                    "numOfRows": 1000,
                }

                # 상업/업무용 임대차
                response = await client.get(
                    f"{self.realestate_base_url}/OpenAPI_ToolInstallNrg/service/rest/RTMSOBJSvc/getRTMSDataSvcNrgRent",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                return [self._parse_rental_listing(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to fetch rental listings: {e}")
            return []

    async def fetch_vacant_stores(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 1000
    ) -> List[Dict[str, Any]]:
        """공실 상가 정보 조회 (소상공인진흥공단 API)"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.COMMERCIAL_API_KEY,
                    "cx": str(longitude),
                    "cy": str(latitude),
                    "radius": str(radius_m),
                    "type": "json",
                    "indsLclsCd": "Q",  # 의료/건강/사회복지 업종
                }

                response = await client.get(
                    f"{self.commercial_base_url}/storeListInRadius",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("body", {}).get("items", [])
                if isinstance(items, dict):
                    items = [items]

                return items
        except Exception as e:
            logger.error(f"Failed to fetch vacant stores: {e}")
            return []

    async def fetch_building_info(
        self,
        sigungu_code: str,
        bjdong_code: str,
        bun: str,
        ji: str
    ) -> Optional[Dict[str, Any]]:
        """건축물대장 정보 조회"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.BUILDING_API_KEY,
                    "sigunguCd": sigungu_code,
                    "bjdongCd": bjdong_code,
                    "bun": bun.zfill(4),
                    "ji": ji.zfill(4),
                    "_type": "json",
                    "numOfRows": 100,
                }

                response = await client.get(
                    f"{self.building_base_url}/getBrTitleInfo",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                return items[0] if items else None
        except Exception as e:
            logger.error(f"Failed to fetch building info: {e}")
            return None

    async def analyze_medical_suitability(
        self,
        listing: Dict[str, Any],
        building_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """의료시설 적합성 분석"""
        score = 50  # 기본 점수
        suitable_for = []
        features = []

        area_pyeong = listing.get("area_pyeong", 0)
        floor = listing.get("floor", "")

        # 면적 분석
        if 20 <= area_pyeong <= 50:
            score += 15
            suitable_for.extend(["피부과", "안과", "치과"])
            features.append("소규모 의원 적합")
        elif 50 < area_pyeong <= 100:
            score += 20
            suitable_for.extend(["내과", "정형외과", "이비인후과", "소아청소년과"])
            features.append("중규모 의원 적합")
        elif area_pyeong > 100:
            score += 25
            suitable_for.extend(["재활의학과", "산부인과", "검진센터"])
            features.append("대규모 의원/검진센터 적합")

        # 층수 분석
        floor_str = str(floor)
        if "1" in floor_str or "2" in floor_str:
            score += 15
            features.append("저층(접근성 우수)")
        elif "B" in floor_str.upper():
            score -= 10
            features.append("지하층(주의 필요)")

        # 건축물대장 분석
        if building_info:
            main_purps = building_info.get("mainPurpsCdNm", "")
            if "의료" in main_purps:
                score += 20
                features.append("기존 의료시설")
            elif "근린생활" in main_purps:
                score += 10
                features.append("근린생활시설")

            # 엘리베이터
            if building_info.get("elvCnt", 0) > 0:
                score += 5
                features.append("엘리베이터 있음")

            # 주차
            if building_info.get("indrPkngCnt", 0) > 0 or building_info.get("oudrPkngCnt", 0) > 0:
                score += 10
                features.append("주차공간 있음")

        # 주변 병원/약국 확인
        if listing.get("latitude") and listing.get("longitude"):
            nearby_hospitals = await external_api_service.get_nearby_hospitals(
                listing["latitude"],
                listing["longitude"],
                radius_m=500
            )
            nearby_pharmacies = await external_api_service.get_nearby_pharmacies(
                listing["latitude"],
                listing["longitude"],
                radius_m=300
            )

            if nearby_pharmacies:
                score += 5
                features.append(f"인근 약국 {len(nearby_pharmacies)}개")

            # 경쟁 병원 분석
            if len(nearby_hospitals) < 3:
                score += 10
                features.append("경쟁 의원 적음")
            elif len(nearby_hospitals) > 10:
                score -= 5
                features.append("경쟁 과다 지역")

        return {
            "suitability_score": min(score, 100),
            "suitable_for": list(set(suitable_for)),
            "features": features,
            "recommendation": self._get_recommendation(score)
        }

    def _get_recommendation(self, score: int) -> str:
        if score >= 80:
            return "매우 적합 - 적극 추천"
        elif score >= 60:
            return "적합 - 추천"
        elif score >= 40:
            return "보통 - 조건부 추천"
        else:
            return "부적합 - 비추천"

    def _parse_commercial_listing(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """상업용 매매 데이터 파싱"""
        return {
            "type": "SALE",
            "address": f"{item.get('시군구', '')} {item.get('법정동', '')} {item.get('지번', '')}",
            "building_name": item.get("건물명", ""),
            "floor": item.get("층", ""),
            "area_m2": float(item.get("전용면적", 0)),
            "area_pyeong": float(item.get("전용면적", 0)) * 0.3025,
            "sale_price": int(item.get("거래금액", "0").replace(",", "")) * 10000,  # 만원 단위
            "deal_year": item.get("년", ""),
            "deal_month": item.get("월", ""),
            "deal_day": item.get("일", ""),
            "building_use": item.get("용도", ""),
        }

    def _parse_rental_listing(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """임대차 데이터 파싱"""
        return {
            "type": "RENT",
            "address": f"{item.get('시군구', '')} {item.get('법정동', '')} {item.get('지번', '')}",
            "building_name": item.get("건물명", ""),
            "floor": item.get("층", ""),
            "area_m2": float(item.get("전용면적", 0)),
            "area_pyeong": float(item.get("전용면적", 0)) * 0.3025,
            "deposit": int(item.get("보증금", "0").replace(",", "")) * 10000,
            "monthly_rent": int(item.get("월세", "0").replace(",", "")) * 10000,
            "deal_year": item.get("년", ""),
            "deal_month": item.get("월", ""),
            "building_use": item.get("용도", ""),
        }

    async def collect_listings_for_region(
        self,
        db: AsyncSession,
        sido_name: str,
        sigungu_codes: List[str],
        months_back: int = 3
    ) -> int:
        """특정 지역의 매물 수집 및 DB 저장"""
        sido_code = self.sido_codes.get(sido_name)
        if not sido_code:
            logger.error(f"Unknown sido: {sido_name}")
            return 0

        collected_count = 0
        now = datetime.now()

        for sigungu_code in sigungu_codes:
            for month_offset in range(months_back):
                target_date = now - timedelta(days=30 * month_offset)
                deal_ymd = target_date.strftime("%Y%m")

                # 매매 데이터
                sale_listings = await self.fetch_commercial_listings(
                    sido_code, sigungu_code, deal_ymd
                )

                # 임대차 데이터
                rental_listings = await self.fetch_rental_listings(
                    sido_code, sigungu_code, deal_ymd
                )

                all_listings = sale_listings + rental_listings

                for listing_data in all_listings:
                    try:
                        # 좌표 조회
                        coords = await external_api_service.geocode_address(
                            listing_data["address"]
                        )

                        if coords:
                            listing_data["latitude"] = coords["latitude"]
                            listing_data["longitude"] = coords["longitude"]

                            # 의료 적합성 분석
                            suitability = await self.analyze_medical_suitability(listing_data)

                            # DB 저장
                            await self._save_listing(db, listing_data, suitability)
                            collected_count += 1

                        # Rate limiting
                        await asyncio.sleep(0.1)

                    except Exception as e:
                        logger.error(f"Failed to process listing: {e}")
                        continue

        await db.commit()
        return collected_count

    async def _save_listing(
        self,
        db: AsyncSession,
        listing_data: Dict[str, Any],
        suitability: Dict[str, Any]
    ) -> RealEstateListing:
        """매물 DB 저장"""
        # 중복 체크
        existing = await db.execute(
            select(RealEstateListing).where(
                and_(
                    RealEstateListing.address == listing_data["address"],
                    RealEstateListing.floor == listing_data.get("floor"),
                    RealEstateListing.area_m2 == listing_data.get("area_m2")
                )
            )
        )
        existing_listing = existing.scalar_one_or_none()

        if existing_listing:
            # 업데이트
            existing_listing.updated_at = datetime.utcnow()
            return existing_listing

        # 신규 생성
        listing_type = ListingType.SALE if listing_data["type"] == "SALE" else ListingType.RENT

        title = self._generate_title(listing_data, suitability)

        new_listing = RealEstateListing(
            id=uuid.uuid4(),
            title=title,
            address=listing_data["address"],
            latitude=listing_data.get("latitude", 0),
            longitude=listing_data.get("longitude", 0),
            building_name=listing_data.get("building_name"),
            floor=listing_data.get("floor"),
            area_pyeong=listing_data.get("area_pyeong"),
            area_m2=listing_data.get("area_m2"),
            listing_type=listing_type,
            rent_deposit=listing_data.get("deposit"),
            rent_monthly=listing_data.get("monthly_rent"),
            sale_price=listing_data.get("sale_price"),
            suitable_for=suitability.get("suitable_for", []),
            previous_use=listing_data.get("building_use"),
            features=suitability.get("features", []),
            description=self._generate_description(listing_data, suitability),
            source="PUBLIC_API",
            status=ListingStatus.AVAILABLE,
        )

        db.add(new_listing)
        return new_listing

    def _generate_title(self, listing_data: Dict, suitability: Dict) -> str:
        """매물 제목 생성"""
        parts = []

        # 지역
        address_parts = listing_data["address"].split()
        if len(address_parts) >= 2:
            parts.append(address_parts[1])  # 구/군

        # 면적
        area = listing_data.get("area_pyeong", 0)
        if area:
            parts.append(f"{area:.0f}평")

        # 층
        floor = listing_data.get("floor", "")
        if floor:
            parts.append(f"{floor}층")

        # 적합 진료과
        suitable = suitability.get("suitable_for", [])
        if suitable:
            parts.append(f"{suitable[0]} 적합")

        return " ".join(parts) if parts else "상업용 부동산"

    def _generate_description(self, listing_data: Dict, suitability: Dict) -> str:
        """매물 설명 생성"""
        lines = []

        # 기본 정보
        lines.append(f"주소: {listing_data['address']}")

        if listing_data.get("building_name"):
            lines.append(f"건물명: {listing_data['building_name']}")

        area = listing_data.get("area_pyeong", 0)
        if area:
            lines.append(f"면적: {area:.1f}평 ({listing_data.get('area_m2', 0):.1f}㎡)")

        # 가격 정보
        if listing_data.get("sale_price"):
            price = listing_data["sale_price"]
            if price >= 100000000:
                lines.append(f"매매가: {price / 100000000:.1f}억원")
            else:
                lines.append(f"매매가: {price / 10000:.0f}만원")

        if listing_data.get("deposit") or listing_data.get("monthly_rent"):
            deposit = listing_data.get("deposit", 0) / 10000
            monthly = listing_data.get("monthly_rent", 0) / 10000
            lines.append(f"임대료: 보증금 {deposit:.0f}만원 / 월세 {monthly:.0f}만원")

        # 적합성
        lines.append("")
        lines.append(f"의료시설 적합도: {suitability.get('suitability_score', 0)}점")
        lines.append(f"추천: {suitability.get('recommendation', '')}")

        suitable = suitability.get("suitable_for", [])
        if suitable:
            lines.append(f"추천 진료과: {', '.join(suitable)}")

        features = suitability.get("features", [])
        if features:
            lines.append(f"특징: {', '.join(features)}")

        return "\n".join(lines)


# 싱글톤 인스턴스
realestate_crawler_service = RealEstateCrawlerService()
