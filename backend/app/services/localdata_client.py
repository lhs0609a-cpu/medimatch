"""
LOCALDATA (localdata.go.kr) 클라이언트.
지방행정인허가데이터 — 의원/약국 영업/폐업 이력의 골든 데이터.

용도:
- 시군구×진료과 5년 폐업률 직접 계산
- 평균 영업 기간 (생존 시간) 측정
- 신규 개원 트렌드 (월별/분기별)
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import httpx
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)


class LocalDataClient:
    """LOCALDATA 인허가 API 클라이언트."""

    BASE_URL = "https://www.localdata.go.kr/platform/rest/TO0/openDataApi"
    # 의원 = 03_22_04_P (병의원 인허가) 등 — 실제 코드는 운영 중 검증 필요

    OPN_SVC_CODES = {
        "의원": "03_22_04_P",   # 병의원
        "약국": "03_22_05_P",   # 약국
        "치과": "03_22_03_P",   # 치과
        "한의원": "03_22_06_P",  # 한의원
    }

    def __init__(self):
        # data.go.kr 인증키 활용 (LOCALDATA는 별도 키 발급도 가능)
        self.api_key = (
            settings.MOIS_API_KEY
            or settings.HIRA_API_KEY
            or settings.BUILDING_API_KEY
            or ""
        )

    async def get_clinic_history(
        self,
        sido_cd: str,
        sggu_cd: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        category: str = "의원",
        page_size: int = 500,
    ) -> List[Dict[str, Any]]:
        """
        시군구의 의원 영업·폐업 이력 조회.

        Returns:
            [{
                'name': str, 'address': str, 'open_date': str, 'close_date': str,
                'status': '영업/폐업/휴업', 'biz_type': str
            }]
        """
        if not self.api_key:
            logger.warning("LOCALDATA: no API key configured")
            return []

        opn_svc_id = self.OPN_SVC_CODES.get(category, "03_22_04_P")

        # 기본: 최근 5년
        if not from_date:
            from_date = (datetime.now() - timedelta(days=365 * 5)).strftime("%Y%m%d")
        if not to_date:
            to_date = datetime.now().strftime("%Y%m%d")

        all_items = []
        page = 1

        try:
            async with httpx.AsyncClient() as client:
                while True:
                    params = {
                        "authKey": self.api_key,
                        "opnSvcId": opn_svc_id,
                        "lastModTsBgn": from_date,
                        "lastModTsEnd": to_date,
                        "pageIndex": page,
                        "pageSize": page_size,
                        "resultType": "json",
                    }
                    if sido_cd:
                        params["localCode"] = (
                            sido_cd + (sggu_cd or "")
                        )[:7]

                    response = await client.get(
                        self.BASE_URL,
                        params=params,
                        timeout=20.0,
                    )
                    response.raise_for_status()
                    data = response.json()

                    rows = (
                        data.get("result", {})
                        .get("body", {})
                        .get("rows", [])
                    )
                    if not rows:
                        break
                    if isinstance(rows, dict):
                        rows = [rows]

                    items = (
                        rows[0].get("row", []) if rows and isinstance(rows[0], dict) else []
                    )
                    if not items:
                        break

                    for it in items:
                        all_items.append({
                            "name": it.get("bplcNm", ""),
                            "address": it.get("siteWhlAddr", "") or it.get("rdnWhlAddr", ""),
                            "open_date": it.get("apvPermYmd", ""),
                            "close_date": it.get("dcbYmd", ""),
                            "status": it.get("trdStateNm", ""),
                            "biz_type": it.get("uptaeNm", ""),
                            "lat": float(it.get("y", 0) or 0),
                            "lng": float(it.get("x", 0) or 0),
                        })

                    if len(items) < page_size:
                        break
                    page += 1
                    if page > 10:  # max 5,000 records
                        break

        except Exception as e:
            logger.warning(f"LOCALDATA query failed: {e}")

        return all_items

    async def calculate_closure_rate(
        self,
        sido_cd: str,
        sggu_cd: str,
        years: int = 3,
    ) -> Dict[str, Any]:
        """
        시군구 의원 N년 폐업률 + 평균 영업기간.
        """
        from_date = (datetime.now() - timedelta(days=365 * years)).strftime("%Y%m%d")
        records = await self.get_clinic_history(
            sido_cd=sido_cd,
            sggu_cd=sggu_cd,
            from_date=from_date,
            category="의원",
        )

        if not records:
            return {
                "total": 0,
                "closed": 0,
                "open": 0,
                "closure_rate_percent": 0.0,
                "avg_lifespan_years": 0.0,
                "data_source": "LOCALDATA",
                "is_estimated": True,
            }

        total = len(records)
        closed = sum(1 for r in records if "폐업" in r.get("status", ""))
        open_count = sum(1 for r in records if "영업" in r.get("status", ""))

        # 평균 영업기간
        lifespans = []
        for r in records:
            if not r["open_date"] or not r["close_date"]:
                continue
            try:
                opened = datetime.strptime(r["open_date"][:8], "%Y%m%d")
                closed_dt = datetime.strptime(r["close_date"][:8], "%Y%m%d")
                lifespan = (closed_dt - opened).days / 365.25
                if 0 < lifespan < 50:
                    lifespans.append(lifespan)
            except (ValueError, TypeError):
                continue

        avg_lifespan = sum(lifespans) / len(lifespans) if lifespans else 0.0
        closure_rate = closed / total * 100 if total > 0 else 0.0

        return {
            "total": total,
            "closed": closed,
            "open": open_count,
            "closure_rate_percent": round(closure_rate, 2),
            "avg_lifespan_years": round(avg_lifespan, 1),
            "data_source": "LOCALDATA 인허가",
            "period_years": years,
            "is_estimated": False,
        }


localdata_client = LocalDataClient()
