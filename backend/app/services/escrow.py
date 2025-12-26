"""
에스크로 결제 서비스
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
from decimal import Decimal
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from ..models.escrow import (
    EscrowTransaction, EscrowContract, EscrowMilestone, EscrowMessage,
    EscrowDispute, ContactDetectionLog,
    EscrowStatus, MilestoneStatus, ContractStatus, MessageType, DetectionAction,
    create_default_milestones
)
from ..models.partner import Partner
from ..models.user import User
from ..schemas.escrow import (
    ContractCreate, ContractUpdate, ContractSignRequest,
    EscrowCreate, MessageCreate, MilestoneSubmitRequest,
    DisputeCreate, DisputeResolveRequest
)
from .contact_detection import contact_detection_service, DetectionResult
from .toss_payments import toss_payments_service

logger = logging.getLogger(__name__)


class EscrowService:
    """에스크로 결제 서비스"""

    # ============================================================
    # 헬퍼 메서드
    # ============================================================

    async def _get_partner_by_user(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Optional[Partner]:
        """사용자 ID로 연결된 파트너 조회"""
        result = await db.execute(
            select(Partner).where(Partner.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _is_partner_of_transaction(
        self,
        db: AsyncSession,
        user_id: UUID,
        partner_id: int
    ) -> bool:
        """사용자가 해당 파트너의 소유자인지 확인"""
        partner = await db.get(Partner, partner_id)
        if not partner:
            return False
        return partner.user_id == user_id

    # ============================================================
    # 계약서 관련
    # ============================================================

    async def create_contract(
        self,
        db: AsyncSession,
        data: ContractCreate,
        customer_id: UUID
    ) -> EscrowContract:
        """계약서 생성"""
        # 파트너 조회 (수수료율 확인)
        partner = await db.get(Partner, data.partner_id)
        if not partner:
            raise ValueError("Partner not found")

        # 수수료 계산
        commission_rate = partner.commission_rate or Decimal("3.0")
        commission_amount = data.total_amount * commission_rate / 100

        contract = EscrowContract(
            customer_id=customer_id,
            partner_id=data.partner_id,
            inquiry_id=data.inquiry_id,
            title=data.title,
            description=data.description,
            contract_content=data.contract_content,
            terms_and_conditions=data.terms_and_conditions,
            total_amount=data.total_amount,
            deposit_amount=data.deposit_amount,
            commission_rate=commission_rate,
            commission_amount=commission_amount,
            service_start_date=data.service_start_date,
            service_end_date=data.service_end_date,
            status=ContractStatus.DRAFT
        )

        db.add(contract)
        await db.commit()
        await db.refresh(contract)

        logger.info(f"Contract created: {contract.contract_number}")
        return contract

    async def get_contract(
        self,
        db: AsyncSession,
        contract_id: int,
        user_id: UUID
    ) -> Optional[EscrowContract]:
        """계약서 조회 (권한 확인)"""
        result = await db.execute(
            select(EscrowContract)
            .where(EscrowContract.id == contract_id)
        )
        contract = result.scalar_one_or_none()

        if not contract:
            return None

        # 권한 확인: 고객 또는 파트너
        if contract.customer_id != user_id:
            # 파트너 user_id 확인
            is_partner = await self._is_partner_of_transaction(
                db, user_id, contract.partner_id
            )
            if not is_partner:
                logger.warning(f"Unauthorized contract access attempt: user={user_id}, contract={contract_id}")
                return None

        return contract

    async def sign_contract(
        self,
        db: AsyncSession,
        contract_id: int,
        user_id: UUID,
        signature: str,
        ip_address: str
    ) -> EscrowContract:
        """계약서 서명"""
        contract = await self.get_contract(db, contract_id, user_id)
        if not contract:
            raise ValueError("Contract not found")

        if contract.status not in [ContractStatus.DRAFT, ContractStatus.PENDING_CUSTOMER, ContractStatus.PENDING_PARTNER]:
            raise ValueError("Contract is not in signable status")

        # 서명자 확인 및 서명 저장
        if contract.customer_id == user_id:
            contract.customer_signed = True
            contract.customer_signature = signature
            contract.customer_signed_at = datetime.utcnow()
            contract.customer_signed_ip = ip_address

            if not contract.partner_signed:
                contract.status = ContractStatus.PENDING_PARTNER
        else:
            contract.partner_signed = True
            contract.partner_signature = signature
            contract.partner_signed_at = datetime.utcnow()
            contract.partner_signed_ip = ip_address

            if not contract.customer_signed:
                contract.status = ContractStatus.PENDING_CUSTOMER

        # 양측 모두 서명 완료
        if contract.customer_signed and contract.partner_signed:
            contract.status = ContractStatus.SIGNED

        await db.commit()
        await db.refresh(contract)

        logger.info(f"Contract signed: {contract.contract_number}, status={contract.status}")
        return contract

    # ============================================================
    # 에스크로 거래 관련
    # ============================================================

    async def create_transaction(
        self,
        db: AsyncSession,
        contract_id: int,
        customer_id: UUID
    ) -> EscrowTransaction:
        """에스크로 거래 생성 (계약 서명 완료 후)"""
        # 계약 조회
        contract = await self.get_contract(db, contract_id, customer_id)
        if not contract:
            raise ValueError("Contract not found")

        if contract.status != ContractStatus.SIGNED:
            raise ValueError("Contract must be signed by both parties")

        # 수수료 계산
        platform_fee = contract.commission_amount or (contract.total_amount * Decimal("3") / 100)
        partner_payout = contract.total_amount - platform_fee

        # 에스크로 거래 생성
        escrow = EscrowTransaction(
            customer_id=customer_id,
            partner_id=contract.partner_id,
            contract_id=contract_id,
            total_amount=contract.total_amount,
            platform_fee=platform_fee,
            partner_payout=partner_payout,
            status=EscrowStatus.INITIATED
        )

        db.add(escrow)
        await db.flush()  # ID 생성을 위해

        # 기본 마일스톤 생성 (30-40-30)
        milestones = create_default_milestones(escrow.id, contract.total_amount)
        for milestone in milestones:
            db.add(milestone)

        # 계약 상태 업데이트
        contract.status = ContractStatus.ACTIVE

        await db.commit()
        await db.refresh(escrow)

        logger.info(f"Escrow transaction created: {escrow.escrow_number}")
        return escrow

    async def get_transaction(
        self,
        db: AsyncSession,
        escrow_id: UUID,
        user_id: UUID
    ) -> Optional[EscrowTransaction]:
        """에스크로 거래 조회"""
        result = await db.execute(
            select(EscrowTransaction)
            .options(selectinload(EscrowTransaction.milestones))
            .options(selectinload(EscrowTransaction.contract))
            .where(EscrowTransaction.id == escrow_id)
        )
        escrow = result.scalar_one_or_none()

        if not escrow:
            return None

        # 권한 확인: 고객 또는 파트너
        if escrow.customer_id != user_id:
            is_partner = await self._is_partner_of_transaction(
                db, user_id, escrow.partner_id
            )
            if not is_partner:
                logger.warning(f"Unauthorized escrow access attempt: user={user_id}, escrow={escrow_id}")
                return None

        return escrow

    async def get_user_transactions(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> List[EscrowTransaction]:
        """사용자의 에스크로 거래 목록 (고객 및 파트너 거래 포함)"""
        # 사용자가 소유한 파트너 조회
        partner = await self._get_partner_by_user(db, user_id)
        partner_id = partner.id if partner else None

        # 고객으로서의 거래 또는 파트너로서의 거래 조회
        if partner_id:
            result = await db.execute(
                select(EscrowTransaction)
                .options(selectinload(EscrowTransaction.milestones))
                .where(
                    or_(
                        EscrowTransaction.customer_id == user_id,
                        EscrowTransaction.partner_id == partner_id
                    )
                )
                .order_by(EscrowTransaction.created_at.desc())
            )
        else:
            # 파트너가 아닌 경우 고객 거래만 조회
            result = await db.execute(
                select(EscrowTransaction)
                .options(selectinload(EscrowTransaction.milestones))
                .where(EscrowTransaction.customer_id == user_id)
                .order_by(EscrowTransaction.created_at.desc())
            )

        return result.scalars().all()

    async def fund_transaction(
        self,
        db: AsyncSession,
        escrow_id: UUID,
        payment_key: str,
        order_id: str
    ) -> EscrowTransaction:
        """결제 완료 처리"""
        escrow = await db.get(EscrowTransaction, escrow_id)
        if not escrow:
            raise ValueError("Escrow transaction not found")

        escrow.payment_key = payment_key
        escrow.order_id = order_id
        escrow.status = EscrowStatus.FUNDED
        escrow.funded_at = datetime.utcnow()

        # 첫 번째 마일스톤 활성화
        result = await db.execute(
            select(EscrowMilestone)
            .where(
                and_(
                    EscrowMilestone.escrow_id == escrow_id,
                    EscrowMilestone.sequence == 1
                )
            )
        )
        first_milestone = result.scalar_one_or_none()
        if first_milestone:
            first_milestone.status = MilestoneStatus.FUNDED

        await db.commit()
        await db.refresh(escrow)

        logger.info(f"Escrow funded: {escrow.escrow_number}")
        return escrow

    # ============================================================
    # 마일스톤 관련
    # ============================================================

    async def submit_milestone(
        self,
        db: AsyncSession,
        milestone_id: UUID,
        user_id: UUID,
        data: MilestoneSubmitRequest
    ) -> EscrowMilestone:
        """마일스톤 완료 제출 (파트너)"""
        milestone = await db.get(EscrowMilestone, milestone_id)
        if not milestone:
            raise ValueError("Milestone not found")

        if milestone.status not in [MilestoneStatus.FUNDED, MilestoneStatus.IN_PROGRESS]:
            raise ValueError("Milestone is not in submittable status")

        milestone.status = MilestoneStatus.REVIEW
        milestone.submitted_at = datetime.utcnow()
        milestone.proof_description = data.proof_description
        milestone.proof_files = data.proof_files

        await db.commit()
        await db.refresh(milestone)

        logger.info(f"Milestone submitted: {milestone_id}")
        return milestone

    async def approve_milestone(
        self,
        db: AsyncSession,
        milestone_id: UUID,
        user_id: UUID
    ) -> EscrowMilestone:
        """마일스톤 승인 (고객)"""
        milestone = await db.get(EscrowMilestone, milestone_id)
        if not milestone:
            raise ValueError("Milestone not found")

        # 권한 확인
        escrow = await db.get(EscrowTransaction, milestone.escrow_id)
        if escrow.customer_id != user_id:
            raise ValueError("Only customer can approve milestone")

        if milestone.status != MilestoneStatus.REVIEW:
            raise ValueError("Milestone is not in review status")

        milestone.status = MilestoneStatus.APPROVED
        milestone.approved_at = datetime.utcnow()

        # 다음 마일스톤 활성화
        result = await db.execute(
            select(EscrowMilestone)
            .where(
                and_(
                    EscrowMilestone.escrow_id == milestone.escrow_id,
                    EscrowMilestone.sequence == milestone.sequence + 1
                )
            )
        )
        next_milestone = result.scalar_one_or_none()
        if next_milestone:
            next_milestone.status = MilestoneStatus.FUNDED

        # 모든 마일스톤 완료 확인
        all_result = await db.execute(
            select(func.count(EscrowMilestone.id))
            .where(
                and_(
                    EscrowMilestone.escrow_id == milestone.escrow_id,
                    EscrowMilestone.status != MilestoneStatus.APPROVED
                )
            )
        )
        remaining = all_result.scalar()

        if remaining == 0:
            escrow.status = EscrowStatus.COMPLETED
            escrow.completed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(milestone)

        logger.info(f"Milestone approved: {milestone_id}")
        return milestone

    async def reject_milestone(
        self,
        db: AsyncSession,
        milestone_id: UUID,
        user_id: UUID,
        reason: str
    ) -> EscrowMilestone:
        """마일스톤 거절 (고객)"""
        milestone = await db.get(EscrowMilestone, milestone_id)
        if not milestone:
            raise ValueError("Milestone not found")

        # 권한 확인
        escrow = await db.get(EscrowTransaction, milestone.escrow_id)
        if escrow.customer_id != user_id:
            raise ValueError("Only customer can reject milestone")

        if milestone.status != MilestoneStatus.REVIEW:
            raise ValueError("Milestone is not in review status")

        # 마일스톤 상태를 IN_PROGRESS로 변경 (재제출 가능)
        milestone.status = MilestoneStatus.IN_PROGRESS
        milestone.rejection_reason = reason
        milestone.rejected_at = datetime.utcnow()

        # 제출 정보 초기화 (재제출을 위해)
        milestone.submitted_at = None
        milestone.proof_description = None
        milestone.proof_files = None

        await db.commit()
        await db.refresh(milestone)

        logger.info(f"Milestone rejected: {milestone_id}, reason={reason}")
        return milestone

    # ============================================================
    # 채팅 관련
    # ============================================================

    async def send_message(
        self,
        db: AsyncSession,
        escrow_id: UUID,
        sender_id: UUID,
        data: MessageCreate
    ) -> Tuple[EscrowMessage, Optional[str]]:
        """메시지 전송 (연락처 탐지 적용)"""
        escrow = await db.get(EscrowTransaction, escrow_id)
        if not escrow:
            raise ValueError("Escrow transaction not found")

        # 권한 확인: 고객 또는 파트너
        if escrow.customer_id != sender_id:
            is_partner = await self._is_partner_of_transaction(
                db, sender_id, escrow.partner_id
            )
            if not is_partner:
                raise ValueError("Not authorized to send message in this transaction")

        # 연락처 탐지
        detection_result = contact_detection_service.analyze(data.content)
        warning_message = None

        if detection_result.detected:
            # 조치 결정
            action = await contact_detection_service.determine_action(db, sender_id, detection_result)

            if action == DetectionAction.BLOCKED:
                raise ValueError("Message blocked due to repeated contact sharing attempts")

            # 탐지 로그 기록
            log = await contact_detection_service.log_detection(
                db, sender_id, escrow_id, detection_result, action
            )

            # 경고 메시지
            violation_count = await contact_detection_service.get_violation_count(db, sender_id)
            warning_message = contact_detection_service.get_warning_message(action, violation_count)

        # 메시지 저장
        message = EscrowMessage(
            escrow_id=escrow_id,
            sender_id=sender_id,
            message_type=data.message_type,
            content=data.content,
            filtered_content=detection_result.filtered_content if detection_result.detected else None,
            attachments=data.attachments,
            contains_contact_info=detection_result.detected
        )

        db.add(message)

        # 에스크로 상태 업데이트 (첫 메시지 시)
        if escrow.status == EscrowStatus.FUNDED:
            escrow.status = EscrowStatus.IN_PROGRESS

        await db.commit()
        await db.refresh(message)

        return message, warning_message

    async def get_messages(
        self,
        db: AsyncSession,
        escrow_id: UUID,
        user_id: UUID,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """메시지 목록 조회"""
        escrow = await db.get(EscrowTransaction, escrow_id)
        if not escrow:
            return {"items": [], "total": 0, "unread_count": 0}

        # 전체 개수
        count_result = await db.execute(
            select(func.count(EscrowMessage.id))
            .where(EscrowMessage.escrow_id == escrow_id)
        )
        total = count_result.scalar()

        # 읽지 않은 메시지 개수
        unread_result = await db.execute(
            select(func.count(EscrowMessage.id))
            .where(
                and_(
                    EscrowMessage.escrow_id == escrow_id,
                    EscrowMessage.sender_id != user_id,
                    EscrowMessage.is_read == False
                )
            )
        )
        unread_count = unread_result.scalar()

        # 메시지 조회 (sender 관계 포함)
        offset = (page - 1) * page_size
        result = await db.execute(
            select(EscrowMessage)
            .options(selectinload(EscrowMessage.sender))
            .where(EscrowMessage.escrow_id == escrow_id)
            .order_by(EscrowMessage.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        messages = result.scalars().all()

        # 읽음 처리
        for msg in messages:
            if msg.sender_id != user_id and not msg.is_read:
                msg.is_read = True
                msg.read_at = datetime.utcnow()

        await db.commit()

        return {
            "items": list(reversed(messages)),  # 시간순 정렬
            "total": total,
            "unread_count": max(0, unread_count - len([m for m in messages if m.sender_id != user_id]))
        }

    # ============================================================
    # 정산 관련
    # ============================================================

    async def release_funds(
        self,
        db: AsyncSession,
        escrow_id: UUID,
        user_id: UUID
    ) -> EscrowTransaction:
        """파트너에게 정산"""
        escrow = await self.get_transaction(db, escrow_id, user_id)
        if not escrow:
            raise ValueError("Escrow transaction not found")

        if escrow.status != EscrowStatus.COMPLETED:
            raise ValueError("Escrow must be completed before release")

        # 모든 마일스톤 승인 확인
        for milestone in escrow.milestones:
            if milestone.status != MilestoneStatus.APPROVED:
                raise ValueError("All milestones must be approved")

        # 파트너 정산 계좌 정보 조회
        partner = await db.get(Partner, escrow.partner_id)
        if not partner:
            raise ValueError("Partner not found")

        # 정산 계좌 정보 확인
        if not partner.payout_bank or not partner.payout_account or not partner.payout_holder:
            raise ValueError("Partner payout account information is not set")

        # 은행 코드 조회
        bank_code = toss_payments_service.get_bank_code(partner.payout_bank)
        if not bank_code:
            logger.warning(f"Unknown bank name: {partner.payout_bank}")
            bank_code = partner.payout_bank  # 은행명 그대로 사용

        # 토스페이먼츠 정산 요청
        payout_result = await toss_payments_service.request_payout(
            bank_code=bank_code,
            account_number=partner.payout_account,
            holder_name=partner.payout_holder,
            amount=int(escrow.partner_payout),
            transfer_purpose=f"에스크로 정산 - {escrow.escrow_number}"
        )

        if not payout_result.success:
            logger.error(f"Payout failed: {payout_result.error_message}")
            raise ValueError(f"정산 처리 실패: {payout_result.error_message}")

        # 에스크로 정산 정보 저장
        escrow.payout_account_bank = partner.payout_bank
        escrow.payout_account_number = partner.payout_account[-4:]  # 마지막 4자리만 저장
        escrow.payout_account_holder = partner.payout_holder
        escrow.paid_at = datetime.utcnow()

        escrow.status = EscrowStatus.RELEASED
        escrow.released_at = datetime.utcnow()

        for milestone in escrow.milestones:
            milestone.status = MilestoneStatus.RELEASED
            milestone.released_at = datetime.utcnow()

        await db.commit()
        await db.refresh(escrow)

        logger.info(f"Escrow released: {escrow.escrow_number}, payout={escrow.partner_payout}")
        return escrow

    # ============================================================
    # 분쟁 관련
    # ============================================================

    async def create_dispute(
        self,
        db: AsyncSession,
        escrow_id: UUID,
        user_id: UUID,
        data: DisputeCreate
    ) -> EscrowDispute:
        """분쟁 제기"""
        escrow = await self.get_transaction(db, escrow_id, user_id)
        if not escrow:
            raise ValueError("Escrow transaction not found")

        dispute = EscrowDispute(
            escrow_id=escrow_id,
            raised_by=user_id,
            reason=data.reason,
            description=data.description,
            evidence_files=data.evidence_files
        )

        escrow.status = EscrowStatus.DISPUTED

        db.add(dispute)
        await db.commit()
        await db.refresh(dispute)

        logger.info(f"Dispute created for escrow: {escrow.escrow_number}")
        return dispute


# 싱글톤 인스턴스
escrow_service = EscrowService()
