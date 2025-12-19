import httpx
from typing import Optional, Dict, List, Any
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)


class ExternalAPIService:
    """외부 API 연동 서비스"""

    def __init__(self):
        self.hira_base_url = "http://apis.data.go.kr/B551182/hospInfoServicev2"
        self.building_base_url = "http://apis.data.go.kr/1613000/BldRgstService_v2"
        self.commercial_base_url = "http://apis.data.go.kr/B553077/api/open/sdsc2"
        self.kakao_base_url = "https://dapi.kakao.com/v2/local"

    async def get_nearby_hospitals(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 1000,
        clinic_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """주변 병원 정보 조회 (심평원 API)"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "xPos": str(longitude),
                    "yPos": str(latitude),
                    "radius": str(radius_m),
                    "_type": "json"
                }
                if clinic_type:
                    params["dgsbjtCd"] = self._get_clinic_code(clinic_type)

                response = await client.get(
                    f"{self.hira_base_url}/getHospBasisList",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                return [self._parse_hospital_data(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to get nearby hospitals: {e}")
            return []

    async def get_building_info(self, address: str) -> Optional[Dict[str, Any]]:
        """건축물대장 정보 조회 (국토교통부 API)"""
        try:
            async with httpx.AsyncClient() as client:
                # First, get coordinates from address
                coords = await self.geocode_address(address)
                if not coords:
                    return None

                params = {
                    "serviceKey": settings.BUILDING_API_KEY,
                    "sigunguCd": coords.get("region_code", ""),
                    "bjdongCd": coords.get("bjdong_code", ""),
                    "_type": "json"
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
            logger.error(f"Failed to get building info: {e}")
            return None

    async def get_commercial_data(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 500
    ) -> Dict[str, Any]:
        """상권 정보 조회 (소상공인진흥공단 API)"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.COMMERCIAL_API_KEY,
                    "cx": str(longitude),
                    "cy": str(latitude),
                    "radius": str(radius_m),
                    "type": "json"
                }

                response = await client.get(
                    f"{self.commercial_base_url}/storeListInRadius",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get commercial data: {e}")
            return {}

    async def get_floating_population(
        self,
        region_code: str
    ) -> Dict[str, Any]:
        """유동인구 데이터 조회"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.COMMERCIAL_API_KEY,
                    "divId": "adongCd",
                    "key": region_code,
                    "type": "json"
                }

                response = await client.get(
                    f"{self.commercial_base_url}/storeStatsUpjongInAdong",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get floating population: {e}")
            return {}

    async def geocode_address(self, address: str) -> Optional[Dict[str, Any]]:
        """주소 → 좌표 변환 (카카오 API)"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"KakaoAK {settings.KAKAO_MAP_API_KEY}"}
                params = {"query": address}

                response = await client.get(
                    f"{self.kakao_base_url}/search/address.json",
                    headers=headers,
                    params=params,
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()

                documents = data.get("documents", [])
                if documents:
                    doc = documents[0]
                    return {
                        "latitude": float(doc.get("y", 0)),
                        "longitude": float(doc.get("x", 0)),
                        "region_code": doc.get("address", {}).get("b_code", ""),
                        "bjdong_code": doc.get("address", {}).get("h_code", ""),
                        "formatted_address": doc.get("address_name", address)
                    }
                return None
        except Exception as e:
            logger.error(f"Failed to geocode address: {e}")
            return None

    async def get_demographics(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 1000
    ) -> Dict[str, Any]:
        """인구통계 데이터 조회"""
        # This would integrate with MOIS API for real implementation
        # For now, return mock data structure
        return {
            "population_1km": 0,
            "age_distribution": {},
            "household_count": 0,
            "age_40_plus_ratio": 0.0
        }

    def _get_clinic_code(self, clinic_type: str) -> str:
        """진료과목명을 코드로 변환"""
        clinic_codes = {
            "내과": "01",
            "소아청소년과": "11",
            "정신건강의학과": "03",
            "외과": "04",
            "정형외과": "05",
            "신경외과": "06",
            "흉부외과": "07",
            "성형외과": "08",
            "마취통증의학과": "09",
            "산부인과": "10",
            "안과": "12",
            "이비인후과": "13",
            "피부과": "14",
            "비뇨의학과": "15",
            "영상의학과": "16",
            "방사선종양학과": "17",
            "병리과": "18",
            "진단검사의학과": "19",
            "결핵과": "20",
            "재활의학과": "21",
            "핵의학과": "22",
            "가정의학과": "23",
            "응급의학과": "24",
            "직업환경의학과": "25",
            "예방의학과": "26",
            "치과": "49",
            "한방과": "80",
        }
        return clinic_codes.get(clinic_type, "01")

    def _parse_hospital_data(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """병원 데이터 파싱"""
        return {
            "name": item.get("yadmNm", ""),
            "address": item.get("addr", ""),
            "phone": item.get("telno", ""),
            "clinic_type": item.get("dgsbjtCdNm", ""),
            "latitude": float(item.get("YPos", 0)),
            "longitude": float(item.get("XPos", 0)),
            "beds": int(item.get("sickbedCnt", 0)),
            "doctors": int(item.get("drTotCnt", 0)),
            "established": item.get("estbDd", ""),
        }


external_api_service = ExternalAPIService()
