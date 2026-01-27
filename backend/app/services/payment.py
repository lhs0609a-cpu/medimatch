"""
결제 서비스 (Toss Payments 연동)
"""
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
import base64
import logging
import os

from app.models.partner_subscription import SUBSCRIPTION_PLANS, SubscriptionPlan

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
# 주의: SalesScanner 구독 가격은 partner_subscription.py의 SUBSCRIPTION_PLANS와 동기화됨
PRODUCTS = {
    "simulation_report": {
        "name": "개원 시뮬레이션 리포트",
        "price": 30000,
        "description": "AI 기반 개원 시뮬레이션 상세 리포트",
    },
    "sales_scanner_basic": {
        "name": "SalesScanner 베이직 (월)",
        "price": SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC]["monthly_fee"],  # 300,000원
        "description": f"월 {SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC]['leads_per_month']}건 리드 제공",
        "plan": SubscriptionPlan.BASIC,
    },
    "sales_scanner_standard": {
        "name": "SalesScanner 스탠다드 (월)",
        "price": SUBSCRIPTION_PLANS[SubscriptionPlan.STANDARD]["monthly_fee"],  # 500,000원
        "description": f"월 {SUBSCRIPTION_PLANS[SubscriptionPlan.STANDARD]['leads_per_month']}건 리드 + 우선 노출",
        "plan": SubscriptionPlan.STANDARD,
    },
    "sales_scanner_premium": {
        "name": "SalesScanner 프리미엄 (월)",
        "price": SUBSCRIPTION_PLANS[SubscriptionPlan.PREMIUM]["monthly_fee"],  # 1,000,000원
        "description": "무제한 리드 + 최상단 노출 + 프리미엄 배지",
        "plan": SubscriptionPlan.PREMIUM,
    },
    "sales_scanner_basic_yearly": {
        "name": "SalesScanner 베이직 (연)",
        "price": SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC]["monthly_fee"] * 10,  # 10개월분 (2개월 무료)
        "description": "베이직 연간 구독 (2개월 무료)",
        "plan": SubscriptionPlan.BASIC,
    },
    "pharmmatch_contact_partial": {
        "name": "PharmMatch 부분 정보 공개",
        "price": 50000,
        "description": "매물 재무 범위 정보 열람",
    },
    "pharmmatch_contact_full": {
        "name": "PharmMatch 전체 정보 공개",
        "price": 100000,
        "description": "매물 상세 정보 및 연락처 열람",
    },
    "sales_match_request": {
        "name": "의사 매칭 요청",
        "price": 300000,
        "description": "개원 준비중 의사에게 영업 요청 (수락 시 연락처 공개, 거절/무응답 시 환불)",
    },
    # ===== 약국 양도양수 컨설팅 서비스 =====
    "pharmacy_consulting_basic": {
        "name": "매칭 컨설팅 베이직",
        "price": 500000,
        "description": "3개 매물 연결 + 기본 상담",
        "category": "consulting",
        "features": [
            "맞춤 매물 3건 추천",
            "매물 상세 정보 열람",
            "양도인 연락처 제공",
            "기본 상담 1회",
        ],
    },
    "pharmacy_consulting_premium": {
        "name": "매칭 컨설팅 프리미엄",
        "price": 1500000,
        "description": "무제한 매물 + 협상 지원 + 계약 동행",
        "category": "consulting",
        "features": [
            "무제한 매물 추천",
            "전담 컨설턴트 배정",
            "권리금 협상 지원",
            "계약 동행 서비스",
            "법률 검토 지원",
            "3개월 사후 관리",
        ],
        "recommended": True,
    },
    "pharmacy_consulting_vip": {
        "name": "VIP 토탈 케어",
        "price": 3000000,
        "description": "All-in-One 양도양수 대행",
        "category": "consulting",
        "features": [
            "프리미엄 서비스 전체 포함",
            "실사 대행",
            "자금 조달 컨설팅",
            "인허가 변경 대행",
            "인테리어 연계",
            "개국 후 6개월 운영 컨설팅",
        ],
    },
    # ===== 건물주 구독 서비스 =====
    "landlord_starter": {
        "name": "건물주 스타터 (월)",
        "price": 99000,
        "description": "매물 1개 등록, 기본 노출",
        "category": "landlord_subscription",
        "tier": "starter",
        "features": [
            "매물 1개 등록",
            "기본 검색 노출",
            "문의 알림",
            "기본 통계",
        ],
    },
    "landlord_pro": {
        "name": "건물주 프로 (월)",
        "price": 299000,
        "description": "매물 3개, 상위 노출, 월 5회 매칭",
        "category": "landlord_subscription",
        "tier": "pro",
        "features": [
            "매물 3개 등록",
            "검색 상위 노출",
            "월 5회 매칭 요청권",
            "상세 통계 리포트",
            "프로 배지 표시",
        ],
        "matching_requests_per_month": 5,
        "recommended": True,
    },
    "landlord_premium": {
        "name": "건물주 프리미엄 (월)",
        "price": 599000,
        "description": "무제한 등록, 최상위 노출, 무제한 매칭",
        "category": "landlord_subscription",
        "tier": "premium",
        "features": [
            "무제한 매물 등록",
            "검색 최상위 노출",
            "무제한 매칭 요청권",
            "전담 매니저 배정",
            "프리미엄 배지",
            "홈페이지 배너 노출 (월 1회)",
        ],
        "matching_requests_per_month": -1,  # unlimited
    },
    "landlord_pro_yearly": {
        "name": "건물주 프로 (연)",
        "price": 2990000,  # 10개월분 (2개월 무료)
        "description": "프로 연간 구독 (2개월 무료)",
        "category": "landlord_subscription",
        "tier": "pro",
        "features": [
            "프로 플랜 전체 혜택",
            "우선 매칭 기회",
            "2개월 무료 혜택",
        ],
    },
    # ===== 건물주 매칭 서비스 (양방향 동의 기반) =====
    "landlord_matching_request": {
        "name": "매칭 요청",
        "price": 50000,
        "description": "관심 회원에게 매칭 요청 발송 (상대방 수락 시에만 연락처 공개)",
        "category": "landlord_matching",
    },
    "landlord_matching_pack_5": {
        "name": "매칭 요청 5회권",
        "price": 200000,  # 20% 할인
        "description": "매칭 요청 5회 (20% 할인)",
        "category": "landlord_matching",
        "count": 5,
    },
    "landlord_matching_pack_10": {
        "name": "매칭 요청 10회권",
        "price": 350000,  # 30% 할인
        "description": "매칭 요청 10회 (30% 할인)",
        "category": "landlord_matching",
        "count": 10,
    },
    # ===== 건물주 광고/부스팅 =====
    "landlord_boost_top": {
        "name": "검색 상위 노출 (1주)",
        "price": 300000,
        "description": "검색 결과 상위 3위 내 노출 보장",
        "category": "landlord_ad",
        "duration_days": 7,
        "ad_type": "search_top",
    },
    "landlord_boost_featured": {
        "name": "추천 매물 배지 (1주)",
        "price": 200000,
        "description": "추천 매물 배지 + 하이라이트 표시",
        "category": "landlord_ad",
        "duration_days": 7,
        "ad_type": "featured",
    },
    "landlord_banner_home": {
        "name": "홈 배너 광고 (1주)",
        "price": 500000,
        "description": "메인페이지 상단 배너 노출",
        "category": "landlord_ad",
        "duration_days": 7,
        "ad_type": "home_banner",
    },
    "landlord_push_notification": {
        "name": "타겟 푸시 알림",
        "price": 100000,
        "description": "관심 지역 의사/약사에게 푸시 발송 (최대 1000명)",
        "category": "landlord_ad",
        "ad_type": "push",
        "max_recipients": 1000,
    },
    "landlord_email_campaign": {
        "name": "이메일 마케팅",
        "price": 200000,
        "description": "뉴스레터에 매물 소개 포함",
        "category": "landlord_ad",
        "ad_type": "email",
    },
    "landlord_premium_package": {
        "name": "프리미엄 광고 패키지 (1개월)",
        "price": 1500000,
        "description": "상위노출 + 배너 + 푸시 + 이메일 (30% 할인)",
        "category": "landlord_ad",
        "duration_days": 30,
        "ad_type": "package",
        "includes": ["search_top", "home_banner", "push", "email"],
    },
}

