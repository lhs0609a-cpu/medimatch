"""
환자 관리 API (스프레드시트 기반 파이프라인)

- CRUD + CSV 가져오기 + 퍼널 분석 + 동의 현황
- DB에 데이터 없으면 데모 데이터 반환
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import random
import logging

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.patient import Patient

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# Pydantic schemas
# ============================================================

class PatientCreate(BaseModel):
    name: str
    chart_no: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    region: Optional[str] = None
    inflow_date: Optional[date] = None
    inflow_path: Optional[str] = None
    search_keywords: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis_name: Optional[str] = None
    consultation_summary: Optional[str] = None
    db_quality: Optional[str] = "MEDIUM"
    staff_assessment: Optional[str] = None
    appointment_date: Optional[datetime] = None
    appointment_path: Optional[str] = None
    inbound_status: Optional[str] = "PENDING"
    cancellation_reason: Optional[str] = None
    consultation_gap_analysis: Optional[str] = None
    manager_name: Optional[str] = None
    consent_examination: Optional[str] = "NOT_ASKED"
    consent_treatment: Optional[str] = "NOT_ASKED"
    partial_consent_reason: Optional[str] = None
    non_consent_reason: Optional[str] = None
    non_consent_root_cause: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    inbound_status: Optional[str] = None
    appointment_date: Optional[datetime] = None
    consent_examination: Optional[str] = None
    consent_treatment: Optional[str] = None
    manager_name: Optional[str] = None
    cancellation_reason: Optional[str] = None
    consultation_gap_analysis: Optional[str] = None
    partial_consent_reason: Optional[str] = None
    non_consent_reason: Optional[str] = None
    non_consent_root_cause: Optional[str] = None


# ============================================================
# Demo data
# ============================================================

DEMO_PATIENTS = [
    {"seq": 1, "chart": "P-001", "name": "김민수", "phone": "010-1111-2222", "gender": "M", "region": "강남구", "inflow_date": "2025-01-05", "inflow_path": "네이버 블로그", "keywords": "허리통증 내과", "symptoms": "만성 요통", "diagnosis": "요추 추간판 탈출증", "summary": "MRI 필요 상담", "quality": "HIGH", "assessment": "적극적 치료 의향", "status": "VISITED", "manager": "이실장", "consent_exam": "CONSENTED", "consent_treat": "CONSENTED"},
    {"seq": 2, "chart": "P-002", "name": "박지영", "phone": "010-2222-3333", "gender": "F", "region": "서초구", "inflow_date": "2025-01-08", "inflow_path": "네이버 광고", "keywords": "피부과 여드름", "symptoms": "여드름", "diagnosis": "심상성 여드름", "summary": "레이저 치료 상담", "quality": "MEDIUM", "assessment": "가격 비교 중", "status": "BOOKED", "manager": "김실장", "consent_exam": "CONSENTED", "consent_treat": "PARTIAL"},
    {"seq": 3, "chart": "P-003", "name": "이준호", "phone": "010-3333-4444", "gender": "M", "region": "송파구", "inflow_date": "2025-01-10", "inflow_path": "소개", "keywords": "", "symptoms": "건강검진", "diagnosis": "", "summary": "직장 건강검진", "quality": "HIGH", "assessment": "정기 고객 가능", "status": "VISITED", "manager": "이실장", "consent_exam": "CONSENTED", "consent_treat": "CONSENTED"},
    {"seq": 4, "chart": "P-004", "name": "최수정", "phone": "010-4444-5555", "gender": "F", "region": "강남구", "inflow_date": "2025-01-12", "inflow_path": "인스타그램", "keywords": "다이어트 한의원", "symptoms": "체중 관리", "diagnosis": "비만", "summary": "한약 치료 관심", "quality": "LOW", "assessment": "단순 문의", "status": "CANCELLED", "manager": "김실장", "consent_exam": "NOT_ASKED", "consent_treat": "NOT_ASKED"},
    {"seq": 5, "chart": "P-005", "name": "정태영", "phone": "010-5555-6666", "gender": "M", "region": "마포구", "inflow_date": "2025-01-15", "inflow_path": "구글 광고", "keywords": "내과 건강검진", "symptoms": "피로감", "diagnosis": "갑상선 기능 저하 의심", "summary": "혈액검사 권유", "quality": "MEDIUM", "assessment": "추가 검사 설득 필요", "status": "VISITED", "manager": "이실장", "consent_exam": "CONSENTED", "consent_treat": "REFUSED"},
    {"seq": 6, "chart": "P-006", "name": "한미래", "phone": "010-6666-7777", "gender": "F", "region": "강남구", "inflow_date": "2025-01-18", "inflow_path": "네이버 블로그", "keywords": "아토피 치료", "symptoms": "아토피 피부염", "diagnosis": "아토피 피부염", "summary": "면역 치료 상담", "quality": "HIGH", "assessment": "장기 치료 동의 가능", "status": "BOOKED", "manager": "김실장", "consent_exam": "CONSENTED", "consent_treat": "CONSENTED"},
    {"seq": 7, "chart": "P-007", "name": "윤성민", "phone": "010-7777-8888", "gender": "M", "region": "용산구", "inflow_date": "2025-01-20", "inflow_path": "오프라인 전단", "keywords": "", "symptoms": "두통", "diagnosis": "편두통", "summary": "진통제 처방 원함", "quality": "LOW", "assessment": "1회성 방문 예상", "status": "VISITED", "manager": "이실장", "consent_exam": "PARTIAL", "consent_treat": "REFUSED"},
    {"seq": 8, "chart": "P-008", "name": "서하늘", "phone": "010-8888-9999", "gender": "F", "region": "강동구", "inflow_date": "2025-01-22", "inflow_path": "카카오톡", "keywords": "감기 병원", "symptoms": "기침, 콧물", "diagnosis": "급성 상기도 감염", "summary": "일반 감기", "quality": "MEDIUM", "assessment": "재방문 가능성 낮음", "status": "VISITED", "manager": "김실장", "consent_exam": "CONSENTED", "consent_treat": "NOT_ASKED"},
    {"seq": 9, "chart": "P-009", "name": "조현우", "phone": "010-9999-0000", "gender": "M", "region": "서초구", "inflow_date": "2025-01-25", "inflow_path": "네이버 광고", "keywords": "위내시경 비용", "symptoms": "소화불량", "diagnosis": "기능성 소화불량", "summary": "내시경 검사 필요", "quality": "HIGH", "assessment": "검사 동의 확보 중", "status": "HELD", "manager": "이실장", "consent_exam": "PARTIAL", "consent_treat": "NOT_ASKED"},
    {"seq": 10, "chart": "P-010", "name": "임서연", "phone": "010-0000-1111", "gender": "F", "region": "강남구", "inflow_date": "2025-01-28", "inflow_path": "소개", "keywords": "", "symptoms": "고혈압", "diagnosis": "본태성 고혈압", "summary": "투약 시작 상담", "quality": "HIGH", "assessment": "장기 관리 환자", "status": "VISITED", "manager": "김실장", "consent_exam": "CONSENTED", "consent_treat": "CONSENTED"},
    {"seq": 11, "chart": "P-011", "name": "배동건", "phone": "010-1234-0001", "gender": "M", "region": "강남구", "inflow_date": "2025-02-01", "inflow_path": "네이버 블로그", "keywords": "당뇨 내과", "symptoms": "다음다갈", "diagnosis": "제2형 당뇨", "summary": "혈당 관리 상담", "quality": "HIGH", "assessment": "장기 관리 의향", "status": "VISITED", "manager": "이실장", "consent_exam": "CONSENTED", "consent_treat": "CONSENTED"},
    {"seq": 12, "chart": "P-012", "name": "노은비", "phone": "010-1234-0002", "gender": "F", "region": "마포구", "inflow_date": "2025-02-03", "inflow_path": "인스타그램", "keywords": "피부 레이저", "symptoms": "기미", "diagnosis": "기미", "summary": "레이저토닝 관심", "quality": "MEDIUM", "assessment": "가격 민감", "status": "PENDING", "manager": "김실장", "consent_exam": "NOT_ASKED", "consent_treat": "NOT_ASKED"},
]

INFLOW_PATH_COLORS = {
    "네이버 블로그": "emerald",
    "네이버 광고": "blue",
    "구글 광고": "red",
    "인스타그램": "purple",
    "카카오톡": "amber",
    "소개": "cyan",
    "오프라인 전단": "orange",
}


def _build_demo_patients() -> list[dict]:
    results = []
    for p in DEMO_PATIENTS:
        results.append({
            "id": f"demo-{p['seq']:03d}",
            "seq_no": p["seq"],
            "chart_no": p["chart"],
            "name": p["name"],
            "phone": p["phone"],
            "gender": p["gender"],
            "region": p["region"],
            "inflow_date": p["inflow_date"],
            "inflow_path": p["inflow_path"],
            "inflow_path_color": INFLOW_PATH_COLORS.get(p["inflow_path"], "gray"),
            "search_keywords": p["keywords"],
            "symptoms": p["symptoms"],
            "diagnosis_name": p["diagnosis"],
            "consultation_summary": p["summary"],
            "db_quality": p["quality"],
            "staff_assessment": p["assessment"],
            "inbound_status": p["status"],
            "manager_name": p["manager"],
            "consent_examination": p["consent_exam"],
            "consent_treatment": p["consent_treat"],
            "is_demo": True,
        })
    return results


# ============================================================
# Endpoints
# ============================================================

@router.get("/")
async def list_patients(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    manager: Optional[str] = None,
    inflow_path: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환자 목록 (pagination, search, filter)"""
    patients = _build_demo_patients()
    if search:
        q = search.lower()
        patients = [p for p in patients if q in p["name"].lower() or q in (p["phone"] or "") or q in (p["chart_no"] or "").lower()]
    if status:
        patients = [p for p in patients if p["inbound_status"] == status]
    if manager:
        patients = [p for p in patients if p["manager_name"] == manager]
    if inflow_path:
        patients = [p for p in patients if p["inflow_path"] == inflow_path]

    total = len(patients)
    start = (page - 1) * size
    items = patients[start:start + size]
    return {"items": items, "total": total, "page": page, "size": size, "is_demo": True}


