"""
카카오 알림톡 발송 서비스

Aligo / Bizm 호환 패턴.
환경변수 미설정 시 로깅만 하고 noop으로 종료 (개발/스테이지에서 안전).

사용처:
- 진단 완료 직후 결과 요약 + 미션맵 매직링크 발송
- 추후: 견적 도착, 단계 전환, 미팅 리마인더 등 재사용

설정:
- KAKAO_ALIMTALK_PROVIDER : "aligo" | "bizm" (기본 aligo)
- ALIGO_API_KEY / ALIGO_USER_ID / ALIGO_SENDER / ALIGO_SENDER_KEY
- BIZM_PROFILE_KEY / BIZM_USER_ID

템플릿은 채널 등록·승인이 사전 필요. 코드에는 template_code 만 보낸다.
"""
from __future__ import annotations
import os
import json
import httpx
from typing import Optional

from app.core.config import settings


PROVIDER = os.getenv("KAKAO_ALIMTALK_PROVIDER", "aligo").lower()
TIMEOUT = 10.0

# Aligo
ALIGO_BASE = "https://kakaoapi.aligo.in/akv10"
ALIGO_API_KEY = os.getenv("ALIGO_API_KEY", "") or settings.KAKAO_ALIMTALK_API_KEY
ALIGO_USER_ID = os.getenv("ALIGO_USER_ID", "")
ALIGO_SENDER = os.getenv("ALIGO_SENDER", "")
ALIGO_SENDER_KEY = os.getenv("ALIGO_SENDER_KEY", "") or settings.KAKAO_SENDER_KEY

# Bizm
BIZM_BASE = "https://alimtalk-api.bizmsg.kr/v2"
BIZM_PROFILE_KEY = os.getenv("BIZM_PROFILE_KEY", "")
BIZM_USER_ID = os.getenv("BIZM_USER_ID", "")


def _normalize_phone(p: str) -> str:
    """01012345678 형태로 정규화"""
    return "".join(c for c in (p or "") if c.isdigit())


def _is_configured() -> bool:
    if PROVIDER == "aligo":
        return bool(ALIGO_API_KEY and ALIGO_USER_ID and ALIGO_SENDER_KEY)
    if PROVIDER == "bizm":
        return bool(BIZM_PROFILE_KEY and BIZM_USER_ID)
    return False


async def send_alimtalk(
    *,
    phone: str,
    template_code: str,
    message: str,
    button_url: Optional[str] = None,
    button_name: str = "자세히 보기",
    fallback_sms: bool = True,
) -> dict:
    """알림톡 1건 발송. dict {ok, provider, status, message} 반환.

    설정 미비 시 ok=False, status='not_configured' — 절대 raise 하지 않음.
    """
    phone_norm = _normalize_phone(phone)
    if not phone_norm:
        return {"ok": False, "provider": PROVIDER, "status": "no_phone"}

    if not _is_configured():
        print(f"[ALIMTALK] not configured (provider={PROVIDER}). would send to {phone_norm}: {message[:40]}…")
        return {"ok": False, "provider": PROVIDER, "status": "not_configured"}

    if PROVIDER == "aligo":
        return await _send_aligo(phone_norm, template_code, message, button_url, button_name, fallback_sms)
    if PROVIDER == "bizm":
        return await _send_bizm(phone_norm, template_code, message, button_url, button_name, fallback_sms)

    return {"ok": False, "provider": PROVIDER, "status": "unknown_provider"}


async def _send_aligo(phone, template_code, message, button_url, button_name, fallback_sms):
    """Aligo 알림톡 단건 발송"""
    payload = {
        "apikey": ALIGO_API_KEY,
        "userid": ALIGO_USER_ID,
        "senderkey": ALIGO_SENDER_KEY,
        "tpl_code": template_code,
        "sender": ALIGO_SENDER,
        "receiver_1": phone,
        "subject_1": "메디플라톤 알림",
        "message_1": message,
    }
    if button_url:
        payload["button_1"] = json.dumps({
            "button": [{"name": button_name, "linkType": "WL",
                        "linkTypeName": "웹링크",
                        "linkPc": button_url, "linkMo": button_url}],
        }, ensure_ascii=False)
    if fallback_sms:
        payload["failover"] = "Y"
        payload["fsubject_1"] = "메디플라톤"
        payload["fmessage_1"] = message[:80]

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.post(f"{ALIGO_BASE}/alimtalk/send/", data=payload)
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {"raw": res.text}
        ok = res.status_code == 200 and (str(data.get("code", "")) == "0" or data.get("result_code") == "1")
        if not ok:
            print(f"[ALIMTALK] aligo fail status={res.status_code} body={data}")
        return {"ok": ok, "provider": "aligo", "status": str(data.get("code", "?")), "message": data.get("message")}
    except Exception as e:
        print(f"[ALIMTALK] aligo error: {e}")
        return {"ok": False, "provider": "aligo", "status": "exception", "message": str(e)}


