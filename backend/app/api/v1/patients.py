"""
환자 관리 API (스프레드시트 기반 파이프라인)

- CRUD + CSV 가져오기 + 퍼널 분석 + 동의 현황
- 현재 계정의 저장된 데이터만 반환
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import json
import logging
import uuid

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.patient import Patient
from ...services.emr_import import (
    parse_file, auto_map, apply_mapping, MappedRow,
)

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

def _serialize_patient(patient):
    """One representation for list/detail, including intake and consent fields."""
    result = {}
    for column in Patient.__table__.columns:
        if column.name in {"user_id", "clinic_id"}:
            continue
        value = getattr(patient, column.name)
        if isinstance(value, (datetime, date)):
            value = value.isoformat()
        elif isinstance(value, uuid.UUID):
            value = str(value)
        elif hasattr(value, "value"):
            value = value.value
        result[column.name] = value
    return {**result, "inflow_path_color": "blue", "is_demo": False}


async def _patient_analytics(db, user_id):
    rows = (await db.execute(select(Patient).where(Patient.user_id == user_id))).scalars().all()
    def value(v):
        return v.value if hasattr(v, "value") else v
    return [{
        "inbound_status": value(p.inbound_status),
        "consent_examination": value(p.consent_examination),
        "consent_treatment": value(p.consent_treatment),
        "inflow_path": p.inflow_path or "-",
        "inflow_path_color": "blue",
        "manager_name": p.manager_name,
        "non_consent_reason": p.non_consent_reason,
    } for p in rows]

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
    """환자 목록 (pagination, search, filter). 빈 검색 결과는 빈 목록."""
    # 실 DB 조회
    q_db = select(Patient).where(Patient.user_id == current_user.id)
    if search:
        like = f"%{search}%"
        q_db = q_db.where(or_(
            Patient.name.ilike(like),
            Patient.phone.ilike(like),
            Patient.chart_no.ilike(like),
        ))
    if status:
        q_db = q_db.where(Patient.inbound_status == status)
    if manager:
        q_db = q_db.where(Patient.manager_name == manager)
    if inflow_path:
        q_db = q_db.where(Patient.inflow_path == inflow_path)

    total_db = (await db.execute(
        select(func.count()).select_from(q_db.subquery())
    )).scalar() or 0

    if total_db > 0:
        rows = (await db.execute(
            q_db.order_by(Patient.created_at.desc())
                .offset((page - 1) * size).limit(size)
        )).scalars().all()
        items = [_serialize_patient(p) for p in rows]
        return {"items": items, "total": total_db, "page": page, "size": size, "is_demo": False}

    # 검색 결과에 가상 환자를 섞지 않는다.
    return {"items": [], "total": 0, "page": page, "size": size, "is_demo": False}


@router.get("/funnel/summary")
async def funnel_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """파이프라인 KPI"""
    patients = await _patient_analytics(db, current_user.id)
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
        "is_demo": False,
    }


@router.get("/funnel/stage-counts")
async def funnel_stage_counts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """단계별 환자 수"""
    patients = await _patient_analytics(db, current_user.id)
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

    return {"stages": list(stages.values()), "total": len(patients), "is_demo": False}


@router.get("/funnel/inflow-path")
async def funnel_inflow_path(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """유입경로별 전환율"""
    patients = await _patient_analytics(db, current_user.id)
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
    return {"paths": result, "is_demo": False}


@router.get("/consent/dashboard")
async def consent_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """동의 현황 대시보드"""
    patients = await _patient_analytics(db, current_user.id)
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
    from collections import Counter
    reason_counts = Counter(p["non_consent_reason"] for p in visited if p.get("non_consent_reason"))
    non_consent_reasons = [{"reason": reason, "count": count} for reason, count in reason_counts.most_common(5)]

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
        "is_demo": False,
    }


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """환자 상세 — 현재 계정 소유 환자만 조회."""
    # UUID 형식이면 DB 조회
    try:
        from uuid import UUID
        pid = UUID(patient_id)
        row = (await db.execute(
            select(Patient).where(and_(
                Patient.id == pid, Patient.user_id == current_user.id,
            ))
        )).scalar_one_or_none()
        if row:
            return _serialize_patient(row)
    except (ValueError, TypeError):
        pass

    # 없는 ID를 다른 환자로 대체하지 않는다.
    raise HTTPException(status_code=404, detail="Patient not found")


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


# ============================================================
# 임포트 — 어떤 CSV/엑셀이든 자동 매핑 + 정규화
# ============================================================

@router.get("/import/template.xlsx")
async def import_template():
    """표준 임포트 템플릿 — 한국 EMR 호환 컬럼명 + 안내 행."""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from fastapi.responses import StreamingResponse
    import io as _io

    wb = Workbook()
    ws = wb.active
    ws.title = "환자목록"

    headers = [
        "차트번호", "이름", "성별", "생년월일", "전화번호", "지역",
        "유입일", "유입경로", "검색키워드", "주증상", "진단명",
        "상담요약", "DB등급", "실무자판단",
        "예약일", "예약경로", "내원상태", "취소사유",
        "담당실장", "검사동의", "치료동의",
    ]
    examples = [
        "A-001", "김환자", "남", "1985-03-15", "010-1234-5678", "서울 강남구",
        "2026-05-10", "네이버 광고", "허리통증 강남내과", "만성 요통", "요추 추간판 탈출증",
        "MRI 권유", "상", "적극 치료 의향",
        "2026-05-15 10:00", "전화", "예약", "",
        "이실장", "동의", "동의",
    ]
    note_row = [
        "필수: 이름 + (전화 또는 차트번호) — 둘 중 하나는 있어야 등록됩니다.",
        "", "M/F 또는 남/여 OK", "주민번호 앞자리도 자동 인식", "010 없어도 11자리 OK", "",
        "다양한 형식 OK (2026.05.10, 2026/5/10, 2026년 5월 10일)", "", "", "", "",
        "", "상/중/하 또는 H/M/L", "",
        "", "", "예약/대기/내원/취소 등", "",
        "", "동의/예/Y/거부/N 등", "동의/예/Y/거부/N 등",
    ]

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    note_font = Font(italic=True, color="6B7280", size=9)
    center = Alignment(horizontal="center", vertical="center")

    for col, h in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center

    for col, v in enumerate(examples, start=1):
        ws.cell(row=2, column=col, value=v)

    for col, v in enumerate(note_row, start=1):
        cell = ws.cell(row=3, column=col, value=v)
        cell.font = note_font

    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col) if col <= 26 else "A" + chr(64 + col - 26)].width = 18

    ws.cell(row=5, column=1, value="※ 알림톡 수신 동의는 정통망법/PIPA에 따라 사람이 직접 받은 동의만 인정합니다.")
    ws.cell(row=5, column=1).font = Font(italic=True, color="DC2626", size=9)
    ws.cell(row=6, column=1, value="※ 임포트 후 알림톡 동의는 모두 '미확인'으로 들어가며, 별도 화면에서 일괄 수정 가능합니다.")
    ws.cell(row=6, column=1).font = Font(italic=True, color="DC2626", size=9)
    ws.cell(row=7, column=1, value="※ 위 컬럼명을 그대로 쓰지 않아도 됩니다 — 시스템이 자동으로 매핑합니다.")
    ws.cell(row=7, column=1).font = Font(italic=True, color="6B7280", size=9)

    buf = _io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="medimatch_patients_template.xlsx"'},
    )




# 베타 안전 한도 (2000명 가드와 정합)
_IMPORT_MAX_ROWS_PER_FILE = 5000   # 파서 자체 한도
_IMPORT_MAX_ROWS_PER_BATCH = 2000  # 한 번에 커밋 가능한 최대
_IMPORT_MAX_FILE_BYTES = 20 * 1024 * 1024  # 20 MB
_ALLOWED_EXTS = (".csv", ".tsv", ".txt", ".xlsx", ".xls", ".xlsm")


def _ext_ok(filename: str) -> bool:
    n = (filename or "").lower()
    return any(n.endswith(e) for e in _ALLOWED_EXTS)


async def _read_upload(file: UploadFile) -> bytes:
    raw = await file.read()
    if len(raw) > _IMPORT_MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"파일이 너무 큽니다 (최대 {_IMPORT_MAX_FILE_BYTES // 1024 // 1024}MB)",
        )
    return raw


def _row_to_preview(row: MappedRow) -> dict:
    """직렬화 가능한 형태로 변환 (date/datetime → ISO 문자열)."""
    out = {}
    for k, v in row.fields.items():
        if isinstance(v, (date, datetime)):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return {
        "fields": out,
        "external_meta_keys": list(row.external_meta.keys()),
        "issues": row.issues,
        "valid": row.is_valid(),
    }


@router.post("/import/preview")
async def import_preview(
    file: UploadFile = File(...),
    manual_mapping: Optional[str] = Form(default=None),  # JSON: {"원본헤더": "canonical"}
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """업로드 → 자동 매핑 결과 + 처음 20행 미리보기 (실제 저장 X).

    프런트는 이 결과로 매핑 화면을 그리고, 사용자가 수정한 매핑을 다음 호출에 전달.
    """
    if not _ext_ok(file.filename or ""):
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 형식입니다. 가능: {', '.join(_ALLOWED_EXTS)}",
        )
    raw = await _read_upload(file)

    parsed = parse_file(file.filename or "upload", raw, max_rows=_IMPORT_MAX_ROWS_PER_FILE)
    if not parsed.headers:
        raise HTTPException(
            status_code=400,
            detail=parsed.warnings[0] if parsed.warnings else "파일을 읽지 못했습니다.",
        )

    manual = None
    if manual_mapping:
        try:
            manual = json.loads(manual_mapping)
            if not isinstance(manual, dict):
                raise ValueError("dict 형식이어야 합니다.")
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"manual_mapping JSON 오류: {e}")

    plan = auto_map(parsed.headers, parsed.rows[:200], manual_mapping=manual)
    mapped = apply_mapping(plan, parsed.rows[:20])

    return {
        "filename": file.filename,
        "encoding": parsed.encoding_used,
        "sheet": parsed.sheet_used,
        "warnings": parsed.warnings,
        "total_rows": len(parsed.rows),
        "preview_rows": [_row_to_preview(r) for r in mapped],
        "mapping": plan.mapping,
        "confidence": plan.confidence,
        "unmapped_headers": plan.unmapped_headers,
        "detected_emr": plan.detected_emr,
        "notes": plan.notes,
        "valid_count_in_preview": sum(1 for r in mapped if r.is_valid()),
    }


@router.post("/import")
async def import_patients(
    file: UploadFile = File(...),
    manual_mapping: Optional[str] = Form(default=None),
    source_emr: str = Form(default="manual_csv"),
    skip_duplicates: bool = Form(default=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """CSV/엑셀 → 환자 일괄 등록.

    안전 가드:
    - 한 파일 최대 _IMPORT_MAX_ROWS_PER_BATCH 행
    - 알림톡 동의는 무조건 NOT_ASKED (CSV 신뢰 X — 정통망법/PIPA)
    - (user_id, source_emr, external_id) unique — 같은 출처 중복 자동 skip
    - 행 단위 정규화 실패는 skip하고 리포트, 트랜잭션은 통째 커밋
    """
    if not _ext_ok(file.filename or ""):
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 형식입니다. 가능: {', '.join(_ALLOWED_EXTS)}",
        )
    raw = await _read_upload(file)

    parsed = parse_file(file.filename or "upload", raw, max_rows=_IMPORT_MAX_ROWS_PER_FILE)
    if not parsed.headers:
        raise HTTPException(
            status_code=400,
            detail=parsed.warnings[0] if parsed.warnings else "파일을 읽지 못했습니다.",
        )
    if len(parsed.rows) > _IMPORT_MAX_ROWS_PER_BATCH:
        raise HTTPException(
            status_code=400,
            detail=f"한 번에 최대 {_IMPORT_MAX_ROWS_PER_BATCH}명까지 임포트할 수 있습니다. "
                   f"파일을 나눠서 올려주세요.",
        )

    manual = None
    if manual_mapping:
        try:
            manual = json.loads(manual_mapping)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"manual_mapping JSON 오류: {e}")

    plan = auto_map(parsed.headers, parsed.rows[:200], manual_mapping=manual)
    mapped_rows = apply_mapping(plan, parsed.rows)

    batch_id = uuid.uuid4()
    now = datetime.utcnow()

    # 같은 출처에서 이미 가져온 external_id 미리 조회 (중복 검출용)
    existing_ext_ids: set[str] = set()
    if skip_duplicates:
        ext_ids_in_file = [
            r.fields.get("external_id") for r in mapped_rows
            if r.fields.get("external_id")
        ]
        if ext_ids_in_file:
            res = await db.execute(
                select(Patient.external_id).where(and_(
                    Patient.user_id == current_user.id,
                    Patient.source_emr == source_emr,
                    Patient.external_id.in_(ext_ids_in_file),
                ))
            )
            existing_ext_ids = {row[0] for row in res.all()}

    inserted = 0
    skipped_invalid = 0
    skipped_duplicate = 0
    issues: list[dict] = []

    for idx, mr in enumerate(mapped_rows, start=2):  # 2부터 = 헤더 다음 줄번호
        if not mr.is_valid():
            skipped_invalid += 1
            if len(issues) < 50:
                issues.append({"row": idx, "kind": "invalid", "detail": mr.issues})
            continue

        ext_id = mr.fields.get("external_id")
        if skip_duplicates and ext_id and ext_id in existing_ext_ids:
            skipped_duplicate += 1
            if len(issues) < 50:
                issues.append({"row": idx, "kind": "duplicate", "external_id": ext_id})
            continue

        # external_id가 같은 파일 내 중복 → 두 번째부터 skip
        if ext_id and ext_id in existing_ext_ids:
            skipped_duplicate += 1
            continue

        patient = Patient(
            user_id=current_user.id,
            source_emr=source_emr,
            external_id=ext_id,
            external_meta=mr.external_meta or None,
            import_batch_id=batch_id,
            imported_at=now,
            **{k: v for k, v in mr.fields.items() if k != "external_id"},
        )
        db.add(patient)
        inserted += 1
        if ext_id:
            existing_ext_ids.add(ext_id)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.exception("환자 임포트 커밋 실패")
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {e}")

    return {
        "batch_id": str(batch_id),
        "imported_count": inserted,
        "skipped_invalid": skipped_invalid,
        "skipped_duplicate": skipped_duplicate,
        "total_in_file": len(parsed.rows),
        "source_emr": source_emr,
        "mapping": plan.mapping,
        "unmapped_headers": plan.unmapped_headers,
        "issues": issues,
        "warnings": parsed.warnings,
        "notes": plan.notes,
        "message": f"{inserted}명 임포트 완료 (중복 {skipped_duplicate}, 불완전 {skipped_invalid})",
    }


@router.post("/import/rollback/{batch_id}")
async def rollback_import_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """배치 단위 롤백 — soft delete (의료법 5년 보존). 이번 임포트가 잘못됐을 때 즉시 되돌림."""
    try:
        bid = uuid.UUID(batch_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 batch_id")

    res = await db.execute(
        select(Patient).where(and_(
            Patient.user_id == current_user.id,
            Patient.import_batch_id == bid,
            Patient.deleted_at.is_(None),
        ))
    )
    targets = res.scalars().all()
    now = datetime.utcnow()
    for p in targets:
        p.deleted_at = now
    await db.commit()
    return {"rolled_back": len(targets), "batch_id": batch_id}
