"""
심평원 API 엔드포인트 (건강보험심사평가원)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from math import radians, sin, cos, sqrt, atan2

from ...services.external_api import external_api_service
from ...schemas.hira import (
    NearbyHospitalsRequest, NearbyHospitalsResponse,
    NearbyPharmaciesRequest, NearbyPharmaciesResponse,
    HospitalSearchRequest, HospitalSearchResponse,
    RegionStatsRequest, RegionStatsResponse,
    HospitalInfo, HospitalWithRevenue, PharmacyInfo, PharmacyWithStats,
    ClinicTypeStats, ClinicType
)
from ..deps import get_current_user_optional
from ...core.security import TokenData

router = APIRouter()


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """두 좌표 간 거리 계산 (미터)"""
    R = 6371000  # 지구 반경 (미터)

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return int(R * c)


@router.get("/hospitals/nearby", response_model=NearbyHospitalsResponse)
async def get_nearby_hospitals(
    latitude: float = Query(..., description="위도"),
    longitude: float = Query(..., description="경도"),
    radius_m: int = Query(1000, ge=100, le=5000, description="검색 반경 (미터)"),
    clinic_type: Optional[str] = Query(None, description="진료과목 필터"),
    include_revenue: bool = Query(False, description="매출 데이터 포함 여부"),
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    주변 병원 검색 (심평원 API)

    - 지정 좌표 반경 내 병원 목록 조회
    - 진료과목 필터링 가능
    - include_revenue=true 시 추정 매출 데이터 포함 (로그인 필요)
    """
    if include_revenue:
        hospitals = await external_api_service.get_nearby_hospitals_with_revenue(
            latitude=latitude,
            longitude=longitude,
            radius_m=radius_m,
            clinic_type=clinic_type
        )
    else:
        hospitals = await external_api_service.get_nearby_hospitals(
            latitude=latitude,
            longitude=longitude,
            radius_m=radius_m,
            clinic_type=clinic_type
        )

    # 거리 계산 및 정렬
    for h in hospitals:
        h["distance_m"] = calculate_distance(
            latitude, longitude,
            h.get("latitude", 0), h.get("longitude", 0)
        )

    hospitals = [h for h in hospitals if h["distance_m"] <= radius_m]
    hospitals.sort(key=lambda x: x["distance_m"])

    items = [HospitalWithRevenue(**h) for h in hospitals]

    return NearbyHospitalsResponse(
        items=items,
        total=len(items),
        center={"latitude": latitude, "longitude": longitude},
        radius_m=radius_m
    )


