"""
값 정규화 — 한국 EMR이 뱉는 온갖 표기를 시스템 표준형으로.

각 함수는 (정규화된 값, 신뢰도 0~1) 튜플을 반환하지 않고
정규화된 값 또는 None만 반환. 신뢰도는 mapper에서 데이터형 추론에 사용.
"""
import re
from datetime import date, datetime
from typing import Optional, Any

from .aliases import (
    INBOUND_STATUS_ALIASES, CONSENT_ALIASES, DB_QUALITY_ALIASES,
)


_PHONE_DIGITS = re.compile(r"\D+")


def normalize_phone(v: Any) -> Optional[str]:
    """전화번호 → 010-XXXX-XXXX 형태 (한국 휴대폰 우선).

    수용: 01012345678, 010-1234-5678, +82-10-1234-5678, 010 1234 5678,
          82-10-1234-5678, (010)1234-5678
    """
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() in ("nan", "none", "null", "-"):
        return None
    digits = _PHONE_DIGITS.sub("", s)
    if not digits:
        return None
    # 국가코드 +82 처리
    if digits.startswith("82"):
        digits = "0" + digits[2:]
    # 길이 체크: 10 (010 + 7자리 옛 번호) 또는 11 (010 + 8자리)
    if len(digits) == 11 and digits.startswith("01"):
        return f"{digits[0:3]}-{digits[3:7]}-{digits[7:11]}"
    if len(digits) == 10 and digits.startswith("01"):
        return f"{digits[0:3]}-{digits[3:6]}-{digits[6:10]}"
    if len(digits) == 10 and digits.startswith("02"):  # 서울 지역번호
        return f"02-{digits[2:6]}-{digits[6:10]}"
    if len(digits) == 11 and digits.startswith("0"):  # 기타 지역번호
        return f"{digits[0:3]}-{digits[3:7]}-{digits[7:11]}"
    if len(digits) == 10 and digits.startswith("0"):
        return f"{digits[0:3]}-{digits[3:6]}-{digits[6:10]}"
    # 휴대폰 8자리만 (앞에 010 가정)
    if len(digits) == 8:
        return f"010-{digits[0:4]}-{digits[4:8]}"
    return None


def looks_like_phone(v: Any) -> bool:
    """데이터형 추론용 — 전화번호처럼 생겼는지."""
    if v is None:
        return False
    s = str(v).strip()
    if not s:
        return False
    digits = _PHONE_DIGITS.sub("", s)
    if not digits:
        return False
    if digits.startswith("82"):
        digits = "0" + digits[2:]
    return 8 <= len(digits) <= 11 and digits.startswith("0")


_DATE_PATTERNS = [
    "%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d", "%Y%m%d",
    "%y-%m-%d", "%y/%m/%d", "%y.%m.%d", "%y%m%d",
    "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M",
    "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M",
    "%Y.%m.%d %H:%M", "%Y.%m.%d %H:%M:%S",
    "%m/%d/%Y", "%d/%m/%Y", "%d.%m.%Y", "%d-%m-%Y",
]

_KO_DATE_RE = re.compile(r"(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일")
_RRN_RE = re.compile(r"^(\d{6})[-\s]?([1-8])\d{6}$")  # 주민등록번호


def normalize_date(v: Any, allow_future: bool = True) -> Optional[date]:
    """다양한 한국식/서구식 날짜 표기 → date.

    수용: '2025-01-05', '2025.1.5', '2025년 1월 5일', '20250105',
          '2501055123456' (주민번호 앞자리), Excel datetime, pandas Timestamp 등.
    """
    if v is None:
        return None
    # pandas/openpyxl이 이미 datetime/date로 줬으면 그대로
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = str(v).strip()
    if not s or s.lower() in ("nan", "nat", "none", "null", "-", "0"):
        return None

    # 한글 날짜
    m = _KO_DATE_RE.search(s)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            return None

    # 주민번호 → 생년월일 추출
    m = _RRN_RE.match(s.replace(" ", ""))
    if m:
        yymmdd, sex_digit = m.group(1), m.group(2)
        century = 1900 if sex_digit in ("1", "2", "5", "6") else 2000
        try:
            return date(
                century + int(yymmdd[0:2]),
                int(yymmdd[2:4]),
                int(yymmdd[4:6]),
            )
        except ValueError:
            return None

    # strptime 패턴 시도
    for fmt in _DATE_PATTERNS:
        try:
            d = datetime.strptime(s, fmt).date()
            if not allow_future and d > date.today():
                continue
            return d
        except ValueError:
            continue

    return None


def normalize_datetime(v: Any) -> Optional[datetime]:
    """날짜+시간 — 시간 정보 없으면 00:00:00."""
    if v is None:
        return None
    if isinstance(v, datetime):
        return v
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day)
    d = normalize_date(v)
    if d is None:
        return None
    return datetime(d.year, d.month, d.day)


def looks_like_date(v: Any) -> bool:
    """데이터형 추론용 — 날짜처럼 생겼는지."""
    if isinstance(v, (datetime, date)):
        return True
    return normalize_date(v) is not None


def normalize_gender(v: Any) -> Optional[str]:
    """성별 → 'M' | 'F' | None.

    수용: 남/여, 남자/여자, M/F, Male/Female, 1/2 (주민번호식), male/female.
    """
    if v is None:
        return None
    s = str(v).strip().lower()
    if s in ("m", "male", "남", "남자", "남성", "1", "3", "5", "7"):
        return "M"
    if s in ("f", "female", "여", "여자", "여성", "2", "4", "6", "8"):
        return "F"
    return None


def looks_like_gender(v: Any) -> bool:
    return normalize_gender(v) is not None


def normalize_consent(v: Any, *, default: str = "NOT_ASKED") -> str:
    """동의 표현 → ConsentStatus enum 값.

    중요: 알림톡 동의는 사람 확인 없이는 절대 CONSENTED로 변환하지 않음.
    이 함수는 일반 동의 컬럼용. 알림톡은 import 엔드포인트에서 강제로 NOT_ASKED.
    """
    if v is None:
        return default
    s = str(v).strip().lower()
    if not s or s in ("nan", "none", "null"):
        return default
    return CONSENT_ALIASES.get(s, default)


def normalize_db_quality(v: Any) -> str:
    if v is None:
        return "MEDIUM"
    s = str(v).strip().lower()
    if not s:
        return "MEDIUM"
    return DB_QUALITY_ALIASES.get(s, "MEDIUM")


def normalize_inbound_status(v: Any) -> str:
    if v is None:
        return "PENDING"
    s = str(v).strip().lower()
    if not s:
        return "PENDING"
    # 공백 제거 후 매칭
    s_clean = s.replace(" ", "").replace("-", "")
    return INBOUND_STATUS_ALIASES.get(s_clean, "PENDING")


def clean_str(v: Any, max_len: int = 0) -> Optional[str]:
    """공백 정리, NaN/None 제거, 길이 제한."""
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() in ("nan", "none", "null"):
        return None
    if max_len and len(s) > max_len:
        s = s[:max_len]
    return s
