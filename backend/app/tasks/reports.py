"""
리포트 생성 관련 Celery 태스크
"""
from celery import shared_task
from typing import Dict, Any
from datetime import datetime, timedelta
import logging
import json
import asyncio

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_simulation_report(self, simulation_id: int):
    """
    시뮬레이션 리포트 생성
    """
    logger.info(f"Generating simulation report for {simulation_id}")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_generate_simulation_report_async(simulation_id))
        return result
    except Exception as e:
        logger.error(f"Failed to generate simulation report: {e}")
        self.retry(exc=e, countdown=60)
    finally:
        loop.close()


async def _generate_simulation_report_async(simulation_id: int):
    """
    시뮬레이션 리포트 비동기 생성
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, update
    from app.models.simulation import Simulation, SimulationReport

    async with AsyncSessionLocal() as db:
        try:
            # 시뮬레이션 조회
            result = await db.execute(
                select(Simulation).where(Simulation.id == simulation_id)
            )
            simulation = result.scalar_one_or_none()

            if not simulation:
                return {"error": "Simulation not found"}

            # AI 리포트 생성 (실제 구현 시 GPT-4o Mini 사용)
            report_content = await _generate_ai_report(simulation)

            # 리포트 저장
            report = SimulationReport(
                simulation_id=simulation_id,
                report_type="FULL",
                content=json.dumps(report_content, ensure_ascii=False),
                generated_at=datetime.utcnow(),
            )
            db.add(report)

            # 시뮬레이션 상태 업데이트
            await db.execute(
                update(Simulation)
                .where(Simulation.id == simulation_id)
                .values(status="COMPLETED")
            )

            await db.commit()

            logger.info(f"Simulation report generated: {simulation_id}")
            return {"status": "completed", "simulation_id": simulation_id}

        except Exception as e:
            logger.error(f"Failed to generate simulation report: {e}")
            await db.rollback()
            return {"error": str(e)}


async def _generate_ai_report(simulation) -> Dict[str, Any]:
    """
    AI 기반 리포트 생성
    """
    # 실제 구현 시 GPT-4o Mini API 호출
    # 현재는 템플릿 기반 리포트 생성

    result = simulation.result or {}

    report = {
        "summary": {
            "title": f"{simulation.address} 개원 시뮬레이션 리포트",
            "generated_at": datetime.utcnow().isoformat(),
            "specialty": simulation.specialty,
            "address": simulation.address,
        },
        "financial_analysis": {
            "expected_monthly_revenue": result.get("monthly_revenue", 0),
            "expected_monthly_patients": result.get("monthly_patients", 0),
            "break_even_months": result.get("break_even_months", 0),
            "roi_3_year": result.get("roi", 0),
        },
        "market_analysis": {
            "competition_level": result.get("competition_level", "보통"),
            "population_density": result.get("population_density", 0),
            "target_demographics": result.get("demographics", {}),
            "nearby_hospitals": result.get("nearby_hospitals", []),
        },
        "location_analysis": {
            "accessibility_score": result.get("accessibility_score", 0),
            "parking_availability": result.get("parking", "보통"),
            "public_transport": result.get("public_transport", []),
            "foot_traffic": result.get("foot_traffic", "보통"),
        },
        "recommendations": {
            "strengths": [
                "해당 지역 전문의 부족으로 수요 높음",
                "대중교통 접근성 우수",
                "주변 오피스 밀집 지역",
            ],
            "weaknesses": [
                "초기 임대료 높음",
                "주차 공간 제한적",
            ],
            "opportunities": [
                "인근 신규 아파트 단지 입주 예정",
                "지역 고령화로 의료 수요 증가",
            ],
            "threats": [
                "대형 병원 인근 위치",
                "경쟁 의원 증가 추세",
            ],
        },
        "action_items": [
            {
                "priority": "HIGH",
                "action": "임대 계약 협상",
                "deadline": "개원 3개월 전",
            },
            {
                "priority": "MEDIUM",
                "action": "인테리어 업체 선정",
                "deadline": "개원 2개월 전",
            },
            {
                "priority": "LOW",
                "action": "마케팅 계획 수립",
                "deadline": "개원 1개월 전",
            },
        ],
    }

    return report


@shared_task(bind=True, max_retries=3)
def generate_prospect_report(self, prospect_id: int, user_id: int):
    """
    프로스펙트 AI 리포트 생성
    """
    logger.info(f"Generating prospect report for {prospect_id}")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_generate_prospect_report_async(prospect_id, user_id))
        return result
    except Exception as e:
        logger.error(f"Failed to generate prospect report: {e}")
        self.retry(exc=e, countdown=60)
    finally:
        loop.close()


async def _generate_prospect_report_async(prospect_id: int, user_id: int) -> Dict[str, Any]:
    """
    프로스펙트 리포트 비동기 생성
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.prospect import ProspectLocation

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(ProspectLocation).where(ProspectLocation.id == prospect_id)
            )
            prospect = result.scalar_one_or_none()

            if not prospect:
                return {"error": "Prospect not found"}

            # AI 리포트 생성
            report = {
                "prospect_id": prospect_id,
                "address": prospect.address,
                "type": prospect.type,
                "generated_at": datetime.utcnow().isoformat(),
                "analysis": {
                    "fit_score": prospect.clinic_fit_score,
                    "recommended_specialties": prospect.recommended_dept or [],
                    "market_potential": "높음" if prospect.clinic_fit_score >= 80 else "보통",
                },
                "sales_strategy": {
                    "approach": "신규 개업 의사 타겟",
                    "key_points": [
                        "최신 건물로 시설 우수",
                        "인근 경쟁 적음",
                        "교통 접근성 좋음",
                    ],
                    "objection_handling": [
                        "임대료: 장기 계약 시 할인 협상 가능",
                        "인지도: 초기 마케팅 지원 제안",
                    ],
                },
                "contact_info": {
                    "building_owner": "부동산 중개사 연결 필요",
                    "estimated_rent": f"{prospect.floor_area * 50000:,.0f}원/월" if prospect.floor_area else "문의 필요",
                },
            }

            return report

        except Exception as e:
            logger.error(f"Failed to generate prospect report: {e}")
            return {"error": str(e)}


