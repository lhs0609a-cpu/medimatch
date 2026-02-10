from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from contextlib import asynccontextmanager
import logging

from .core.config import settings
from .core.database import init_db
from .core.logging import setup_logging, LoggingMiddleware, get_logger
from .core.rate_limit import RateLimitMiddleware
from .api.v1 import api_router
from .api.v1.websocket import router as websocket_router

# 로깅 초기화
setup_logging(
    log_level="DEBUG" if settings.DEBUG else "INFO",
    json_format=not settings.DEBUG  # 개발 환경에서는 일반 포맷, 프로덕션에서는 JSON
)
logger = get_logger("mediplaton.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## 메디플라톤 Platform API

의료 개원 통합 솔루션 플랫폼 API

### 모듈
- **OpenSim**: 개원 시뮬레이터 - 3분 만에 예상 매출/비용 산출
- **SalesScanner**: 영업사원 B2B SaaS - 개원 예정지 스캐너
- **PharmMatch**: 약사 타겟 매칭 - 독점 약국 자리 입찰

### 인증
JWT 기반 인증을 사용합니다. `/api/v1/auth/login`에서 토큰을 발급받아 사용하세요.
    """,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Logging Middleware (요청/응답 로깅)
app.add_middleware(LoggingMiddleware)

# Rate Limit Middleware (API 요청 제한)
app.add_middleware(RateLimitMiddleware, enabled=not settings.DEBUG)

# CORS Middleware — MUST be last (outermost) to handle preflight OPTIONS before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Include WebSocket router
app.include_router(websocket_router, tags=["WebSocket"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
