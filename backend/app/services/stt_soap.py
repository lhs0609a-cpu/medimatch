"""
STT → SOAP 자동 파싱 서비스

진료 음성/텍스트 transcript를 받아 SOAP 4섹션 + 진단/처치/처방 후보로 분해.

- 1순위: OpenAI GPT-4o-mini (JSON 모드)
- Fallback: 키워드 규칙 기반 분해 (API 키 없을 때 안전망)
"""
from __future__ import annotations
import json
import re
from typing import Dict, Any, List, Optional

import httpx

from app.core.config import settings


OPENAI_URL = "https://api.openai.com/v1/chat/completions"
DEFAULT_MODEL = "gpt-4o-mini"


SYSTEM_PROMPT = """당신은 한국 의료 진료실의 차팅 보조 AI입니다.
의사와 환자 간 대화 또는 의사의 음성 메모를 받아, 한국식 SOAP 차트로 분해하세요.

규칙:
1. 모든 출력은 한국어. 의료 용어는 한국 임상 표준 표현 사용.
2. 환자가 호소한 것은 S(주관), 의사가 관찰/측정한 것은 O(객관), 진단·평가는 A, 계획·처방·교육은 P.
3. 주증상(chief_complaint)은 가장 핵심 1줄로 요약 (예: "두통 3일째").
4. 진단 후보는 진단명만 (KCD 코드는 비워둠).
5. 처치/검사 후보는 행위명만.
6. 처방 후보는 약물명만 (용량은 알면 명시).
7. 텍스트가 짧거나 정보가 부족하면 빈 문자열로 둘 것 — 절대 추측해서 채우지 말 것.
8. confidence는 0.0~1.0 사이의 본인 판단치.

출력은 반드시 JSON. 키는 다음과 같이 고정:
{
  "chief_complaint": "string",
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "diagnoses_suggested": [{"name": "string"}],
  "procedures_suggested": [{"name": "string"}],
  "drugs_suggested": [{"name": "string", "dose": "string"}],
  "confidence": number
}"""


# ────────────────────────────────────────────────────────────
#  OpenAI 호출
# ────────────────────────────────────────────────────────────
async def _call_openai(transcript: str, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    payload = {
        "model": model,
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"진료 transcript:\n\n{transcript}"},
        ],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(OPENAI_URL, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)


# ────────────────────────────────────────────────────────────
#  Fallback — 룰 기반
# ────────────────────────────────────────────────────────────
S_KEYWORDS = ["호소", "환자", "통증", "불편", "느낌", "고통", "주소", "왔어요", "왔습니다", "아파요", "아파"]
O_KEYWORDS = ["관찰", "측정", "검사", "진찰", "혈압", "맥박", "체온", "압통", "청진", "촉진"]
A_KEYWORDS = ["진단", "의심", "추정", "사료", "rule out", "r/o", "추정 진단"]
P_KEYWORDS = ["처방", "지시", "복용", "교육", "주사", "재방문", "follow-up", "재내원"]


def _rule_based_parse(transcript: str) -> Dict[str, Any]:
    text = (transcript or "").strip()
    sentences = re.split(r"[.!?。]\s*|\n+", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    s_lines, o_lines, a_lines, p_lines = [], [], [], []
    for sent in sentences:
        if any(k in sent for k in P_KEYWORDS):
            p_lines.append(sent)
        elif any(k in sent for k in A_KEYWORDS):
            a_lines.append(sent)
        elif any(k in sent for k in O_KEYWORDS):
            o_lines.append(sent)
        elif any(k in sent for k in S_KEYWORDS):
            s_lines.append(sent)
        else:
            # 분류 못한 문장은 가장 짧은 섹션에 배분
            target = min([s_lines, o_lines, a_lines, p_lines], key=len)
            target.append(sent)

    chief = sentences[0] if sentences else ""
    if len(chief) > 40:
        chief = chief[:40] + "…"

    return {
        "chief_complaint": chief,
        "subjective": "\n".join(s_lines),
        "objective": "\n".join(o_lines),
        "assessment": "\n".join(a_lines),
        "plan": "\n".join(p_lines),
        "diagnoses_suggested": [],
        "procedures_suggested": [],
        "drugs_suggested": [],
        "confidence": 0.35,
    }


# ────────────────────────────────────────────────────────────
#  메인
# ────────────────────────────────────────────────────────────
async def parse_to_soap(transcript: str) -> Dict[str, Any]:
    transcript = (transcript or "").strip()
    if not transcript:
        return {
            "chief_complaint": "",
            "subjective": "", "objective": "", "assessment": "", "plan": "",
            "diagnoses_suggested": [], "procedures_suggested": [], "drugs_suggested": [],
            "confidence": 0.0,
            "model": "empty",
            "raw_transcript": "",
        }

    try:
        if settings.OPENAI_API_KEY:
            parsed = await _call_openai(transcript)
            parsed["model"] = DEFAULT_MODEL
        else:
            parsed = _rule_based_parse(transcript)
            parsed["model"] = "fallback"
    except Exception as exc:
        # 안전망 — 절대 raise 하지 않음
        parsed = _rule_based_parse(transcript)
        parsed["model"] = f"fallback_after_error: {type(exc).__name__}"

    parsed["raw_transcript"] = transcript

    # 누락 키 보강
    for k in ("chief_complaint", "subjective", "objective", "assessment", "plan"):
        parsed.setdefault(k, "")
    for k in ("diagnoses_suggested", "procedures_suggested", "drugs_suggested"):
        parsed.setdefault(k, [])
    parsed.setdefault("confidence", 0.5)
    return parsed
