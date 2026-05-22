"""
청구 누락검출 룰이 사용할 *실제 수가표* 로더.

기존 룰셋은 진찰료/처치료 금액을 파이썬 상수로 하드코딩했고, 그 코드(AA157 등)가
실제 시드된 hira_fee_codes 테이블(AA100/AA200 …)과도 맞지 않았다.

이 모듈은 DB의 hira_fee_codes / hira_disease_codes 에서 다음을 로드한다:
- FeeSchedule: code → unit_price (원). 룰은 여기서 실수가를 읽고, 없으면 폴백 상수 사용.
- chronic_dx: is_chronic=True 상병코드 집합.

DB 호출은 detector 바깥(엔드포인트)에서 1회 수행해 ctx로 주입한다.
detector / rules 자체는 순수 함수로 유지 → DB 없이 단위테스트 가능.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class FeeSchedule:
    """code → 단가(원) 조회. 코드가 없으면 fallback 반환."""

    prices: dict[str, int] = field(default_factory=dict)

    def price(self, code: str | None, fallback: int) -> int:
        if not code:
            return fallback
        return self.prices.get(code.upper(), fallback)

    def has(self, code: str | None) -> bool:
        return bool(code) and code.upper() in self.prices

    def __bool__(self) -> bool:
        return bool(self.prices)


async def load_fee_schedule(db: AsyncSession) -> FeeSchedule:
    """hira_fee_codes 활성 코드 → FeeSchedule.

    테이블이 비어있거나(시드 전) 조회 실패해도 빈 FeeSchedule 반환 →
    룰은 폴백 상수로 동작.
    """
    from ...models.hira_code import HIRAFeeCode

    prices: dict[str, int] = {}
    try:
        rows = (
            await db.execute(
                select(HIRAFeeCode.code, HIRAFeeCode.unit_price).where(
                    HIRAFeeCode.is_active.is_(True)
                )
            )
        ).all()
        for code, unit_price in rows:
            if code and unit_price is not None:
                prices[code.upper()] = int(unit_price)
    except Exception:
        # 테이블 미존재/마이그레이션 전 등 — 폴백 상수로 동작
        return FeeSchedule()

    return FeeSchedule(prices=prices)


async def load_chronic_dx(db: AsyncSession) -> Optional[set[str]]:
    """is_chronic=True 인 상병코드 집합. 조회 실패 시 None(룰 내장 상수 사용)."""
    from ...models.hira_code import HIRADiseaseCode

    try:
        rows = (
            await db.execute(
                select(HIRADiseaseCode.code).where(
                    HIRADiseaseCode.is_chronic.is_(True)
                )
            )
        ).scalars().all()
    except Exception:
        return None

    codes = {c.upper() for c in rows if c}
    return codes or None
