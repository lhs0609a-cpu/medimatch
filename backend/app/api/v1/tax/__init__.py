from fastapi import APIRouter
from .corrections import router as corrections_router
from .scanner import router as scanner_router
from .hometax import router as hometax_router
from .documents import router as documents_router
from .fees import router as fees_router
from .analytics import router as analytics_router
from .regulations import router as regulations_router

router = APIRouter()
router.include_router(corrections_router, tags=["Tax Correction - 경정청구"])
router.include_router(scanner_router, prefix="/scan", tags=["Tax Scanner - AI 스캔"])
router.include_router(hometax_router, prefix="/hometax", tags=["HomeTax - 홈택스 연동"])
router.include_router(documents_router, prefix="/documents", tags=["Tax Documents - 증빙서류"])
router.include_router(fees_router, prefix="/fees", tags=["Tax Fees - 수수료 정산"])
router.include_router(analytics_router, prefix="/analytics", tags=["Tax Analytics - 분석"])
router.include_router(regulations_router, prefix="/regulations", tags=["Tax Regulations - 세법"])