@router.get("/hospitals/search", response_model=HospitalSearchResponse)
async def search_hospitals(
    sido_code: str = Query(..., description="시도 코드 (예: 110000 서울)"),
    sggu_code: Optional[str] = Query(None, description="시군구 코드"),
    clinic_type: Optional[str] = Query(None, description="진료과목"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    지역별 병원 검색 (심평원 API)

    시도 코드:
    - 110000: 서울
    - 210000: 부산
    - 220000: 대구
    - 230000: 인천
    - 240000: 광주
    - 250000: 대전
    - 260000: 울산
    - 310000: 경기
    - 320000: 강원
    - 330000: 충북
    - 340000: 충남
    - 350000: 전북
    - 360000: 전남
    - 370000: 경북
    - 380000: 경남
    - 390000: 제주
    """
    # 외부 API 호출
    hospitals_raw = await external_api_service.get_hospitals_by_region(
        sido_code=sido_code,
        sggu_code=sggu_code,
        page_no=page,
        num_of_rows=page_size
    )

    # 진료과목 필터링
    if clinic_type:
        hospitals_raw = [
            h for h in hospitals_raw
            if clinic_type.lower() in h.get("clinic_type", "").lower()
        ]

    items = [HospitalInfo(**h) for h in hospitals_raw]

    return HospitalSearchResponse(
        items=items,
        total=len(items),  # 실제로는 API에서 total count 받아와야 함
        page=page,
        page_size=page_size
    )


@router.get("/hospitals/{ykiho}/billing", response_model=dict)
async def get_hospital_billing(
    ykiho: str,
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    병원별 진료비 청구 통계 조회

    - ykiho: 요양기관번호
    - 월별 청구건수, 총 진료비, 건당 평균 등
    """
    stats = await external_api_service.get_hospital_billing_stats(ykiho)

    if not stats:
        raise HTTPException(status_code=404, detail="Billing stats not found")

    return stats


@router.get("/stats/region", response_model=RegionStatsResponse)
async def get_region_stats(
    region_code: str = Query(..., description="지역 코드"),
    clinic_type: str = Query(..., description="진료과목"),
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    지역/진료과별 평균 통계

    해당 지역의 같은 진료과목 병원들의:
    - 평균 월 매출
    - 평균 청구 건수
    - 평균 건당 진료비
    - 총 병원 수
    """
    stats = await external_api_service.get_clinic_type_stats(region_code, clinic_type)

    # 전국 평균 대비 계산
    national_stats = await external_api_service.get_clinic_type_stats("", clinic_type)

    comparison = None
    if national_stats and stats:
        national_avg = national_stats.get("avg_monthly_revenue", 0)
        region_avg = stats.get("avg_monthly_revenue", 0)
        if national_avg > 0:
            comparison = {
                "vs_national_percent": round((region_avg / national_avg - 1) * 100, 1),
                "national_avg_revenue": national_avg,
                "region_rank": None  # 추후 구현
            }

    return RegionStatsResponse(
        stats=ClinicTypeStats(**stats),
        comparison=comparison
    )


@router.get("/pharmacies/nearby", response_model=NearbyPharmaciesResponse)
async def get_nearby_pharmacies(
    latitude: float = Query(..., description="위도"),
    longitude: float = Query(..., description="경도"),
    radius_m: int = Query(500, ge=100, le=3000, description="검색 반경 (미터)"),
    include_stats: bool = Query(False, description="통계 데이터 포함 여부"),
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    주변 약국 검색 (심평원 API)

    - 지정 좌표 반경 내 약국 목록 조회
    - include_stats=true 시 처방 통계 포함
    """
    pharmacies = await external_api_service.get_nearby_pharmacies(
        latitude=latitude,
        longitude=longitude,
        radius_m=radius_m
    )

    # 거리 계산 및 정렬
    for p in pharmacies:
        p["distance_m"] = calculate_distance(
            latitude, longitude,
            p.get("latitude", 0), p.get("longitude", 0)
        )

    pharmacies = [p for p in pharmacies if p["distance_m"] <= radius_m]
    pharmacies.sort(key=lambda x: x["distance_m"])

    if include_stats:
        # 각 약국의 인근 병원 정보 조회
        for pharmacy in pharmacies:
            nearby_hospitals = await external_api_service.get_nearby_hospitals(
                latitude=pharmacy.get("latitude", 0),
                longitude=pharmacy.get("longitude", 0),
                radius_m=200
            )
            pharmacy["nearby_hospitals"] = list(set(
                h.get("clinic_type", "") for h in nearby_hospitals if h.get("clinic_type")
            ))
            pharmacy["nearby_hospital_count"] = len(nearby_hospitals)

    items = [PharmacyWithStats(**p) for p in pharmacies]

    return NearbyPharmaciesResponse(
        items=items,
        total=len(items),
        center={"latitude": latitude, "longitude": longitude},
        radius_m=radius_m
    )


@router.get("/clinic-types", response_model=List[dict])
async def get_clinic_types():
    """
    진료과목 목록

    시뮬레이션 및 검색에 사용 가능한 진료과목 코드/명칭 목록
    """
    clinic_codes = {
        "01": "내과",
        "11": "소아청소년과",
        "03": "정신건강의학과",
        "04": "외과",
        "05": "정형외과",
        "06": "신경외과",
        "07": "흉부외과",
        "08": "성형외과",
        "09": "마취통증의학과",
        "10": "산부인과",
        "12": "안과",
        "13": "이비인후과",
        "14": "피부과",
        "15": "비뇨의학과",
        "16": "영상의학과",
        "17": "방사선종양학과",
        "18": "병리과",
        "19": "진단검사의학과",
        "20": "결핵과",
        "21": "재활의학과",
        "22": "핵의학과",
        "23": "가정의학과",
        "24": "응급의학과",
        "25": "직업환경의학과",
        "26": "예방의학과",
        "49": "치과",
        "80": "한방과",
    }

    return [
        {"code": code, "name": name}
        for code, name in clinic_codes.items()
    ]


@router.get("/region-codes", response_model=List[dict])
async def get_region_codes():
    """
    지역 코드 목록

    심평원 API에서 사용하는 시도/시군구 코드
    """
    regions = [
        {"sido_code": "110000", "name": "서울특별시"},
        {"sido_code": "210000", "name": "부산광역시"},
        {"sido_code": "220000", "name": "대구광역시"},
        {"sido_code": "230000", "name": "인천광역시"},
        {"sido_code": "240000", "name": "광주광역시"},
        {"sido_code": "250000", "name": "대전광역시"},
        {"sido_code": "260000", "name": "울산광역시"},
        {"sido_code": "290000", "name": "세종특별자치시"},
        {"sido_code": "310000", "name": "경기도"},
        {"sido_code": "320000", "name": "강원특별자치도"},
        {"sido_code": "330000", "name": "충청북도"},
        {"sido_code": "340000", "name": "충청남도"},
        {"sido_code": "350000", "name": "전북특별자치도"},
        {"sido_code": "360000", "name": "전라남도"},
        {"sido_code": "370000", "name": "경상북도"},
        {"sido_code": "380000", "name": "경상남도"},
        {"sido_code": "390000", "name": "제주특별자치도"},
    ]

    return regions
