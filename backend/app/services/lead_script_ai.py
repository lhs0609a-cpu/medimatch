"""
Lead 상담 스크립트 AI 생성기

OpenAI GPT-4o-mini 사용 — 룰 기반보다 한 단계 위.
실패 시 룰 fallback (호출부에서 처리).
"""
import json
import httpx
from typing import Any, Optional

from app.core.config import settings


OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"
TIMEOUT = 25


SYSTEM_PROMPT = """\
당신은 20년 경력의 의료 개원 영업 전문가다. 메디플라톤은 개원의에게 부동산·법무·회계·세무·노무·인테리어·의료기기·EMR·마케팅까지 협력사를 매칭해주는 플랫폼이다.

당신의 임무: 우리 상담사가 이 의사와 통화할 때 바로 사용할 수 있는 1:1 맞춤 스크립트를 작성한다.
- 톤: 격조 있고 절제된 한국어. 영업 티 안 나게.
- 포맷: 반드시 아래 JSON 스키마로만 답변한다. 다른 텍스트 없음.
- 분량: 각 필드 50~120자.

JSON 스키마:
{
  "opening": "통화 시작 인사 한 문장",
  "hook": "관심을 끌 한 문장 — 의사의 현재 단계·고민에 정확히 맞춤",
  "value_cards": [
    {"category": "<slug>", "label": "<한글 라벨>", "pitch": "이 분야에 우리가 줄 수 있는 가치 한 문장"}
  ],
  "objections": [
    {"q": "예상 반론 한 문장", "a": "대응 한~두 문장"}
  ],
  "closing": "통화 끝 클로징 + 다음 액션 한~두 문장"
}

규칙:
- value_cards 는 의사가 막막해하는 영역 + 단계상 필요한 영역 위주로 3~5개.
- objections 3개. 그 의사 상황에서 실제로 나올 법한 것.
- 모든 문장은 의사 정보(전공·지역·단계·이력)에 맞춤. 일반론 금지.
"""


def build_user_prompt(ctx: dict) -> str:
    """lead 컨텍스트 → 사용자 프롬프트"""
    lines = [
        "## 의사 프로필",
        f"- 이름: {ctx.get('name', '?')}",
        f"- 전공: {ctx.get('specialty', '미정')}",
        f"- 지역: {ctx.get('region', '미정')}",
        f"- 현재 단계: {ctx.get('opening_stage_label', '미정')}",
        f"- 시기: {ctx.get('timeline', '미정')}",
        f"- 예산: {ctx.get('budget', '미정')}",
        f"- 동업: {'예' if ctx.get('has_partner') else '아니오'}",
        f"- 자금 조달 필요: {'예' if ctx.get('needs_loan') else '아니오'}",
        f"- 준비도 점수: {ctx.get('readiness_score', 0)}/100",
        "",
        "## 의사가 막막해하는 영역",
        ctx.get('pain_text', '(없음)'),
        "",
        "## 미완료 체크리스트 (현재·이전 단계)",
        ctx.get('missing_text', '(없음)'),
        "",
        "## 매칭된 협력사 현황",
        ctx.get('matches_text', '(아직 없음)'),
        "",
        "## 최근 통화 이력 (최대 3건)",
        ctx.get('consult_text', '(없음)'),
        "",
        "## 추천 가능한 협력사 카테고리",
        ctx.get('rec_text', '(없음)'),
    ]
    return "\n".join(lines)


async def generate_script_ai(ctx: dict) -> Optional[dict]:
    """AI 스크립트 생성. 실패 시 None 반환 (호출부에서 룰 fallback)."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        return None

    user_prompt = build_user_prompt(ctx)

    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.7,
        "max_tokens": 1200,
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.post(
                OPENAI_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            if res.status_code != 200:
                print(f"AI script: openai status {res.status_code}")
                return None
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            # 최소 검증
            if not all(k in parsed for k in ("opening", "hook", "value_cards", "objections", "closing")):
                return None
            return parsed
    except Exception as e:
        print(f"AI script generation failed: {e}")
        return None
