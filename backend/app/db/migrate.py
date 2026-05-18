"""
Migration runner — Tier 1 (registry) + Tier 2 (runner) + Tier 5 (release_command 진입점).

실행: `python -m app.db.migrate`
fly.toml: `[deploy] release_command = "python -m app.db.migrate"`

특징:
- pg_advisory_lock → 다중 머신 race condition 차단
- schema_migrations 테이블에 적용 버전·체크섬·소요시간 기록
- 이미 적용된 버전 skip
- 적용 후 파일이 수정되면 checksum 불일치 WARN
- 어느 마이그레이션이라도 실패 시 exit 1 → fly deploy abort → 기존 앱 유지
"""
import asyncio
import hashlib
import importlib.util
import logging
import os
import sys
import time
from pathlib import Path

import asyncpg

logger = logging.getLogger("migrate")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)

# 64-bit signed int. pg_advisory_lock의 namespace는 전체 DB라 임의 고유값 권장.
# 우연한 충돌 방지를 위해 medimatch ASCII 합 + 임의 prefix.
ADVISORY_LOCK_ID = 7341337

REGISTRY_DDL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     TEXT PRIMARY KEY,
    applied_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,
    checksum    TEXT
);
"""


def _get_dsn() -> str:
    """DATABASE_URL을 asyncpg 호환 DSN으로 변환."""
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        raise RuntimeError("DATABASE_URL 환경변수가 비어있습니다")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    return db_url.replace("postgresql+asyncpg://", "postgresql://")


def _sha256(path: Path) -> str:
    """파일 SHA256 첫 16자 — 변경 감지용 (전체 길이 불필요)."""
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


async def _run_one(path: Path, version: str) -> int:
    """단일 마이그레이션 파일의 async def run() 실행. 소요 ms 반환."""
    spec = importlib.util.spec_from_file_location(version, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"{version}: import spec 실패")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if not hasattr(module, "run") or not asyncio.iscoroutinefunction(module.run):
        raise RuntimeError(f"{version}: async def run() 정의 누락")
    t0 = time.monotonic()
    await module.run()
    return int((time.monotonic() - t0) * 1000)


async def main() -> int:
    # 프로젝트 루트의 alembic/versions/ 디렉토리
    # /app/app/db/migrate.py → /app/alembic/versions/
    versions_dir = Path(__file__).resolve().parent.parent.parent / "alembic" / "versions"
    if not versions_dir.exists():
        logger.error(f"versions 디렉토리 없음: {versions_dir}")
        return 1

    try:
        dsn = _get_dsn()
    except RuntimeError as e:
        logger.error(str(e))
        return 1

    logger.info("Connecting to database...")
    try:
        conn = await asyncpg.connect(dsn)
    except Exception as e:
        logger.error(f"DB 연결 실패: {e}")
        return 1

    try:
        # 1) Registry 테이블 준비
        await conn.execute(REGISTRY_DDL)

        # 2) Advisory lock — 다중 머신/프로세스 동시 실행 차단
        logger.info(f"Acquiring advisory lock {ADVISORY_LOCK_ID}...")
        await conn.execute("SELECT pg_advisory_lock($1)", ADVISORY_LOCK_ID)

        try:
            # 3) 적용된 버전 로드 (version → checksum)
            rows = await conn.fetch("SELECT version, checksum FROM schema_migrations")
            applied: dict[str, str] = {r["version"]: r["checksum"] for r in rows}

            # 4) 디스크 파일 스캔 — asyncpg-style만
            files = sorted(
                f for f in versions_dir.glob("*.py")
                if not f.name.startswith("__")
            )

            pending: list[tuple[str, Path, str]] = []
            drift_warnings: list[str] = []
            for f in files:
                try:
                    src = f.read_text(encoding="utf-8")
                except Exception:
                    continue
                if "async def run" not in src:
                    # alembic-style (001~010) — create_all이 처리
                    continue
                version = f.stem
                checksum = _sha256(f)
                if version in applied:
                    if applied[version] != checksum:
                        drift_warnings.append(
                            f"  {version}: 이미 적용됨 but 파일 변경됨 "
                            f"(저장 {applied[version][:8]} vs 현재 {checksum[:8]})"
                        )
                    continue
                pending.append((version, f, checksum))

            logger.info(
                f"Schema status — applied: {len(applied)}, pending: {len(pending)}"
            )
            if drift_warnings:
                logger.warning(f"Checksum drift {len(drift_warnings)}건:")
                for w in drift_warnings:
                    logger.warning(w)

            # 5) 미적용 마이그레이션 순차 실행
            for version, f, checksum in pending:
                logger.info(f"→ {version}")
                try:
                    duration_ms = await _run_one(f, version)
                except Exception as e:
                    logger.exception(f"✗ {version} 실패: {e}")
                    return 1

                # 성공 시 레지스트리에 기록
                await conn.execute(
                    "INSERT INTO schema_migrations (version, duration_ms, checksum) "
                    "VALUES ($1, $2, $3) ON CONFLICT (version) DO UPDATE "
                    "SET duration_ms = EXCLUDED.duration_ms, checksum = EXCLUDED.checksum, "
                    "applied_at = NOW()",
                    version, duration_ms, checksum,
                )
                logger.info(f"✓ {version} ({duration_ms}ms)")

            # 6) 최종 버전 표시
            final = await conn.fetchval(
                "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1"
            )
            logger.info(f"Schema 최종: {final or '(empty)'}")
            return 0
        finally:
            await conn.execute("SELECT pg_advisory_unlock($1)", ADVISORY_LOCK_ID)
    finally:
        await conn.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
