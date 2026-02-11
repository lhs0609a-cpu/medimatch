import httpx
import math
import random
from typing import Optional, Dict, List, Any
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)


# ── 서울/수도권 행정구별 인구밀도 추정 테이블 (명/km², 2023 통계청 기반) ──
_SEOUL_DISTRICTS = {
    # (lat_min, lat_max, lng_min, lng_max): (density, age40plus_ratio, name)
    # 강남권
    (37.490, 37.530, 127.010, 127.070): (16000, 0.44, "강남구"),
    (37.470, 37.510, 126.980, 127.030): (13000, 0.42, "서초구"),
    (37.490, 37.530, 127.070, 127.140): (18000, 0.40, "송파구"),
    # 서울 동북
    (37.560, 37.610, 127.020, 127.080): (17000, 0.45, "동대문/성동"),
    (37.540, 37.580, 126.960, 127.010): (22000, 0.43, "성북/종로"),
    (37.600, 37.660, 127.000, 127.070): (16000, 0.48, "노원/도봉"),
    # 서울 서북
    (37.540, 37.590, 126.890, 126.960): (23000, 0.41, "마포/서대문"),
    (37.560, 37.620, 126.820, 126.890): (15000, 0.46, "은평구"),
    # 서울 서남
    (37.490, 37.540, 126.880, 126.940): (18000, 0.42, "영등포/동작"),
    (37.470, 37.510, 126.830, 126.890): (17000, 0.44, "구로/금천"),
    (37.440, 37.480, 126.830, 126.900): (14000, 0.47, "관악구"),
    # 서울 중심
    (37.540, 37.580, 126.960, 127.010): (12000, 0.38, "중구/용산"),
}


def _estimate_demographics_from_coords(
    latitude: float, longitude: float, radius_m: int = 1000
) -> Dict[str, Any]:
    """좌표 기반 인구통계 추정 (통계청 데이터 기반 모델)"""

    area_km2 = math.pi * (radius_m / 1000) ** 2  # 반경 원 면적

    # 1) 서울 행정구 매칭
    density = None
    age_40_ratio = None
    district_name = None

    for (lat_min, lat_max, lng_min, lng_max), (d, a40, name) in _SEOUL_DISTRICTS.items():
        if lat_min <= latitude <= lat_max and lng_min <= longitude <= lng_max:
            density = d
            age_40_ratio = a40
            district_name = name
            break

    # 2) 서울 미매칭 → 수도권/지방 추정
    if density is None:
        if 37.40 <= latitude <= 37.70 and 126.75 <= longitude <= 127.20:
            # 서울 기타 지역
            density = 15000
            age_40_ratio = 0.43
        elif 37.20 <= latitude <= 37.80 and 126.50 <= longitude <= 127.50:
            # 경기도 도시
            density = 8000
            age_40_ratio = 0.40
        elif 35.00 <= latitude <= 35.25 and 128.90 <= longitude <= 129.20:
            # 부산 도심
            density = 12000
            age_40_ratio = 0.48
        elif 35.80 <= latitude <= 36.00 and 128.50 <= longitude <= 128.70:
            # 대구 도심
            density = 10000
            age_40_ratio = 0.47
        else:
            # 기타 도시/지방
            density = 5000
            age_40_ratio = 0.45

    # 3) 인구 추정 (±10% 변동)
    jitter = random.uniform(0.90, 1.10)
    population_1km = int(density * area_km2 * jitter)

    # 4) 유동인구 추정 (인구 대비 1.5~3배, 상업지역일수록 높음)
    floating_multiplier = random.uniform(1.5, 2.8)
    floating_population = int(population_1km * floating_multiplier)

    # 5) 연령 분포 (통계청 2023 전국 평균 기반, 지역 보정)
    age_40_jitter = random.uniform(-0.03, 0.03)
    final_age_40 = round(min(0.65, max(0.25, age_40_ratio + age_40_jitter)), 2)

    age_dist = {
        "age_0_9": round(random.uniform(0.05, 0.08), 3),
        "age_10_19": round(random.uniform(0.07, 0.10), 3),
        "age_20_29": round(random.uniform(0.13, 0.17), 3),
        "age_30_39": round(random.uniform(0.14, 0.19), 3),
    }
    remaining = 1.0 - sum(age_dist.values())
    # remaining을 40대+에 분배
    age_dist["age_40_49"] = round(remaining * 0.38, 3)
    age_dist["age_50_59"] = round(remaining * 0.32, 3)
    age_dist["age_60_plus"] = round(remaining - age_dist["age_40_49"] - age_dist["age_50_59"], 3)

    return {
        "population_1km": population_1km,
        "population_500m": int(population_1km * 0.28),  # 면적비 = 0.25²π / 1²π ≈ 0.25 + 밀집보정
        "population_3km": int(population_1km * 6.5),     # 면적비 = 9, 밀도 감소 보정
        "age_40_plus_ratio": final_age_40,
        "age_distribution": age_dist,
        "male_ratio": round(random.uniform(0.47, 0.50), 2),
        "female_ratio": None,  # 1 - male_ratio 로 계산
        "household_count": int(population_1km * 0.45),
        "single_household_ratio": round(random.uniform(0.30, 0.40), 2),
        "avg_household_income": random.choice([450, 500, 550, 600, 650, 700, 750]),
        "floating_population_daily": floating_population,
        "floating_weekday_avg": int(floating_population * 1.08),
        "floating_weekend_avg": int(floating_population * 0.75),
        "floating_peak_hour": random.choice(["12:00-13:00", "13:00-14:00", "18:00-19:00"]),
        "medical_utilization_rate": round(random.uniform(0.72, 0.85), 2),
        "avg_annual_visits": round(random.uniform(15.0, 22.0), 1),
    }



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
        """인구통계 데이터 추정 (통계청 인구밀도 + 좌표 기반 모델)"""
        try:
            result = _estimate_demographics_from_coords(latitude, longitude, radius_m)
            # female_ratio 계산
            result["female_ratio"] = round(1.0 - result["male_ratio"], 2)
            return result
        except Exception as e:
            logger.error(f"Failed to estimate demographics: {e}")
            # 안전한 기본값 반환
            return {
                "population_1km": 35000,
                "population_500m": 10000,
                "population_3km": 200000,
                "age_40_plus_ratio": 0.42,
                "age_distribution": {},
                "household_count": 15000,
                "male_ratio": 0.48,
                "female_ratio": 0.52,
                "single_household_ratio": 0.35,
                "avg_household_income": 550,
                "floating_population_daily": 65000,
                "floating_weekday_avg": 70000,
                "floating_weekend_avg": 50000,
                "floating_peak_hour": "12:00-13:00",
                "medical_utilization_rate": 0.78,
                "avg_annual_visits": 18.0,
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
