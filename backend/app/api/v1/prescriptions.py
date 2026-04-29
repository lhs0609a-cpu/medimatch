"""처방전(Prescription) API + DUR 안전 체크"""
import logging
from datetime import date, datetime
from typing import List, Optional, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.prescription import Prescription, PrescriptionItem, PrescriptionStatus
from ...schemas.emr_core import (
    PrescriptionCreate, PrescriptionOut,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# DUR 단일 성분 경고 — 임신부/연령/공통 주의
DUR_RULES = {
    "이부프로펜": "임신 32주 이후 투여 금기. 출혈 환자 주의.",
    "케토프로펜": "위장관 출혈 병력 환자 금기.",
    "아스피린": "16세 미만 라이증후군 위험. 와파린 병용 시 출혈 주의.",
    "와파린": "비스테로이드성 소염제(NSAIDs) 병용 시 출혈 위험 ↑.",
    "트라마돌": "MAOI/SSRI 병용 시 세로토닌 증후군 위험.",
    "코데인": "12세 미만 사용 금지. 호흡억제 위험.",
    "독시사이클린": "8세 미만 사용 금지 (치아 착색).",
    "시프로플록사신": "18세 미만 사용 시 연골 발달 영향 가능.",
    "메토트렉세이트": "NSAIDs/페니실린 병용 시 독성 ↑.",
    "디곡신": "칼슘차단제(베라파밀) 병용 시 디곡신 농도 ↑.",
    "클로피도그렐": "PPI(오메프라졸) 병용 시 항혈소판 효과 감소.",
    "푸로세미드": "ACE-I/디곡신 병용 시 전해질·신독성 모니터.",
    "벤조디아제핀": "오피오이드 병용 금기 — 호흡억제 사망 위험.",
}

# 병용 금기 — 성분 키워드 쌍 (한쪽만 있어도 다른 쪽 있는지 검사)
DRUG_INTERACTIONS = [
    # (성분A 키워드, 성분B 키워드, 위험도, 메시지)
    ("와파린", "이부프로펜", "HIGH", "와파린 + NSAIDs(이부프로펜) — 출혈 위험 현저히 ↑"),
    ("와파린", "나프록센", "HIGH", "와파린 + NSAIDs(나프록센) — 출혈 위험 현저히 ↑"),
    ("와파린", "케토프로펜", "HIGH", "와파린 + NSAIDs(케토프로펜) — 출혈 위험 현저히 ↑"),
    ("와파린", "디클로페낙", "HIGH", "와파린 + NSAIDs(디클로페낙) — 출혈 위험 현저히 ↑"),
    ("와파린", "아스피린", "HIGH", "와파린 + 아스피린 — 출혈 위험 누적 ↑↑"),
    ("메토트렉세이트", "이부프로펜", "HIGH", "메토트렉세이트 + NSAIDs — 메토트렉세이트 독성 ↑"),
    ("메토트렉세이트", "나프록센", "HIGH", "메토트렉세이트 + NSAIDs — 메토트렉세이트 독성 ↑"),
    ("트라마돌", "플루옥세틴", "HIGH", "트라마돌 + SSRI(플루옥세틴) — 세로토닌 증후군 위험"),
    ("트라마돌", "에스시탈로프람", "HIGH", "트라마돌 + SSRI(에스시탈로프람) — 세로토닌 증후군 위험"),
    ("트라마돌", "세트랄린", "HIGH", "트라마돌 + SSRI(세트랄린) — 세로토닌 증후군 위험"),
    ("아토르바스타틴", "아지스로마이신", "MEDIUM", "스타틴 + 마크로라이드 — 횡문근융해 위험 ↑"),
    ("심바스타틴", "아지스로마이신", "HIGH", "심바스타틴 + 마크로라이드 — 횡문근융해 위험 ↑↑"),
    ("로수바스타틴", "아지스로마이신", "MEDIUM", "스타틴 + 마크로라이드 — 횡문근융해 위험 ↑"),
    ("디곡신", "베라파밀", "HIGH", "디곡신 + 베라파밀 — 디곡신 혈중농도 50% ↑, 독성 위험"),
    ("클로피도그렐", "오메프라졸", "MEDIUM", "클로피도그렐 + 오메프라졸 — 항혈소판 효과 감소 (라베프라졸로 대체 권장)"),
    ("로사르탄", "라미프릴", "MEDIUM", "ARB + ACE-I 병용 — 신독성·고칼륨혈증 위험"),
    ("발사르탄", "라미프릴", "MEDIUM", "ARB + ACE-I 병용 — 신독성·고칼륨혈증 위험"),
    ("이부프로펜", "라미프릴", "MEDIUM", "NSAIDs + ACE-I — 신기능 저하 위험"),
    ("푸로세미드", "이부프로펜", "MEDIUM", "이뇨제 + NSAIDs — 이뇨 효과 감소·신기능 저하"),
    ("알프라졸람", "트라마돌", "HIGH", "벤조디아제핀 + 오피오이드 — 호흡억제·혼수 위험"),
    ("로라제팜", "트라마돌", "HIGH", "벤조디아제핀 + 오피오이드 — 호흡억제·혼수 위험"),
    ("졸피뎀", "트라마돌", "HIGH", "수면제 + 오피오이드 — 호흡억제 위험"),
]


def _generate_rx_no(user_id: UUID) -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    suffix = str(user_id)[:6].upper()
    micro = datetime.utcnow().strftime("%H%M%S%f")[:9]
    return f"RX-{today}-{suffix}-{micro}"


def _dur_check(items: List) -> tuple[List[dict], dict]:
    """DUR 체크 — 단일 성분 + 병용 금기 + 동일 약품 중복."""
    warnings = []
    item_warnings: Dict[int, List[str]] = {}
    seen_drugs = {}

    def _add_item_warning(idx: int, msg: str):
        item_warnings.setdefault(idx, []).append(msg)

    # 1) 단일 성분 검사
    for i, item in enumerate(items):
        keys_to_check = [item.drug_name or "", item.ingredient or ""]
        for key in keys_to_check:
            for trigger, msg in DUR_RULES.items():
                if trigger in key:
                    _add_item_warning(i, msg)
                    warnings.append({
                        "type": "rule",
                        "severity": "MEDIUM",
                        "drug": item.drug_name,
                        "trigger": trigger,
                        "message": msg,
                    })
        # 동일 약품 중복
        norm = (item.drug_name or "").strip()
        if norm:
            if norm in seen_drugs:
                msg = f"동일 약품 중복 처방: {norm}"
                _add_item_warning(i, msg)
                warnings.append({"type": "duplicate", "severity": "LOW", "drug": norm, "message": msg})
            seen_drugs[norm] = i

    # 2) 병용 금기 검사 — pair 비교
    for i, a in enumerate(items):
        a_text = (a.drug_name or "") + " " + (a.ingredient or "")
        for j, b in enumerate(items):
            if j <= i:
                continue
            b_text = (b.drug_name or "") + " " + (b.ingredient or "")
            for ing_a, ing_b, severity, msg in DRUG_INTERACTIONS:
                hit = (
                    (ing_a in a_text and ing_b in b_text)
                    or (ing_b in a_text and ing_a in b_text)
                )
                if hit:
                    _add_item_warning(i, f"⚠ {msg}")
                    _add_item_warning(j, f"⚠ {msg}")
                    warnings.append({
                        "type": "interaction",
                        "severity": severity,
                        "drugs": [a.drug_name, b.drug_name],
                        "message": msg,
                    })

    # item_warnings: List[str] → "; "로 join
    final_item_warnings: Dict[int, str] = {
        idx: "; ".join(msgs) for idx, msgs in item_warnings.items()
    }
    return warnings, final_item_warnings


async def _fetch_patient_active_meds(
    db: AsyncSession,
    user_id: UUID,
    patient_id: UUID,
    days: int = 90,
) -> List:
    """환자의 최근 N일 처방 약품 (현재 복용 추정)."""
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)
    q = (
        select(Prescription)
        .where(and_(
            Prescription.user_id == user_id,
            Prescription.patient_id == patient_id,
            Prescription.prescribed_date >= cutoff,
            Prescription.status != PrescriptionStatus.CANCELLED,
        ))
        .options(selectinload(Prescription.items))
        .order_by(desc(Prescription.prescribed_date))
        .limit(20)
    )
    rxs = (await db.execute(q)).scalars().all()
    items = []
    for rx in rxs:
        items.extend(rx.items)
    return items


