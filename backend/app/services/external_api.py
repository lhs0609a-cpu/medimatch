import httpx
from typing import Optional, Dict, List, Any
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)


class ExternalAPIService:
    """외부 API 연동 서비스"""

    def __init__(self):
        self.hira_base_url = "http://apis.data.go.kr/B551182/hospInfoServicev2"
        self.hira_pharmacy_url = "http://apis.data.go.kr/B551182/pharmacyInfoService"  # 약국 정보
        self.hira_cost_url = "http://apis.data.go.kr/B551182/MadmDtlInfoService2"  # 진료비용 정보
        self.hira_stats_url = "http://apis.data.go.kr/B551182/statInfoService"  # 통계 정보
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
            "ykiho": item.get("ykiho", ""),  # 요양기관번호 (청구데이터 조회용)
        }

    async def get_hospital_billing_stats(
        self,
        ykiho: str
    ) -> Optional[Dict[str, Any]]:
        """
        병원별 진료비 청구 통계 조회 (심평원)

        Returns:
            - claim_count: 월 청구건수
            - total_amount: 총 진료비
            - avg_per_claim: 건당 평균 진료비
            - patient_count: 환자 수
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "ykiho": ykiho,
                    "_type": "json"
                }

                response = await client.get(
                    f"{self.hira_cost_url}/getDtlInfo2",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                if items:
                    item = items[0]
                    return {
                        "claim_count": int(item.get("rcptCnt", 0)),
                        "total_amount": int(item.get("totRcptAmt", 0)),
                        "avg_per_claim": int(item.get("avgRcptAmt", 0)),
                        "patient_count": int(item.get("ptntCnt", 0)),
                        "year_month": item.get("yyyymm", ""),
                    }
                return None
        except Exception as e:
            logger.error(f"Failed to get hospital billing stats: {e}")
            return None

    async def get_clinic_type_stats(
        self,
        region_code: str,
        clinic_type: str
    ) -> Dict[str, Any]:
        """
        지역별/진료과별 평균 매출 통계 조회

        Returns:
            - avg_monthly_revenue: 지역 평균 월매출
            - avg_claim_count: 평균 청구건수
            - avg_per_claim: 평균 건당 진료비
            - total_clinics: 해당 지역 총 병원 수
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "sidoCd": region_code[:2] if region_code else "",
                    "sgguCd": region_code[2:5] if len(region_code) >= 5 else "",
                    "dgsbjtCd": self._get_clinic_code(clinic_type),
                    "_type": "json"
                }

                response = await client.get(
                    f"{self.hira_stats_url}/getStatsInfo",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                if items:
                    # 통계 데이터 집계
                    total_revenue = sum(int(i.get("totAmt", 0)) for i in items)
                    total_claims = sum(int(i.get("rcptCnt", 0)) for i in items)
                    clinic_count = len(items)

                    return {
                        "avg_monthly_revenue": total_revenue // clinic_count if clinic_count > 0 else 0,
                        "avg_claim_count": total_claims // clinic_count if clinic_count > 0 else 0,
                        "avg_per_claim": total_revenue // total_claims if total_claims > 0 else 0,
                        "total_clinics": clinic_count,
                        "region_code": region_code,
                        "clinic_type": clinic_type,
                    }

                return self._get_default_clinic_stats(clinic_type)
        except Exception as e:
            logger.error(f"Failed to get clinic type stats: {e}")
            return self._get_default_clinic_stats(clinic_type)

    def _get_default_clinic_stats(self, clinic_type: str) -> Dict[str, Any]:
        """진료과별 기본 통계 (API 실패 시 대체값)"""
        # 2023년 심평원 공개 자료 기반 진료과별 평균 데이터
        default_stats = {
            "내과": {"avg_monthly_revenue": 65000000, "avg_claim_count": 1800, "avg_per_claim": 36000},
            "정형외과": {"avg_monthly_revenue": 85000000, "avg_claim_count": 1500, "avg_per_claim": 57000},
            "피부과": {"avg_monthly_revenue": 55000000, "avg_claim_count": 1200, "avg_per_claim": 46000},
            "성형외과": {"avg_monthly_revenue": 120000000, "avg_claim_count": 400, "avg_per_claim": 300000},
            "이비인후과": {"avg_monthly_revenue": 48000000, "avg_claim_count": 1600, "avg_per_claim": 30000},
            "소아청소년과": {"avg_monthly_revenue": 52000000, "avg_claim_count": 2000, "avg_per_claim": 26000},
            "안과": {"avg_monthly_revenue": 70000000, "avg_claim_count": 1100, "avg_per_claim": 64000},
            "치과": {"avg_monthly_revenue": 75000000, "avg_claim_count": 800, "avg_per_claim": 94000},
            "산부인과": {"avg_monthly_revenue": 90000000, "avg_claim_count": 900, "avg_per_claim": 100000},
            "비뇨의학과": {"avg_monthly_revenue": 60000000, "avg_claim_count": 1000, "avg_per_claim": 60000},
            "정신건강의학과": {"avg_monthly_revenue": 45000000, "avg_claim_count": 600, "avg_per_claim": 75000},
            "재활의학과": {"avg_monthly_revenue": 80000000, "avg_claim_count": 1400, "avg_per_claim": 57000},
            "가정의학과": {"avg_monthly_revenue": 50000000, "avg_claim_count": 1500, "avg_per_claim": 33000},
        }

        stats = default_stats.get(clinic_type, {
            "avg_monthly_revenue": 55000000,
            "avg_claim_count": 1200,
            "avg_per_claim": 46000
        })

        return {
            **stats,
            "total_clinics": 0,
            "region_code": "",
            "clinic_type": clinic_type,
            "is_default": True
        }

    async def get_nearby_hospitals_with_revenue(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 1000,
        clinic_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """주변 병원 정보 + 매출 데이터 조회"""
        hospitals = await self.get_nearby_hospitals(latitude, longitude, radius_m, clinic_type)

        # 각 병원의 청구 데이터 조회
        for hospital in hospitals:
            ykiho = hospital.get("ykiho")
            if ykiho:
                billing = await self.get_hospital_billing_stats(ykiho)
                if billing:
                    hospital["billing_data"] = billing
                    hospital["est_monthly_revenue"] = billing.get("total_amount", 0)
                    hospital["claim_count"] = billing.get("claim_count", 0)
                    hospital["patient_count"] = billing.get("patient_count", 0)
                else:
                    # 청구 데이터 없으면 추정
                    hospital["est_monthly_revenue"] = self._estimate_revenue_from_size(hospital)
                    hospital["billing_data"] = None
            else:
                hospital["est_monthly_revenue"] = self._estimate_revenue_from_size(hospital)
                hospital["billing_data"] = None

        return hospitals

    def _estimate_revenue_from_size(self, hospital: Dict) -> int:
        """병원 규모 기반 매출 추정 (청구 데이터 없을 때)"""
        doctors = hospital.get("doctors", 1)
        beds = hospital.get("beds", 0)

        base_revenue = 40000000  # 기본 4천만원
        doctor_revenue = doctors * 25000000  # 의사당 2500만원
        bed_revenue = beds * 3000000  # 병상당 300만원

        return base_revenue + doctor_revenue + bed_revenue

    async def get_hospitals_by_region(
        self,
        sido_code: str,
        sggu_code: Optional[str] = None,
        page_no: int = 1,
        num_of_rows: int = 100
    ) -> List[Dict[str, Any]]:
        """지역별 병원 목록 조회 (심평원 API)"""
        try:
            async with httpx.AsyncClient() as client:
                params: Dict[str, Any] = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "sidoCd": sido_code,
                    "pageNo": page_no,
                    "numOfRows": num_of_rows,
                    "_type": "json"
                }

                if sggu_code:
                    params["sgguCd"] = sggu_code

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
            logger.error(f"Failed to get hospitals by region: {e}")
            return []

    async def get_nearby_pharmacies(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 500
    ) -> List[Dict[str, Any]]:
        """주변 약국 정보 조회 (심평원 API)"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "xPos": str(longitude),
                    "yPos": str(latitude),
                    "radius": str(radius_m),
                    "_type": "json"
                }

                response = await client.get(
                    f"{self.hira_pharmacy_url}/getParmacyBasisList",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                return [self._parse_pharmacy_data(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to get nearby pharmacies: {e}")
            return []

    def _parse_pharmacy_data(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """약국 데이터 파싱"""
        return {
            "ykiho": item.get("ykiho", ""),
            "name": item.get("yadmNm", ""),
            "address": item.get("addr", ""),
            "phone": item.get("telno", ""),
            "latitude": float(item.get("YPos", 0)),
            "longitude": float(item.get("XPos", 0)),
            "established": item.get("estbDd", ""),
            "pharmacists": int(item.get("parmCnt", 0)),
            "est_monthly_revenue": 0,  # 추후 계산
            "nearby_hospitals": [],
            "nearby_hospital_count": 0
        }

    async def get_pharmacy_billing_stats(
        self,
        ykiho: str
    ) -> Optional[Dict[str, Any]]:
        """약국별 처방 통계 조회"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "ykiho": ykiho,
                    "_type": "json"
                }

                response = await client.get(
                    f"{self.hira_pharmacy_url}/getParmacyDtlInfo",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                if items:
                    item = items[0]
                    return {
                        "rx_count": int(item.get("rcptCnt", 0)),
                        "total_amount": int(item.get("totRcptAmt", 0)),
                        "avg_per_rx": int(item.get("avgRcptAmt", 0)),
                        "year_month": item.get("yyyymm", ""),
                    }
                return None
        except Exception as e:
            logger.error(f"Failed to get pharmacy billing stats: {e}")
            return None

    async def get_pharmacies_by_region(
        self,
        sido_code: str,
        sggu_code: Optional[str] = None,
        page_no: int = 1,
        num_of_rows: int = 100
    ) -> List[Dict[str, Any]]:
        """지역별 약국 목록 조회"""
        try:
            async with httpx.AsyncClient() as client:
                params: Dict[str, Any] = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "sidoCd": sido_code,
                    "pageNo": page_no,
                    "numOfRows": num_of_rows,
                    "_type": "json"
                }

                if sggu_code:
                    params["sgguCd"] = sggu_code

                response = await client.get(
                    f"{self.hira_pharmacy_url}/getParmacyBasisList",
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                return [self._parse_pharmacy_data(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to get pharmacies by region: {e}")
            return []


external_api_service = ExternalAPIService()