async def _send_bizm(phone, template_code, message, button_url, button_name, fallback_sms):
    """Bizm 알림톡 단건 발송"""
    body = [{
        "message_type": "AT",
        "phn": phone,
        "profile": BIZM_PROFILE_KEY,
        "tmplId": template_code,
        "msg": message,
        "smsMsg": message[:80] if fallback_sms else "",
        "smsKind": "L" if fallback_sms else "N",
    }]
    if button_url:
        body[0]["button1"] = json.dumps({
            "name": button_name, "type": "WL", "url_pc": button_url, "url_mobile": button_url,
        }, ensure_ascii=False)

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.post(
                f"{BIZM_BASE}/sender/send",
                headers={"userid": BIZM_USER_ID, "Content-Type": "application/json"},
                json=body,
            )
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {"raw": res.text}
        item = data[0] if isinstance(data, list) and data else {}
        ok = res.status_code == 200 and item.get("code") in ("success", "0000")
        if not ok:
            print(f"[ALIMTALK] bizm fail status={res.status_code} body={data}")
        return {"ok": ok, "provider": "bizm", "status": item.get("code", "?"), "message": item.get("message")}
    except Exception as e:
        print(f"[ALIMTALK] bizm error: {e}")
        return {"ok": False, "provider": "bizm", "status": "exception", "message": str(e)}


# ============================================================
# 도메인 헬퍼 — 진단 완료 알림톡
# ============================================================

DIAGNOSIS_TEMPLATE_CODE = os.getenv("KAKAO_TPL_DIAGNOSIS", "MEDI_DIAG_V1")


def render_diagnosis_message(
    *,
    name: str,
    readiness_score: int,
    stage_label: str,
    rec_label: Optional[str],
    next_action: str,
) -> str:
    """알림톡 템플릿 본문 — 사전 등록한 템플릿과 토씨까지 일치해야 도달.

    템플릿 등록 예시(승인 받아둘 것):

    "{원장님이름}님, 메디플라톤입니다.

    1분 개원 진단이 완료됐어요.
    · 준비도: {준비도}/100
    · 현재 단계: {단계}
    · 우선 매칭: {추천}

    {다음액션}

    아래 버튼으로 본인 미션맵을 바로 확인하실 수 있어요."
    """
    rec = rec_label or "맞춤 협력사 안내"
    return (
        f"{name}님, 메디플라톤입니다.\n\n"
        f"1분 개원 진단이 완료됐어요.\n"
        f"· 준비도: {readiness_score}/100\n"
        f"· 현재 단계: {stage_label}\n"
        f"· 우선 매칭: {rec}\n\n"
        f"{next_action}\n\n"
        "아래 버튼으로 본인 미션맵을 바로 확인하실 수 있어요."
    )


async def send_diagnosis_alimtalk(
    *,
    phone: str,
    name: str,
    readiness_score: int,
    stage_label: str,
    rec_label: Optional[str],
    next_action: str,
    roadmap_url: str,
) -> dict:
    """진단 완료 → 의사 본인 카톡으로 결과 + 미션맵 매직링크 발송"""
    msg = render_diagnosis_message(
        name=name, readiness_score=readiness_score, stage_label=stage_label,
        rec_label=rec_label, next_action=next_action,
    )
    return await send_alimtalk(
        phone=phone,
        template_code=DIAGNOSIS_TEMPLATE_CODE,
        message=msg,
        button_url=roadmap_url,
        button_name="내 미션맵 보기",
        fallback_sms=True,
    )
