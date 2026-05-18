"""
Tier 4 — Observability.

GET /api/v1/admin/schema-version
  → 마이그레이션 적용 이력 + 현재 schema 버전 + drift 감지 결과

운영자가 배포 직후 또는 500 발생 시 첫 점검 포인트.
"""
import os
import logging
from typing import Optional
from datetime import datetime

import asyncpg
from fastapi import APIRouter, HTTPException

from ...core.database import engine, Base
from ...db.drift import detect_drift

logger = logging.getLogger(__name__)
router = APIRouter()


def _dsn() -> str:
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    return db_url.replace("postgresql+asyncpg://", "postgresql://")


@router.get("/schema-version")
async def schema_version():
    """현재 schema 버전 + 적용 이력 + drift 점검 결과."""
    dsn = _dsn()
    if not dsn:
        raise HTTPException(500, "DATABASE_URL unset")

    conn = await asyncpg.connect(dsn)
    try:
        # schema_migrations 테이블 있는지 확인 (release_command 한번도 안 돌았으면 없음)
        exists = await conn.fetchval(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name = 'schema_migrations')"
        )
        if not exists:
            applied: list = []
            current: Optional[str] = None
        else:
            rows = await conn.fetch(
                "SELECT version, applied_at, duration_ms, checksum "
                "FROM schema_migrations ORDER BY version DESC"
            )
            applied = [
                {
                    "version": r["version"],
                    "applied_at": r["applied_at"].isoformat() if r["applied_at"] else None,
                    "duration_ms": r["duration_ms"],
                    "checksum": r["checksum"],
                }
                for r in rows
            ]
            current = applied[0]["version"] if applied else None
    finally:
        await conn.close()

    # Drift 점검
    try:
        drift_issues = await detect_drift(engine, Base.metadata)
    except Exception as e:
        drift_issues = [f"drift detector failed: {e}"]

    return {
        "current": current,
        "applied_count": len(applied),
        "drift_ok": len(drift_issues) == 0,
        "drift_issues": drift_issues[:50],  # 너무 많으면 자르기
        "history": applied[:20],            # 최근 20개만
        "checked_at": datetime.utcnow().isoformat(),
    }
