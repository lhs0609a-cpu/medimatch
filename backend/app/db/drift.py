"""
Tier 3 — Schema drift detector.

SQLAlchemy Base.metadata와 실제 PostgreSQL 스키마를 비교해
누락 테이블·컬럼을 startup 시 1회 감지. 발견 시 ERROR 로그.

drift는 보통 다음 상황에서 발생:
- 모델에 컬럼 추가했지만 마이그레이션 작성 누락
- 마이그레이션은 있지만 release_command가 실패해서 미적용
- 두 머신이 다른 버전의 코드를 실행 중

치명적이지 않은 경고이지만, 곧 발생할 500의 사전 시그널이라
선명하게 보이도록 함.
"""
import logging
from typing import List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger("mediplaton.drift")


async def detect_drift(engine: AsyncEngine, base_metadata) -> List[str]:
    """
    Returns drift issues as readable strings.
    빈 리스트면 모델과 DB가 동기화 상태.
    """
    issues: List[str] = []

    async with engine.connect() as conn:
        # 1) 현재 DB의 public 스키마 테이블 목록
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public'"
        ))
        live_tables = {row[0] for row in result}

        model_tables = set(base_metadata.tables.keys())

        # 2) 모델에는 있는데 DB에 없는 테이블
        for t in sorted(model_tables - live_tables):
            issues.append(f"MISSING TABLE: {t}")

        # 3) 양쪽에 존재하는 테이블에 대해 컬럼 비교
        common_tables = sorted(model_tables & live_tables)
        for table_name in common_tables:
            result = await conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = :t"
            ).bindparams(t=table_name))
            live_columns = {row[0] for row in result}
            model_columns = {c.name for c in base_metadata.tables[table_name].columns}

            for col in sorted(model_columns - live_columns):
                issues.append(f"MISSING COLUMN: {table_name}.{col}")

    return issues


async def log_drift_or_clean(engine: AsyncEngine, base_metadata) -> None:
    """startup 호출용 — drift 발견 시 ERROR, 깨끗하면 INFO."""
    try:
        issues = await detect_drift(engine, base_metadata)
    except Exception as e:
        logger.warning(f"Drift detector 실행 실패 (non-fatal): {e}")
        return

    if not issues:
        logger.info(f"Schema drift check: OK ({len(base_metadata.tables)} tables aligned)")
        return

    logger.error(
        f"⚠️ SCHEMA DRIFT — 모델과 DB 불일치 {len(issues)}건. "
        f"이 컬럼·테이블을 사용하는 엔드포인트는 500 발생 예상:"
    )
    for issue in issues[:30]:  # 너무 많으면 잘라냄
        logger.error(f"  • {issue}")
    if len(issues) > 30:
        logger.error(f"  ... and {len(issues) - 30} more")
    logger.error(
        "→ 새 마이그레이션 파일을 alembic/versions/에 추가하고 "
        "fly deploy로 release_command 트리거"
    )
