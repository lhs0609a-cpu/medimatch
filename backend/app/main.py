from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import init_db
from .api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## MediMatch Platform API

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

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


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
