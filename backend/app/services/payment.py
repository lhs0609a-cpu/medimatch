"""
결제 서비스 (Toss Payments 연동)
"""
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
import base64
import logging
import os

logger = logging.getLogger(__name__)

TOSS_SECRET_KEY = os.getenv("TOSS_SECRET_KEY", "test_sk_xxx")
TOSS_CLIENT_KEY = os.getenv("TOSS_CLIENT_KEY", "test_ck_xxx")
TOSS_API_URL = "https://api.tosspayments.com/v1"


class PaymentService:
    """토스페이먼츠 결제 서비스"""

    def __init__(self):
        self.secret_key = TOSS_SECRET_KEY
        self.client_key = TOSS_CLIENT_KEY
        self.base_url = TOSS_API_URL

    def _get_auth_header(self) -> str:
        """Basic Auth 헤더 생성"""
        credentials = f"{self.secret_key}:"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    async def create_payment(
        self,
        order_id: str,
        amount: int,
        order_name: str,
        customer_name: str,
        customer_email: str,
        success_url: str,
        fail_url: str,
        method: str = "카드"
    ) -> Dict[str, Any]:
        """
        결제 요청 생성

        Args:
            order_id: 주문 ID
            amount: 결제 금액
            order_name: 주문명
            customer_name: 고객명
            customer_email: 고객 이메일
            success_url: 성공 리다이렉트 URL
            fail_url: 실패 리다이렉트 URL
            method: 결제 수단 (카드, 가상계좌, 계좌이체 등)

        Returns:
            결제 요청 정보
        """
        logger.info(f"Creating payment: {order_id}, amount: {amount}")

        return {
            "orderId": order_id,
            "amount": amount,
            "orderName": order_name,
            "customerName": customer_name,
            "customerEmail": customer_email,
            "successUrl": success_url,
            "failUrl": fail_url,
            "method": method,
            "clientKey": self.client_key,
        }

    async def confirm_payment(
        self,
        payment_key: str,
        order_id: str,
        amount: int
    ) -> Dict[str, Any]:
        """
        결제 승인

        Args:
            payment_key: 결제 키
            order_id: 주문 ID
            amount: 결제 금액

        Returns:
            결제 승인 결과
        """
        logger.info(f"Confirming payment: {payment_key}")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/payments/confirm",
                    headers={
                        "Authorization": self._get_auth_header(),
                        "Content-Type": "application/json",
                    },
                    json={
                        "paymentKey": payment_key,
                        "orderId": order_id,
                        "amount": amount,
                    }
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    error_data = response.json()
                    logger.error(f"Payment confirmation failed: {error_data}")
                    return {
                        "success": False,
                        "error": error_data.get("message", "결제 승인 실패"),
                        "code": error_data.get("code"),
                    }

            except Exception as e:
                logger.error(f"Payment confirmation error: {e}")
                return {
                    "success": False,
                    "error": str(e),
                }

    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str,
        cancel_amount: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        결제 취소

        Args:
            payment_key: 결제 키
            cancel_reason: 취소 사유
            cancel_amount: 부분 취소 금액 (None이면 전액 취소)

        Returns:
            취소 결과
        """
        logger.info(f"Canceling payment: {payment_key}")

        async with httpx.AsyncClient() as client:
            try:
                body = {"cancelReason": cancel_reason}
                if cancel_amount:
                    body["cancelAmount"] = cancel_amount

                response = await client.post(
                    f"{self.base_url}/payments/{payment_key}/cancel",
                    headers={
                        "Authorization": self._get_auth_header(),
                        "Content-Type": "application/json",
                    },
                    json=body
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    error_data = response.json()
                    logger.error(f"Payment cancel failed: {error_data}")
                    return {
                        "success": False,
                        "error": error_data.get("message", "결제 취소 실패"),
                    }

            except Exception as e:
                logger.error(f"Payment cancel error: {e}")
                return {
                    "success": False,
                    "error": str(e),
                }

    async def get_payment(self, payment_key: str) -> Dict[str, Any]:
        """
        결제 정보 조회

        Args:
            payment_key: 결제 키

        Returns:
            결제 정보
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/payments/{payment_key}",
                    headers={
                        "Authorization": self._get_auth_header(),
                    }
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": "결제 정보를 찾을 수 없습니다."}

            except Exception as e:
                logger.error(f"Get payment error: {e}")
                return {"error": str(e)}


# 결제 상품 정보
PRODUCTS = {
    "simulation_report": {
        "name": "개원 시뮬레이션 리포트",
        "price": 30000,
        "description": "AI 기반 개원 시뮬레이션 상세 리포트",
    },
    "sales_scanner_monthly": {
        "name": "SalesScanner 월 구독",
        "price": 30000,
        "description": "영업 입지 탐색 월간 구독",
    },
    "sales_scanner_yearly": {
        "name": "SalesScanner 연 구독",
        "price": 300000,
        "description": "영업 입지 탐색 연간 구독 (2개월 무료)",
    },
    "pharmmatch_premium": {
        "name": "PharmMatch 프리미엄",
        "price": 50000,
        "description": "프리미엄 슬롯 매칭 서비스",
    },
}


def get_product_info(product_id: str) -> Optional[Dict[str, Any]]:
    """상품 정보 조회"""
    return PRODUCTS.get(product_id)


def generate_order_id(user_id: int, product_id: str) -> str:
    """주문 ID 생성"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"MM{user_id}_{product_id}_{timestamp}"


# 싱글톤 인스턴스
payment_service = PaymentService()
