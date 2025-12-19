"""
리포트 생성 관련 Celery 태스크
"""
from celery import shared_task
from typing import Dict, Any
from datetime import datetime, timedelta
import logging
import json
import asyncio
import httpx

from app.core.config import settings

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
    AI 기반 리포트 생성 (OpenAI GPT-4o Mini 사용)
    """
    result = simulation.result or {}

    # 기본 분석 데이터 구성
    base_report = {
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
    }

    # OpenAI API로 SWOT 분석 및 추천 생성
    ai_analysis = await _call_openai_for_analysis(simulation, result)

    base_report["recommendations"] = ai_analysis.get("recommendations", {
        "strengths": ["데이터 분석 중"],
        "weaknesses": ["데이터 분석 중"],
        "opportunities": ["데이터 분석 중"],
        "threats": ["데이터 분석 중"],
    })

    base_report["action_items"] = ai_analysis.get("action_items", [
        {"priority": "HIGH", "action": "현장 답사 진행", "deadline": "1주 내"},
    ])

    base_report["ai_summary"] = ai_analysis.get("summary", "")

    return base_report


async def _call_openai_for_analysis(simulation, result: Dict) -> Dict[str, Any]:
    """
    OpenAI GPT-4o Mini API 호출하여 분석 생성
    """
    if not settings.OPENAI_API_KEY:
        logger.warning("OpenAI API key not configured, using template analysis")
        return _generate_template_analysis(simulation, result)

    prompt = f"""
당신은 의료 시장 분석 전문가입니다. 다음 데이터를 기반으로 병원 개원 분석을 해주세요.

[입력 데이터]
- 주소: {simulation.address}
- 진료과목: {simulation.specialty}
- 예상 월 매출: {result.get("monthly_revenue", 0):,}원
- 예상 일일 환자: {result.get("daily_patients", 0)}명
- 반경 1km 경쟁 병원 수: {len(result.get("nearby_hospitals", []))}개
- 인구밀도: {result.get("population_density", 0)}명/km²
- 유동인구: {result.get("floating_population", 0)}명
- 40대 이상 비율: {result.get("age_40_plus_ratio", 0.4) * 100:.1f}%

다음 JSON 형식으로 응답해주세요:
{{
    "summary": "전체 분석 요약 (2-3문장)",
    "recommendations": {{
        "strengths": ["강점 3개"],
        "weaknesses": ["약점 2개"],
        "opportunities": ["기회 2개"],
        "threats": ["위협 2개"]
    }},
    "action_items": [
        {{"priority": "HIGH/MEDIUM/LOW", "action": "구체적 액션", "deadline": "기한"}}
    ]
}}
"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "당신은 의료 시장 분석 전문가입니다. JSON 형식으로만 응답하세요."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500,
                    "response_format": {"type": "json_object"}
                }
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return _generate_template_analysis(simulation, result)

    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        return _generate_template_analysis(simulation, result)


def _generate_template_analysis(simulation, result: Dict) -> Dict[str, Any]:
    """
    OpenAI 사용 불가시 템플릿 기반 분석 생성
    """
    nearby_count = len(result.get("nearby_hospitals", []))
    monthly_revenue = result.get("monthly_revenue", 0)

    # 경쟁 수준에 따른 동적 분석
    if nearby_count <= 3:
        competition_strength = "해당 지역 내 경쟁이 적어 시장 선점 유리"
        competition_threat = "신규 경쟁자 진입 가능성"
    elif nearby_count <= 7:
        competition_strength = "적정 수준의 경쟁으로 수요 검증됨"
        competition_threat = "기존 경쟁자와의 차별화 필요"
    else:
        competition_strength = "의료 수요가 높은 지역으로 검증됨"
        competition_threat = "치열한 경쟁으로 마케팅 비용 증가 예상"

    return {
        "summary": f"{simulation.address}는 {simulation.specialty} 개원에 {'적합한' if monthly_revenue > 50000000 else '보통의'} 입지입니다. "
                   f"반경 1km 내 {nearby_count}개의 경쟁 병원이 있으며, 예상 월 매출은 {monthly_revenue:,}원입니다.",
        "recommendations": {
            "strengths": [
                competition_strength,
                "대중교통 접근성 우수",
                "주변 상업시설 밀집으로 유동인구 확보",
            ],
            "weaknesses": [
                "초기 임대료 및 인테리어 비용 부담",
                "주차 공간 확보 필요",
            ],
            "opportunities": [
                "지역 내 의료 서비스 수요 증가 추세",
                "온라인 마케팅을 통한 신규 환자 유치 가능",
            ],
            "threats": [
                competition_threat,
                "의료 정책 변화에 따른 수익성 영향",
            ],
        },
        "action_items": [
            {"priority": "HIGH", "action": "현장 답사 및 상권 분석", "deadline": "1주 내"},
            {"priority": "HIGH", "action": "임대 조건 협상", "deadline": "2주 내"},
            {"priority": "MEDIUM", "action": "인테리어 업체 비교 견적", "deadline": "1개월 내"},
            {"priority": "MEDIUM", "action": "의료기기 도입 계획 수립", "deadline": "2개월 내"},
            {"priority": "LOW", "action": "마케팅 전략 수립", "deadline": "개원 1개월 전"},
        ],
    }


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
