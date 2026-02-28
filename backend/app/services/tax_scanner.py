"""
AI 세금 스캐너 서비스

카테고리별 스캐너 레지스트리 패턴으로 의료업 특화 세금 공제 항목을 탐색.
각 스캐너는 독립적으로 특정 공제 카테고리를 분석하고, TaxScannerService가 결과를 통합.

신뢰도 알고리즘: data_quality + rule_clarity + peer_comparison + historical_approval
"""
import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# Base Scanner
# ─────────────────────────────────────────

class BaseCategoryScanner(ABC):
    """공제 카테고리 스캐너 추상 기반 클래스"""

    category: str = ""
    display_name: str = ""

    @abstractmethod
    async def scan(
        self, db: AsyncSession, user_id: str, tax_year: int, filing_data: dict,
    ) -> list:
        """
        스캔 실행 — 해당 카테고리에서 누락/최적화 가능한 공제 항목 탐색

        Returns:
            발견 항목 리스트 [{title, description, severity, estimated_amount, ...}]
        """
        pass

    @abstractmethod
    def calculate_eligible_amount(self, filing_data: dict, finding: dict) -> int:
        """적격 공제 금액 계산"""
        pass

    @abstractmethod
    def get_required_documents(self) -> list:
        """필요 증빙 서류 목록"""
        pass

    def get_confidence(
        self,
        data_quality: float,
        rule_clarity: float,
        peer_comparison: float,
        historical_approval: float,
    ) -> float:
        """
        신뢰도 산출 (0.0 ~ 1.0)

        Weights:
            data_quality (30%) — 입력 데이터 완성도
            rule_clarity (30%) — 세법 규정의 명확성
            peer_comparison (20%) — 동종 업계 대비 편차
            historical_approval (20%) — 과거 승인 이력
        """
        return round(
            data_quality * 0.30
            + rule_clarity * 0.30
            + peer_comparison * 0.20
            + historical_approval * 0.20,
            3,
        )


# ─────────────────────────────────────────
# Concrete Scanners
# ─────────────────────────────────────────

class EquipmentDepreciationScanner(BaseCategoryScanner):
    """의료기기 감가상각 최적화 (정률법 vs 정액법)"""

    category = "EQUIPMENT_DEPRECIATION"
    display_name = "의료기기 감가상각"

    async def scan(
        self, db: AsyncSession, user_id: str, tax_year: int, filing_data: dict,
    ) -> list:
        findings = []

        current_depreciation = filing_data.get("expense_breakdown", {}).get("감가상각비", 0)
        equipment_assets = filing_data.get("equipment_assets", [])

        # 감가상각비가 신고되지 않았거나 과소한 경우
        if current_depreciation == 0 and filing_data.get("gross_income", 0) > 50_000_000:
            estimated = int(filing_data.get("gross_income", 0) * 0.03)
            confidence = self.get_confidence(
                data_quality=0.6,
                rule_clarity=0.9,
                peer_comparison=0.8,
                historical_approval=0.85,
            )
            findings.append({
                "category": self.category,
                "title": "의료기기 감가상각 방법 변경 검토",
                "description": "정액법 → 정률법 변경 시 초기 연도 추가 공제 가능. "
                               "CT, MRI 등 고가 장비 보유 시 효과 극대화.",
                "severity": "HIGH",
                "estimated_amount": estimated,
                "tax_savings": int(estimated * 0.35),
                "confidence": confidence,
                "tax_year": tax_year,
                "tax_code_reference": "소득세법 제33조",
                "required_documents": self.get_required_documents(),
                "risk_note": None,
            })

        # 정률법 전환 가능 여부 체크
        if current_depreciation > 0:
            # 동종 업계 평균 대비 30% 이상 낮으면 최적화 여지
            peer_avg = filing_data.get("peer_benchmark", {}).get(
                "avg_deduction_by_category", {},
            ).get("EQUIPMENT_DEPRECIATION", current_depreciation)

            if peer_avg > 0 and current_depreciation < peer_avg * 0.7:
                gap = peer_avg - current_depreciation
                confidence = self.get_confidence(
                    data_quality=0.8,
                    rule_clarity=0.9,
                    peer_comparison=0.9,
                    historical_approval=0.8,
                )
                findings.append({
                    "category": self.category,
                    "title": "감가상각비 동종 대비 과소 계상",
                    "description": f"동종 업계 평균 대비 감가상각비가 {int((1 - current_depreciation / peer_avg) * 100)}% 낮습니다.",
                    "severity": "MEDIUM",
                    "estimated_amount": int(gap),
                    "tax_savings": int(gap * 0.35),
                    "confidence": confidence,
                    "tax_year": tax_year,
                    "tax_code_reference": "소득세법 제33조",
                    "required_documents": self.get_required_documents(),
                    "risk_note": "자산 목록 확인 필요",
                })

        return findings

    def calculate_eligible_amount(self, filing_data: dict, finding: dict) -> int:
        return finding.get("estimated_amount", 0)

    def get_required_documents(self) -> list:
        return ["의료기기 구매 영수증", "감가상각명세서", "고정자산 대장"]


