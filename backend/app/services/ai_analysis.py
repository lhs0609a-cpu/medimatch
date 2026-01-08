"""
AI 분석 서비스 - OpenAI GPT-4o Mini를 사용한 상권 분석
"""
import json
import httpx
from typing import Optional
from datetime import datetime

from ..core.config import settings
from ..models.simulation import Simulation


class AIAnalysisService:
    """GPT-4o Mini를 사용한 의료 개원 상권 분석 서비스"""

    OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
    MODEL = "gpt-4o-mini"

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY

    async def generate_analysis(self, simulation: Simulation) -> dict:
        """시뮬레이션 데이터를 기반으로 AI 분석 생성"""
        if not self.api_key:
            return self._generate_fallback_analysis(simulation)

        try:
            prompt = self._build_prompt(simulation)
            response = await self._call_openai(prompt)
            return self._parse_response(response)
        except Exception as e:
            print(f"AI 분석 실패, fallback 사용: {e}")
            return self._generate_fallback_analysis(simulation)

    def _build_prompt(self, sim: Simulation) -> str:
        """분석 프롬프트 생성"""
        # 경쟁 병원 정보 정리
        competitors_info = ""
        if sim.competitors_data:
            for i, comp in enumerate(sim.competitors_data[:5], 1):
                competitors_info += f"  {i}. {comp.get('name', '미상')} (거리: {comp.get('distance', 'N/A')}m)\n"

        return f"""당신은 20년 경력의 의료 개원 컨설턴트입니다. 다음 상권 분석 데이터를 바탕으로 전문적인 개원 분석 리포트를 작성해주세요.

## 분석 대상 정보
- **위치**: {sim.address}
- **진료과목**: {sim.clinic_type}
- **면적**: {sim.size_pyeong or '미정'}평
- **예산**: {sim.budget_million or '미정'}백만원

## 시장 분석 데이터
- **예상 월 매출**: {sim.est_revenue_avg:,}원 (범위: {sim.est_revenue_min:,} ~ {sim.est_revenue_max:,}원)
- **예상 월 비용**: {sim.est_cost_total:,}원
  - 임차료: {sim.est_cost_rent:,}원
  - 인건비: {sim.est_cost_labor:,}원
  - 유틸리티: {sim.est_cost_utilities:,}원
  - 의료용품: {sim.est_cost_supplies:,}원
- **예상 월 순이익**: {sim.monthly_profit_avg:,}원
- **손익분기점**: {sim.breakeven_months}개월
- **연간 ROI**: {sim.annual_roi_percent:.1f}%

## 경쟁 현황
- **반경 1km 동일 진료과 병원**: {sim.same_dept_count}개
- **반경 1km 전체 의료기관**: {sim.total_clinic_count}개
{competitors_info if competitors_info else '- 상세 경쟁 정보 없음'}

## 인구통계
- **반경 1km 인구**: {sim.population_1km:,}명
- **40대 이상 비율**: {(sim.age_40_plus_ratio or 0) * 100:.1f}%
- **일일 유동인구**: {sim.floating_population_daily:,}명

## 시스템 분석 결과
- **신뢰도 점수**: {sim.confidence_score}점
- **추천 등급**: {sim.recommendation.value if sim.recommendation else 'N/A'}
- **추천 사유**: {sim.recommendation_reason or 'N/A'}

---

다음 JSON 형식으로 상세 분석을 제공해주세요:

{{
  "executive_summary": "경영진 요약 (3-4문장, 핵심 결론)",
  "location_analysis": "입지 분석 (상권 특성, 접근성, 가시성 평가)",
  "market_potential": "시장 잠재력 분석 (타겟 환자층, 수요 예측)",
  "competition_analysis": "경쟁 분석 (경쟁 강도, 차별화 전략 제안)",
  "financial_outlook": "재무 전망 (수익성 평가, 투자 회수 기간)",
  "swot": {{
    "strengths": ["강점 1", "강점 2", "강점 3"],
    "weaknesses": ["약점 1", "약점 2"],
    "opportunities": ["기회 1", "기회 2"],
    "threats": ["위협 1", "위협 2"]
  }},
  "risk_factors": [
    {{"risk": "리스크 1", "impact": "HIGH/MEDIUM/LOW", "mitigation": "대응 방안"}},
    {{"risk": "리스크 2", "impact": "HIGH/MEDIUM/LOW", "mitigation": "대응 방안"}},
    {{"risk": "리스크 3", "impact": "HIGH/MEDIUM/LOW", "mitigation": "대응 방안"}}
  ],
  "success_strategies": [
    {{"strategy": "전략 1", "priority": "HIGH", "description": "상세 설명"}},
    {{"strategy": "전략 2", "priority": "MEDIUM", "description": "상세 설명"}},
    {{"strategy": "전략 3", "priority": "MEDIUM", "description": "상세 설명"}}
  ],
  "action_plan": [
    {{"phase": "개원 전", "actions": ["액션 1", "액션 2"]}},
    {{"phase": "개원 초기 (1-3개월)", "actions": ["액션 1", "액션 2"]}},
    {{"phase": "안정화 (4-12개월)", "actions": ["액션 1", "액션 2"]}}
  ],
  "final_recommendation": "최종 권고사항 (개원 추천 여부 및 조건)",
  "confidence_note": "분석 신뢰도 및 참고사항"
}}

반드시 위 JSON 형식만 출력하세요. 다른 텍스트는 포함하지 마세요."""

    async def _call_openai(self, prompt: str) -> dict:
        """OpenAI API 호출"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "당신은 의료 개원 전문 컨설턴트입니다. 항상 JSON 형식으로만 응답합니다."
                },
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 2500,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.OPENAI_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    def _parse_response(self, response: dict) -> dict:
        """OpenAI 응답 파싱"""
        try:
            content = response["choices"][0]["message"]["content"]
            return json.loads(content)
        except (KeyError, json.JSONDecodeError) as e:
            print(f"응답 파싱 실패: {e}")
            return {}

    def _generate_fallback_analysis(self, sim: Simulation) -> dict:
        """API 실패 시 기본 분석 생성"""
        # 경쟁 강도 평가
        competition_level = "낮음" if sim.same_dept_count <= 3 else "보통" if sim.same_dept_count <= 7 else "높음"

        # 수익성 평가
        profit_level = "양호" if sim.monthly_profit_avg > 5000000 else "보통" if sim.monthly_profit_avg > 0 else "주의 필요"

        # 인구 기반 평가
        population_level = "풍부" if sim.population_1km > 50000 else "적정" if sim.population_1km > 20000 else "부족"

        return {
            "executive_summary": f"{sim.address} 지역의 {sim.clinic_type} 개원 분석 결과, 예상 월 순이익은 {sim.monthly_profit_avg:,}원이며, 경쟁 강도는 {competition_level} 수준입니다. 투자 회수 기간은 약 {sim.breakeven_months}개월로 예상됩니다.",
            "location_analysis": f"해당 위치는 반경 1km 내 인구 {sim.population_1km:,}명이 거주하며, 유동인구는 일 {sim.floating_population_daily:,}명 수준입니다. 40대 이상 인구 비율은 {(sim.age_40_plus_ratio or 0) * 100:.1f}%로 {sim.clinic_type} 진료 수요가 {'충분' if (sim.age_40_plus_ratio or 0) > 0.35 else '다소 부족'}할 것으로 예상됩니다.",
            "market_potential": f"예상 월 매출 {sim.est_revenue_avg:,}원 기준으로 시장 잠재력은 {profit_level}합니다. 지역 내 수요 대비 공급 상황을 고려할 때 신규 진입 여지가 {'있습니다' if sim.same_dept_count <= 5 else '제한적입니다'}.",
            "competition_analysis": f"반경 1km 내 동일 진료과목 병원이 {sim.same_dept_count}개 운영 중입니다. 경쟁 강도가 {competition_level}하므로 {'차별화된 서비스 전략 수립이 필요합니다' if sim.same_dept_count > 5 else '시장 진입에 유리한 조건입니다'}.",
            "financial_outlook": f"월 예상 비용 {sim.est_cost_total:,}원 대비 매출 {sim.est_revenue_avg:,}원으로 순이익 {sim.monthly_profit_avg:,}원이 예상됩니다. 연간 ROI {sim.annual_roi_percent:.1f}%로 투자 대비 수익률은 {'양호' if sim.annual_roi_percent > 20 else '보통'}합니다.",
            "swot": {
                "strengths": [
                    f"인구 {population_level}한 지역" if sim.population_1km > 30000 else "개발 잠재력 있는 지역",
                    f"경쟁 강도 {competition_level}" if sim.same_dept_count <= 5 else "검증된 의료 수요 지역",
                    f"예상 ROI {sim.annual_roi_percent:.1f}%" if sim.annual_roi_percent > 15 else "안정적인 수익 구조"
                ],
                "weaknesses": [
                    f"경쟁 병원 {sim.same_dept_count}개 존재" if sim.same_dept_count > 3 else "신규 시장 개척 필요",
                    f"초기 투자금 회수 기간 {sim.breakeven_months}개월" if sim.breakeven_months > 24 else "임차료 부담"
                ],
                "opportunities": [
                    "디지털 마케팅을 통한 신환 유치",
                    f"40대 이상 인구 {(sim.age_40_plus_ratio or 0) * 100:.1f}% 타겟팅"
                ],
                "threats": [
                    "신규 경쟁자 진입 가능성",
                    "의료 정책 변화 리스크"
                ]
            },
            "risk_factors": [
                {"risk": "경쟁 심화", "impact": "HIGH" if sim.same_dept_count > 5 else "MEDIUM", "mitigation": "차별화된 진료 서비스 개발"},
                {"risk": "환자 유치 지연", "impact": "MEDIUM", "mitigation": "개원 초기 마케팅 집중 투자"},
                {"risk": "운영비 증가", "impact": "MEDIUM", "mitigation": "효율적인 인력 운영 및 비용 관리"}
            ],
            "success_strategies": [
                {"strategy": "지역 밀착 마케팅", "priority": "HIGH", "description": "지역 커뮤니티 및 SNS를 활용한 인지도 구축"},
                {"strategy": "서비스 차별화", "priority": "HIGH", "description": "특화 진료 분야 개발 및 환자 경험 개선"},
                {"strategy": "온라인 예약 시스템", "priority": "MEDIUM", "description": "편의성 향상을 통한 환자 만족도 제고"}
            ],
            "action_plan": [
                {"phase": "개원 전", "actions": ["입지 최종 확정", "인테리어 및 의료장비 계약", "인력 채용", "마케팅 계획 수립"]},
                {"phase": "개원 초기 (1-3개월)", "actions": ["지역 홍보 활동", "환자 DB 구축", "서비스 프로세스 안정화"]},
                {"phase": "안정화 (4-12개월)", "actions": ["단골 환자 관리", "매출 분석 및 전략 조정", "추가 서비스 개발"]}
            ],
            "final_recommendation": f"{'개원을 권장합니다. 다만 경쟁이 있으므로 차별화 전략이 필요합니다.' if sim.recommendation and sim.recommendation.value in ['VERY_POSITIVE', 'POSITIVE'] else '신중한 검토가 필요합니다. 추가적인 시장 조사를 권장합니다.' if sim.recommendation and sim.recommendation.value == 'NEUTRAL' else '현재 조건에서는 개원에 신중할 필요가 있습니다. 대안 입지 검토를 권장합니다.'}",
            "confidence_note": f"본 분석은 공공 데이터 기반으로 생성되었으며, 신뢰도 {sim.confidence_score}점입니다. 실제 개원 시 추가적인 현장 조사가 필요합니다.",
            "generated_at": datetime.utcnow().isoformat(),
            "analysis_type": "fallback"
        }


# 서비스 인스턴스
ai_analysis_service = AIAnalysisService()
