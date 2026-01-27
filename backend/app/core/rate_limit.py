"""
API Rate Limiting 및 캐싱
"""
import time
import hashlib
import json
from typing import Optional, Callable, Any
from functools import wraps
from collections import defaultdict
import asyncio

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .logging import get_logger

logger = get_logger("mediplaton.rate_limit")


class InMemoryRateLimiter:
    """
    인메모리 Rate Limiter
    프로덕션에서는 Redis 기반으로 변경 권장
    """

    def __init__(self):
        self.requests = defaultdict(list)  # ip/user -> [timestamps]
        self.cleanup_interval = 60  # 60초마다 정리
        self.last_cleanup = time.time()

    def _cleanup(self):
        """오래된 요청 기록 정리"""
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return

        keys_to_remove = []
        for key, timestamps in self.requests.items():
            # 1시간 이상 된 기록 제거
            self.requests[key] = [t for t in timestamps if now - t < 3600]
            if not self.requests[key]:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self.requests[key]

        self.last_cleanup = now

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, int, int]:
        """
        Rate limit 체크

        Returns:
            (is_limited, remaining, reset_time)
        """
        self._cleanup()

        now = time.time()
        window_start = now - window_seconds

        # 윈도우 내 요청만 필터링
        recent_requests = [t for t in self.requests[key] if t > window_start]
        self.requests[key] = recent_requests

        remaining = max(0, max_requests - len(recent_requests))
        reset_time = int(window_start + window_seconds)

        if len(recent_requests) >= max_requests:
            return True, remaining, reset_time

        # 새 요청 기록
        self.requests[key].append(now)
        return False, remaining - 1, reset_time


class InMemoryCache:
    """
    인메모리 캐시
    프로덕션에서는 Redis 기반으로 변경 권장
    """

    def __init__(self, max_size: int = 1000):
        self.cache: dict[str, tuple[Any, float]] = {}  # key -> (value, expire_time)
        self.max_size = max_size

    def _cleanup(self):
        """만료된 캐시 정리"""
        now = time.time()
        expired_keys = [
            key for key, (_, expire_time) in self.cache.items()
            if expire_time < now
        ]
        for key in expired_keys:
            del self.cache[key]

        # 최대 크기 초과 시 오래된 항목 제거
        if len(self.cache) > self.max_size:
            sorted_keys = sorted(
                self.cache.keys(),
                key=lambda k: self.cache[k][1]
            )
            for key in sorted_keys[:len(self.cache) - self.max_size]:
                del self.cache[key]

    def get(self, key: str) -> Optional[Any]:
        """캐시 조회"""
        if key not in self.cache:
            return None

        value, expire_time = self.cache[key]
        if time.time() > expire_time:
            del self.cache[key]
            return None

        return value

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """캐시 저장"""
        self._cleanup()
        expire_time = time.time() + ttl_seconds
        self.cache[key] = (value, expire_time)

    def delete(self, key: str):
        """캐시 삭제"""
        if key in self.cache:
            del self.cache[key]

    def clear_pattern(self, pattern: str):
        """패턴에 맞는 캐시 삭제"""
        keys_to_delete = [k for k in self.cache.keys() if pattern in k]
        for key in keys_to_delete:
            del self.cache[key]


# 전역 인스턴스
rate_limiter = InMemoryRateLimiter()
cache = InMemoryCache()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate Limiting 미들웨어

    - 인증되지 않은 요청: 분당 30회
    - 인증된 요청: 분당 100회
    - 특정 엔드포인트는 더 엄격하게 제한
    """

    # 엔드포인트별 Rate Limit 설정
    ENDPOINT_LIMITS = {
        "/api/v1/auth/login": (5, 60),     # 5회/분 (브루트포스 방지)
        "/api/v1/auth/register": (3, 60),  # 3회/분
        "/api/v1/simulate": (10, 60),      # 10회/분
        "/api/v1/export": (5, 60),         # 5회/분
    }

    DEFAULT_ANONYMOUS_LIMIT = (30, 60)  # 30회/분
    DEFAULT_AUTHENTICATED_LIMIT = (100, 60)  # 100회/분

    def __init__(self, app, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next: Callable):
        if not self.enabled:
            return await call_next(request)

        # CORS preflight 요청(OPTIONS)은 제외
        if request.method == "OPTIONS":
            return await call_next(request)

        # 헬스체크, 문서 등은 제외
        path = request.url.path
        if path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Rate limit 키 생성
        client_ip = request.client.host if request.client else "unknown"
        auth_header = request.headers.get("authorization", "")
        is_authenticated = auth_header.startswith("Bearer ")

        if is_authenticated:
            # 토큰에서 사용자 ID 추출 (간단히 해시)
            key = f"auth:{hashlib.md5(auth_header.encode()).hexdigest()[:8]}"
        else:
            key = f"anon:{client_ip}"

        # 엔드포인트별 제한 확인
        for endpoint, limits in self.ENDPOINT_LIMITS.items():
            if path.startswith(endpoint):
                max_requests, window_seconds = limits
                break
        else:
            if is_authenticated:
                max_requests, window_seconds = self.DEFAULT_AUTHENTICATED_LIMIT
            else:
                max_requests, window_seconds = self.DEFAULT_ANONYMOUS_LIMIT

        # Rate limit 체크
        is_limited, remaining, reset_time = rate_limiter.is_rate_limited(
            f"{key}:{path}",
            max_requests,
            window_seconds
        )

        if is_limited:
            logger.warning(
                f"Rate limit exceeded for {key} on {path}",
                extra={"extra": {"client_ip": client_ip, "path": path}}
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
                    "retry_after": reset_time - int(time.time()),
                },
                headers={
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(reset_time),
                    "Retry-After": str(reset_time - int(time.time())),
                }
            )

        # 요청 처리
        response = await call_next(request)

        # Rate limit 헤더 추가
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)

        return response


def cached(
    ttl_seconds: int = 300,
    key_builder: Optional[Callable[..., str]] = None,
    invalidate_on: Optional[list[str]] = None
):
    """
    API 응답 캐싱 데코레이터

    Usage:
        @cached(ttl_seconds=60)
        async def get_stats():
            ...

        @cached(key_builder=lambda user_id: f"user:{user_id}")
        async def get_user(user_id: str):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 캐시 키 생성
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # 기본: 함수 이름 + 인자 해시
                args_hash = hashlib.md5(
                    json.dumps([str(a) for a in args] + [f"{k}={v}" for k, v in sorted(kwargs.items())],
                              ensure_ascii=False).encode()
                ).hexdigest()[:8]
                cache_key = f"{func.__module__}.{func.__name__}:{args_hash}"

            # 캐시 조회
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value

            # 함수 실행
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)

            # 캐시 저장
            cache.set(cache_key, result, ttl_seconds)
            logger.debug(f"Cache set: {cache_key} (TTL: {ttl_seconds}s)")

            return result

        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    패턴에 맞는 캐시 무효화

    Usage:
        invalidate_cache("user:123")  # 특정 사용자 캐시 삭제
        invalidate_cache("stats")     # 통계 관련 캐시 삭제
    """
    cache.clear_pattern(pattern)
    logger.debug(f"Cache invalidated: {pattern}")