class EmploymentTaxCreditScanner(BaseCategoryScanner):
    """고용증대 세액공제 (조특법 §29의7)"""

    category = "EMPLOYMENT_TAX_CREDIT"
    display_name = "고용증대 세액공제"

    async def scan(
        self, db: AsyncSession, user_id: str, tax_year: int, filing_data: dict,
    ) -> list:
        findings = []

        credits = filing_data.get("credits_breakdown", {})
        employee_count = filing_data.get("employee_count", 0)
        prev_employee_count = filing_data.get("prev_employee_count", 0)

        # 고용 증가가 있는데 세액공제를 받지 않은 경우
        if employee_count > prev_employee_count and not credits.get("고용증대세액공제"):
            new_hires = employee_count - prev_employee_count
            # 수도권 외: 1인당 770만원, 수도권: 1인당 450만원 (중소기업 기준)
            credit_per_person = 7_700_000  # 수도권 외 중소기업 기준
            estimated = new_hires * credit_per_person
            confidence = self.get_confidence(
                data_quality=0.7,
                rule_clarity=0.95,
                peer_comparison=0.7,
                historical_approval=0.9,
            )
            findings.append({
                "category": self.category,
                "title": "고용증대 세액공제 미적용",
                "description": f"전년 대비 {new_hires}명 고용 증가 확인. "
                               f"조특법 §29의7에 따라 최대 {estimated:,}원 세액공제 가능.",
                "severity": "HIGH",
                "estimated_amount": estimated,
                "tax_savings": estimated,  # 세액공제는 직접 세금 감면
                "confidence": confidence,
                "tax_year": tax_year,
                "tax_code_reference": "조특법 제29조의7",
                "required_documents": self.get_required_documents(),
                "risk_note": "상시근로자 수 변동 확인 필요 (일용직 제외)",
            })

        return findings

    def calculate_eligible_amount(self, filing_data: dict, finding: dict) -> int:
        return finding.get("estimated_amount", 0)

    def get_required_documents(self) -> list:
        return ["근로소득 원천징수영수증", "4대보험 가입자 명부", "급여대장"]


class YouthEmploymentScanner(BaseCategoryScanner):
    """청년 정규직 고용 세액공제 (조특법 §30의4)"""

    category = "YOUTH_EMPLOYMENT"
    display_name = "청년고용 세액공제"

    async def scan(
        self, db: AsyncSession, user_id: str, tax_year: int, filing_data: dict,
    ) -> list:
        findings = []

        credits = filing_data.get("credits_breakdown", {})
        youth_hires = filing_data.get("youth_employee_count", 0)

        if youth_hires > 0 and not credits.get("청년고용세액공제"):
            # 청년 정규직: 1인당 1,100만원 (중소기업, 수도권 외)
            credit_per_person = 11_000_000
            estimated = youth_hires * credit_per_person
            confidence = self.get_confidence(
                data_quality=0.65,
                rule_clarity=0.9,
                peer_comparison=0.6,
                historical_approval=0.85,
            )
            findings.append({
                "category": self.category,
                "title": "청년 정규직 고용 세액공제 미적용",
                "description": f"청년(15~34세) 정규직 {youth_hires}명 확인. "
                               f"조특법 §30의4에 따라 최대 {estimated:,}원 세액공제 가능.",
                "severity": "HIGH",
                "estimated_amount": estimated,
                "tax_savings": estimated,
                "confidence": confidence,
                "tax_year": tax_year,
                "tax_code_reference": "조특법 제30조의4",
                "required_documents": self.get_required_documents(),
                "risk_note": "청년 연령 요건 및 정규직 여부 확인 필요",
            })

        return findings

    def calculate_eligible_amount(self, filing_data: dict, finding: dict) -> int:
        return finding.get("estimated_amount", 0)

    def get_required_documents(self) -> list:
        return ["근로계약서", "주민등록등본(연령 확인)", "4대보험 가입 확인서"]


