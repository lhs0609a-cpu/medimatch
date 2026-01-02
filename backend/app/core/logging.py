"""
구조화된 로깅 설정
JSON 형식 로그 출력, 요청 추적
"""
import logging
import sys
import time
import uuid
from typing import Callable
from contextvars import ContextVar
from functools import wraps

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# 요청 ID 컨텍스트 변수
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


class RequestContextFilter(logging.Filter):
    """로그에 요청 컨텍스트 추가"""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get("")
        return True


def setup_logging(log_level: str = "INFO", json_format: bool = True):
    """
    로깅 설정 초기화

    Args:
        log_level: 로그 레벨 (DEBUG, INFO, WARNING, ERROR)
        json_format: JSON 형식 로그 사용 여부
    """
    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # 기존 핸들러 제거
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 콘솔 핸들러 추가
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper()))

    # 필터 추가
    console_handler.addFilter(RequestContextFilter())

    if json_format:
        # JSON 포맷터
        formatter = JsonFormatter()
    else:
        # 일반 포맷터
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s [%(request_id)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 라이브러리 로그 레벨 조정
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    return root_logger


class JsonFormatter(logging.Formatter):
    """JSON 형식 로그 포맷터"""

    def format(self, record: logging.LogRecord) -> str:
        import json
        from datetime import datetime

        log_dict = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # 요청 ID 추가
        if hasattr(record, "request_id") and record.request_id:
            log_dict["request_id"] = record.request_id

        # 예외 정보 추가
        if record.exc_info:
            log_dict["exception"] = self.formatException(record.exc_info)

        # 추가 필드
        if hasattr(record, "extra"):
            log_dict.update(record.extra)

        return json.dumps(log_dict, ensure_ascii=False)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    요청/응답 로깅 미들웨어
    - 요청 ID 생성 및 추적
    - 응답 시간 측정
    - 요청/응답 로깅
    """

    def __init__(self, app, logger: logging.Logger = None):
        super().__init__(app)
        self.logger = logger or logging.getLogger("medimatch.api")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 요청 ID 생성
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
        request_id_ctx.set(request_id)

        # 시작 시간
        start_time = time.time()

        # 요청 로깅
        self.logger.info(
            f"Request started",
            extra={
                "extra": {
                    "method": request.method,
                    "path": request.url.path,
                    "query": str(request.query_params),
                    "client_ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                }
            }
        )

        # 요청 처리
        try:
            response = await call_next(request)

            # 응답 시간 계산
            process_time = time.time() - start_time

            # 응답 헤더에 요청 ID 추가
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time:.3f}s"

            # 응답 로깅
            log_level = logging.INFO if response.status_code < 400 else logging.WARNING
            self.logger.log(
                log_level,
                f"Request completed",
                extra={
                    "extra": {
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "process_time_ms": round(process_time * 1000, 2),
                    }
                }
            )

            return response

        except Exception as e:
            # 예외 로깅
            process_time = time.time() - start_time
            self.logger.exception(
                f"Request failed: {str(e)}",
                extra={
                    "extra": {
                        "method": request.method,
                        "path": request.url.path,
                        "error": str(e),
                        "process_time_ms": round(process_time * 1000, 2),
                    }
                }
            )
            raise


def get_logger(name: str) -> logging.Logger:
    """
    로거 인스턴스 반환

    Args:
        name: 로거 이름 (예: "medimatch.api.auth")

    Returns:
        Logger 인스턴스
    """
    return logging.getLogger(name)


def log_execution_time(logger: logging.Logger = None):
    """
    함수 실행 시간 로깅 데코레이터

    Usage:
        @log_execution_time()
        async def my_function():
            ...
    """
    def decorator(func: Callable):
        _logger = logger or logging.getLogger(func.__module__)

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time
                _logger.debug(
                    f"{func.__name__} executed",
                    extra={"extra": {"execution_time_ms": round(execution_time * 1000, 2)}}
                )
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                _logger.error(
                    f"{func.__name__} failed: {str(e)}",
                    extra={"extra": {"execution_time_ms": round(execution_time * 1000, 2)}}
                )
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                _logger.debug(
                    f"{func.__name__} executed",
                    extra={"extra": {"execution_time_ms": round(execution_time * 1000, 2)}}
                )
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                _logger.error(
                    f"{func.__name__} failed: {str(e)}",
                    extra={"extra": {"execution_time_ms": round(execution_time * 1000, 2)}}
                )
                raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