# 건물주 입주 성사 수수료
LANDLORD_SUCCESS_FEE = {
    "monthly_rent_months": 1,  # 월세 1개월분
    "deposit_rate": 0.01,  # 또는 보증금의 1%
    "min_fee": 500000,  # 최소 50만원
    "max_fee": 10000000,  # 최대 1000만원
}


def calculate_landlord_success_fee(monthly_rent: int, deposit: int) -> int:
    """
    건물주 입주 성사 수수료 계산

    Args:
        monthly_rent: 월세 (원)
        deposit: 보증금 (원)

    Returns:
        성사 수수료 (원) - 월세 1개월분과 보증금 1% 중 큰 금액
    """
    fee_by_rent = monthly_rent
    fee_by_deposit = int(deposit * LANDLORD_SUCCESS_FEE["deposit_rate"])

    fee = max(fee_by_rent, fee_by_deposit)
    fee = max(fee, LANDLORD_SUCCESS_FEE["min_fee"])
    fee = min(fee, LANDLORD_SUCCESS_FEE["max_fee"])

    return fee

# 성사 보수 요율
SUCCESS_FEE_RATES = {
    "default": 0.025,  # 기본 2.5%
    "premium_member": 0.02,  # 프리미엄 회원 2%
    "vip_member": 0.015,  # VIP 회원 1.5%
    "min_fee": 1000000,  # 최소 100만원
    "max_fee": 30000000,  # 최대 3000만원
}


def calculate_success_fee(premium_amount: int, member_tier: str = "default") -> int:
    """
    성사 보수 계산

    Args:
        premium_amount: 권리금 (원)
        member_tier: 회원 등급 (default, premium_member, vip_member)

    Returns:
        성사 보수 금액 (원)
    """
    rate = SUCCESS_FEE_RATES.get(member_tier, SUCCESS_FEE_RATES["default"])
    fee = int(premium_amount * rate)

    # 최소/최대 금액 적용
    fee = max(fee, SUCCESS_FEE_RATES["min_fee"])
    fee = min(fee, SUCCESS_FEE_RATES["max_fee"])

    return fee


def get_product_info(product_id: str) -> Optional[Dict[str, Any]]:
    """상품 정보 조회"""
    return PRODUCTS.get(product_id)


def generate_order_id(user_id: int, product_id: str) -> str:
    """주문 ID 생성"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"MM{user_id}_{product_id}_{timestamp}"


# 싱글톤 인스턴스
payment_service = PaymentService()