class FaithfulFilingScanner(BaseCategoryScanner):
    """성실신고 확인비용 세액공제 (120만원 한도)"""

    category = "FAITHFUL_FILING"
    display_name = "성실신고 확인비용"

    async def scan(
        self, db: AsyncSession, user_id: str, tax_year: int, filing_data: dict,
    ) -> list:
        findings = []

        gross_income = filing_data.get("gross_income", 0)
        credits = filing_data.get("credits_breakdown", {})

        # 성실신고 대상자 (수입금액 5억 이상 의료업)
        THRESHOLD = 500_000_000
        MAX_CREDIT = 1_200_000

        if gross_income >= THRESHOLD and not credits.get("성실신고확인비용"):
            confidence = self.get_confidence(
                data_quality=0.9,
                rule_clarity=0.95,
                peer_comparison=0.85,
                historical_approval=0.95,
            )
            findings.append({
                "category": self.category,
                "title": "성실신고 확인비용 세액공제 미적용",
                "description": f"수입금액 {gross_income:,}원으로 성실신고 대상자입니다. "
                               f"세무 조정 수수료의 60% (최대 {MAX_CREDIT:,}원) 세액공제 가능.",
                "severity": "MEDIUM",
                "estimated_amount": MAX_CREDIT,
                "tax_savings": MAX_CREDIT,
                "confidence": confidence,
                "tax_year": tax_year,
                "tax_code_reference": "소득세법 제160조의2",
                "required_documents": self.get_required_documents(),
                "risk_note": None,
            })

        return findings

    def calculate_eligible_amount(self, filing_data: dict, finding: dict) -> int:
        return min(finding.get("estimated_amount", 0), 1_200_000)

    def get_required_documents(self) -> list:
        return ["성실신고확인서", "세무 조정 수수료 영수증"]


class MedicalExpenseScanner(BaseCategoryScanner):
    """의료비 세액공제 (총급여 3% 초과분 15%)"""

    category = "MEDICAL_EXPENSE"
    display_name = "의료비 세액공제"

    async def scan(
        self, db: AsyncSession, user_id: str, tax_year: int, filing_data: dict,
    ) -> list:
        findings = []

        deductions = filing_data.get("deductions_breakdown", {})
        salary_income = filing_data.get("salary_income", 0)
        medical_expense_claimed = deductions.get("의료비", 0)

        # 총급여가 있고 의료비 공제가 없는 경우 체크
        if salary_income > 0:
            threshold = int(salary_income * 0.03)
            # 동종 평균 의료비 추정
            estimated_medical = filing_data.get("estimated_medical_expense", 0)

            if estimated_medical > threshold and medical_expense_claimed == 0:
                excess = estimated_medical - threshold
                tax_savings = int(excess * 0.15)
                confidence = self.get_confidence(
                    data_quality=0.5,
                    rule_clarity=0.95,
                    peer_comparison=0.6,
                    historical_approval=0.9,
                )
                findings.append({
                    "category": self.category,
                    "title": "의료비 세액공제 누락 가능성",
                    "description": f"총급여 3% 초과분({threshold:,}원 초과)에 대해 15% 세액공제 가능. "
                                   f"예상 절감액 {tax_savings:,}원.",
                    "severity": "MEDIUM",
                    "estimated_amount": excess,
                    "tax_savings": tax_savings,
                    "confidence": confidence,
                    "tax_year": tax_year,
                    "tax_code_reference": "소득세법 제59조의4",
                    "required_documents": self.get_required_documents(),
                    "risk_note": "실제 의료비 영수증 확인 필요",
                })

        return findings

    def calculate_eligible_amount(self, filing_data: dict, finding: dict) -> int:
        return finding.get("estimated_amount", 0)

    def get_required_documents(self) -> list:
        return ["의료비 영수증", "의료비 납입확인서"]