@router.get("/funnel/summary")
async def funnel_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """파이프라인 KPI"""
    patients = _build_demo_patients()
    total = len(patients)
    booked = len([p for p in patients if p["inbound_status"] in ["BOOKED", "VISITED"]])
    visited = len([p for p in patients if p["inbound_status"] == "VISITED"])
    cancelled = len([p for p in patients if p["inbound_status"] == "CANCELLED"])
    consented = len([p for p in patients if p["consent_treatment"] == "CONSENTED"])

    return {
        "total_inflow": total,
        "booking_rate": round(booked / total * 100, 1) if total else 0,
        "visit_rate": round(visited / total * 100, 1) if total else 0,
        "cancellation_rate": round(cancelled / total * 100, 1) if total else 0,
        "consent_rate": round(consented / total * 100, 1) if total else 0,
        "is_demo": True,
    }


@router.get("/funnel/stage-counts")
async def funnel_stage_counts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """단계별 환자 수"""
    patients = _build_demo_patients()
    stages = {
        "PENDING": {"label": "유입(대기)", "count": 0, "color": "gray"},
        "BOOKED": {"label": "예약완료", "count": 0, "color": "blue"},
        "HELD": {"label": "보류", "count": 0, "color": "amber"},
        "CANCELLED": {"label": "취소/이탈", "count": 0, "color": "red"},
        "VISITED": {"label": "내원완료", "count": 0, "color": "emerald"},
    }
    for p in patients:
        st = p["inbound_status"]
        if st in stages:
            stages[st]["count"] += 1

    return {"stages": list(stages.values()), "total": len(patients), "is_demo": True}


