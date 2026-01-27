"""
영업사원 매칭 관련 Celery 태스크

- 48시간 무응답 매칭 요청 자동 만료 및 환불
- 매칭 관련 알림 발송
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_app import celery_app
from app.core.database import async_session
from app.models.sales_match import (
    SalesMatchRequest,
    MatchRequestStatus,
    DoctorResponse,
    RESPONSE_TIMEOUT_HOURS
)
from app.models.payment import Payment, PaymentStatus
from app.services.payment import payment_service

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.sales_match_tasks.expire_pending_match_requests")
def expire_pending_match_requests():
    """
    48시간 초과된 매칭 요청 자동 만료 및 환불 처리

    - 매 시간 실행 (celery beat)
    - PENDING 상태 + expires_at 초과 건 검색
    - 상태를 EXPIRED로 변경
    - 결제 취소 및 환불 처리
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_expire_pending_match_requests_async())


async def _expire_pending_match_requests_async():
    """비동기 만료 처리"""
    async with async_session() as db:
        try:
            now = datetime.utcnow()

            # 만료된 PENDING 요청 조회
            result = await db.execute(
                select(SalesMatchRequest).where(
                    SalesMatchRequest.status == MatchRequestStatus.PENDING,
                    SalesMatchRequest.expires_at < now
                )
            )
            expired_requests = result.scalars().all()

            if not expired_requests:
                logger.info("No expired match requests found")
                return {"expired_count": 0, "refunded_count": 0}

            logger.info(f"Found {len(expired_requests)} expired match requests")

            expired_count = 0
            refunded_count = 0
            errors = []

            for request in expired_requests:
                try:
                    # 상태 업데이트: PENDING -> EXPIRED
                    request.status = MatchRequestStatus.EXPIRED
                    request.doctor_response = DoctorResponse.EXPIRED
                    request.responded_at = now

                    # 결제가 있는 경우 환불 처리
                    if request.payment_id:
                        payment_result = await db.execute(
                            select(Payment).where(Payment.id == request.payment_id)
                        )
                        payment = payment_result.scalar_one_or_none()

                        if payment and payment.status == PaymentStatus.COMPLETED and payment.payment_key:
                            # 토스페이먼츠 환불 요청
                            cancel_result = await payment_service.cancel_payment(
                                payment_key=payment.payment_key,
                                cancel_reason=f"48시간 무응답 자동 환불 (요청ID: {request.id})",
                                cancel_amount=None  # 전액 환불
                            )

                            if cancel_result.get("success") != False:
                                # 환불 성공
                                payment.status = PaymentStatus.REFUNDED
                                payment.cancel_reason = "48시간 무응답 자동 환불"
                                payment.canceled_at = now

                                request.status = MatchRequestStatus.REFUNDED
                                request.refunded_at = now
                                request.refund_reason = "48시간 무응답"

                                refunded_count += 1
                                logger.info(f"Refunded match request {request.id}, payment {payment.id}")
                            else:
                                # 환불 실패 - 수동 처리 필요 알림
                                error_msg = cancel_result.get("error", "Unknown error")
                                errors.append({
                                    "request_id": str(request.id),
                                    "payment_id": payment.id,
                                    "error": error_msg
                                })
                                logger.error(f"Failed to refund match request {request.id}: {error_msg}")

                    expired_count += 1

                except Exception as e:
                    logger.error(f"Error processing match request {request.id}: {e}")
                    errors.append({
                        "request_id": str(request.id),
                        "error": str(e)
                    })

            await db.commit()

            result = {
                "expired_count": expired_count,
                "refunded_count": refunded_count,
                "errors": errors if errors else None
            }

            logger.info(f"Expire task completed: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in expire_pending_match_requests: {e}")
            await db.rollback()
            raise


