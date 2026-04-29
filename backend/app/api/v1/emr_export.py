"""EMR 데이터 CSV 내보내기 — 환자·진료·청구·처방"""
import csv
import io
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.patient import Patient
from ...models.visit import Visit
from ...models.bill import Bill
from ...models.prescription import Prescription

router = APIRouter()


def _csv_response(rows: list, fieldnames: list, filename_kr: str) -> StreamingResponse:
    """UTF-8 BOM + CSV 스트리밍. 한글 파일명은 RFC 6266 형식."""
    from urllib.parse import quote
    buf = io.StringIO()
    buf.write('\ufeff')  # Excel UTF-8 인식용 BOM
    writer = csv.DictWriter(buf, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow({k: r.get(k, '') for k in fieldnames})
    buf.seek(0)
    today = datetime.now().strftime('%Y%m%d')
    filename = f"{filename_kr}_{today}.csv"
    encoded = quote(filename)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename_kr}.csv"; filename*=UTF-8\'\'{encoded}',
        },
    )


@router.get("/patients.csv")
async def export_patients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """환자 전체 CSV 내보내기."""
    rows = (await db.execute(
        select(Patient).where(Patient.user_id == current_user.id)
        .order_by(Patient.created_at.desc())
    )).scalars().all()

    data = []
    for p in rows:
        data.append({
            "차트번호": p.chart_no or "",
            "이름": p.name,
            "성별": p.gender or "",
            "생년월일": p.birth_date.isoformat() if p.birth_date else "",
            "전화": p.phone or "",
            "지역": p.region or "",
            "유입일": p.inflow_date.isoformat() if p.inflow_date else "",
            "유입경로": p.inflow_path or "",
            "증상": p.symptoms or "",
            "진단명": p.diagnosis_name or "",
            "예약일": p.appointment_date.isoformat() if p.appointment_date else "",
            "상태": p.inbound_status.value if p.inbound_status else "",
            "담당실장": p.manager_name or "",
            "등록일": p.created_at.isoformat() if p.created_at else "",
        })
    return _csv_response(data, list(data[0].keys()) if data else ["차트번호","이름"], "환자목록")


@router.get("/visits.csv")
async def export_visits(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """진료 기록 CSV (기간 필터 가능)."""
    q = (
        select(Visit)
        .where(Visit.user_id == current_user.id)
        .options(selectinload(Visit.diagnoses), selectinload(Visit.procedures))
        .order_by(Visit.visit_date.desc())
    )
    if date_from:
        q = q.where(Visit.visit_date >= date_from)
    if date_to:
        q = q.where(Visit.visit_date <= date_to)

    rows = (await db.execute(q)).scalars().all()
    data = []
    for v in rows:
        primary = next((d.name for d in v.diagnoses if d.is_primary), None) or (
            v.diagnoses[0].name if v.diagnoses else ""
        )
        all_dx = "; ".join([f"{d.code} {d.name}" for d in v.diagnoses])
        all_proc = "; ".join([f"{p.name}({p.quantity})" for p in v.procedures])
        proc_total = sum(p.total_price or 0 for p in v.procedures)
        data.append({
            "진료번호": v.visit_no,
            "차트번호": v.chart_no or "",
            "진료일": v.visit_date.isoformat(),
            "구분": {"INITIAL":"초진","REVISIT":"재진","CHECKUP":"검진"}.get(v.visit_type, v.visit_type),
            "주소": v.chief_complaint or "",
            "주진단": primary,
            "전체진단": all_dx,
            "시술": all_proc,
            "시술합계": proc_total,
            "혈압": f"{v.vital_systolic}/{v.vital_diastolic}" if v.vital_systolic else "",
            "맥박": v.vital_hr or "",
            "체온": v.vital_temp or "",
            "체중": v.vital_weight or "",
            "신장": v.vital_height or "",
            "BMI": v.vital_bmi or "",
            "담당의": v.doctor_name or "",
            "상태": {"COMPLETED":"완료","IN_PROGRESS":"진행중","SCHEDULED":"예약","CANCELLED":"취소"}.get(
                v.status.value if hasattr(v.status, 'value') else str(v.status), ""
            ),
            "다음예정일": v.next_visit_date.isoformat() if v.next_visit_date else "",
        })
    return _csv_response(
        data,
        list(data[0].keys()) if data else ["진료번호","진료일","주소"],
        "진료기록",
    )


@router.get("/bills.csv")
async def export_bills(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """청구·수납 CSV."""
    q = (
        select(Bill)
        .where(Bill.user_id == current_user.id)
        .order_by(Bill.bill_date.desc())
    )
    if date_from:
        q = q.where(Bill.bill_date >= date_from)
    if date_to:
        q = q.where(Bill.bill_date <= date_to)

    rows = (await db.execute(q)).scalars().all()
    data = []
    for b in rows:
        data.append({
            "청구번호": b.bill_no,
            "발행일": b.bill_date.isoformat(),
            "소계": b.subtotal,
            "공단부담": b.insurance_amount,
            "본인부담": b.patient_amount,
            "비급여": b.non_covered_amount,
            "할인": b.discount_amount,
            "최종금액": b.final_amount,
            "수납완료": b.paid_amount,
            "잔액": b.balance,
            "상태": {"PAID":"완납","PARTIAL":"부분수납","ISSUED":"발행","CANCELLED":"취소","REFUNDED":"환불"}.get(
                b.status.value if hasattr(b.status, 'value') else str(b.status), ""
            ),
            "메모": b.memo or "",
        })
    return _csv_response(
        data,
        list(data[0].keys()) if data else ["청구번호"],
        "청구수납",
    )


@router.get("/prescriptions.csv")
async def export_prescriptions(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """처방전 CSV."""
    q = (
        select(Prescription)
        .where(Prescription.user_id == current_user.id)
        .options(selectinload(Prescription.items))
        .order_by(Prescription.prescribed_date.desc())
    )
    if date_from:
        q = q.where(Prescription.prescribed_date >= date_from)
    if date_to:
        q = q.where(Prescription.prescribed_date <= date_to)

    rows = (await db.execute(q)).scalars().all()
    data = []
    for rx in rows:
        drugs = "; ".join([
            f"{it.drug_name}({it.dose_per_time}{it.dose_unit}×{it.frequency_per_day}회×{it.duration_days}일)"
            for it in rx.items
        ])
        data.append({
            "처방번호": rx.prescription_no,
            "처방일": rx.prescribed_date.isoformat(),
            "약품": drugs,
            "약품수": len(rx.items),
            "총액": rx.total_amount,
            "DUR경고수": len(rx.dur_warnings or []),
            "약국": rx.pharmacy_name or "",
            "담당의": rx.doctor_name or "",
            "상태": {"ISSUED":"발행","DISPENSED":"조제완료","CANCELLED":"취소","DRAFT":"임시"}.get(
                rx.status.value if hasattr(rx.status, 'value') else str(rx.status), ""
            ),
        })
    return _csv_response(
        data,
        list(data[0].keys()) if data else ["처방번호"],
        "처방전",
    )