@router.post("/dur-check")
async def dur_check_only(
    payload: PrescriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """처방전 저장 전 DUR 안전 체크 — 신규 처방 + 환자의 최근 90일 처방 cross-check."""
    items_to_check = list(payload.items)

    # 환자 최근 처방을 합쳐서 검사 (cross-check)
    cross_check_count = 0
    if payload.patient_id:
        active_meds = await _fetch_patient_active_meds(db, current_user.id, payload.patient_id)
        cross_check_count = len(active_meds)
        # PrescriptionItem 모델 객체를 PrescriptionItemIn-호환 형태로 wrap
        class _Adapter:
            def __init__(self, m):
                self.drug_name = m.drug_name
                self.ingredient = m.ingredient
        items_to_check = list(payload.items) + [_Adapter(m) for m in active_meds]

    warnings, item_warnings = _dur_check(items_to_check)
    # 신규 처방 인덱스만 item_warnings로 반환 (기존 복용약은 정보용)
    new_count = len(payload.items)
    new_item_warnings = {i: w for i, w in item_warnings.items() if i < new_count}

    return {
        "ok": len(warnings) == 0,
        "warnings": warnings,
        "item_warnings": new_item_warnings,
        "cross_checked_active_meds": cross_check_count,
    }


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    payload: PrescriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """처방전 발행 — DUR 자동 체크 (환자 복용약 cross-check 포함) + 총액 계산."""
    # 환자 최근 처방을 합쳐 cross-check
    items_to_check = list(payload.items)
    if payload.patient_id:
        active_meds = await _fetch_patient_active_meds(db, current_user.id, payload.patient_id)
        class _Adapter:
            def __init__(self, m):
                self.drug_name = m.drug_name
                self.ingredient = m.ingredient
        items_to_check = list(payload.items) + [_Adapter(m) for m in active_meds]
    warnings, item_warnings = _dur_check(items_to_check)
    # 신규 처방 인덱스만 item_warnings 유지 (기존 복용약은 모델에 저장 안 함)
    new_count = len(payload.items)
    item_warnings = {i: w for i, w in item_warnings.items() if i < new_count}

    rx = Prescription(
        user_id=current_user.id,
        visit_id=payload.visit_id,
        patient_id=payload.patient_id,
        prescription_no=_generate_rx_no(current_user.id),
        prescribed_date=payload.prescribed_date,
        doctor_id=current_user.id,
        doctor_name=payload.doctor_name or current_user.name,
        pharmacy_name=payload.pharmacy_name,
        duration_days=payload.duration_days,
        patient_note=payload.patient_note,
        dur_warnings=warnings,
    )
    db.add(rx)
    await db.flush()

    total_amount = 0
    for i, item in enumerate(payload.items):
        total_qty = item.total_quantity or (
            item.dose_per_time * item.frequency_per_day * item.duration_days
        )
        total_price = item.total_price or int(item.unit_price * total_qty)
        db.add(PrescriptionItem(
            prescription_id=rx.id,
            drug_code=item.drug_code,
            drug_name=item.drug_name,
            ingredient=item.ingredient,
            dose_per_time=item.dose_per_time,
            dose_unit=item.dose_unit,
            frequency_per_day=item.frequency_per_day,
            duration_days=item.duration_days,
            total_quantity=total_qty,
            unit_price=item.unit_price,
            total_price=total_price,
            usage_note=item.usage_note,
            warning=item_warnings.get(i),
        ))
        total_amount += total_price

    rx.total_amount = total_amount
    await db.commit()
    await db.refresh(rx, ["items"])
    return rx


@router.get("", response_model=List[PrescriptionOut])
async def list_prescriptions(
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Prescription)
        .where(Prescription.user_id == current_user.id)
        .options(selectinload(Prescription.items))
        .order_by(desc(Prescription.prescribed_date))
    )
    if patient_id:
        q = q.where(Prescription.patient_id == patient_id)
    if visit_id:
        q = q.where(Prescription.visit_id == visit_id)
    if date_from:
        q = q.where(Prescription.prescribed_date >= date_from)
    if date_to:
        q = q.where(Prescription.prescribed_date <= date_to)
    q = q.offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/{rx_id}", response_model=PrescriptionOut)
async def get_prescription(
    rx_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Prescription)
        .where(and_(Prescription.id == rx_id, Prescription.user_id == current_user.id))
        .options(selectinload(Prescription.items))
    )
    rx = (await db.execute(q)).scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return rx


@router.post("/{rx_id}/cancel", response_model=PrescriptionOut)
async def cancel_prescription(
    rx_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        select(Prescription)
        .where(and_(Prescription.id == rx_id, Prescription.user_id == current_user.id))
        .options(selectinload(Prescription.items))
    )
    rx = (await db.execute(q)).scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    rx.status = PrescriptionStatus.CANCELLED
    await db.commit()
    await db.refresh(rx, ["items"])
    return rx
