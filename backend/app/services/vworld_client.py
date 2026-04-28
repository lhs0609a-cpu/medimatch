"""
VWORLD (vworld.kr) 공간정보 클라이언트.
건물 메타데이터: 층수, 용도, 준공연도, 메디컬빌딩 여부 등.

학계: 입지보정계수의 핵심 변수 — 1층 vs 2층 매출 차이 ±30%,
메디컬빌딩 여부 ±15%.
"""
from typing import Dict, Optional, Any
import httpx
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)


# 의원 입지에 유리한 건물 용도 분류
MEDICAL_FRIENDLY_USES = {
    "근린생활시설", "의료시설", "업무시설", "복합건물", "판매시설"
}


class VWorldClient:
    """VWORLD 건물정보 API 클라이언트."""

    BASE_URL = "https://api.vworld.kr/req/data"

    def __init__(self):
        self.api_key = settings.VWORLD_API_KEY or ""

    async def get_building_info(
        self,
        latitude: float,
        longitude: float,
    ) -> Optional[Dict[str, Any]]:
        """
        좌표 기반 건물 정보 조회.

        Returns:
            {
                'building_name': str,
                'floors_above': int,
                'floors_below': int,
                'main_purpose': str,
                'built_year': int,
                'is_medical_building': bool,
                'is_first_floor_friendly': bool,
                'location_factor': float,  # 학계 입지 보정계수
            }
        """
        if not self.api_key:
            logger.debug("VWORLD: no API key configured — using fallback")
            return self._fallback_building_info(latitude, longitude)

        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "service": "data",
                    "request": "GetFeature",
                    "data": "LT_C_SPBD_BULDINFO",
                    "key": self.api_key,
                    "domain": "medi.brandplaton.com",
                    "geomFilter": f"POINT({longitude} {latitude})",
                    "size": "1",
                    "format": "json",
                    "geometry": "false",
                }

                response = await client.get(
                    self.BASE_URL,
                    params=params,
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()

                features = (
                    data.get("response", {})
                    .get("result", {})
                    .get("featureCollection", {})
                    .get("features", [])
                )
                if not features:
                    return self._fallback_building_info(latitude, longitude)

                props = features[0].get("properties", {})

                floors_above = int(props.get("gro_flo_co", 0) or 0)
                floors_below = int(props.get("ug_flo_co", 0) or 0)
                main_purpose = props.get("main_purps_cd_nm", "") or ""
                built_year_raw = props.get("use_appr_day", "") or ""

                try:
                    built_year = int(built_year_raw[:4]) if len(built_year_raw) >= 4 else 0
                except ValueError:
                    built_year = 0

                is_medical_building = (
                    "의료" in main_purpose
                    or floors_above >= 5 and any(u in main_purpose for u in MEDICAL_FRIENDLY_USES)
                )
                # 1~2층 = 의원 운영에 유리
                is_first_floor_friendly = floors_above >= 1

                # 학계 입지 보정계수 산출
                factor = 1.0
                if is_medical_building:
                    factor *= 1.15
                if floors_above >= 5:
                    factor *= 1.05
                if built_year and built_year >= 2010:
                    factor *= 1.03  # 신축 +3%
                elif built_year and built_year < 1990:
                    factor *= 0.92  # 노후 -8%

                return {
                    "building_name": props.get("bld_nm", ""),
                    "floors_above": floors_above,
                    "floors_below": floors_below,
                    "main_purpose": main_purpose,
                    "built_year": built_year,
                    "is_medical_building": is_medical_building,
                    "is_first_floor_friendly": is_first_floor_friendly,
                    "location_factor": round(factor, 3),
                    "data_source": "VWORLD 건축물정보",
                }
        except Exception as e:
            logger.warning(f"VWORLD building info failed: {e}")
            return self._fallback_building_info(latitude, longitude)

    @staticmethod
    def _fallback_building_info(latitude: float, longitude: float) -> Dict[str, Any]:
        """API 실패 시 안전한 기본값."""
        return {
            "building_name": "",
            "floors_above": 0,
            "floors_below": 0,
            "main_purpose": "",
            "built_year": 0,
            "is_medical_building": False,
            "is_first_floor_friendly": True,
            "location_factor": 1.0,
            "data_source": "fallback",
        }


vworld_client = VWorldClient()