@shared_task
def send_daily_digest():
    """
    일일 다이제스트 발송
    """
    logger.info("Sending daily digest...")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_send_daily_digest_async())
        return result
    finally:
        loop.close()


async def _send_daily_digest_async():
    """
    일일 다이제스트 비동기 발송
    """
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select, func
    from app.models.user import User
    from app.models.prospect import ProspectLocation, UserAlert
    from app.tasks.notifications import send_email_notification

    async with AsyncSessionLocal() as db:
        try:
            # 어제 생성된 프로스펙트 수
            yesterday = datetime.utcnow() - timedelta(days=1)
            result = await db.execute(
                select(func.count(ProspectLocation.id)).where(
                    ProspectLocation.created_at >= yesterday
                )
            )
            new_prospects_count = result.scalar() or 0

            # 다이제스트를 받을 사용자 조회 (알림 설정된 사용자)
            users_result = await db.execute(
                select(User).join(UserAlert).where(UserAlert.is_active == True).distinct()
            )
            users = users_result.scalars().all()

            sent_count = 0

            for user in users:
                # 사용자별 관심 지역 프로스펙트 조회
                # 간단한 버전: 전체 새 프로스펙트 수만 전송
                send_email_notification.delay(
                    user.email,
                    f"[MediMatch] 오늘의 새로운 기회 {new_prospects_count}건",
                    "daily_digest",
                    {
                        "user_name": user.name,
                        "new_prospects": new_prospects_count,
                        "date": datetime.now().strftime("%Y년 %m월 %d일"),
                    }
                )
                sent_count += 1

            logger.info(f"Daily digest sent to {sent_count} users")
            return {"sent": sent_count, "new_prospects": new_prospects_count}

        except Exception as e:
            logger.error(f"Failed to send daily digest: {e}")
            return {"error": str(e)}


@shared_task(bind=True, max_retries=3)
def export_report_to_pdf(self, simulation_id: int):
    """
    시뮬레이션 리포트를 PDF로 내보내기
    """
    logger.info(f"Exporting simulation {simulation_id} to PDF")

    try:
        # PDF 생성 로직
        # 실제 구현 시 WeasyPrint, reportlab 등 사용

        pdf_path = f"/tmp/simulation_{simulation_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"

        # 임시: 로그만 출력
        logger.info(f"PDF would be generated at: {pdf_path}")

        return {"status": "completed", "path": pdf_path}

    except Exception as e:
        logger.error(f"Failed to export PDF: {e}")
        self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def export_prospects_to_excel(self, user_id: int, filters: Dict = None):
    """
    프로스펙트 목록을 Excel로 내보내기
    """
    logger.info(f"Exporting prospects for user {user_id}")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(_export_prospects_async(user_id, filters))
        return result
    except Exception as e:
        logger.error(f"Failed to export prospects: {e}")
        self.retry(exc=e, countdown=60)
    finally:
        loop.close()


async def _export_prospects_async(user_id: int, filters: Dict = None):
    """
    프로스펙트 Excel 내보내기 비동기 처리
    """
    import io
    from openpyxl import Workbook
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.prospect import ProspectLocation

    async with AsyncSessionLocal() as db:
        try:
            query = select(ProspectLocation)

            if filters:
                if filters.get("type"):
                    query = query.where(ProspectLocation.type == filters["type"])
                if filters.get("min_score"):
                    query = query.where(ProspectLocation.clinic_fit_score >= filters["min_score"])

            result = await db.execute(query)
            prospects = result.scalars().all()

            # Excel 생성
            wb = Workbook()
            ws = wb.active
            ws.title = "프로스펙트 목록"

            # 헤더
            headers = ["ID", "주소", "유형", "적합도 점수", "추천 진료과", "상태", "발견일"]
            ws.append(headers)

            # 데이터
            for p in prospects:
                ws.append([
                    p.id,
                    p.address,
                    p.type,
                    p.clinic_fit_score,
                    ", ".join(p.recommended_dept) if p.recommended_dept else "",
                    p.status,
                    p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
                ])

            # 파일 저장
            file_path = f"/tmp/prospects_{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
            wb.save(file_path)

            logger.info(f"Excel exported: {file_path}")
            return {"status": "completed", "path": file_path, "count": len(prospects)}

        except Exception as e:
            logger.error(f"Failed to export prospects: {e}")
            return {"error": str(e)}
