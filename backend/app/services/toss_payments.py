"""
토스페이먼츠 결제 서비스
- 결제 정보 생성
- 결제 승인
- 정산 처리
"""
import logging
import httpx
import base64
from typing import Dict, Any, Optional
from decimal import Decimal
from dataclasses import dataclass

from ..core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PaymentInfo:
    """결제 정보"""
    order_id: str
    amount: int
    order_name: str
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    success_url: str = ""
    fail_url: str = ""


@dataclass
class PaymentResult:
    """결제 승인 결과"""
    success: bool
    payment_key: Optional[str] = None
    order_id: Optional[str] = None
    amount: Optional[int] = None
    status: Optional[str] = None
    method: Optional[str] = None
    approved_at: Optional[str] = None
    receipt_url: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None


@dataclass
class PayoutResult:
    """정산 결과"""
    success: bool
    payout_key: Optional[str] = None
    amount: Optional[int] = None
    status: Optional[str] = None
    settled_at: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class TossPaymentsService:
    """토스페이먼츠 결제 서비스"""

    BASE_URL = "https://api.tosspayments.com/v1"

    def __init__(self):
        self.client_key = settings.TOSS_CLIENT_KEY
        self.secret_key = settings.TOSS_SECRET_KEY

    def _get_auth_header(self) -> Dict[str, str]:
        """Basic 인증 헤더 생성"""
        auth_string = f"{self.secret_key}:"
        encoded = base64.b64encode(auth_string.encode()).decode()
        return {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json"
        }

    def create_payment_info(
        self,
        order_id: str,
        amount: int,
        order_name: str,
        success_url: str,
        fail_url: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        customer_phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        결제창 호출을 위한 정보 생성

        프론트엔드에서 토스페이먼츠 SDK를 사용하여 결제창을 호출할 때 필요한 정보
        """
        return {
            "clientKey": self.client_key,
            "orderId": order_id,
            "amount": amount,
            "orderName": order_name,
            "successUrl": success_url,
            "failUrl": fail_url,
            "customerEmail": customer_email,
            "customerName": customer_name,
            "customerMobilePhone": customer_phone,
        }

    async def confirm_payment(
        self,
        payment_key: str,
        order_id: str,
        amount: int
    ) -> PaymentResult:
        """
        결제 승인

        사용자가 결제를 완료하면 success_url로 리다이렉트되며,
        이때 받은 paymentKey, orderId, amount로 승인을 요청
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/payments/confirm",
                    headers=self._get_auth_header(),
                    json={
                        "paymentKey": payment_key,
                        "orderId": order_id,
                        "amount": amount
                    },
                    timeout=30.0
                )

                data = response.json()

                if response.status_code == 200:
                    logger.info(f"Payment confirmed: {order_id}, amount={amount}")
                    return PaymentResult(
                        success=True,
                        payment_key=data.get("paymentKey"),
                        order_id=data.get("orderId"),
                        amount=data.get("totalAmount"),
                        status=data.get("status"),
                        method=data.get("method"),
                        approved_at=data.get("approvedAt"),
                        receipt_url=data.get("receipt", {}).get("url")
                    )
                else:
                    logger.error(f"Payment confirmation failed: {data}")
                    return PaymentResult(
                        success=False,
                        error_code=data.get("code"),
                        error_message=data.get("message")
                    )

        except httpx.TimeoutException:
            logger.error(f"Payment confirmation timeout: {order_id}")
            return PaymentResult(
                success=False,
                error_code="TIMEOUT",
                error_message="결제 승인 요청 시간이 초과되었습니다."
            )
        except Exception as e:
            logger.exception(f"Payment confirmation error: {e}")
            return PaymentResult(
                success=False,
                error_code="UNKNOWN_ERROR",
                error_message=str(e)
            )

    async def get_payment(self, payment_key: str) -> Optional[Dict[str, Any]]:
        """결제 정보 조회"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/payments/{payment_key}",
                    headers=self._get_auth_header(),
                    timeout=30.0
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Get payment failed: {response.json()}")
                    return None

        except Exception as e:
            logger.exception(f"Get payment error: {e}")
            return None

    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str,
        cancel_amount: Optional[int] = None
    ) -> PaymentResult:
        """
        결제 취소 (환불)

        cancel_amount가 None이면 전액 취소, 있으면 부분 취소
        """
        try:
            payload = {"cancelReason": cancel_reason}
            if cancel_amount:
                payload["cancelAmount"] = cancel_amount

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/payments/{payment_key}/cancel",
                    headers=self._get_auth_header(),
                    json=payload,
                    timeout=30.0
                )

                data = response.json()

                if response.status_code == 200:
                    logger.info(f"Payment cancelled: {payment_key}")
                    return PaymentResult(
                        success=True,
                        payment_key=data.get("paymentKey"),
                        order_id=data.get("orderId"),
                        amount=data.get("totalAmount"),
                        status=data.get("status")
                    )
                else:
                    logger.error(f"Payment cancellation failed: {data}")
                    return PaymentResult(
                        success=False,
                        error_code=data.get("code"),
                        error_message=data.get("message")
                    )

        except Exception as e:
            logger.exception(f"Payment cancellation error: {e}")
            return PaymentResult(
                success=False,
                error_code="UNKNOWN_ERROR",
                error_message=str(e)
            )

    async def request_payout(
        self,
        bank_code: str,
        account_number: str,
        holder_name: str,
        amount: int,
        transfer_purpose: str = "에스크로 정산"
    ) -> PayoutResult:
        """
        정산 요청 (계좌이체)

        토스페이먼츠 정산 API를 통해 파트너에게 금액 송금

        참고: 토스페이먼츠의 실제 정산은 자동 정산 주기(D+1~D+7)에 따라 처리됩니다.
        이 함수는 커스텀 정산 또는 수동 송금 시나리오를 위한 것입니다.
        실제 프로덕션에서는 토스페이먼츠의 정산 정책에 따라 구현해야 합니다.
        """
        try:
            # 토스페이먼츠 브랜드페이 정산 API 또는 송금 API 사용
            # 여기서는 정산 기록만 남기고 실제 송금은 별도 처리
            logger.info(
                f"Payout requested: bank={bank_code}, account=****{account_number[-4:]}, "
                f"holder={holder_name}, amount={amount}"
            )

            # 실제 구현 시 토스페이먼츠 정산 API 또는 계좌이체 API 호출
            # 현재는 성공으로 가정
            return PayoutResult(
                success=True,
                amount=amount,
                status="REQUESTED"
            )

        except Exception as e:
            logger.exception(f"Payout request error: {e}")
            return PayoutResult(
                success=False,
                error_code="UNKNOWN_ERROR",
                error_message=str(e)
            )

    def get_bank_code(self, bank_name: str) -> Optional[str]:
        """은행명으로 은행 코드 조회"""
        bank_codes = {
            "경남은행": "039",
            "광주은행": "034",
            "국민은행": "004",
            "기업은행": "003",
            "농협": "011",
            "농협중앙회": "012",
            "대구은행": "031",
            "부산은행": "032",
            "산업은행": "002",
            "새마을금고": "045",
            "수협": "007",
            "신한은행": "088",
            "신협": "048",
            "외환은행": "005",
            "우리은행": "020",
            "우체국": "071",
            "전북은행": "037",
            "제주은행": "035",
            "카카오뱅크": "090",
            "케이뱅크": "089",
            "토스뱅크": "092",
            "하나은행": "081",
            "한국씨티은행": "027",
            "SC제일은행": "023",
        }
        return bank_codes.get(bank_name)


# 싱글톤 인스턴스
toss_payments_service = TossPaymentsService()
