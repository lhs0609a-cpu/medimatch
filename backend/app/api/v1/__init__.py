from fastapi import APIRouter
from .auth import router as auth_router
from .simulate import router as simulate_router
from .slots import router as slots_router
from .bids import router as bids_router
from .prospects import router as prospects_router
from .alerts import router as alerts_router
from .export import router as export_router
from .map import router as map_router
from .partner import router as partner_router
from .payment import router as payment_router
from .oauth import router as oauth_router
from .pharmacy_match import router as pharmacy_match_router
from .escrow import router as escrow_router
from .hira import router as hira_router
from .realestate import router as realestate_router
from .prospect import router as prospect_router
from .campaign import router as campaign_router
from .chat import router as chat_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(oauth_router, tags=["OAuth"])
api_router.include_router(hira_router, prefix="/hira", tags=["HIRA - 심평원 API"])
api_router.include_router(simulate_router, prefix="/simulate", tags=["OpenSim - Simulation"])
api_router.include_router(slots_router, prefix="/slots", tags=["PharmMatch - Slots"])
api_router.include_router(bids_router, prefix="/bids", tags=["PharmMatch - Bids"])
api_router.include_router(pharmacy_match_router, prefix="/pharmacy-match", tags=["PharmMatch v2 - Anonymous Matching"])
api_router.include_router(prospects_router, prefix="/prospects", tags=["SalesScanner - Prospects"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["SalesScanner - Alerts"])
api_router.include_router(export_router, prefix="/export", tags=["Export"])
api_router.include_router(map_router, prefix="/map", tags=["Map"])
api_router.include_router(partner_router, tags=["Partners"])
api_router.include_router(payment_router, tags=["Payments"])
api_router.include_router(escrow_router, prefix="/escrow", tags=["Escrow - Partner Transactions"])
api_router.include_router(realestate_router, prefix="/realestate", tags=["Real Estate - 부동산 매물"])
api_router.include_router(prospect_router, prefix="/pharmacy-prospects", tags=["Pharmacy Prospects - 약국 타겟팅"])
api_router.include_router(campaign_router, prefix="/campaigns", tags=["Campaigns - 아웃바운드 캠페인"])
api_router.include_router(chat_router, tags=["Chat - 파트너 채팅"])
