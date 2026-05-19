"""
청구 값 정규화 — 금액·코드·날짜.
"""
import re
from datetime import date, datetime
from typing import Optional, Any


_AMOUNT_DIGITS = re.compile(r"[^\d.\-]")
_DATE_PATTERNS = (
    "%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d", "%Y%m%d",
    "%y-%m-%d", "%y/%m/%d", "%y.%m.%d", "%y%m%d",
    "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M",
)


def normalize_amount(v: Any) -> Optional[int]:
    """금액 → int (원). '12,500원' / '₩12,500' / '12500.0' / '12500' 다 처리.

    음수도 허용 (조정/삭감액). 0/빈값/문자만 → None.
    """
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        if isinstance(v, float) and v != v:  # NaN
            return None
        return int(round(v))
    s = str(v).strip()
    if not s or s.lower() in ("nan", "none", "null", "-"):
        return None
    cleaned = _AMOUNT_DIGITS.sub("", s)
    if not cleaned or cleaned in ("-", "."):
        return None
    try:
        return int(round(float(cleaned)))
    except (ValueError, TypeError):
        return None


def normalize_quantity(v: Any) -> int:
    """수량 → int. 기본 1."""
    n = normalize_amount(v)
    if n is None or n <= 0:
        return 1
    return n


def normalize_code(v: Any, max_len: int = 20) -> Optional[str]:
    """수가/상병 코드 — 공백 제거, 대문자, 길이 제한.

    심평원 코드: 영문대문자 + 숫자. 예: AA157, B0010, J06.9 (KCD).
    """
    if v is None:
        return None
    s = str(v).strip().upper()
    if not s or s in ("NAN", "NONE", "NULL", "-"):
        return None
    # 공백/특수문자 일부 제거 (KCD는 점 유지)
    s = s.replace(" ", "").replace("\t", "")
    return s[:max_len]


def normalize_date(v: Any) -> Optional[date]:
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = str(v).strip()
    if not s or s.lower() in ("nan", "nat", "none", "null", "-", "0"):
        return None
    for fmt in _DATE_PATTERNS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def normalize_gender(v: Any) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip().lower()
    if s in ("m", "male", "남", "남자", "남성", "1", "3", "5", "7"):
        return "M"
    if s in ("f", "female", "여", "여자", "여성", "2", "4", "6", "8"):
        return "F"
    return None


def clean_str(v: Any, max_len: int = 0) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, float) and v != v:
        return None
    s = str(v).strip()
    if not s or s.lower() in ("nan", "none", "null"):
        return None
    if max_len and len(s) > max_len:
        s = s[:max_len]
    return s


def looks_like_amount(v: Any) -> bool:
    return normalize_amount(v) is not None and normalize_amount(v) >= 0


def looks_like_code(v: Any) -> bool:
    """심평원 수가코드 패턴: 영문 1~2자 + 숫자 3~5자, 또는 KCD: 영문 1자 + 숫자."""
    if v is None:
        return False
    s = str(v).strip().upper()
    if len(s) < 3 or len(s) > 15:
        return False
    return bool(re.match(r"^[A-Z]{1,3}\d{2,6}([A-Z0-9]{0,3})?$|^[A-Z]\d{2}(\.\d+)?$", s))
