"""
HIRA EDI 연동 서비스

심평원 VPN/EDI 채널을 통한 XML 메시지 송수신.
Phase 1: 시뮬레이션 모드 (실제 HIRA VPN 연동 placeholder)
"""
import logging
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update

logger = logging.getLogger(__name__)

# EDI 환경 설정 (실제 운영에서는 config/환경변수로 관리)
EDI_CONFIG = {
    "endpoint": "https://edi.hira.or.kr/api/v1",  # 시뮬레이션용
    "vpn_gateway": "vpn.hira.or.kr",
    "timeout_seconds": 30,
    "max_retries": 3,
    "message_encoding": "UTF-8",
}

# HIRA 결과 코드
RESULT_CODES = {
    "0000": "정상 접수",
    "1001": "메시지 형식 오류",
    "1002": "요양기관번호 불일치",
    "1003": "코드 유효성 오류",
    "2001": "전체 삭감",
    "2002": "일부 삭감",
    "3001": "심사 진행 중",
    "9999": "시스템 오류",
}


class HIRAEDIService:
    """심평원 EDI 연동 서비스"""

    def __init__(self, simulation_mode: bool = True):
        self.simulation_mode = simulation_mode
        self.config = EDI_CONFIG

    # ─────────────────────────────────────────
    # Public Methods
    # ─────────────────────────────────────────

    async def submit_claims(
        self, db: AsyncSession, batch_id: int, claims: list, user_id: str,
    ) -> dict:
        """
        청구 건 일괄 EDI 전송

        Args:
            db: DB 세션
            batch_id: ClaimBatch ID
            claims: InsuranceClaim 목록
            user_id: 사용자 UUID

        Returns:
            전송 결과 (message_id, receipt_number, status)
        """
        from app.models.edi_log import EDIMessageLog, EDIDirection, EDIMessageType
        from app.models.insurance_claim import InsuranceClaim, ClaimStatus

        # 1) EDI XML 포맷 검증
        validation = await self.validate_edi_format(claims)
        if not validation["valid"]:
            return {
                "success": False,
                "error": "EDI_VALIDATION_FAILED",
                "detail": validation["errors"],
            }

        # 2) XML 메시지 생성
        message_id = self._generate_message_id()
        xml_messages = []
        for claim in claims:
            xml_msg = self._build_claim_xml(claim)
            xml_messages.append(xml_msg)

        combined_xml = self._wrap_batch_xml(message_id, batch_id, xml_messages)

        # 3) 전송 로그 기록
        log = await self._create_message_log(
            db=db,
            user_id=user_id,
            batch_id=batch_id,
            direction=EDIDirection.OUTBOUND,
            message_type=EDIMessageType.CLAIM_SUBMIT,
            message_id=message_id,
            xml_message=combined_xml,
            claim_ids=",".join(str(c.id) for c in claims),
        )

        # 4) 전송 (시뮬레이션 또는 실제)
        try:
            if self.simulation_mode:
                result = self._simulate_submit_response(message_id, len(claims))
            else:
                # TODO: 실제 HIRA VPN 연동 구현
                # result = await self._send_via_vpn(combined_xml)
                result = self._simulate_submit_response(message_id, len(claims))

            # 5) 로그 업데이트
            log.success = result["success"]
            log.http_status = result.get("http_status", 200)
            log.http_response_time_ms = result.get("response_time_ms", 150)
            log.error_code = result.get("error_code")
            log.error_message = result.get("error_message")

            # 6) 청구 상태 업데이트
            if result["success"]:
                for claim in claims:
                    claim.status = ClaimStatus.SUBMITTED
                    claim.submitted_at = datetime.utcnow()
                    claim.edi_message_id = message_id
                    claim.edi_receipt_number = result.get("receipt_number")
                    claim.edi_submitted_at = datetime.utcnow()

            await db.flush()

            return {
                "success": result["success"],
                "message_id": message_id,
                "receipt_number": result.get("receipt_number"),
                "submitted_count": len(claims),
                "result_code": result.get("result_code", "0000"),
                "result_message": RESULT_CODES.get(result.get("result_code", "0000"), "알 수 없음"),
            }

        except Exception as e:
            log.success = False
            log.error_message = str(e)
            log.retry_count += 1
            await db.flush()
            logger.error(f"EDI submit failed for batch {batch_id}: {e}")
            return {
                "success": False,
                "error": "EDI_SUBMIT_FAILED",
                "detail": str(e),
            }

    async def poll_results(self, db: AsyncSession, batch_id: int, user_id: str) -> dict:
        """
        EDI 심사 결과 조회 (폴링)

        Args:
            db: DB 세션
            batch_id: ClaimBatch ID
            user_id: 사용자 UUID

        Returns:
            심사 결과 (status, items)
        """
        from app.models.edi_log import EDIMessageLog, EDIDirection, EDIMessageType
        from app.models.insurance_claim import InsuranceClaim, ClaimBatch

        # 배치 조회
        batch_result = await db.execute(
            select(ClaimBatch).where(ClaimBatch.id == batch_id)
        )
        batch = batch_result.scalar_one_or_none()
        if not batch:
            return {"success": False, "error": "BATCH_NOT_FOUND"}

        # 시뮬레이션 결과 생성
        if self.simulation_mode:
            result = self._simulate_poll_response(batch_id)
        else:
            # TODO: 실제 HIRA 결과 조회 구현
            result = self._simulate_poll_response(batch_id)

        # 수신 로그 기록
        message_id = self._generate_message_id()
        await self._create_message_log(
            db=db,
            user_id=user_id,
            batch_id=batch_id,
            direction=EDIDirection.INBOUND,
            message_type=EDIMessageType.REVIEW_RESULT,
            message_id=message_id,
            xml_message=result.get("raw_xml", ""),
            claim_ids=None,
        )

        await db.flush()

        return {
            "success": True,
            "batch_id": batch_id,
            "status": result["status"],
            "results": result.get("claim_results", []),
            "polled_at": datetime.utcnow().isoformat(),
        }

    async def validate_edi_format(self, claims: list) -> dict:
        """
        EDI XML 포맷 요구사항 검증

        Args:
            claims: InsuranceClaim 목록

        Returns:
            검증 결과 (valid, errors)
        """
        errors = []
        for idx, claim in enumerate(claims):
            # 필수 필드 검증
            if not claim.claim_number:
                errors.append({"claim_index": idx, "field": "claim_number", "error": "청구번호 누락"})
            if not claim.service_date:
                errors.append({"claim_index": idx, "field": "service_date", "error": "진료일 누락"})
            if not claim.ykiho:
                errors.append({"claim_index": idx, "field": "ykiho", "error": "요양기관번호 누락"})
            if not claim.primary_dx_code:
                errors.append({"claim_index": idx, "field": "primary_dx_code", "error": "주상병코드 누락"})

            # 금액 검증
            if claim.total_amount <= 0:
                errors.append({"claim_index": idx, "field": "total_amount", "error": "청구금액이 0 이하"})

            # 항목 검증
            if hasattr(claim, 'items') and claim.items:
                for item_idx, item in enumerate(claim.items):
                    if not item.code:
                        errors.append({
                            "claim_index": idx,
                            "item_index": item_idx,
                            "field": "code",
                            "error": "항목 코드 누락",
                        })
                    if item.quantity <= 0:
                        errors.append({
                            "claim_index": idx,
                            "item_index": item_idx,
                            "field": "quantity",
                            "error": "수량이 0 이하",
                        })

        return {"valid": len(errors) == 0, "errors": errors, "checked_count": len(claims)}

    # ─────────────────────────────────────────
    # Private Methods
    # ─────────────────────────────────────────

    def _build_claim_xml(self, claim) -> str:
        """단일 청구 건 EDI XML 생성"""
        root = Element("ClaimRequest")

        # 헤더
        header = SubElement(root, "Header")
        SubElement(header, "ClaimNumber").text = claim.claim_number
        SubElement(header, "ServiceDate").text = str(claim.service_date)
        SubElement(header, "ClaimDate").text = str(claim.claim_date)
        SubElement(header, "YkihoCode").text = claim.ykiho or ""
        SubElement(header, "SpecialtyCode").text = claim.specialty_code or ""

        # 환자 정보
        patient = SubElement(root, "Patient")
        SubElement(patient, "ChartNo").text = claim.patient_chart_no or ""
        SubElement(patient, "Age").text = str(claim.patient_age or "")
        SubElement(patient, "Gender").text = claim.patient_gender or ""

        # 진단
        diagnosis = SubElement(root, "Diagnosis")
        SubElement(diagnosis, "PrimaryDxCode").text = claim.primary_dx_code or ""
        if claim.secondary_dx_codes:
            for dx in claim.secondary_dx_codes:
                SubElement(diagnosis, "SecondaryDxCode").text = dx

        # 금액
        amounts = SubElement(root, "Amounts")
        SubElement(amounts, "TotalAmount").text = str(claim.total_amount)
        SubElement(amounts, "InsuranceAmount").text = str(claim.insurance_amount)
        SubElement(amounts, "CopayAmount").text = str(claim.copay_amount)

        # 항목
        if hasattr(claim, 'items') and claim.items:
            items_elem = SubElement(root, "Items")
            for item in claim.items:
                item_elem = SubElement(items_elem, "Item")
                SubElement(item_elem, "Type").text = item.item_type.value if item.item_type else ""
                SubElement(item_elem, "Code").text = item.code
                SubElement(item_elem, "Name").text = item.name
                SubElement(item_elem, "Quantity").text = str(item.quantity)
                SubElement(item_elem, "UnitPrice").text = str(item.unit_price)
                SubElement(item_elem, "TotalPrice").text = str(item.total_price)

        xml_str = tostring(root, encoding="unicode")
        # Pretty print
        try:
            return parseString(xml_str).toprettyxml(indent="  ", encoding=None)
        except Exception:
            return xml_str

    def _wrap_batch_xml(self, message_id: str, batch_id: int, claim_xmls: list) -> str:
        """배치 래퍼 XML 생성"""
        root = Element("EDIBatchMessage")
        SubElement(root, "MessageID").text = message_id
        SubElement(root, "BatchID").text = str(batch_id)
        SubElement(root, "Timestamp").text = datetime.utcnow().isoformat()
        SubElement(root, "ClaimCount").text = str(len(claim_xmls))

        claims_elem = SubElement(root, "Claims")
        for xml in claim_xmls:
            claim_elem = SubElement(claims_elem, "ClaimData")
            claim_elem.text = xml

        xml_str = tostring(root, encoding="unicode")
        return xml_str

    def _generate_message_id(self) -> str:
        """EDI 메시지 ID 생성"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        short_uuid = uuid.uuid4().hex[:8].upper()
        return f"MM-{timestamp}-{short_uuid}"

    async def _create_message_log(
        self,
        db: AsyncSession,
        user_id: str,
        batch_id: Optional[int],
        direction,
        message_type,
        message_id: str,
        xml_message: str,
        claim_ids: Optional[str] = None,
        ykiho: Optional[str] = None,
    ):
        """EDI 메시지 로그 기록"""
        from app.models.edi_log import EDIMessageLog

        log = EDIMessageLog(
            user_id=user_id,
            batch_id=batch_id,
            direction=direction,
            message_type=message_type,
            message_id=message_id,
            xml_message=xml_message,
            message_size_bytes=len(xml_message.encode("utf-8")) if xml_message else 0,
            ykiho=ykiho,
            claim_ids=claim_ids,
        )
        db.add(log)
        await db.flush()
        return log

    # ─────────────────────────────────────────
    # Simulation Helpers (개발/테스트용)
    # ─────────────────────────────────────────

    def _simulate_submit_response(self, message_id: str, claim_count: int) -> dict:
        """시뮬레이션 전송 응답 생성"""
        receipt_hash = hashlib.md5(message_id.encode()).hexdigest()[:12].upper()
        return {
            "success": True,
            "result_code": "0000",
            "receipt_number": f"RN-{receipt_hash}",
            "http_status": 200,
            "response_time_ms": 150,
            "submitted_count": claim_count,
        }

    def _simulate_poll_response(self, batch_id: int) -> dict:
        """시뮬레이션 심사 결과 생성"""
        import random

        statuses = ["UNDER_REVIEW", "ACCEPTED", "PARTIAL", "REJECTED"]
        weights = [0.3, 0.45, 0.15, 0.1]
        status = random.choices(statuses, weights=weights, k=1)[0]

        claim_results = []
        # 시뮬레이션 결과 3건 생성
        for i in range(3):
            item_status = random.choices(
                ["ACCEPTED", "PARTIAL", "REJECTED"],
                weights=[0.6, 0.25, 0.15],
                k=1,
            )[0]
            claim_results.append({
                "claim_index": i,
                "status": item_status,
                "approved_amount": random.randint(50000, 500000) if item_status != "REJECTED" else 0,
                "rejected_amount": random.randint(5000, 50000) if item_status != "ACCEPTED" else 0,
                "rejection_reason": "주상병과 처치 관련성 낮음" if item_status == "REJECTED" else None,
            })

        return {
            "status": status,
            "claim_results": claim_results,
            "raw_xml": f"<SimulatedResult batch_id='{batch_id}' />",
        }


# 싱글톤 인스턴스
hira_edi_service = HIRAEDIService(simulation_mode=True)