class EducationExpenseScanner(BaseCategoryScanner):
    """교육비 세액공제"""

    category = "EDUCATION_EXPENSE"
    display_name = "교육비 세액공제"

    async def scan(
        self, db: AsyncSession, user_id: str, tax_year: int, filing_data: dict,
    ) -> list:
        findings = []

        deductions = filing_data.get("deductions_breakdown", {})
        credits = filing_data.get("credits_breakdown", {})
        dependents = filing_data.get("dependents", [])

        education_claimed = credits.get("교육비", 0)

        # 부양가족이 있는데 교육비 공제가 없는 경우
        school_age_dependents = [
            d for d in dependents
            if d.get("age", 0) >= 6 and d.get("age", 0) <= 25
        ]

        if school_age_dependents and education_claimed == 0:
            # 추정: 부양가족 1인당 평균 교육비 300만원 가정
            estimated_education = len(school_age_dependents) * 3_000_000
            # 대학생: 900만원 한도, 초중고: 300만원 한도
            tax_savings = int(min(estimated_education, 9_000_000) * 0.15)
            confidence = self.get_confidence(
                data_quality=0.4,
                rule_clarity=0.9,
                peer_comparison=0.5,
                historical_approval=0.85,
            )
            findings.append({
                "category": self.category,
                "title": "교육비 세액공제 누락 가능성",
                "description": f"학령기 부양가족 {len(school_age_dependents)}명 확인. "
                               f"교육비 15% 세액공제 가능 (초중고 300만원, 대학 900만원 한도).",
                "severity": "LOW",
                "estimated_amount": estimated_education,
                "tax_savings": tax_savings,
                "confidence": confidence,
                "tax_year": tax_year,
                "tax_code_reference": "소득세법 제59조의4",
                "required_documents": self.get_required_documents(),
                "risk_note": "교육비 납입 증명서 확인 필요",
            })

        return findings

    def calculate_eligible_amount(self, filing_data: dict, finding: dict) -> int:
        return finding.get("estimated_amount", 0)

    def get_required_documents(self) -> list:
        return ["교육비 납입 증명서", "재학 증명서"]


# ─────────────────────────────────────────
# Scanner Registry & Service
# ─────────────────────────────────────────

# 등록된 스캐너 목록
SCANNER_REGISTRY: list[BaseCategoryScanner] = [
    EquipmentDepreciationScanner(),
    EmploymentTaxCreditScanner(),
    YouthEmploymentScanner(),
    FaithfulFilingScanner(),
    MedicalExpenseScanner(),
    EducationExpenseScanner(),
]


