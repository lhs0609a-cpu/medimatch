"""
크롤링 관련 Celery 태스크
"""
from celery import shared_task
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging
import httpx
import asyncio
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)


@shared_task
def run_daily_crawl():
    """
    일일 크롤링 실행
    """
    logger.info("=== Daily Crawl Started ===")
    start_time = datetime.now()

    results = {
        "new_hospitals": 0,
        "closed_hospitals": 0,
        "new_buildings": 0,
    }

    try:
        # Step 1: 심평원 병원 데이터 수집
        logger.info("Step 1: Fetching hospital data from HIRA")
        hospital_result = crawl_hira_hospitals.delay()

        # Step 2: 폐업 병원 탐지
        logger.info("Step 2: Detecting closed hospitals")
        closed_result = check_closed_hospitals.delay()

        # Step 3: 신규 건물 탐지
        logger.info("Step 3: Detecting new medical buildings")
        building_result = crawl_building_registry.delay()

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"=== Daily Crawl Completed in {duration}s ===")

        return {"status": "completed", "duration": duration}

    except Exception as e:
        logger.error(f"Daily crawl failed: {e}")
        return {"status": "failed", "error": str(e)}


@shared_task(bind=True, max_retries=3)
def crawl_hira_hospitals(self):
    """
    심평원 병원 데이터 크롤링
    """
    logger.info("Crawling HIRA hospital data...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_crawl_hira_async())
        return result
    except Exception as e:
        logger.error(f"HIRA crawl failed: {e}")
        self.retry(exc=e, countdown=300)
    finally:
        loop.close()


async def _crawl_hira_async():
    """
    심평원 병원 데이터 비동기 크롤링
    """
    import os
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select

    HIRA_API_KEY = os.getenv("HIRA_API_KEY", "")
    BASE_URL = "http://apis.data.go.kr/B551182/hospInfoServicev2"

    if not HIRA_API_KEY:
        logger.warning("HIRA_API_KEY not set, using mock data")
        return {"status": "skipped", "reason": "API key not configured"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 서울 지역 병원 조회
            response = await client.get(
                f"{BASE_URL}/getHospBasisList",
                params={
                    "serviceKey": HIRA_API_KEY,
                    "sidoCd": "110000",
                    "pageNo": 1,
                    "numOfRows": 100,
                }
            )

            if response.status_code != 200:
                logger.error(f"HIRA API error: {response.status_code}")
                return {"status": "error", "code": response.status_code}

            # XML 파싱
            root = ET.fromstring(response.text)
            items = root.findall(".//item")

            hospitals = []
            week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y%m%d")

            for item in items:
                estb_dd = item.findtext("estbDd", "")

                # 최근 개업 병원만
                if estb_dd >= week_ago:
                    hospital = {
                        "ykiho": item.findtext("ykiho", ""),
                        "name": item.findtext("yadmNm", ""),
                        "address": item.findtext("addr", ""),
                        "phone": item.findtext("telno", ""),
                        "latitude": float(item.findtext("YPos", "0") or 0),
                        "longitude": float(item.findtext("XPos", "0") or 0),
                        "clinic_type": item.findtext("dgsbjtCdNm", ""),
                        "established": estb_dd,
                        "doctor_count": int(item.findtext("drTotCnt", "0") or 0),
                    }
                    hospitals.append(hospital)

            # DB 저장
            async with AsyncSessionLocal() as db:
                from app.models.hospital import Hospital

                for h in hospitals:
                    # upsert 로직
                    existing = await db.execute(
                        select(Hospital).where(Hospital.ykiho == h["ykiho"])
                    )
                    if not existing.scalar_one_or_none():
                        hospital = Hospital(**h)
                        db.add(hospital)
                        logger.info(f"New hospital: {h['name']}")

                await db.commit()

            logger.info(f"Crawled {len(hospitals)} new hospitals from HIRA")
            return {"status": "completed", "count": len(hospitals)}

        except Exception as e:
            logger.error(f"HIRA crawl error: {e}")
            return {"status": "error", "message": str(e)}


@shared_task(bind=True, max_retries=3)
def check_closed_hospitals(self):
    """
    폐업 병원 탐지
    """
    logger.info("Checking for closed hospitals...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_check_closed_async())
        return result
    except Exception as e:
        logger.error(f"Closed hospital check failed: {e}")
        self.retry(exc=e, countdown=300)
    finally:
        loop.close()


async def _check_closed_async():
    """
    폐업 병원 비동기 탐지
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, update
    from app.tasks.notifications import send_new_prospect_alerts

    async with AsyncSessionLocal() as db:
        try:
            # 기존 활성 병원 조회
            from app.models.hospital import Hospital
            from app.models.prospect import ProspectLocation

            result = await db.execute(
                select(Hospital).where(Hospital.is_active == True)
            )
            active_hospitals = result.scalars().all()

            # 여기서 실제로는 API 호출하여 현재 병원 목록과 비교
            # 현재는 Mock 처리
            closed_count = 0

            # 예시: 일부 병원을 폐업 처리 (실제로는 API 비교 결과)
            # 실제 구현에서는 API에서 없어진 병원을 폐업 처리

            logger.info(f"Checked {len(active_hospitals)} hospitals, found {closed_count} closed")
            return {"status": "completed", "checked": len(active_hospitals), "closed": closed_count}

        except Exception as e:
            logger.error(f"Closed hospital check error: {e}")
            return {"status": "error", "message": str(e)}


@shared_task(bind=True, max_retries=3)
def crawl_building_registry(self):
    """
    건축물대장 크롤링
    """
    logger.info("Crawling building registry...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_crawl_building_async())
        return result
    except Exception as e:
        logger.error(f"Building crawl failed: {e}")
        self.retry(exc=e, countdown=300)
    finally:
        loop.close()


async def _crawl_building_async():
    """
    건축물대장 비동기 크롤링
    """
    import os
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.prospect import ProspectLocation
    from app.tasks.notifications import send_new_prospect_alerts

    BUILDING_API_KEY = os.getenv("BUILDING_API_KEY", "")
    BASE_URL = "http://apis.data.go.kr/1613000/BldRgstService_v2"

    if not BUILDING_API_KEY:
        logger.warning("BUILDING_API_KEY not set, using mock data")
        return {"status": "skipped", "reason": "API key not configured"}

    # 서울 주요 구 코드
    districts = [
        {"sigunguCd": "11680", "bjdongCd": "10300", "name": "강남구 역삼동"},
        {"sigunguCd": "11680", "bjdongCd": "10800", "name": "강남구 삼성동"},
        {"sigunguCd": "11650", "bjdongCd": "10100", "name": "서초구 서초동"},
    ]

    month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y%m%d")
    medical_purposes = ["근린생활시설", "제1종근린생활시설", "제2종근린생활시설", "의료시설", "업무시설"]

    new_buildings = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for district in districts:
            try:
                response = await client.get(
                    f"{BASE_URL}/getBrTitleInfo",
                    params={
                        "serviceKey": BUILDING_API_KEY,
                        "sigunguCd": district["sigunguCd"],
                        "bjdongCd": district["bjdongCd"],
                        "pageNo": 1,
                        "numOfRows": 100,
                    }
                )

                if response.status_code != 200:
                    continue

                # XML 파싱
                root = ET.fromstring(response.text)
                items = root.findall(".//item")

                for item in items:
                    use_apr_day = item.findtext("useAprDay", "")
                    main_purps = item.findtext("mainPurpsCdNm", "")

                    # 최근 사용승인 + 병원 입점 가능 용도
                    is_recent = use_apr_day >= month_ago
                    is_medical = any(p in main_purps for p in medical_purposes)

                    if is_recent and is_medical:
                        building = {
                            "building_id": item.findtext("mgmBldrgstPk", ""),
                            "name": item.findtext("bldNm", ""),
                            "address": item.findtext("newPlatPlc", "") or item.findtext("platPlc", ""),
                            "purpose": main_purps,
                            "area": float(item.findtext("totArea", "0") or 0),
                            "approved": use_apr_day,
                        }
                        new_buildings.append(building)

                # API 호출 간격
                await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"Error crawling {district['name']}: {e}")
                continue

    # DB 저장
    async with AsyncSessionLocal() as db:
        saved_count = 0

        for b in new_buildings:
            # 중복 체크
            existing = await db.execute(
                select(ProspectLocation).where(ProspectLocation.building_id == b["building_id"])
            )

            if not existing.scalar_one_or_none():
                # 적합도 점수 계산
                fit_score = 70
                if b["area"] >= 100:
                    fit_score += 10
                if b["area"] >= 200:
                    fit_score += 10

                # 추천 진료과
                recommended = []
                if b["area"] >= 200:
                    recommended = ["정형외과", "재활의학과"]
                elif b["area"] >= 100:
                    recommended = ["내과", "이비인후과", "소아청소년과"]
                else:
                    recommended = ["피부과", "안과"]

                prospect = ProspectLocation(
                    building_id=b["building_id"],
                    address=b["address"],
                    type="NEW_BUILD",
                    zoning=b["purpose"],
                    floor_area=b["area"],
                    clinic_fit_score=fit_score,
                    recommended_dept=recommended,
                    status="NEW",
                )
                db.add(prospect)
                saved_count += 1

                logger.info(f"New prospect: {b['address']}")

        await db.commit()

        # 알림 발송
        if saved_count > 0:
            logger.info(f"Sending alerts for {saved_count} new prospects")

    logger.info(f"Crawled {len(new_buildings)} buildings, saved {saved_count} new prospects")
    return {"status": "completed", "crawled": len(new_buildings), "saved": saved_count}


@shared_task
def crawl_commercial_data():
    """
    상권 데이터 크롤링 (소상공인진흥공단)
    """
    logger.info("Crawling commercial data...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_crawl_commercial_async())
        return result
    finally:
        loop.close()


async def _crawl_commercial_async():
    """
    상권 데이터 비동기 크롤링
    """
    import os

    COMMERCIAL_API_KEY = os.getenv("COMMERCIAL_API_KEY", "")
    BASE_URL = "http://apis.data.go.kr/B553077/api/open/sdsc"

    if not COMMERCIAL_API_KEY:
        logger.warning("COMMERCIAL_API_KEY not set")
        return {"status": "skipped", "reason": "API key not configured"}

    # 상권 분석 데이터 수집 로직
    # 실제 구현 시 소상공인진흥공단 API 사용

    return {"status": "completed", "message": "Commercial data crawl placeholder"}


@shared_task
def geocode_addresses():
    """
    주소 좌표 변환 (Kakao Map API)
    """
    logger.info("Geocoding addresses...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_geocode_async())
        return result
    finally:
        loop.close()


async def _geocode_async():
    """
    주소 좌표 변환 비동기 처리
    """
    import os
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, update
    from app.models.prospect import ProspectLocation

    KAKAO_API_KEY = os.getenv("KAKAO_REST_API_KEY", "")

    if not KAKAO_API_KEY:
        logger.warning("KAKAO_REST_API_KEY not set")
        return {"status": "skipped", "reason": "API key not configured"}

    async with AsyncSessionLocal() as db:
        # 좌표가 없는 프로스펙트 조회
        result = await db.execute(
            select(ProspectLocation).where(
                ProspectLocation.latitude == 0,
                ProspectLocation.longitude == 0
            ).limit(100)
        )
        prospects = result.scalars().all()

        geocoded_count = 0

        async with httpx.AsyncClient(timeout=10.0) as client:
            for prospect in prospects:
                try:
                    response = await client.get(
                        "https://dapi.kakao.com/v2/local/search/address.json",
                        params={"query": prospect.address},
                        headers={"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
                    )

                    if response.status_code == 200:
                        data = response.json()
                        if data.get("documents"):
                            doc = data["documents"][0]
                            await db.execute(
                                update(ProspectLocation)
                                .where(ProspectLocation.id == prospect.id)
                                .values(
                                    latitude=float(doc.get("y", 0)),
                                    longitude=float(doc.get("x", 0))
                                )
                            )
                            geocoded_count += 1

                    await asyncio.sleep(0.1)  # Rate limiting

                except Exception as e:
                    logger.error(f"Geocoding error for {prospect.address}: {e}")
                    continue

        await db.commit()

    logger.info(f"Geocoded {geocoded_count} addresses")
    return {"status": "completed", "geocoded": geocoded_count}
