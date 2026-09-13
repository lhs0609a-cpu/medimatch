"""Dependency-free appointment transitions and clinic time normalization."""
from datetime import datetime, timedelta, timezone

CLINIC_TIMEZONE = timezone(timedelta(hours=9))
TRANSITIONS = {
    "SCHEDULED": {"CONFIRMED", "ARRIVED", "NO_SHOW", "CANCELLED"},
    "CONFIRMED": {"ARRIVED", "NO_SHOW", "CANCELLED"},
    "ARRIVED": {"IN_PROGRESS", "COMPLETED", "CANCELLED"},
    "IN_PROGRESS": {"COMPLETED"},
    "NO_SHOW": {"SCHEDULED", "ARRIVED"},
    "COMPLETED": set(),
    "CANCELLED": set(),
}


def validate_transition(current: str, target: str) -> None:
    if target not in TRANSITIONS:
        raise ValueError("올바르지 않은 예약 상태입니다.")
    if current != target and target not in TRANSITIONS.get(current, set()):
        raise ValueError("현재 상태에서는 요청한 예약 상태로 변경할 수 없습니다.")


def clinic_datetime(value: datetime) -> datetime:
    """The existing appointment columns store Korean wall time without a zone."""
    if value.tzinfo is not None:
        return value.astimezone(CLINIC_TIMEZONE).replace(tzinfo=None)
    return value


def clinic_today():
    return datetime.now(CLINIC_TIMEZONE).date()