class TaxScannerService:
    """AI 세금 스캐너 — 모든 카테고리 스캐너를 실행하고 결과 통합"""

    def __init__(self, scanners: Optional[list] = None):
        self.scanners = scanners or SCANNER_REGISTRY

    async def run_full_scan(
        self,
        db: AsyncSession,
        user_id: str,
        tax_years: list,
        filing_data_by_year: dict,
    ) -> dict:
        """
        전체 스캔 실행

        Args:
            db: DB 세션
            user_id: 사용자 UUID
            tax_years: 스캔 대상 연도 리스트
            filing_data_by_year: {year: filing_data_dict}

        Returns:
            통합 스캔 결과
        """
        from app.models.tax_scan import TaxScanResult, TaxScanStatus

        start_time = time.time()

        # 스캔 기록 생성
        scan_result = TaxScanResult(
            user_id=user_id,
            scan_type="FULL",
            tax_years=tax_years,
            status=TaxScanStatus.SCANNING,
            started_at=datetime.utcnow(),
        )
        db.add(scan_result)
        await db.flush()

        try:
            all_findings = []
            total_potential_refund = 0
            total_tax_savings = 0

            for year in tax_years:
                filing_data = filing_data_by_year.get(year, {})
                if not filing_data:
                    continue

                # 동종 벤치마크 데이터 로드
                peer_data = await self._load_peer_benchmark(db, year, filing_data)
                filing_data["peer_benchmark"] = peer_data

                for scanner in self.scanners:
                    try:
                        findings = await scanner.scan(db, user_id, year, filing_data)
                        all_findings.extend(findings)

                        for f in findings:
                            total_potential_refund += f.get("estimated_amount", 0)
                            total_tax_savings += f.get("tax_savings", 0)
                    except Exception as e:
                        logger.error(
                            f"Scanner {scanner.category} failed for year {year}: {e}"
                        )

            # 신뢰도 계산 (발견 항목의 가중 평균)
            if all_findings:
                weighted_confidence = sum(
                    f.get("confidence", 0) * f.get("tax_savings", 1)
                    for f in all_findings
                )
                total_weight = sum(f.get("tax_savings", 1) for f in all_findings)
                avg_confidence = weighted_confidence / total_weight if total_weight > 0 else 0.0
            else:
                avg_confidence = 0.0

            # 동종 벤치마크 요약
            peer_summary = await self._build_peer_summary(
                db, tax_years, filing_data_by_year,
            )

            duration_ms = int((time.time() - start_time) * 1000)

            # 스캔 결과 업데이트
            scan_result.status = TaxScanStatus.COMPLETED
            scan_result.findings = all_findings
            scan_result.total_findings = len(all_findings)
            scan_result.total_potential_refund = total_potential_refund
            scan_result.total_tax_savings = total_tax_savings
            scan_result.confidence = round(avg_confidence, 3)
            scan_result.peer_benchmark = peer_summary
            scan_result.completed_at = datetime.utcnow()
            scan_result.duration_ms = duration_ms
            scan_result.model_version = "scanner-v1.0"

            await db.flush()

            return {
                "scan_id": scan_result.id,
                "status": "COMPLETED",
                "total_findings": len(all_findings),
                "findings": all_findings,
                "total_potential_refund": total_potential_refund,
                "total_tax_savings": total_tax_savings,
                "confidence": round(avg_confidence, 3),
                "peer_benchmark": peer_summary,
                "duration_ms": duration_ms,
            }

        except Exception as e:
            scan_result.status = TaxScanStatus.FAILED
            scan_result.completed_at = datetime.utcnow()
            await db.flush()
            logger.error(f"Tax scan failed for user {user_id}: {e}")
            raise

    async def run_category_scan(
        self,
        db: AsyncSession,
        user_id: str,
        category: str,
        tax_year: int,
        filing_data: dict,
    ) -> dict:
        """단일 카테고리 스캔"""
        scanner = next(
            (s for s in self.scanners if s.category == category), None,
        )
        if not scanner:
            return {"error": f"Unknown category: {category}", "findings": []}

        findings = await scanner.scan(db, user_id, tax_year, filing_data)
        return {
            "category": category,
            "display_name": scanner.display_name,
            "findings": findings,
            "total_findings": len(findings),
            "required_documents": scanner.get_required_documents(),
        }

    async def _load_peer_benchmark(
        self, db: AsyncSession, tax_year: int, filing_data: dict,
    ) -> dict:
        """동종 업계 벤치마크 데이터 로드"""
        from app.models.tax_regulation import TaxPeerBenchmark

        specialty = filing_data.get("specialty", "")
        if not specialty:
            return {}

        result = await db.execute(
            select(TaxPeerBenchmark).where(
                and_(
                    TaxPeerBenchmark.period == str(tax_year),
                    TaxPeerBenchmark.specialty == specialty,
                )
            )
        )
        benchmark = result.scalar_one_or_none()
        if benchmark:
            return {
                "avg_gross_income": benchmark.avg_gross_income,
                "avg_necessary_expenses": benchmark.avg_necessary_expenses,
                "avg_expense_rate": benchmark.avg_expense_rate,
                "avg_deduction_total": benchmark.avg_deduction_total,
                "avg_deduction_by_category": benchmark.avg_deduction_by_category,
                "percentiles": benchmark.percentiles,
                "sample_size": benchmark.sample_size,
            }
        return {}

    async def _build_peer_summary(
        self, db: AsyncSession, tax_years: list, filing_data_by_year: dict,
    ) -> dict:
        """동종 비교 요약 생성"""
        # 가장 최근 연도 기준으로 요약
        latest_year = max(tax_years) if tax_years else None
        if not latest_year:
            return {}

        filing = filing_data_by_year.get(latest_year, {})
        specialty = filing.get("specialty", "")

        user_deduction_rate = 0.0
        gross = filing.get("gross_income", 0)
        deductions = filing.get("deductions_total", 0)
        if gross > 0:
            user_deduction_rate = round((deductions / gross) * 100, 1)

        return {
            "specialty": specialty,
            "user_deduction_rate": user_deduction_rate,
            "peer_avg_deduction_rate": 48.2,  # 시뮬레이션 값
            "peer_percentile": 35,  # 시뮬레이션 값
        }


# 싱글톤 인스턴스
tax_scanner_service = TaxScannerService()
