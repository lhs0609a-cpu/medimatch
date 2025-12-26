"""
연락처 우회 탐지 서비스

플랫폼 내 채팅에서 연락처 공유를 감지하고 차단합니다.
- 전화번호 패턴
- 이메일 패턴
- SNS ID 패턴
- URL 패턴
- 한글 숫자 우회 패턴
"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..models.escrow import ContactDetectionLog, DetectionAction

logger = logging.getLogger(__name__)


@dataclass
class DetectionResult:
    """탐지 결과"""
    detected: bool
    patterns: List[Dict[str, str]]  # [{"type": "phone", "value": "010-****-1234", "original": "..."}]
    filtered_content: str           # 마스킹된 메시지
    action: Optional[DetectionAction]
    message: Optional[str]


class ContactDetectionService:
    """연락처 우회 탐지 서비스"""

    # 한글 숫자 매핑
    KOREAN_NUMBERS = {
        '공': '0', '영': '0', '빵': '0',
        '일': '1', '하나': '1',
        '이': '2', '둘': '2',
        '삼': '3', '셋': '3',
        '사': '4', '넷': '4',
        '오': '5', '다섯': '5',
        '육': '6', '여섯': '6',
        '칠': '7', '일곱': '7',
        '팔': '8', '여덟': '8',
        '구': '9', '아홉': '9',
    }

    # 탐지 패턴
    PATTERNS = {
        "phone": [
            # 일반 전화번호 패턴
            r'01[0-9][-.\s]?\d{3,4}[-.\s]?\d{4}',           # 010-1234-5678
            r'\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}',           # 02-123-4567
            r'0\d{1,2}\s*-?\s*\d{3,4}\s*-?\s*\d{4}',        # 공백 포함
            # 숫자만
            r'01[0-9]\d{7,8}',                              # 01012345678
        ],
        "phone_korean": [
            # 한글 숫자 패턴
            r'[공영빵일이삼사오육칠팔구하나둘셋넷다섯여섯일곱여덟아홉]{10,11}',
            r'공일[공영빵일이삼사오육칠팔구]{1}[-\s]*[공영빵일이삼사오육칠팔구]{3,4}[-\s]*[공영빵일이삼사오육칠팔구]{4}',
        ],
        "email": [
            # 일반 이메일
            r'[\w.+-]+@[\w-]+\.[\w.-]+',
            # 우회 이메일 (골뱅이, 앳, at 등)
            r'[\w.+-]+\s*[@골뱅이앳ㅇㅌ]\s*[\w-]+\s*[.점닷]\s*[\w.-]+',
            r'[\w.+-]+\s*at\s*[\w-]+\s*dot\s*[\w.-]+',
        ],
        "sns": [
            # 카카오톡
            r'[카카][톡카오]+\s*[:=]?\s*[\w가-힣]+',
            r'kakao\s*[:=]?\s*[\w]+',
            r'카[카톡]\s*[아이디ID]*\s*[:=]?\s*[\w가-힣]+',
            # 인스타그램
            r'인스타[그램]*\s*[:=]?\s*@?[\w.]+',
            r'insta(?:gram)?\s*[:=]?\s*@?[\w.]+',
            # 텔레그램
            r'텔레[그램]*\s*[:=]?\s*@?[\w]+',
            r'telegram\s*[:=]?\s*@?[\w]+',
            # 라인
            r'라인\s*[:=]?\s*[\w가-힣]+',
            r'line\s*[:=]?\s*[\w]+',
        ],
        "url": [
            # 일반 URL
            r'https?://[^\s]+',
            # 도메인만
            r'(?:www\.)?[\w-]+\.(?:com|net|kr|co\.kr|org|io)[/\w.-]*',
            # 우회 URL
            r'[\w-]+\s*[.점닷]\s*(?:com|net|kr|co\.kr|org|io)',
        ],
        "messenger": [
            # 메신저 앱 언급
            r'[문자문의메세지]로?\s*(?:연락|주세요|해주세요|드릴게요)',
            r'직접\s*(?:연락|문의|통화)',
            r'따로\s*(?:연락|문의|말씀)',
        ],
    }

    # 마스킹 문자
    MASK_CHAR = '*'

    def __init__(self):
        # 패턴 컴파일
        self.compiled_patterns = {}
        for pattern_type, patterns in self.PATTERNS.items():
            self.compiled_patterns[pattern_type] = [
                re.compile(p, re.IGNORECASE) for p in patterns
            ]

    def _convert_korean_numbers(self, text: str) -> str:
        """한글 숫자를 아라비아 숫자로 변환"""
        result = text
        for korean, arabic in self.KOREAN_NUMBERS.items():
            result = result.replace(korean, arabic)
        return result

    def _mask_value(self, value: str, pattern_type: str) -> str:
        """값 마스킹"""
        if pattern_type == "phone":
            # 전화번호: 중간 4자리 마스킹
            clean = re.sub(r'[-.\s]', '', value)
            if len(clean) >= 10:
                return f"{clean[:3]}-****-{clean[-4:]}"
            return self.MASK_CHAR * len(value)

        elif pattern_type == "email":
            # 이메일: 앞 2글자만 표시
            if '@' in value:
                local, domain = value.split('@', 1)
                masked_local = local[:2] + self.MASK_CHAR * (len(local) - 2)
                return f"{masked_local}@{domain}"
            return self.MASK_CHAR * len(value)

        else:
            # 기타: 처음과 끝 2글자만 표시
            if len(value) > 4:
                return value[:2] + self.MASK_CHAR * (len(value) - 4) + value[-2:]
            return self.MASK_CHAR * len(value)

    def analyze(self, text: str) -> DetectionResult:
        """메시지 분석 및 연락처 탐지"""
        detected_patterns: List[Dict[str, str]] = []
        filtered_content = text

        # 한글 숫자 변환본도 검사
        converted_text = self._convert_korean_numbers(text)

        for pattern_type, compiled_list in self.compiled_patterns.items():
            # 원본 텍스트 검사
            for regex in compiled_list:
                matches = regex.findall(text)
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0]
                    masked = self._mask_value(match, pattern_type)
                    detected_patterns.append({
                        "type": pattern_type,
                        "value": masked,
                        "original": match
                    })
                    # 마스킹 적용
                    filtered_content = filtered_content.replace(match, f"[{pattern_type.upper()} 감지됨]")

            # 한글 숫자 변환본 검사 (phone_korean 패턴)
            if pattern_type == "phone_korean":
                for regex in compiled_list:
                    matches = regex.findall(text)
                    for match in matches:
                        if isinstance(match, tuple):
                            match = match[0]
                        converted = self._convert_korean_numbers(match)
                        masked = self._mask_value(converted, "phone")
                        detected_patterns.append({
                            "type": "phone_korean",
                            "value": masked,
                            "original": match
                        })
                        filtered_content = filtered_content.replace(match, "[전화번호 감지됨]")

        # 탐지 결과 생성
        if detected_patterns:
            return DetectionResult(
                detected=True,
                patterns=detected_patterns,
                filtered_content=filtered_content,
                action=DetectionAction.WARNING,
                message="연락처 정보가 감지되었습니다. 플랫폼 외부 거래는 보호받지 못합니다."
            )

        return DetectionResult(
            detected=False,
            patterns=[],
            filtered_content=text,
            action=None,
            message=None
        )

    async def get_violation_count(self, db: AsyncSession, user_id: UUID) -> int:
        """사용자 위반 횟수 조회"""
        result = await db.execute(
            select(func.count(ContactDetectionLog.id))
            .where(ContactDetectionLog.user_id == user_id)
        )
        return result.scalar() or 0

    async def determine_action(
        self,
        db: AsyncSession,
        user_id: UUID,
        detection_result: DetectionResult
    ) -> DetectionAction:
        """위반 횟수에 따른 조치 결정"""
        if not detection_result.detected:
            return None

        violation_count = await self.get_violation_count(db, user_id)

        # 조치 결정 로직
        if violation_count >= 5:
            return DetectionAction.BLOCKED  # 5회 이상: 차단
        elif violation_count >= 3:
            return DetectionAction.FLAGGED  # 3-4회: 관리자 검토
        else:
            return DetectionAction.WARNING  # 1-2회: 경고

    async def log_detection(
        self,
        db: AsyncSession,
        user_id: UUID,
        escrow_id: Optional[UUID],
        detection_result: DetectionResult,
        action: DetectionAction
    ) -> ContactDetectionLog:
        """탐지 로그 기록"""
        # 현재 위반 횟수 조회
        violation_count = await self.get_violation_count(db, user_id) + 1

        # 첫 번째 패턴만 로그에 기록 (여러 개인 경우)
        pattern = detection_result.patterns[0] if detection_result.patterns else {}

        log = ContactDetectionLog(
            escrow_id=escrow_id,
            user_id=user_id,
            detected_pattern=pattern.get("type", "unknown"),
            detected_value=pattern.get("value", ""),
            original_content=detection_result.filtered_content[:500],  # 500자 제한
            action_taken=action,
            user_violation_count=violation_count
        )

        db.add(log)
        await db.commit()
        await db.refresh(log)

        logger.warning(
            f"Contact detection: user={user_id}, pattern={pattern.get('type')}, "
            f"action={action.value}, violations={violation_count}"
        )

        return log

    def get_warning_message(self, action: DetectionAction, violation_count: int) -> str:
        """경고 메시지 생성"""
        if action == DetectionAction.BLOCKED:
            return (
                "연락처 공유 시도가 5회 이상 감지되어 메시지 전송이 차단되었습니다. "
                "고객센터로 문의해 주세요."
            )
        elif action == DetectionAction.FLAGGED:
            return (
                f"연락처 공유 시도가 {violation_count}회 감지되었습니다. "
                "추가 위반 시 계정이 제한될 수 있습니다."
            )
        else:
            return (
                "연락처 정보가 감지되어 마스킹 처리되었습니다. "
                "플랫폼 외부 거래는 수수료 환불 및 분쟁 조정 서비스를 받을 수 없습니다."
            )


# 싱글톤 인스턴스
contact_detection_service = ContactDetectionService()
