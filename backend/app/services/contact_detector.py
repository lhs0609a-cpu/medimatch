"""
연락처 우회 탐지 서비스
- 전화번호, 이메일, SNS ID 등 개인 연락처 패턴 탐지
- 탐지 시 마스킹 처리 및 로그 기록
"""
import re
from typing import Tuple, List, Optional
from dataclasses import dataclass
from enum import Enum


class ContactType(str, Enum):
    """연락처 유형"""
    PHONE = "phone"
    EMAIL = "email"
    KAKAO = "kakao"
    INSTAGRAM = "instagram"
    URL = "url"
    LINE = "line"


@dataclass
class DetectionResult:
    """탐지 결과"""
    detected: bool
    contact_type: Optional[ContactType]
    original_value: Optional[str]
    filtered_content: str
    patterns_found: List[dict]


class ContactDetector:
    """연락처 탐지기"""

    # 전화번호 패턴 (다양한 형식)
    PHONE_PATTERNS = [
        # 일반 형식: 010-1234-5678, 010.1234.5678, 010 1234 5678
        r'01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}',
        # 붙여쓰기: 01012345678
        r'01[016789]\d{7,8}',
        # 지역번호 포함: 02-1234-5678
        r'0[2-6][1-5]?[-.\s]?\d{3,4}[-.\s]?\d{4}',
        # 공영: 영일영, 공일공
        r'[공영][일이삼사오육칠팔구]\s*[공영][-.\s]*\d{3,4}[-.\s]*\d{4}',
        # 숫자를 한글로: 일이삼사 등
        r'[영공일이삼사오육칠팔구]{10,11}',
        # 특수 표현: 010 일이삼사 오육칠팔
        r'01[016789][-.\s]*[일이삼사오육칠팔구\d]{3,4}[-.\s]*[일이삼사오육칠팔구\d]{4}',
    ]

    # 이메일 패턴
    EMAIL_PATTERNS = [
        r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        # @ 우회: [at], (at), 골뱅이
        r'[a-zA-Z0-9._%+-]+\s*[\[\(]?\s*(?:at|골뱅이|@)\s*[\]\)]?\s*[a-zA-Z0-9.-]+\s*[\[\(]?\s*(?:dot|점|\.)\s*[\]\)]?\s*[a-zA-Z]{2,}',
    ]

    # 카카오톡 ID 패턴
    KAKAO_PATTERNS = [
        r'(?:카카오|카톡|kakao|ktalk)[\s:]*[a-zA-Z0-9_]{4,20}',
        r'(?:카카오|카톡)[\s]*(?:아이디|id)[\s:]*[a-zA-Z0-9_]{4,20}',
        # 플러스친구
        r'(?:플친|플러스친구)[\s:]*[a-zA-Z0-9_가-힣]{2,20}',
    ]

    # 인스타그램 패턴
    INSTAGRAM_PATTERNS = [
        r'(?:인스타|insta|instagram|ig)[\s:@]*[a-zA-Z0-9_.]{3,30}',
        r'@[a-zA-Z0-9_.]{3,30}',  # @username
    ]

    # URL 패턴
    URL_PATTERNS = [
        r'https?://[^\s]+',
        r'www\.[^\s]+',
        # 도메인만
        r'[a-zA-Z0-9-]+\.(com|co\.kr|net|org|io)[^\s]*',
    ]

    # LINE 패턴
    LINE_PATTERNS = [
        r'(?:라인|line)[\s:]*[a-zA-Z0-9_]{4,20}',
    ]

    # 마스킹 문자
    MASK_CHAR = "●"
    MASK_MESSAGE = "[연락처가 감지되어 숨김 처리되었습니다]"

    def __init__(self):
        # 모든 패턴 컴파일
        self.patterns = {
            ContactType.PHONE: [re.compile(p, re.IGNORECASE) for p in self.PHONE_PATTERNS],
            ContactType.EMAIL: [re.compile(p, re.IGNORECASE) for p in self.EMAIL_PATTERNS],
            ContactType.KAKAO: [re.compile(p, re.IGNORECASE) for p in self.KAKAO_PATTERNS],
            ContactType.INSTAGRAM: [re.compile(p, re.IGNORECASE) for p in self.INSTAGRAM_PATTERNS],
            ContactType.URL: [re.compile(p, re.IGNORECASE) for p in self.URL_PATTERNS],
            ContactType.LINE: [re.compile(p, re.IGNORECASE) for p in self.LINE_PATTERNS],
        }

    def detect_and_filter(self, content: str) -> DetectionResult:
        """
        메시지에서 연락처 탐지 및 필터링

        Args:
            content: 원본 메시지

        Returns:
            DetectionResult: 탐지 결과
        """
        if not content:
            return DetectionResult(
                detected=False,
                contact_type=None,
                original_value=None,
                filtered_content=content,
                patterns_found=[]
            )

        filtered_content = content
        patterns_found = []
        first_contact_type = None
        first_original_value = None

        # 각 패턴 유형별로 검사
        for contact_type, pattern_list in self.patterns.items():
            for pattern in pattern_list:
                matches = pattern.finditer(filtered_content)
                for match in matches:
                    original_value = match.group()

                    # 첫 번째 탐지 결과 저장
                    if first_contact_type is None:
                        first_contact_type = contact_type
                        first_original_value = original_value

                    patterns_found.append({
                        "type": contact_type.value,
                        "value": self._partial_mask(original_value),
                        "position": match.span()
                    })

                    # 마스킹 처리
                    masked_value = self._mask_value(original_value, contact_type)
                    filtered_content = filtered_content.replace(original_value, masked_value, 1)

        detected = len(patterns_found) > 0

        return DetectionResult(
            detected=detected,
            contact_type=first_contact_type,
            original_value=first_original_value,
            filtered_content=filtered_content if detected else content,
            patterns_found=patterns_found
        )

    def _mask_value(self, value: str, contact_type: ContactType) -> str:
        """값 마스킹"""
        if contact_type == ContactType.PHONE:
            # 전화번호: 010-****-5678
            if len(value) >= 8:
                return value[:3] + "-" + self.MASK_CHAR * 4 + "-" + value[-4:]
            return self.MASK_CHAR * len(value)

        elif contact_type == ContactType.EMAIL:
            # 이메일: a***@***.com
            if "@" in value:
                parts = value.split("@")
                local = parts[0][0] + self.MASK_CHAR * 3
                domain_parts = parts[1].split(".")
                domain = self.MASK_CHAR * 3 + "." + domain_parts[-1]
                return f"{local}@{domain}"
            return self.MASK_CHAR * len(value)

        else:
            # 기타: 앞 2글자만 표시
            if len(value) > 4:
                return value[:2] + self.MASK_CHAR * (len(value) - 2)
            return self.MASK_CHAR * len(value)

    def _partial_mask(self, value: str) -> str:
        """로그용 부분 마스킹 (앞뒤 일부만 표시)"""
        if len(value) <= 4:
            return self.MASK_CHAR * len(value)
        return value[:2] + self.MASK_CHAR * (len(value) - 4) + value[-2:]

    def check_only(self, content: str) -> bool:
        """연락처 포함 여부만 확인 (마스킹 없이)"""
        for pattern_list in self.patterns.values():
            for pattern in pattern_list:
                if pattern.search(content):
                    return True
        return False


# 싱글톤 인스턴스
contact_detector = ContactDetector()


def detect_contact(content: str) -> DetectionResult:
    """연락처 탐지 헬퍼 함수"""
    return contact_detector.detect_and_filter(content)


def has_contact(content: str) -> bool:
    """연락처 포함 여부 확인 헬퍼 함수"""
    return contact_detector.check_only(content)
