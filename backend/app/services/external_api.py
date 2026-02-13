import asyncio
import httpx
import math
import random
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)


def _get_mois_key() -> str:
    """행안부 API 키 반환 — MOIS_API_KEY 우선, 없으면 HIRA_API_KEY(같은 data.go.kr 키)"""
    return settings.MOIS_API_KEY or settings.HIRA_API_KEY


def _get_recent_ym() -> str:
    """최근 데이터가 확실히 존재하는 YYYYMM 반환 (2개월 전)"""
    now = datetime.now()
    first = now.replace(day=1)
    two_months_ago = (first - timedelta(days=1)).replace(day=1) - timedelta(days=1)
    return two_months_ago.strftime("%Y%m")


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

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """두 좌표 간 거리(m) 계산 — Haversine 공식"""
        R = 6371000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    async def _fetch_hira_hospitals(
        self,
        region_code: str,
        clinic_type: Optional[str] = None,
        num_of_rows: int = 200,
    ) -> List[Dict[str, Any]]:
        """심평원 API로 지역 기반 병원 목록 조회 (sidoCd/sgguCd 사용)"""
        if not region_code or len(region_code) < 5:
            return []
        sido_cd = region_code[:2]
        sggu_cd = region_code[2:5]
        try:
            async with httpx.AsyncClient() as client:
                params: Dict[str, Any] = {
                    "serviceKey": settings.HIRA_API_KEY,
                    "sidoCd": sido_cd,
                    "sgguCd": sggu_cd,
                    "numOfRows": num_of_rows,
                    "_type": "json",
                }
                if clinic_type:
                    params["dgsbjtCd"] = self._get_clinic_code(clinic_type)

                response = await client.get(
                    f"{self.hira_base_url}/getHospBasisList",
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if isinstance(items, dict):
                    items = [items]

                return [self._parse_hospital_data(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to fetch HIRA hospitals (region={region_code}, type={clinic_type}): {e}")
            return []

    async def get_nearby_hospitals(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 1000,
        clinic_type: Optional[str] = None,
        region_code: str = "",
    ) -> List[Dict[str, Any]]:
        """주변 병원 정보 조회 — 지역코드 기반 조회 후 좌표 거리 필터"""
        hospitals = await self._fetch_hira_hospitals(region_code, clinic_type)

        # 좌표 기반 거리 계산 및 반경 필터
        nearby = []
        for h in hospitals:
            h_lat = h.get("latitude", 0)
            h_lng = h.get("longitude", 0)
            if h_lat == 0 or h_lng == 0:
                continue
            dist = self._haversine(latitude, longitude, h_lat, h_lng)
            h["distance"] = round(dist)
            if dist <= radius_m:
                nearby.append(h)

        # 거리순 정렬
        nearby.sort(key=lambda x: x.get("distance", 9999))
        return nearby

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

    # ── 행정안전부 주민등록 인구통계 API ──────────────────────────

    def _extract_mois_items(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """행안부 API 응답에서 items 배열 추출 (다양한 응답 구조 처리)"""
        for path in [
            lambda d: d.get("response", {}).get("body", {}).get("items", {}).get("item", []),
            lambda d: d.get("body", {}).get("items", {}).get("item", []),
            lambda d: d.get("items", {}).get("item", []),
        ]:
            try:
                items = path(data)
                if items:
                    return items if isinstance(items, list) else [items]
            except (AttributeError, TypeError):
                continue
        return []

    async def _get_mois_age_population(self, stdg_cd: str) -> Optional[Dict[str, Any]]:
        """행정안전부 법정동별 성/연령별 주민등록 인구수 API 호출"""
        api_key = _get_mois_key()
        if not api_key:
            return None

        ym = _get_recent_ym()

        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": api_key,
                    "stdgCd": stdg_cd,
                    "srchFrYm": ym,
                    "srchToYm": ym,
                    "lv": "7",        # 단일 읍면동
                    "regSeCd": "2",    # 주민등록자만
                    "type": "JSON",
                    "numOfRows": "100",
                    "pageNo": "1",
                }

                response = await client.get(
                    "https://apis.data.go.kr/1741000/stdgSexdAgePpltn/selectStdgSexdAgePpltn",
                    params=params,
                    timeout=15.0,
                )
                response.raise_for_status()
                data = response.json()

                items = self._extract_mois_items(data)
                if not items:
                    logger.warning(f"MOIS age API returned no items for stdgCd={stdg_cd}")
                    return None

                # 통/반 단위 → 동 단위로 합산
                total_pop = 0
                male_pop = 0
                female_pop = 0
                age_keys = (
                    [f"male{a}AgeNmprCnt" for a in [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]]
                    + [f"feml{a}AgeNmprCnt" for a in [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]]
                )
                age_groups: Dict[str, int] = {k: 0 for k in age_keys}

                for item in items:
                    total_pop += int(item.get("totNmprCnt", 0) or 0)
                    male_pop += int(item.get("maleNmprCnt", 0) or 0)
                    female_pop += int(item.get("femlNmprCnt", 0) or 0)
                    for key in age_keys:
                        age_groups[key] += int(item.get(key, 0) or 0)

                region_name = " ".join(filter(None, [
                    items[0].get("ctpvNm", ""),
                    items[0].get("sggNm", ""),
                    items[0].get("stdgNm", ""),
                ]))

                logger.info(f"MOIS age API: {region_name} pop={total_pop}")
                return {
                    "total_population": total_pop,
                    "male_population": male_pop,
                    "female_population": female_pop,
                    "age_groups": age_groups,
                    "stats_ym": ym,
                    "region_name": region_name,
                }
        except Exception as e:
            logger.error(f"MOIS age population API failed: {e}")
            return None

    async def _get_mois_household(self, stdg_cd: str) -> Optional[Dict[str, Any]]:
        """행정안전부 법정동별 주민등록 인구 및 세대현황 API 호출"""
        api_key = _get_mois_key()
        if not api_key:
            return None

        ym = _get_recent_ym()

        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "serviceKey": api_key,
                    "stdgCd": stdg_cd,
                    "srchFrYm": ym,
                    "srchToYm": ym,
                    "lv": "7",
                    "regSeCd": "2",
                    "type": "JSON",
                    "numOfRows": "100",
                    "pageNo": "1",
                }

                response = await client.get(
                    "https://apis.data.go.kr/1741000/stdgPpltnHhStus/selectStdgPpltnHhStus",
                    params=params,
                    timeout=15.0,
                )
                response.raise_for_status()
                data = response.json()

                items = self._extract_mois_items(data)
                if not items:
                    return None

                total_pop = 0
                total_hh = 0

                for item in items:
                    total_pop += int(item.get("totNmprCnt", 0) or 0)
                    total_hh += int(item.get("hhCnt", 0) or 0)

                pph = round(total_pop / total_hh, 2) if total_hh > 0 else 2.3
                logger.info(f"MOIS household API: pop={total_pop}, hh={total_hh}, pph={pph}")

                return {
                    "total_population": total_pop,
                    "household_count": total_hh,
                    "persons_per_household": pph,
                }
        except Exception as e:
            logger.error(f"MOIS household API failed: {e}")
            return None

    def _build_demographics_from_mois(
        self,
        age_data: Dict[str, Any],
        hh_data: Optional[Dict[str, Any]],
        latitude: float,
        longitude: float,
        radius_m: int,
    ) -> Dict[str, Any]:
        """행안부 API 실데이터 → 시뮬레이션 demographics 포맷 변환"""
        total = age_data["total_population"]
        male = age_data["male_population"]
        female = age_data["female_population"]
        ag = age_data["age_groups"]

        # ─── 연령 비율 계산 ───
        def age_ratio(*keys: str) -> float:
            return sum(ag.get(k, 0) for k in keys) / total if total > 0 else 0

        age_0_9 = age_ratio("male0AgeNmprCnt", "feml0AgeNmprCnt")
        age_10_19 = age_ratio("male10AgeNmprCnt", "feml10AgeNmprCnt")
        age_20_29 = age_ratio("male20AgeNmprCnt", "feml20AgeNmprCnt")
        age_30_39 = age_ratio("male30AgeNmprCnt", "feml30AgeNmprCnt")
        age_40_49 = age_ratio("male40AgeNmprCnt", "feml40AgeNmprCnt")
        age_50_59 = age_ratio("male50AgeNmprCnt", "feml50AgeNmprCnt")
        age_60_plus = age_ratio(
            "male60AgeNmprCnt", "feml60AgeNmprCnt",
            "male70AgeNmprCnt", "feml70AgeNmprCnt",
            "male80AgeNmprCnt", "feml80AgeNmprCnt",
            "male90AgeNmprCnt", "feml90AgeNmprCnt",
            "male100AgeNmprCnt", "feml100AgeNmprCnt",
        )
        age_40_plus = age_40_49 + age_50_59 + age_60_plus

        # ─── 법정동 인구 → 반경 인구 추정 ───
        # 서울 법정동 평균 면적 ≈ 0.5~1.5 km², 1km 반경 원 ≈ 3.14 km²
        # 동 인구 크기에 따른 적응적 스케일링
        if total < 5000:
            scale = 2.8
        elif total < 15000:
            scale = 2.0
        elif total < 30000:
            scale = 1.5
        else:
            scale = 1.2
        population_1km = int(total * scale)

        # ─── 세대 ───
        hh_count = hh_data["household_count"] if hh_data else int(total * 0.45)
        pph = hh_data.get("persons_per_household", 2.3) if hh_data else 2.3
        # 1인가구 비율 추정: pph 낮을수록 1인가구 많음
        single_hh_ratio = round(max(0.15, min(0.55, 0.70 - pph * 0.15)), 2)

        # ─── 유동인구 (행안부에는 없으므로 인구 기반 추정) ───
        floating_multiplier = random.uniform(1.5, 2.8)
        floating = int(population_1km * floating_multiplier)

        male_ratio = round(male / total, 2) if total > 0 else 0.48

        return {
            "population_1km": population_1km,
            "population_500m": int(population_1km * 0.28),
            "population_3km": int(population_1km * 6.5),
            "age_40_plus_ratio": round(age_40_plus, 4),
            "age_distribution": {
                "age_0_9": round(age_0_9, 4),
                "age_10_19": round(age_10_19, 4),
                "age_20_29": round(age_20_29, 4),
                "age_30_39": round(age_30_39, 4),
                "age_40_49": round(age_40_49, 4),
                "age_50_59": round(age_50_59, 4),
                "age_60_plus": round(age_60_plus, 4),
            },
            "male_ratio": male_ratio,
            "female_ratio": round(1.0 - male_ratio, 2),
            "household_count": int(hh_count * scale),
            "single_household_ratio": single_hh_ratio,
            "avg_household_income": random.choice([450, 500, 550, 600, 650, 700, 750]),
            "floating_population_daily": floating,
            "floating_weekday_avg": int(floating * 1.08),
            "floating_weekend_avg": int(floating * 0.75),
            "floating_peak_hour": random.choice(["12:00-13:00", "13:00-14:00", "18:00-19:00"]),
            "medical_utilization_rate": round(0.72 + age_40_plus * 0.2, 2),
            "avg_annual_visits": round(15.0 + age_40_plus * 12.0, 1),
            "data_source": "mois_api",
            "data_ym": age_data.get("stats_ym", ""),
            "region_name": age_data.get("region_name", ""),
            "dong_population": total,
        }

    def _get_default_demographics(self) -> Dict[str, Any]:
        """안전한 기본값 (모든 API/추정 실패 시)"""
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
            "data_source": "default",
        }

    async def get_demographics(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 1000,
        stdg_cd: Optional[str] = None,
    ) -> Dict[str, Any]:
        """인구통계 데이터 — 행안부 실데이터 API 우선, 실패 시 좌표 추정 모델 폴백"""

        # 1) 행안부 API (API 키 + 법정동코드가 있을 때)
        if _get_mois_key() and stdg_cd:
            try:
                age_result, hh_result = await asyncio.gather(
                    self._get_mois_age_population(stdg_cd),
                    self._get_mois_household(stdg_cd),
                    return_exceptions=True,
                )

                age_data = age_result if isinstance(age_result, dict) else None
                hh_data = hh_result if isinstance(hh_result, dict) else None

                if age_data and age_data.get("total_population", 0) > 0:
                    logger.info(
                        f"Demographics from MOIS API: {age_data.get('region_name')} "
                        f"pop={age_data['total_population']}"
                    )
                    return self._build_demographics_from_mois(
                        age_data, hh_data, latitude, longitude, radius_m
                    )
                else:
                    logger.warning("MOIS API returned 0 population, falling back to estimation")
            except Exception as e:
                logger.warning(f"MOIS API failed, falling back to estimation: {e}")

        # 2) 폴백: 좌표 기반 추정 모델
        try:
            result = _estimate_demographics_from_coords(latitude, longitude, radius_m)
            result["female_ratio"] = round(1.0 - result["male_ratio"], 2)
            result["data_source"] = "estimation"
            return result
        except Exception as e:
            logger.error(f"Demographics estimation also failed: {e}")
            return self._get_default_demographics()

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
        clinic_type: Optional[str] = None,
        region_code: str = "",
    ) -> List[Dict[str, Any]]:
        """주변 병원 정보 + 매출 데이터 조회"""
        hospitals = await self.get_nearby_hospitals(
            latitude, longitude, radius_m, clinic_type, region_code=region_code
        )

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
