"""
청구 데이터 임포트 + 누락 검출(잃어버린 돈 찾기) API.

흐름:
1. POST /claims/import/preview  — 파일 업로드, 자동 매핑 + 그룹핑 결과 미리보기
2. POST /claims/import          — 실제 InsuranceClaim+ClaimItem 일괄 등록
3. POST /claims/audit/scan      — 임포트한 청구 전체에 누락 검출 룰셋 실행
4. GET  /claims/audit/findings  — 누락 검출 결과 리스트 (대시보드용)
5. POST /claims/import/rollback/{batch_id} — 배치 단위 soft delete
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional
from datetime import date, datetime
import json
import logging
import uuid

from ..deps import get_db, get_current_active_user
from .service_guards import require_active_service
from ...models.user import User
from ...models.service_subscription import ServiceSubscription, ServiceType
from ...models.insurance_claim import (
    InsuranceClaim, ClaimItem, ClaimStatus, RiskLevel, ClaimItemType,
)
from ...services.claim_import import (
    parse_claim_file, auto_map_claims, group_into_claims,
)
from ...services.claim_import.mapper import apply_mapping_claims
from ...services.claim_audit import scan_claims_for_findings

logger = logging.getLogger(__name__)
router = APIRouter()


_ALLOWED_EXTS = (".csv", ".tsv", ".txt", ".xlsx", ".xls", ".xlsm")
_MAX_FILE_BYTES = 30 * 1024 * 1024   # 30MB — 청구는 환자보다 큼
_MAX_ROWS_PER_FILE = 50000           # 행 (= 청구 항목)
_MAX_GROUPS_PER_BATCH = 10000        # 한 번에 InsuranceClaim 최대 1만건


def _ext_ok(filename: str) -> bool:
    n = (filename or "").lower()
    return any(n.endswith(e) for e in _ALLOWED_EXTS)


async def _read_upload(file: UploadFile) -> bytes:
    raw = await file.read()
    if len(raw) > _MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"파일이 너무 큽니다 (최대 {_MAX_FILE_BYTES // 1024 // 1024}MB)",
        )
    return raw


def _generate_claim_number(user_id: uuid.UUID, idx: int) -> str:
    """임포트한 청구의 내부 claim_number — 충돌 방지 prefix."""
    return f"IMP-{datetime.utcnow().strftime('%Y%m%d')}-{str(user_id)[:8]}-{idx:05d}"


# ============================================================
# 1. PREVIEW
# ============================================================

@router.post("/import/preview")
async def claim_import_preview(
    file: UploadFile = File(...),
    manual_mapping: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """파일 업로드 → 자동 매핑 + 그룹핑 미리보기. 저장 X."""
    if not _ext_ok(file.filename or ""):
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 형식. 가능: {', '.join(_ALLOWED_EXTS)}",
        )
    raw = await _read_upload(file)

    parsed = parse_claim_file(file.filename or "upload", raw, max_rows=_MAX_ROWS_PER_FILE)
    if not parsed.headers and not parsed.rows:
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

    plan = auto_map_claims(parsed.headers, parsed.rows[:200], manual_mapping=manual)
    mapped = apply_mapping_claims(plan, parsed.rows)
    grouped, stats = group_into_claims(mapped)

    # 미리보기는 처음 10건 그룹만
    preview_groups = []
    for g in grouped[:10]:
        preview_groups.append({
            "patient_chart_no": g.patient_chart_no,
            "patient_name": g.patient_name,
            "service_date": g.service_date.isoformat() if g.service_date else None,
            "primary_dx_code": g.primary_dx_code,
            "total_amount": g.total_amount,
            "item_count": len(g.items),
            "items_preview": [
                {
                    "code": it.fields.get("item_code"),
                    "name": it.fields.get("item_name"),
                    "type": it.fields.get("item_type"),
                    "total_price": it.fields.get("total_price"),
                }
                for it in g.items[:5]
            ],
        })

    return {
        "filename": file.filename,
        "format": parsed.format_detected,
        "encoding": parsed.encoding_used,
        "sheet": parsed.sheet_used,
        "warnings": parsed.warnings,
        "total_rows": len(parsed.rows),
        "mapping": plan.mapping,
        "confidence": plan.confidence,
        "unmapped_headers": plan.unmapped_headers,
        "notes": plan.notes,
        "stats": stats,
        "grouped_claims_count": len(grouped),
        "preview_groups": preview_groups,
    }


# ============================================================
# 2. IMPORT (commit)
# ============================================================

@router.post("/import")
async def claim_import(
    file: UploadFile = File(...),
    manual_mapping: Optional[str] = Form(default=None),
    source_emr: str = Form(default="manual_csv"),
    skip_duplicates: bool = Form(default=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """CSV/엑셀/EDI → InsuranceClaim + ClaimItem 일괄 등록."""
    if not _ext_ok(file.filename or ""):
        raise HTTPException(status_code=400, detail="지원하지 않는 형식")
    raw = await _read_upload(file)

    parsed = parse_claim_file(file.filename or "upload", raw, max_rows=_MAX_ROWS_PER_FILE)
    if not parsed.rows:
        raise HTTPException(
            status_code=400,
            detail=parsed.warnings[0] if parsed.warnings else "파일을 읽지 못했습니다.",
        )

    manual = None
    if manual_mapping:
        try:
            manual = json.loads(manual_mapping)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"manual_mapping JSON 오류: {e}")

    plan = auto_map_claims(parsed.headers, parsed.rows[:200], manual_mapping=manual)
    mapped = apply_mapping_claims(plan, parsed.rows)
    grouped, group_stats = group_into_claims(mapped)

    if len(grouped) > _MAX_GROUPS_PER_BATCH:
        raise HTTPException(
            status_code=400,
            detail=f"한 번에 최대 {_MAX_GROUPS_PER_BATCH}건의 청구만 임포트 가능. 파일을 나눠주세요.",
        )

    batch_id = uuid.uuid4()
    now = datetime.utcnow()

    # 중복 검출: 같은 source_emr + external_id
    existing_ext_ids: set[str] = set()
    if skip_duplicates:
        ext_ids = [g.external_id for g in grouped if g.external_id]
        if ext_ids:
            res = await db.execute(
                select(InsuranceClaim.external_id).where(and_(
                    InsuranceClaim.user_id == current_user.id,
                    InsuranceClaim.source_emr == source_emr,
                    InsuranceClaim.external_id.in_(ext_ids),
                    InsuranceClaim.deleted_at.is_(None),
                ))
            )
            existing_ext_ids = {row[0] for row in res.all()}

    inserted = 0
    skipped_duplicate = 0
    skipped_invalid = group_stats["skipped_invalid"]
    issues: list[dict] = []

    item_type_set = {t.value for t in ClaimItemType}

    for idx, g in enumerate(grouped):
        if not g.service_date:
            skipped_invalid += 1
            if len(issues) < 50:
                issues.append({"group": idx, "kind": "invalid", "detail": "service_date 없음"})
            continue

        if skip_duplicates and g.external_id and g.external_id in existing_ext_ids:
            skipped_duplicate += 1
            if len(issues) < 50:
                issues.append({
                    "group": idx, "kind": "duplicate", "external_id": g.external_id,
                })
            continue

        claim = InsuranceClaim(
            user_id=current_user.id,
            claim_number=_generate_claim_number(current_user.id, inserted + 1),
            claim_date=g.claim_date or g.service_date,
            service_date=g.service_date,
            patient_chart_no=g.patient_chart_no,
            patient_name_masked=(g.patient_name[:1] + "○" + g.patient_name[2:]) if g.patient_name and len(g.patient_name) >= 2 else g.patient_name,
            patient_age=g.patient_age,
            patient_gender=g.patient_gender,
            total_amount=g.total_amount or 0,
            insurance_amount=g.insurance_amount or 0,
            copay_amount=g.copay_amount or 0,
            rejected_amount=g.rejected_amount or 0,
            status=ClaimStatus.DRAFT,
            risk_level=RiskLevel.LOW,
            risk_score=100,
            primary_dx_code=g.primary_dx_code,
            secondary_dx_codes=g.secondary_dx_codes or [],
            external_id=g.external_id,
            source_emr=source_emr,
            import_batch_id=batch_id,
            imported_at=now,
            edi_result_detail=g.extra or {},
        )
        db.add(claim)
        await db.flush()  # claim.id 확보

        for item in g.items:
            it_type_raw = item.fields.get("item_type") or "TREATMENT"
            if it_type_raw not in item_type_set:
                it_type_raw = "TREATMENT"
            ci = ClaimItem(
                claim_id=claim.id,
                item_type=ClaimItemType[it_type_raw],
                code=item.fields.get("item_code") or "UNKNOWN",
                name=item.fields.get("item_name") or "(이름 없음)",
                quantity=item.fields.get("quantity") or 1,
                unit_price=item.fields.get("unit_price") or 0,
                total_price=item.fields.get("total_price") or 0,
                risk_level=RiskLevel.LOW,
                pass_rate=100.0,
                issues=item.issues or [],
            )
            db.add(ci)

        inserted += 1
        if g.external_id:
            existing_ext_ids.add(g.external_id)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.exception("청구 임포트 커밋 실패")
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {e}")

    return {
        "batch_id": str(batch_id),
        "imported_count": inserted,
        "skipped_invalid": skipped_invalid,
        "skipped_duplicate": skipped_duplicate,
        "total_rows": len(parsed.rows),
        "total_groups": len(grouped),
        "source_emr": source_emr,
        "issues": issues,
        "warnings": parsed.warnings,
        "notes": plan.notes,
        "message": f"{inserted}건 청구 임포트 완료 (중복 {skipped_duplicate}, 불완전 {skipped_invalid})",
    }


# ============================================================
# 3. AUDIT SCAN
# ============================================================

@router.post("/audit/scan")
async def claim_audit_scan(
    batch_id: Optional[str] = Form(default=None),
    months: int = Form(default=12),
    min_confidence: int = Form(default=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """임포트한 청구를 누락 검출 룰셋에 통과시켜 결과 저장.

    batch_id가 있으면 해당 배치만, 없으면 최근 N개월 청구 전체.
    """
    q = select(InsuranceClaim).where(and_(
        InsuranceClaim.user_id == current_user.id,
        InsuranceClaim.deleted_at.is_(None),
    ))

    if batch_id:
        try:
            bid = uuid.UUID(batch_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="잘못된 batch_id")
        q = q.where(InsuranceClaim.import_batch_id == bid)
    else:
        from datetime import timedelta
        since = date.today() - timedelta(days=months * 30)
        q = q.where(InsuranceClaim.service_date >= since)

    res = await db.execute(q.order_by(InsuranceClaim.service_date))
    claims = res.scalars().all()

    if not claims:
        return {
            "total_claims": 0,
            "findings_count": 0,
            "total_potential": 0,
            "high_confidence_potential": 0,
            "by_rule": {},
            "findings": [],
            "message": "검사 대상 청구가 없습니다. 먼저 청구내역을 임포트하세요.",
        }

    # 각 청구의 항목 일괄 조회 (N+1 회피)
    claim_ids = [c.id for c in claims]
    items_res = await db.execute(
        select(ClaimItem).where(ClaimItem.claim_id.in_(claim_ids))
    )
    items_by_claim: dict = {}
    for it in items_res.scalars().all():
        items_by_claim.setdefault(it.claim_id, []).append({
            "code": it.code,
            "name": it.name,
            "item_type": it.item_type.value if it.item_type else None,
            "quantity": it.quantity,
            "total_price": it.total_price,
        })

    # detector 형식으로 변환
    claim_dicts = []
    for c in claims:
        claim_dicts.append({
            "id": c.id,
            "patient_chart_no": c.patient_chart_no,
            "patient_name": c.patient_name_masked,
            "service_date": c.service_date,
            "primary_dx_code": c.primary_dx_code,
            "total_amount": c.total_amount,
            "items": items_by_claim.get(c.id, []),
        })

    summary = scan_claims_for_findings(claim_dicts, min_confidence=min_confidence)

    # 청구별 findings 저장
    findings_by_claim: dict = {}
    for f in summary.findings:
        if f.claim_id:
            findings_by_claim.setdefault(f.claim_id, []).append(f.to_dict())

    now = datetime.utcnow()
    for c in claims:
        clist = findings_by_claim.get(str(c.id), [])
        if clist:
            c.audit_status = "SCANNED"
            c.audit_findings = clist
            c.audit_potential_amount = sum(f["potential_amount"] for f in clist)
            c.audit_scanned_at = now
        else:
            c.audit_status = "SCANNED"
            c.audit_findings = []
            c.audit_potential_amount = 0
            c.audit_scanned_at = now

    await db.commit()

    return {
        **summary.to_dict(),
        "scanned_at": now.isoformat(),
        "message": (
            f"{summary.findings_count}건 검출 — "
            f"회수 가능 추정액 {summary.total_potential:,}원 "
            f"(높은 신뢰도 {summary.high_confidence_potential:,}원)"
        ),
    }


# ============================================================
# 4. AUDIT FINDINGS LIST
# ============================================================

@router.get("/audit/findings")
async def claim_audit_findings(
    min_confidence: int = Query(default=0, ge=0, le=100),
    rule: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """최근 검출 결과를 청구별로 펼친 평면 리스트로 반환 (대시보드용)."""
    q = select(InsuranceClaim).where(and_(
        InsuranceClaim.user_id == current_user.id,
        InsuranceClaim.deleted_at.is_(None),
        InsuranceClaim.audit_status == "SCANNED",
        InsuranceClaim.audit_potential_amount > 0,
    )).order_by(InsuranceClaim.audit_potential_amount.desc())

    res = await db.execute(q)
    claims = res.scalars().all()

    findings = []
    total_potential = 0
    high_conf_potential = 0
    rule_agg: dict = {}

    for c in claims:
        for f in (c.audit_findings or []):
            if f.get("confidence", 0) < min_confidence:
                continue
            if rule and f.get("rule") != rule:
                continue
            findings.append({
                **f,
                "claim_id": str(c.id),
                "claim_number": c.claim_number,
                "patient_chart_no": c.patient_chart_no,
                "patient_name_masked": c.patient_name_masked,
                "service_date": c.service_date.isoformat() if c.service_date else None,
                "primary_dx_code": c.primary_dx_code,
                "claim_total": c.total_amount,
            })
            total_potential += f.get("potential_amount", 0)
            if f.get("confidence", 0) >= 80:
                high_conf_potential += f.get("potential_amount", 0)
            r = rule_agg.setdefault(f["rule"], {"count": 0, "potential": 0, "title": f.get("title")})
            r["count"] += 1
            r["potential"] += f.get("potential_amount", 0)
            if len(findings) >= limit:
                break
        if len(findings) >= limit:
            break

    return {
        "total_findings": len(findings),
        "total_potential": total_potential,
        "high_confidence_potential": high_conf_potential,
        "by_rule": rule_agg,
        "findings": findings,
    }


# ============================================================
# 5. ROLLBACK
# ============================================================

@router.post("/import/rollback/{batch_id}")
async def claim_import_rollback(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    sub: ServiceSubscription = Depends(require_active_service(ServiceType.EMR)),
):
    """배치 단위 soft delete (의료법 5년 보존)."""
    try:
        bid = uuid.UUID(batch_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 batch_id")

    res = await db.execute(
        select(InsuranceClaim).where(and_(
            InsuranceClaim.user_id == current_user.id,
            InsuranceClaim.import_batch_id == bid,
            InsuranceClaim.deleted_at.is_(None),
        ))
    )
    targets = res.scalars().all()
    now = datetime.utcnow()
    for c in targets:
        c.deleted_at = now
    await db.commit()
    return {"rolled_back": len(targets), "batch_id": batch_id}