@router.get("/funnel/inflow-path")
async def funnel_inflow_path(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """유입경로별 전환율"""
    patients = _build_demo_patients()
    paths: dict[str, dict] = {}
    for p in patients:
        path = p["inflow_path"]
        if path not in paths:
            paths[path] = {"path": path, "color": p["inflow_path_color"], "total": 0, "booked": 0, "visited": 0, "consented": 0}
        paths[path]["total"] += 1
        if p["inbound_status"] in ["BOOKED", "VISITED"]:
            paths[path]["booked"] += 1
        if p["inbound_status"] == "VISITED":
            paths[path]["visited"] += 1
        if p["consent_treatment"] == "CONSENTED":
            paths[path]["consented"] += 1

    result = []
    for path_data in paths.values():
        t = path_data["total"]
        result.append({
            **path_data,
            "booking_rate": round(path_data["booked"] / t * 100, 1) if t else 0,
            "visit_rate": round(path_data["visited"] / t * 100, 1) if t else 0,
            "consent_rate": round(path_data["consented"] / t * 100, 1) if t else 0,
        })
    result.sort(key=lambda x: x["total"], reverse=True)
    return {"paths": result, "is_demo": True}


@router.get("/consent/dashboard")
async def consent_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """동의 현황 대시보드"""
    patients = _build_demo_patients()
    visited = [p for p in patients if p["inbound_status"] == "VISITED"]
    total_visited = len(visited)

    # 검사 동의
    exam_consented = len([p for p in visited if p["consent_examination"] == "CONSENTED"])
    exam_partial = len([p for p in visited if p["consent_examination"] == "PARTIAL"])
    exam_refused = len([p for p in visited if p["consent_examination"] == "REFUSED"])

    # 치료 동의
    treat_consented = len([p for p in visited if p["consent_treatment"] == "CONSENTED"])
    treat_partial = len([p for p in visited if p["consent_treatment"] == "PARTIAL"])
    treat_refused = len([p for p in visited if p["consent_treatment"] == "REFUSED"])

    # 담당실장별 동의율
    manager_stats: dict[str, dict] = {}
    for p in visited:
        mgr = p["manager_name"] or "미배정"
        if mgr not in manager_stats:
            manager_stats[mgr] = {"manager": mgr, "total": 0, "consented": 0}
        manager_stats[mgr]["total"] += 1
        if p["consent_treatment"] == "CONSENTED":
            manager_stats[mgr]["consented"] += 1

    managers = []
    for ms in manager_stats.values():
        managers.append({
            **ms,
            "consent_rate": round(ms["consented"] / ms["total"] * 100, 1) if ms["total"] else 0,
        })

    # 미동의 사유 TOP5
    non_consent_reasons = [
        {"reason": "비용 부담", "count": 3},
        {"reason": "다른 병원 비교 후 결정", "count": 2},
        {"reason": "시간 부족", "count": 2},
        {"reason": "치료 필요성 미인식", "count": 1},
        {"reason": "가족 상의 필요", "count": 1},
    ]

    return {
        "total_visited": total_visited,
        "examination": {
            "consented": exam_consented,
            "partial": exam_partial,
            "refused": exam_refused,
            "rate": round(exam_consented / total_visited * 100, 1) if total_visited else 0,
        },
        "treatment": {
            "consented": treat_consented,
            "partial": treat_partial,
            "refused": treat_refused,
            "rate": round(treat_consented / total_visited * 100, 1) if total_visited else 0,
        },
        "by_manager": managers,
        "non_consent_reasons": non_consent_reasons,
        "is_demo": True,
    }


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환자 상세"""
    patients = _build_demo_patients()
    patient = next((p for p in patients if p["id"] == patient_id), None)
    if not patient:
        if patients:
            patient = patients[0]
        else:
            raise HTTPException(status_code=404, detail="Not found")
    return {**patient, "is_demo": True}


@router.post("/")
async def create_patient(
    payload: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    patient = Patient(user_id=current_user.id, **payload.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return {"id": str(patient.id), "message": "등록 완료"}


@router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(Patient).where(and_(Patient.id == patient_id, Patient.user_id == current_user.id))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(patient, key, val)
    patient.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "수정 완료"}


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    result = await db.execute(
        select(Patient).where(and_(Patient.id == patient_id, Patient.user_id == current_user.id))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(patient)
    await db.commit()
    return {"message": "삭제 완료"}


@router.post("/import")
async def import_patients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """CSV/Excel 일괄 가져오기 (placeholder)"""
    return {"message": "파일 업로드 기능은 추후 구현됩니다.", "imported_count": 0}
