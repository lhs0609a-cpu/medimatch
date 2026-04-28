"""
네이버 데이터랩 (datalab.naver.com) 검색 트렌드 클라이언트.
환자 의도(intent) 신호 — "정형외과 강남" 같은 키워드 검색량 추세.

쓰임:
- 진료과+지역 검색량 6개월 추세 → 환자 유입 정량화
- 트렌드 ↑ = 매출 보정 +5~15%
- 검색량 절대값은 비공개, 0~100 상대값만 가능
"""
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import httpx
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)


class NaverDatalabClient:
    """네이버 데이터랩 통합 검색어 트렌드 API."""

    BASE_URL = "https://openapi.naver.com/v1/datalab/search"

    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID") or getattr(settings, "NAVER_CLIENT_ID", "")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET") or getattr(settings, "NAVER_CLIENT_SECRET", "")

    async def get_search_trend(
        self,
        clinic_type: str,
        region_name: str = "",
        months: int = 6,
    ) -> Optional[Dict[str, Any]]:
        """
        진료과+지역 검색 트렌드 (월 단위).
        Returns:
            {
                'keyword': str,
                'months': int,
                'trend': [{'period': '2025-10', 'ratio': 80.5}, ...],
                'recent_avg': float,
                'past_avg': float,
                'momentum': float,  # +0.15 = 15% 상승, -0.10 = 10% 하락
                'data_source': str,
            }
        """
        if not self.client_id or not self.client_secret:
            logger.debug("Naver Datalab: credentials not configured")
            return None

        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=30 * months)).strftime("%Y-%m-%d")

        keyword = f"{region_name} {clinic_type}".strip() if region_name else clinic_type

        body = {
            "startDate": start_date,
            "endDate": end_date,
            "timeUnit": "month",
            "keywordGroups": [
                {
                    "groupName": keyword,
                    "keywords": [keyword, clinic_type],
                }
            ],
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.BASE_URL,
                    headers={
                        "X-Naver-Client-Id": self.client_id,
                        "X-Naver-Client-Secret": self.client_secret,
                        "Content-Type": "application/json",
                    },
                    content=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()

                results = data.get("results", [])
                if not results:
                    return None

                points = results[0].get("data", [])
                if not points:
                    return None

                trend = [
                    {"period": p.get("period", ""), "ratio": p.get("ratio", 0)}
                    for p in points
                ]

                # 최근 3개월 vs 이전 3개월 모멘텀
                if len(points) >= 6:
                    recent = sum(p["ratio"] for p in trend[-3:]) / 3
                    past = sum(p["ratio"] for p in trend[:3]) / 3
                    momentum = (recent - past) / past if past > 0 else 0
                else:
                    recent = sum(p["ratio"] for p in trend) / len(trend)
                    past = recent
                    momentum = 0.0

                return {
                    "keyword": keyword,
                    "months": months,
                    "trend": trend,
                    "recent_avg": round(recent, 1),
                    "past_avg": round(past, 1),
                    "momentum": round(momentum, 3),
                    "data_source": "네이버 데이터랩",
                }
        except Exception as e:
            logger.warning(f"Naver Datalab API failed: {e}")
            return None

    @staticmethod
    def momentum_to_revenue_factor(momentum: float) -> float:
        """검색 모멘텀 → 매출 보정계수 (±15% 한도)."""
        # 모멘텀 +0.30 → 매출 +9%, -0.30 → -9%
        return max(0.85, min(1.15, 1.0 + momentum * 0.30))


naver_datalab_client = NaverDatalabClient()
