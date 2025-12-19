from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from datetime import datetime

from ..models.pharmacy import PharmacySlot, Bid, SlotStatus, BidStatus
from ..models.user import User
from ..schemas.pharmacy import (
    PharmacySlotCreate, PharmacySlotUpdate, PharmacySlotResponse,
    BidCreate, BidResponse
)
from .prediction import prediction_service
from .external_api import external_api_service

import logging
logger = logging.getLogger(__name__)


class MatchingService:
    """약국 자리 매칭 서비스 (PharmMatch)"""

    async def create_slot(
        self,
        db: AsyncSession,
        slot_data: PharmacySlotCreate,
        created_by: UUID
    ) -> PharmacySlot:
        """새 약국 자리 등록"""

        # 좌표로 주변 병원 정보 가져오기
        nearby_hospitals = await external_api_service.get_nearby_hospitals(
            slot_data.latitude,
            slot_data.longitude,
            1000,
            slot_data.clinic_type
        )

        # 상권 데이터 가져오기
        commercial_data = await external_api_service.get_commercial_data(
            slot_data.latitude,
            slot_data.longitude
        )

        # 처방전 예측이 없으면 자동 계산
        est_daily_rx = slot_data.est_daily_rx
        est_monthly_revenue = slot_data.est_monthly_revenue

        if not est_daily_rx or not est_monthly_revenue:
            prediction = await prediction_service.predict_prescription(
                clinic_type=slot_data.clinic_type,
                latitude=slot_data.latitude,
                longitude=slot_data.longitude,
                nearby_hospitals=nearby_hospitals,
                commercial_data=commercial_data
            )
            est_daily_rx = est_daily_rx or prediction["daily_prescriptions"]["avg"]
            est_monthly_revenue = est_monthly_revenue or prediction["monthly_revenue"]["avg"]

        slot = PharmacySlot(
            address=slot_data.address,
            latitude=slot_data.latitude,
            longitude=slot_data.longitude,
            clinic_type=slot_data.clinic_type,
            clinic_name=slot_data.clinic_name,
            est_daily_rx=est_daily_rx,
            est_monthly_revenue=est_monthly_revenue,
            min_bid_amount=slot_data.min_bid_amount,
            floor_info=slot_data.floor_info,
            area_pyeong=slot_data.area_pyeong,
            description=slot_data.description,
            bid_deadline=slot_data.bid_deadline,
            status=SlotStatus.OPEN,
            created_by=created_by
        )

        db.add(slot)
        await db.commit()
        await db.refresh(slot)

        return slot

    async def get_slots(
        self,
        db: AsyncSession,
        status: Optional[SlotStatus] = None,
        clinic_type: Optional[str] = None,
        min_revenue: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """약국 자리 목록 조회"""
        query = select(PharmacySlot)

        if status:
            query = query.where(PharmacySlot.status == status)
        if clinic_type:
            query = query.where(PharmacySlot.clinic_type == clinic_type)
        if min_revenue:
            query = query.where(PharmacySlot.est_monthly_revenue >= min_revenue)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated items
        offset = (page - 1) * page_size
        query = query.order_by(desc(PharmacySlot.created_at)).offset(offset).limit(page_size)

        result = await db.execute(query)
        slots = result.scalars().all()

        # Get bid counts and highest bids
        items = []
        for slot in slots:
            bid_stats = await self._get_slot_bid_stats(db, slot.id)
            items.append({
                **slot.__dict__,
                "bid_count": bid_stats["count"],
                "highest_bid": bid_stats["highest"]
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size
        }

    async def get_slot(
        self,
        db: AsyncSession,
        slot_id: UUID
    ) -> Optional[PharmacySlot]:
        """약국 자리 상세 조회"""
        result = await db.execute(
            select(PharmacySlot).where(PharmacySlot.id == slot_id)
        )
        return result.scalar_one_or_none()

    async def update_slot(
        self,
        db: AsyncSession,
        slot_id: UUID,
        update_data: PharmacySlotUpdate
    ) -> Optional[PharmacySlot]:
        """약국 자리 수정"""
        slot = await self.get_slot(db, slot_id)
        if not slot:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(slot, key, value)

        await db.commit()
        await db.refresh(slot)
        return slot

    async def create_bid(
        self,
        db: AsyncSession,
        slot_id: UUID,
        bid_data: BidCreate,
        pharmacist_id: UUID
    ) -> Optional[Bid]:
        """입찰 참여"""
        # 자리 확인
        slot = await self.get_slot(db, slot_id)
        if not slot:
            return None

        if slot.status not in [SlotStatus.OPEN, SlotStatus.BIDDING]:
            raise ValueError("This slot is not accepting bids")

        if slot.bid_deadline and slot.bid_deadline < datetime.utcnow():
            raise ValueError("Bid deadline has passed")

        if bid_data.bid_amount < slot.min_bid_amount:
            raise ValueError(f"Bid amount must be at least {slot.min_bid_amount}")

        # 이미 입찰한 적 있는지 확인
        existing_bid = await db.execute(
            select(Bid).where(
                Bid.slot_id == slot_id,
                Bid.pharmacist_id == pharmacist_id
            )
        )
        if existing_bid.scalar_one_or_none():
            raise ValueError("You have already placed a bid on this slot")

        bid = Bid(
            slot_id=slot_id,
            pharmacist_id=pharmacist_id,
            bid_amount=bid_data.bid_amount,
            message=bid_data.message,
            experience_years=bid_data.experience_years,
            pharmacy_name=bid_data.pharmacy_name,
            status=BidStatus.PENDING
        )

        db.add(bid)

        # Update slot status to BIDDING
        if slot.status == SlotStatus.OPEN:
            slot.status = SlotStatus.BIDDING

        await db.commit()
        await db.refresh(bid)

        return bid

    async def get_slot_bids(
        self,
        db: AsyncSession,
        slot_id: UUID
    ) -> List[Dict[str, Any]]:
        """자리별 입찰 목록 조회 (관리자용)"""
        result = await db.execute(
            select(Bid, User)
            .join(User, Bid.pharmacist_id == User.id)
            .where(Bid.slot_id == slot_id)
            .order_by(desc(Bid.bid_amount))
        )
        rows = result.all()

        bids = []
        for bid, user in rows:
            bids.append({
                **bid.__dict__,
                "pharmacist_name": user.full_name,
                "pharmacist_email": user.email
            })

        return bids

    async def accept_bid(
        self,
        db: AsyncSession,
        bid_id: UUID
    ) -> Optional[Bid]:
        """입찰 수락"""
        result = await db.execute(
            select(Bid).where(Bid.id == bid_id)
        )
        bid = result.scalar_one_or_none()
        if not bid:
            return None

        # 해당 자리의 다른 입찰은 모두 거절
        await db.execute(
            select(Bid)
            .where(Bid.slot_id == bid.slot_id, Bid.id != bid_id)
        )
        other_bids_result = await db.execute(
            select(Bid).where(Bid.slot_id == bid.slot_id, Bid.id != bid_id)
        )
        for other_bid in other_bids_result.scalars().all():
            other_bid.status = BidStatus.REJECTED

        # 선택된 입찰 수락
        bid.status = BidStatus.ACCEPTED

        # 자리 상태 변경
        slot = await self.get_slot(db, bid.slot_id)
        if slot:
            slot.status = SlotStatus.MATCHED

        await db.commit()
        await db.refresh(bid)

        return bid

    async def reject_bid(
        self,
        db: AsyncSession,
        bid_id: UUID
    ) -> Optional[Bid]:
        """입찰 거절"""
        result = await db.execute(
            select(Bid).where(Bid.id == bid_id)
        )
        bid = result.scalar_one_or_none()
        if not bid:
            return None

        bid.status = BidStatus.REJECTED
        await db.commit()
        await db.refresh(bid)

        return bid

    async def _get_slot_bid_stats(
        self,
        db: AsyncSession,
        slot_id: UUID
    ) -> Dict[str, Any]:
        """자리별 입찰 통계"""
        result = await db.execute(
            select(
                func.count(Bid.id).label("count"),
                func.max(Bid.bid_amount).label("highest")
            ).where(Bid.slot_id == slot_id)
        )
        row = result.first()
        return {
            "count": row.count if row else 0,
            "highest": row.highest if row else None
        }


matching_service = MatchingService()
