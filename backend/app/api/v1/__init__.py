from fastapi import APIRouter
from .auth import router as auth_router
from .simulate import router as simulate_router
from .slots import router as slots_router
from .bids import router as bids_router
from .prospects import router as prospects_router
from .alerts import router as alerts_router
from .export import router as export_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(simulate_router, prefix="/simulate", tags=["OpenSim - Simulation"])
api_router.include_router(slots_router, prefix="/slots", tags=["PharmMatch - Slots"])
api_router.include_router(bids_router, prefix="/bids", tags=["PharmMatch - Bids"])
api_router.include_router(prospects_router, prefix="/prospects", tags=["SalesScanner - Prospects"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["SalesScanner - Alerts"])
api_router.include_router(export_router, prefix="/export", tags=["Export"])
