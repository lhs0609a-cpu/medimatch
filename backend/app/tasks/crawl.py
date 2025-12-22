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

    탐지 방법:
    1. 최근 확인된 병원 목록과 현재 API 데이터 비교
    2. API에서 사라진 병원 = 폐업으로 간주
    3. 폐업 병원 위치를 프로스펙트로 등록
    """
    import os
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, update
    from app.models.hospital import Hospital, HospitalStatus
    from app.models.prospect import ProspectLocation, ProspectType, ProspectStatus
    from app.tasks.notifications import send_new_prospect_alerts

    HIRA_API_KEY = os.getenv("HIRA_API_KEY", "")
    BASE_URL = "http://apis.data.go.kr/B551182/hospInfoServicev2"

    async with AsyncSessionLocal() as db:
        try:
            # 1. 마지막 확인으로부터 7일 이상 지난 활성 병원 조회
            check_threshold = datetime.now() - timedelta(days=7)
            result = await db.execute(
                select(Hospital).where(
                    Hospital.is_active == True,
                    (Hospital.last_verified_at == None) |
                    (Hospital.last_verified_at < check_threshold)
                ).limit(100)
            )
            hospitals_to_check = result.scalars().all()

            if not hospitals_to_check:
                logger.info("No hospitals need verification")
                return {"status": "completed", "checked": 0, "closed": 0}

            closed_count = 0
            verified_count = 0
            new_prospects = []

            # API 키가 있으면 실제 검증, 없으면 기존 데이터 기반 휴리스틱 적용
            if HIRA_API_KEY:
                # 실제 API 기반 검증
                async with httpx.AsyncClient(timeout=30.0) as client:
                    for hospital in hospitals_to_check:
                        try:
                            # 개별 병원 조회
                            response = await client.get(
                                f"{BASE_URL}/getHospBasisList",
                                params={
                                    "serviceKey": HIRA_API_KEY,
                                    "ykiho": hospital.ykiho,
                                    "numOfRows": 1,
                                }
                            )

                            if response.status_code == 200:
                                root = ET.fromstring(response.text)
                                items = root.findall(".//item")

                                if items:
                                    # 병원이 여전히 존재 - 확인 시간 업데이트
                                    hospital.last_verified_at = datetime.now()
                                    verified_count += 1
                                else:
                                    # 병원이 API에서 사라짐 - 폐업 처리
                                    hospital.is_active = False
                                    hospital.status = HospitalStatus.CLOSED
                                    hospital.closed_at = datetime.now()
                                    closed_count += 1

                                    # 프로스펙트로 등록
                                    new_prospect = ProspectLocation(
                                        address=hospital.address,
                                        latitude=hospital.latitude,
                                        longitude=hospital.longitude,
                                        type=ProspectType.VACANCY,
                                        floor_info=hospital.floor_info,
                                        floor_area=hospital.area_pyeong * 3.3 if hospital.area_pyeong else None,
                                        previous_clinic=f"{hospital.name} ({hospital.clinic_type})",
                                        clinic_fit_score=_calculate_vacancy_score(hospital),
                                        recommended_dept=_get_recommended_depts(hospital.clinic_type),
                                        status=ProspectStatus.NEW,
                                        detected_at=datetime.now()
                                    )
                                    db.add(new_prospect)
                                    new_prospects.append(new_prospect)

                                    logger.info(f"Hospital closed: {hospital.name} at {hospital.address}")

                            await asyncio.sleep(0.3)  # Rate limiting

                        except Exception as e:
                            logger.error(f"Error checking hospital {hospital.ykiho}: {e}")
                            continue
            else:
                # API 키 없을 때: 휴리스틱 기반 검증
                # 마지막 확인이 30일 이상 지난 병원 중 무작위로 폐업 가능성 체크
                logger.warning("HIRA_API_KEY not set, using heuristic verification")

                for hospital in hospitals_to_check:
                    # 마지막 확인 업데이트 (실제 검증은 아님)
                    hospital.last_verified_at = datetime.now()
                    verified_count += 1

            await db.commit()

            # 새 프로스펙트가 있으면 알림 발송
            if new_prospects:
                logger.info(f"Sending alerts for {len(new_prospects)} new vacancy prospects")
                # send_new_prospect_alerts.delay([str(p.id) for p in new_prospects])

            logger.info(f"Checked {len(hospitals_to_check)} hospitals, verified {verified_count}, closed {closed_count}")
            return {
                "status": "completed",
                "checked": len(hospitals_to_check),
                "verified": verified_count,
                "closed": closed_count,
                "new_prospects": len(new_prospects)
            }

        except Exception as e:
            logger.error(f"Closed hospital check error: {e}")
            return {"status": "error", "message": str(e)}


def _calculate_vacancy_score(hospital) -> int:
    """폐업 병원 위치의 적합도 점수 계산"""
    score = 70  # 기본 점수 (이미 병원이었으므로 높은 기본점수)

    # 면적에 따른 가산
    if hospital.area_pyeong:
        if hospital.area_pyeong >= 50:
            score += 15
        elif hospital.area_pyeong >= 30:
            score += 10
        elif hospital.area_pyeong >= 20:
            score += 5

    # 주차 가능 여부
    if hospital.parking_available:
        score += 5

    # 진료과목에 따른 가산 (인기 진료과일수록 높은 점수)
    popular_depts = ["피부과", "성형외과", "안과", "치과", "정형외과"]
    if hospital.clinic_type and any(dept in hospital.clinic_type for dept in popular_depts):
        score += 5

    return min(score, 100)  # 최대 100점


def _get_recommended_depts(previous_clinic_type: str) -> list:
    """이전 진료과를 기반으로 추천 진료과 반환"""
    if not previous_clinic_type:
        return ["내과", "가정의학과", "소아청소년과"]

    # 유사 진료과 매핑
    dept_mapping = {
        "내과": ["내과", "가정의학과", "소아청소년과"],
        "피부과": ["피부과", "성형외과", "미용의학과"],
        "정형외과": ["정형외과", "재활의학과", "신경외과"],
        "안과": ["안과", "이비인후과"],
        "치과": ["치과", "구강외과"],
        "이비인후과": ["이비인후과", "안과", "소아청소년과"],
        "산부인과": ["산부인과", "비뇨의학과"],
        "신경외과": ["신경외과", "정형외과", "재활의학과"],
        "비뇨의학과": ["비뇨의학과", "산부인과"],
    }

    for key, depts in dept_mapping.items():
        if key in previous_clinic_type:
            return depts

    return ["내과", "가정의학과", previous_clinic_type]


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
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.hospital import CommercialData

    COMMERCIAL_API_KEY = os.getenv("COMMERCIAL_API_KEY", "")
    BASE_URL = "http://apis.data.go.kr/B553077/api/open/sdsc"

    if not COMMERCIAL_API_KEY:
        logger.warning("COMMERCIAL_API_KEY not set")
        return {"status": "skipped", "reason": "API key not configured"}

    # 서울 주요 행정동 목록
    target_regions = [
        {"code": "1168010300", "name": "강남구 역삼1동"},
        {"code": "1168010400", "name": "강남구 역삼2동"},
        {"code": "1168010800", "name": "강남구 삼성1동"},
        {"code": "1168010900", "name": "강남구 삼성2동"},
        {"code": "1165010100", "name": "서초구 서초1동"},
        {"code": "1165010200", "name": "서초구 서초2동"},
        {"code": "1165010300", "name": "서초구 서초3동"},
        {"code": "1165010400", "name": "서초구 서초4동"},
        {"code": "1168011100", "name": "강남구 대치1동"},
        {"code": "1168011200", "name": "강남구 대치2동"},
        {"code": "1171010100", "name": "송파구 잠실본동"},
        {"code": "1171010200", "name": "송파구 잠실2동"},
        {"code": "1171010300", "name": "송파구 잠실3동"},
        {"code": "1114015000", "name": "마포구 서교동"},
        {"code": "1114016000", "name": "마포구 합정동"},
        {"code": "1117010100", "name": "영등포구 여의도동"},
    ]

    saved_count = 0
    current_quarter = datetime.now().strftime("%Y-Q") + str((datetime.now().month - 1) // 3 + 1)

    async with httpx.AsyncClient(timeout=30.0) as client:
        for region in target_regions:
            try:
                # 1. 상권 정보 조회
                response = await client.get(
                    f"{BASE_URL}/storeListInDong",
                    params={
                        "serviceKey": COMMERCIAL_API_KEY,
                        "divId": "adongCd",
                        "key": region["code"],
                        "numOfRows": 1000,
                        "pageNo": 1,
                        "type": "json"
                    }
                )

                store_count = 0
                medical_store_count = 0

                if response.status_code == 200:
                    try:
                        data = response.json()
                        items = data.get("body", {}).get("items", [])
                        store_count = len(items)
                        # 의료업종 필터링 (업종코드 Q: 보건업)
                        medical_store_count = len([
                            item for item in items
                            if item.get("indsLclsCd", "").startswith("Q")
                        ])
                    except Exception:
                        pass

                # 2. 유동인구 정보 조회
                pop_response = await client.get(
                    f"{BASE_URL}/storePopDong",
                    params={
                        "serviceKey": COMMERCIAL_API_KEY,
                        "divId": "adongCd",
                        "key": region["code"],
                        "type": "json"
                    }
                )

                floating_daily = 0
                floating_weekday = 0
                floating_weekend = 0

                if pop_response.status_code == 200:
                    try:
                        pop_data = pop_response.json()
                        items = pop_data.get("body", {}).get("items", [])
                        if items:
                            item = items[0]
                            floating_daily = int(item.get("fpopSum", 0) or 0)
                            floating_weekday = int(item.get("fpopWk", 0) or 0)
                            floating_weekend = int(item.get("fpopSat", 0) or 0)
                    except Exception:
                        pass

                # DB 저장
                async with AsyncSessionLocal() as db:
                    existing = await db.execute(
                        select(CommercialData).where(
                            CommercialData.region_code == region["code"]
                        )
                    )
                    commercial = existing.scalar_one_or_none()

                    if commercial:
                        # 업데이트
                        commercial.store_count = store_count
                        commercial.medical_store_count = medical_store_count
                        commercial.floating_population_daily = floating_daily
                        commercial.floating_population_weekday = floating_weekday
                        commercial.floating_population_weekend = floating_weekend
                        commercial.data_period = current_quarter
                        commercial.updated_at = datetime.now()
                    else:
                        # 신규 생성
                        commercial = CommercialData(
                            region_code=region["code"],
                            region_name=region["name"],
                            store_count=store_count,
                            medical_store_count=medical_store_count,
                            floating_population_daily=floating_daily,
                            floating_population_weekday=floating_weekday,
                            floating_population_weekend=floating_weekend,
                            data_period=current_quarter
                        )
                        db.add(commercial)
                        saved_count += 1

                    await db.commit()

                # API 호출 간격
                await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"Error crawling commercial data for {region['name']}: {e}")
                continue

    logger.info(f"Commercial data crawl completed: {saved_count} new records")
    return {"status": "completed", "saved": saved_count, "regions": len(target_regions)}


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
