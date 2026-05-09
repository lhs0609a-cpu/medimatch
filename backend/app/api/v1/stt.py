"""STT → SOAP API.

POST /stt/parse
    transcript 텍스트를 받아 SOAP 4섹션 + 진단/처치/처방 후보로 분해.
    visit_id가 함께 오면 결과를 visit.ai_suggestions에 누적 저장 + voice_transcript 보강.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db, get_current_active_user
from ...models.user import User
from ...models.visit import Visit
from ...services.stt_soap import parse_to_soap

router = APIRouter()


class ParseRequest(BaseModel):
    transcript: str
    visit_id: Optional[UUID] = None
    save_to_visit: bool = False   # True면 visit.ai_suggestions / voice_transcript에 저장


class DiagSuggest(BaseModel):
    name: str
    code: Optional[str] = None


class ProcSuggest(BaseModel):
    name: str


class DrugSuggest(BaseModel):
    name: str
    dose: Optional[str] = None


class ParseResponse(BaseModel):
    chief_complaint: str = ""
    subjective: str = ""
    objective: str = ""
    assessment: str = ""
    plan: str = ""
    diagnoses_suggested: list = Field(default_factory=list)
    procedures_suggested: list = Field(default_factory=list)
    drugs_suggested: list = Field(default_factory=list)
    confidence: float = 0.5
    model: str = ""
    raw_transcript: str = ""
    saved_to_visit: bool = False


@router.post("/parse", response_model=ParseResponse)
async def parse_transcript(
    payload: ParseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    transcript = (payload.transcript or "").strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="transcript가 비어있습니다.")

    parsed = await parse_to_soap(transcript)

    saved = False
    if payload.save_to_visit and payload.visit_id:
        q = select(Visit).where(and_(
            Visit.id == payload.visit_id,
            Visit.user_id == current_user.id,
        ))
        v = (await db.execute(q)).scalar_one_or_none()
        if v:
            existing = v.ai_suggestions or []
            if not isinstance(existing, list):
                existing = []
            existing.append({
                "kind": "stt_soap",
                "at": datetime.utcnow().isoformat(),
                "model": parsed.get("model", ""),
                "confidence": parsed.get("confidence", 0.0),
                "data": {
                    "chief_complaint": parsed.get("chief_complaint", ""),
                    "subjective": parsed.get("subjective", ""),
                    "objective": parsed.get("objective", ""),
                    "assessment": parsed.get("assessment", ""),
                    "plan": parsed.get("plan", ""),
                    "diagnoses": parsed.get("diagnoses_suggested", []),
                    "procedures": parsed.get("procedures_suggested", []),
                    "drugs": parsed.get("drugs_suggested", []),
                },
            })
            v.ai_suggestions = existing
            # transcript 백업 (이전 transcript에 누적)
            prev = (v.voice_transcript or "").strip()
            v.voice_transcript = (prev + "\n---\n" + transcript) if prev else transcript
            await db.commit()
            saved = True

    return ParseResponse(
        chief_complaint=parsed.get("chief_complaint", ""),
        subjective=parsed.get("subjective", ""),
        objective=parsed.get("objective", ""),
        assessment=parsed.get("assessment", ""),
        plan=parsed.get("plan", ""),
        diagnoses_suggested=parsed.get("diagnoses_suggested", []),
        procedures_suggested=parsed.get("procedures_suggested", []),
        drugs_suggested=parsed.get("drugs_suggested", []),
        confidence=parsed.get("confidence", 0.5),
        model=parsed.get("model", ""),
        raw_transcript=parsed.get("raw_transcript", transcript),
        saved_to_visit=saved,
    )
