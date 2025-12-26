"""
심평원 API 스키마 (건강보험심사평가원)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ClinicType(str, Enum):
    """진료과목"""
    INTERNAL = "내과"
    PEDIATRIC = "소아청소년과"
    PSYCHIATRY = "정신건강의학과"
    SURGERY = "외과"
    ORTHOPEDIC = "정형외과"
    NEUROSURGERY = "신경외과"
    CARDIOTHORACIC = "흉부외과"
    PLASTIC = "성형외과"
    ANESTHESIOLOGY = "마취통증의학과"
    OBGYN = "산부인과"
    OPHTHALMOLOGY = "안과"
    ENT = "이비인후과"
    DERMATOLOGY = "피부과"
    UROLOGY = "비뇨의학과"
    RADIOLOGY = "영상의학과"
    RADIATION_ONCOLOGY = "방사선종양학과"
    PATHOLOGY = "병리과"
    LABORATORY = "진단검사의학과"
    TUBERCULOSIS = "결핵과"
    REHABILITATION = "재활의학과"
    NUCLEAR_MEDICINE = "핵의학과"
    FAMILY_MEDICINE = "가정의학과"
    EMERGENCY = "응급의학과"
    OCCUPATIONAL = "직업환경의학과"
    PREVENTIVE = "예방의학과"
    DENTAL = "치과"
    ORIENTAL = "한방과"


class HospitalInfo(BaseModel):
    """병원 기본 정보"""
    ykiho: str = Field(..., description="요양기관번호")
    name: str = Field(..., description="병원명")
    address: str = Field(..., description="주소")
    phone: Optional[str] = Field(None, description="전화번호")
    clinic_type: str = Field(..., description="진료과목")
    latitude: float = Field(..., description="위도")
    longitude: float = Field(..., description="경도")
    established: Optional[str] = Field(None, description="개설일자 (YYYYMMDD)")
    doctors: int = Field(0, description="의사 수")
    beds: int = Field(0, description="병상 수")
    distance_m: Optional[int] = Field(None, description="거리 (미터)")


class HospitalBillingStats(BaseModel):
    """병원별 진료비 청구 통계"""
    ykiho: str = Field(..., description="요양기관번호")
    year_month: Optional[str] = Field(None, description="기준 연월")
    claim_count: int = Field(0, description="청구 건수")
    total_amount: int = Field(0, description="총 진료비")
    avg_per_claim: int = Field(0, description="건당 평균 진료비")
    patient_count: int = Field(0, description="환자 수")


class HospitalWithRevenue(HospitalInfo):
    """병원 정보 + 매출 데이터"""
    billing_data: Optional[HospitalBillingStats] = None
    est_monthly_revenue: int = Field(0, description="추정 월 매출")
    claim_count: int = Field(0, description="청구 건수")
    patient_count: int = Field(0, description="환자 수")


class ClinicTypeStats(BaseModel):
    """지역/진료과별 통계"""
    region_code: str = Field(..., description="지역 코드")
    clinic_type: str = Field(..., description="진료과목")
    avg_monthly_revenue: int = Field(0, description="평균 월 매출")
    avg_claim_count: int = Field(0, description="평균 청구 건수")
    avg_per_claim: int = Field(0, description="평균 건당 진료비")
    total_clinics: int = Field(0, description="총 병원 수")
    is_default: bool = Field(False, description="기본 통계 데이터 여부")


class PharmacyInfo(BaseModel):
    """약국 정보"""
    ykiho: str = Field(..., description="요양기관번호")
    name: str = Field(..., description="약국명")
    address: str = Field(..., description="주소")
    phone: Optional[str] = Field(None, description="전화번호")
    latitude: float = Field(..., description="위도")
    longitude: float = Field(..., description="경도")
    established: Optional[str] = Field(None, description="개설일자 (YYYYMMDD)")
    pharmacists: int = Field(0, description="약사 수")
    distance_m: Optional[int] = Field(None, description="거리 (미터)")


class PharmacyBillingStats(BaseModel):
    """약국별 처방 통계"""
    ykiho: str = Field(..., description="요양기관번호")
    year_month: Optional[str] = Field(None, description="기준 연월")
    rx_count: int = Field(0, description="처방전 건수")
    total_amount: int = Field(0, description="총 조제료")
    avg_per_rx: int = Field(0, description="처방전당 평균 조제료")


class PharmacyWithStats(PharmacyInfo):
    """약국 정보 + 통계"""
    billing_data: Optional[PharmacyBillingStats] = None
    est_monthly_revenue: int = Field(0, description="추정 월 매출")
    nearby_hospitals: List[str] = Field(default_factory=list, description="인근 병원 진료과목")
    nearby_hospital_count: int = Field(0, description="인근 병원 수")


# Request/Response 스키마
class NearbyHospitalsRequest(BaseModel):
    """주변 병원 검색 요청"""
    latitude: float = Field(..., description="위도")
    longitude: float = Field(..., description="경도")
    radius_m: int = Field(1000, ge=100, le=5000, description="검색 반경 (미터)")
    clinic_type: Optional[str] = Field(None, description="진료과목 필터")
    include_revenue: bool = Field(False, description="매출 데이터 포함 여부")


class NearbyHospitalsResponse(BaseModel):
    """주변 병원 검색 응답"""
    items: List[HospitalWithRevenue]
    total: int
    center: dict = Field(..., description="검색 중심점")
    radius_m: int


class NearbyPharmaciesRequest(BaseModel):
    """주변 약국 검색 요청"""
    latitude: float = Field(..., description="위도")
    longitude: float = Field(..., description="경도")
    radius_m: int = Field(500, ge=100, le=3000, description="검색 반경 (미터)")
    include_stats: bool = Field(False, description="통계 데이터 포함 여부")


class NearbyPharmaciesResponse(BaseModel):
    """주변 약국 검색 응답"""
    items: List[PharmacyWithStats]
    total: int
    center: dict
    radius_m: int


class HospitalSearchRequest(BaseModel):
    """병원 검색 요청 (지역 기반)"""
    sido_code: str = Field(..., description="시도 코드 (예: 110000 서울)")
    sggu_code: Optional[str] = Field(None, description="시군구 코드")
    clinic_type: Optional[str] = Field(None, description="진료과목 필터")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class HospitalSearchResponse(BaseModel):
    """병원 검색 응답"""
    items: List[HospitalInfo]
    total: int
    page: int
    page_size: int


class RegionStatsRequest(BaseModel):
    """지역 통계 요청"""
    region_code: str = Field(..., description="지역 코드")
    clinic_type: str = Field(..., description="진료과목")


class RegionStatsResponse(BaseModel):
    """지역 통계 응답"""
    stats: ClinicTypeStats
    comparison: Optional[dict] = Field(None, description="전국 평균 대비")
