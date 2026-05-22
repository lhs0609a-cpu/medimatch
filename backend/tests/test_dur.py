"""
처방 DUR(약물 안전성) 체크 회귀 테스트.

_dur_check 순수 로직 검증 (DB 불필요).
단일 성분 금기 / 병용 금기 / 동일 약품 중복을 잡는지 확인.
"""
import pytest
from dataclasses import dataclass
from typing import Optional

from app.api.v1.prescriptions import _dur_check

pytestmark = pytest.mark.unit


@dataclass
class Item:
    drug_name: str
    ingredient: Optional[str] = None


def _types(warnings):
    return {w["type"] for w in warnings}


def test_no_warnings_for_safe_single_drug():
    warnings, item_warnings = _dur_check([Item("타이레놀", "아세트아미노펜")])
    assert warnings == []
    assert item_warnings == {}


def test_single_ingredient_rule_warning():
    warnings, item_warnings = _dur_check([Item("이지엔6", "이부프로펜")])
    assert "rule" in _types(warnings)
    assert 0 in item_warnings


def test_warfarin_nsaid_interaction_high():
    items = [Item("쿠마딘", "와파린"), Item("이지엔6", "이부프로펜")]
    warnings, item_warnings = _dur_check(items)
    interactions = [w for w in warnings if w["type"] == "interaction"]
    assert len(interactions) >= 1
    assert any(w["severity"] == "HIGH" for w in interactions)
    # 양쪽 항목 모두에 경고 표시
    assert 0 in item_warnings and 1 in item_warnings


def test_benzodiazepine_opioid_interaction():
    items = [Item("자낙스", "알프라졸람"), Item("트리돌", "트라마돌")]
    warnings, _ = _dur_check(items)
    assert any(
        w["type"] == "interaction" and w["severity"] == "HIGH"
        for w in warnings
    )


def test_duplicate_drug_detected():
    items = [Item("타이레놀"), Item("타이레놀")]
    warnings, _ = _dur_check(items)
    assert "duplicate" in _types(warnings)


def test_unrelated_drugs_no_interaction():
    items = [Item("노바스크", "암로디핀"), Item("타이레놀", "아세트아미노펜")]
    warnings, _ = _dur_check(items)
    assert "interaction" not in _types(warnings)


def test_interaction_symmetric_regardless_of_order():
    a = _dur_check([Item("이지엔6", "이부프로펜"), Item("쿠마딘", "와파린")])[0]
    b = _dur_check([Item("쿠마딘", "와파린"), Item("이지엔6", "이부프로펜")])[0]
    a_int = [w for w in a if w["type"] == "interaction"]
    b_int = [w for w in b if w["type"] == "interaction"]
    assert len(a_int) == len(b_int) >= 1