@celery_app.task(name="app.tasks.sales_match_tasks.send_match_request_reminder")
def send_match_request_reminder():
    """
    매칭 요청 응답 리마인더 발송

    - 24시간 경과 + 아직 PENDING인 요청에 대해 의사에게 리마인더 발송
    - 매 6시간 실행
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_send_match_request_reminder_async())


async def _send_match_request_reminder_async():
    """비동기 리마인더 발송"""
    async with async_session() as db:
        try:
            now = datetime.utcnow()
            # 24시간 전 = 생성 후 24시간 이상 경과
            reminder_threshold = now - timedelta(hours=24)
            # 12시간 전 = 너무 최근에 생성된 건 제외
            recent_threshold = now - timedelta(hours=12)

            result = await db.execute(
                select(SalesMatchRequest).where(
                    SalesMatchRequest.status == MatchRequestStatus.PENDING,
                    SalesMatchRequest.created_at < reminder_threshold,
                    SalesMatchRequest.created_at > recent_threshold - timedelta(hours=12),
                    SalesMatchRequest.expires_at > now  # 아직 만료되지 않은 건
                )
            )
            pending_requests = result.scalars().all()

            if not pending_requests:
                logger.info("No pending requests need reminder")
                return {"reminder_sent": 0}

            reminder_sent = 0
            for request in pending_requests:
                # TODO: 실제 알림 발송 로직 (이메일, 푸시 등)
                # from app.services.notification import send_notification
                # await send_notification(
                #     user_id=request.doctor_id,
                #     title="매칭 요청 응답 대기 중",
                #     body=f"영업사원으로부터 매칭 요청이 있습니다. {request.time_remaining.total_seconds() // 3600:.0f}시간 내 응답해주세요.",
                #     link=f"/doctor/sales-requests/{request.id}"
                # )
                reminder_sent += 1
                logger.info(f"Reminder sent for match request {request.id} to doctor {request.doctor_id}")

            return {"reminder_sent": reminder_sent}

        except Exception as e:
            logger.error(f"Error in send_match_request_reminder: {e}")
            raise


@celery_app.task(name="app.tasks.sales_match_tasks.process_rejected_match_refund")
def process_rejected_match_refund(request_id: str):
    """
    거절된 매칭 요청 환불 처리 (실시간 처리용)

    의사가 거절했을 때 바로 환불 처리
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(
        _process_rejected_match_refund_async(request_id)
    )


async def _process_rejected_match_refund_async(request_id: str):
    """비동기 거절 환불 처리"""
    async with async_session() as db:
        try:
            from uuid import UUID

            result = await db.execute(
                select(SalesMatchRequest).where(
                    SalesMatchRequest.id == UUID(request_id)
                )
            )
            request = result.scalar_one_or_none()

            if not request:
                logger.error(f"Match request not found: {request_id}")
                return {"success": False, "error": "Request not found"}

            if request.status != MatchRequestStatus.REJECTED:
                logger.warning(f"Request {request_id} is not in REJECTED status")
                return {"success": False, "error": "Request is not rejected"}

            if not request.payment_id:
                logger.warning(f"Request {request_id} has no payment")
                return {"success": True, "message": "No payment to refund"}

            payment_result = await db.execute(
                select(Payment).where(Payment.id == request.payment_id)
            )
            payment = payment_result.scalar_one_or_none()

            if not payment or payment.status != PaymentStatus.COMPLETED:
                return {"success": True, "message": "Payment already refunded or not completed"}

            # 환불 처리
            cancel_result = await payment_service.cancel_payment(
                payment_key=payment.payment_key,
                cancel_reason=f"의사 거절로 인한 환불 (요청ID: {request_id})",
                cancel_amount=None
            )

            if cancel_result.get("success") != False:
                payment.status = PaymentStatus.REFUNDED
                payment.cancel_reason = "의사 거절"
                payment.canceled_at = datetime.utcnow()

                request.status = MatchRequestStatus.REFUNDED
                request.refunded_at = datetime.utcnow()
                request.refund_reason = "의사 거절"

                await db.commit()
                logger.info(f"Refunded rejected match request {request_id}")
                return {"success": True, "message": "Refund completed"}
            else:
                error_msg = cancel_result.get("error", "Unknown error")
                logger.error(f"Failed to refund rejected request {request_id}: {error_msg}")
                return {"success": False, "error": error_msg}

        except Exception as e:
            logger.error(f"Error processing rejected refund for {request_id}: {e}")
            await db.rollback()
            return {"success": False, "error": str(e)}
