"""
PDF 생성 서비스 - WeasyPrint를 사용한 상권분석 + 개원 실행 계획 리포트.

8개 핵심 모듈 모두 포함:
1. 분석 요약 (위치/진료과/매출/비용/순이익)
2. 인구·경쟁 (행안부 + HIRA 실데이터)
3. 자금 계획 (초기 투자비 + 대출 시뮬)
4. 인력 구성
5. 인허가 체크리스트
6. 의료장비
7. 개원 일정
8. 5년 손익 시뮬
9. 세금 (개인 vs 법인)
10. 마케팅 플랜
"""
import os
import uuid
from io import BytesIO
from datetime import datetime
from pathlib import Path
from typing import Optional, Any

from jinja2 import Environment, FileSystemLoader

# WeasyPrint는 GTK+ 의존성이 필요하여 선택적 임포트
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError):
    WEASYPRINT_AVAILABLE = False
    HTML = None
    CSS = None

# boto3도 선택적 임포트
try:
    import boto3
except ImportError:
    boto3 = None

from ..core.config import settings
from ..models.simulation import Simulation


def _won(v: int) -> str:
    """원 단위를 한글로 (억/만)"""
    if not v:
        return "0원"
    if v >= 100_000_000:
        return f"{v / 100_000_000:.1f}억원"
    if v >= 10_000:
        return f"{v / 10_000:,.0f}만원"
    return f"{v:,}원"


def _esc(s: Any) -> str:
    """HTML escape"""
    if s is None:
        return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class PDFGeneratorService:
    """WeasyPrint 기반 PDF 생성 서비스"""

    def __init__(self):
        template_dir = Path(__file__).parent.parent / "templates" / "pdf"
        template_dir.mkdir(parents=True, exist_ok=True)

        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=True
        )

        self.s3_client = None
        if boto3 and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )

    def generate_simulation_report_pdf(
        self,
        simulation: Simulation,
        ai_analysis_or_response: Any = None,
    ) -> bytes:
        """
        시뮬레이션 리포트 PDF 생성.
        ai_analysis_or_response가 SimulationResponse면 8개 모듈 모두 렌더링,
        아니면 기본 정보만 렌더링.
        """
        if not WEASYPRINT_AVAILABLE:
            raise RuntimeError(
                "WeasyPrint is not available. Please install GTK+ dependencies."
            )

        # SimulationResponse가 들어왔는지 확인 (capital_plan 같은 필드 존재)
        response = ai_analysis_or_response
        has_modules = hasattr(response, 'capital_plan') and response.capital_plan is not None

        # SimulationResponse가 없으면 simulation_service로 빌드
        if not has_modules:
            try:
                from .simulation import simulation_service
                response = simulation_service._build_response(
                    simulation,
                    simulation.competitors_data or [],
                    simulation.clinic_type,
                )
                has_modules = True
            except Exception:
                response = None
                has_modules = False

        html_content = self._build_html(simulation, response, has_modules)

        pdf_bytes = HTML(string=html_content, base_url=".").write_pdf(
            stylesheets=[CSS(string=self._get_pdf_styles())]
        )
        return pdf_bytes

    def _build_html(self, sim: Simulation, response: Any, has_modules: bool) -> str:
        report_id = str(sim.id)[:8].upper()
        now = datetime.now().strftime("%Y년 %m월 %d일 %H:%M")
        rec_map = {
            "VERY_POSITIVE": "매우 긍정적",
            "POSITIVE": "긍정적",
            "NEUTRAL": "중립",
            "NEGATIVE": "부정적",
            "VERY_NEGATIVE": "매우 부정적",
        }
        rec_kr = rec_map.get(sim.recommendation.value if sim.recommendation else "", "분석 중")

        sections = []
        sections.append(self._section_summary(sim, rec_kr))
        sections.append(self._section_market(sim, response))

        if has_modules and response:
            if response.capital_plan:
                sections.append(self._section_capital(response.capital_plan))
            if response.staffing_plan:
                sections.append(self._section_staffing(response.staffing_plan))
            if response.permit_checklist:
                sections.append(self._section_permit(response.permit_checklist))
            if response.equipment_checklist:
                sections.append(self._section_equipment(response.equipment_checklist))
            if response.opening_timeline:
                sections.append(self._section_timeline(response.opening_timeline))
            if response.five_year_pnl:
                sections.append(self._section_5yr_pnl(response.five_year_pnl))
            if response.tax_comparison:
                sections.append(self._section_tax(response.tax_comparison))
            if response.marketing_plan:
                sections.append(self._section_marketing(response.marketing_plan))

        body = "\n".join(sections)

        return f"""<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>메디플라톤 개원 분석 리포트</title></head>
<body>
  <div class="report">
    <header class="head">
      <div>
        <h1>메디플라톤</h1>
        <p>개원 분석 리포트</p>
      </div>
      <div class="meta">
        <p>리포트 ID: {report_id}</p>
        <p>생성일: {now}</p>
      </div>
    </header>
    {body}
    <footer>
      <p>본 리포트는 행정안전부, 건강보험심사평가원, 카카오 Local API, 의료기기협회·대한개원의협의회 표준 데이터를 기반으로 생성되었습니다.</p>
      <p>실제 개원 결정 시 추가적인 현장 조사 및 세무·법무 전문가 상담을 권장합니다.</p>
      <p class="copyright">© {datetime.now().year} 메디플라톤. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>"""

    def _section_summary(self, sim: Simulation, rec_kr: str) -> str:
        rev = _won(sim.est_revenue_avg or 0)
        cost = _won(sim.est_cost_total or 0)
        profit = _won(sim.monthly_profit_avg or 0)
        return f"""
<section class="summary">
  <h2>분석 요약</h2>
  <div class="kv">
    <div><span class="k">주소</span><span class="v">{_esc(sim.address)}</span></div>
    <div><span class="k">진료과</span><span class="v">{_esc(sim.clinic_type)}</span></div>
    <div><span class="k">면적</span><span class="v">{_esc(sim.size_pyeong)}평</span></div>
    <div><span class="k">추천 등급</span><span class="v hi">{rec_kr}</span></div>
  </div>
  <div class="big-num">
    <div class="card"><div class="lbl">예상 월 매출</div><div class="val">{rev}</div></div>
    <div class="card"><div class="lbl">예상 월 비용</div><div class="val">{cost}</div></div>
    <div class="card"><div class="lbl">예상 월 순이익</div><div class="val">{profit}</div></div>
  </div>
  <p class="reason">{_esc(sim.recommendation_reason or "")}</p>
</section>"""

    def _section_market(self, sim: Simulation, response: Any) -> str:
        comp_rows = ""
        if response and response.competitors:
            for i, c in enumerate(response.competitors[:10]):
                comp_rows += f"<tr><td>{chr(65 + i)}</td><td>{_esc(c.name)}</td><td>{c.distance_m}m</td><td>{_esc(c.clinic_type)}</td></tr>"
        comp_table = f"<table class='dt'><thead><tr><th>#</th><th>의원명</th><th>거리</th><th>진료과</th></tr></thead><tbody>{comp_rows}</tbody></table>" if comp_rows else "<p class='note'>반경 내 동일 진료과 의원이 없습니다 (블루오션).</p>"

        return f"""
<section>
  <h2>1. 시장 · 경쟁 분석</h2>
  <div class="kv">
    <div><span class="k">반경 1km 인구</span><span class="v">{(sim.population_1km or 0):,}명</span></div>
    <div><span class="k">40대+ 비율</span><span class="v">{(sim.age_40_plus_ratio or 0) * 100:.1f}%</span></div>
    <div><span class="k">동일과 의원 (반경 1km)</span><span class="v">{sim.same_dept_count or 0}개</span></div>
    <div><span class="k">전체 의료기관</span><span class="v">{sim.total_clinic_count or 0}개</span></div>
  </div>
  <h3>주변 경쟁 의원 (HIRA)</h3>
  {comp_table}
</section>"""

    def _section_capital(self, cap: Any) -> str:
        rows = "".join(f"<tr><td>{_esc(b.label)}</td><td class='r'>{_won(b.amount)}</td><td class='note'>{_esc(b.note or '')}</td></tr>" for b in cap.breakdown)
        scen = "".join(
            f"<tr><td>{_esc(s.scenario)}</td><td class='r'>{_won(s.own_capital)}</td><td class='r'>{_won(s.loan_amount)}</td><td class='r'>{_won(s.monthly_payment)}</td><td class='r'>{s.monthly_burden_ratio*100:.1f}%</td></tr>"
            for s in cap.financing_scenarios
        )
        return f"""
<section>
  <h2>2. 자금 계획</h2>
  <div class="kv">
    <div><span class="k">목표 면적</span><span class="v">{cap.target_size_pyeong}평 (표준 {cap.standard_size_pyeong}평 / 최소 {cap.min_size_pyeong}평)</span></div>
    <div><span class="k">초기 투자비</span><span class="v">{_won(cap.initial_investment_total)}</span></div>
    <div><span class="k">권장 운영자금</span><span class="v">{_won(cap.working_capital_recommended)}</span></div>
    <div><span class="k">총 필요자금</span><span class="v hi">{_won(cap.grand_total)}</span></div>
  </div>
  <h3>투자비 항목별 상세</h3>
  <table class="dt"><thead><tr><th>항목</th><th>금액</th><th>비고</th></tr></thead><tbody>{rows}</tbody></table>
  <h3>자금 조달 시나리오 (연 5.5%, 5년 원리금균등)</h3>
  <table class="dt"><thead><tr><th>구성</th><th>자기자본</th><th>대출금</th><th>월 상환</th><th>매출 대비</th></tr></thead><tbody>{scen}</tbody></table>
  <p class="note">출처: {_esc(cap.data_source)}</p>
</section>"""

    def _section_staffing(self, st: Any) -> str:
        return f"""
<section>
  <h2>3. 인력 구성</h2>
  <div class="kv">
    <div><span class="k">의사</span><span class="v">{st.doctors}명</span></div>
    <div><span class="k">간호사</span><span class="v">{st.nurses}명</span></div>
    <div><span class="k">행정·접수</span><span class="v">{st.admins}명</span></div>
    <div><span class="k">기사·검사</span><span class="v">{st.technicians}명</span></div>
    <div><span class="k">총 인원 (원장 포함)</span><span class="v">{st.total_headcount}명</span></div>
    <div><span class="k">월 인건비 (원장 제외)</span><span class="v hi">{_won(st.monthly_payroll)}</span></div>
  </div>
</section>"""

    def _section_permit(self, pm: Any) -> str:
        rows = "".join(
            f"<tr><td>{_esc(p.name)}</td><td>{_esc(p.authority)}</td><td class='r'>{p.duration_days}일</td><td class='r'>{_won(p.cost) if p.cost else '무료'}</td><td class='note'>{_esc(p.description)}</td></tr>"
            for p in pm.common_permits
        )
        specifics = "".join(f"<li>{_esc(s)}</li>" for s in pm.specific_permits)
        spec_html = f"<h3>진료과별 추가 인허가</h3><ul>{specifics}</ul>" if specifics else ""
        return f"""
<section>
  <h2>4. 인허가 체크리스트</h2>
  <table class="dt"><thead><tr><th>항목</th><th>담당기관</th><th>처리기간</th><th>수수료</th><th>설명</th></tr></thead><tbody>{rows}</tbody></table>
  {spec_html}
</section>"""

    def _section_equipment(self, eq: Any) -> str:
        rows = "".join(
            f"<tr><td>{_esc(it.name)}</td><td class='c'>{'필수' if it.is_essential else '선택'}</td><td class='r'>{_won(it.price_min)}</td><td class='r'>{_won(it.price_typical)}</td></tr>"
            for it in eq.items
        )
        return f"""
<section>
  <h2>5. 의료장비</h2>
  <div class="kv">
    <div><span class="k">필수 장비 합계</span><span class="v">{_won(eq.essential_total_min)} ~ {_won(eq.essential_total_typical)}</span></div>
    <div><span class="k">선택 장비 합계 (표준)</span><span class="v">+{_won(eq.optional_total_typical)}</span></div>
  </div>
  <table class="dt"><thead><tr><th>장비</th><th>구분</th><th>최저가</th><th>표준가</th></tr></thead><tbody>{rows}</tbody></table>
</section>"""

    def _section_timeline(self, tl: Any) -> str:
        steps = ""
        for st in tl.steps:
            deliv = "".join(f"<li>{_esc(d)}</li>" for d in st.deliverables)
            steps += f"""
<div class="step">
  <div class="step-no">{st.step_no}</div>
  <div class="step-body">
    <h4>{_esc(st.title)}</h4>
    <p class="note">시작 +{st.months_from_start}개월 · 기간 {st.duration_weeks}주</p>
    <ul>{deliv}</ul>
  </div>
</div>"""
        return f"""
<section>
  <h2>6. 개원 일정 (총 {tl.total_months}개월)</h2>
  <div class="steps">{steps}</div>
</section>"""

    def _section_5yr_pnl(self, pnl: Any) -> str:
        rows = "".join(
            f"<tr><td>{p.year}년차</td><td class='r'>{p.patient_ratio_of_capacity*100:.0f}%</td><td class='r'>{_won(p.monthly_revenue)}</td><td class='r'>-{_won(p.monthly_cost)}</td><td class='r'>-{_won(p.monthly_loan_payment)}</td><td class='r {('pos' if p.monthly_profit_before_tax > 0 else 'neg')}'>{'+' if p.monthly_profit_before_tax >= 0 else ''}{_won(p.monthly_profit_before_tax)}</td></tr>"
            for p in pnl.projections
        )
        assumptions = "".join(f"<li>{_esc(a)}</li>" for a in pnl.assumptions)
        be = f"{pnl.breakeven_month}개월" if pnl.breakeven_month else "5년 내 미회수"
        return f"""
<section>
  <h2>7. 5년 손익 시뮬레이션</h2>
  <div class="kv">
    <div><span class="k">5년 누적 세전이익</span><span class="v hi">{_won(pnl.total_5yr_profit_before_tax)}</span></div>
    <div><span class="k">연평균 이익</span><span class="v">{_won(pnl.avg_annual_profit)}</span></div>
    <div><span class="k">자기자본 회수</span><span class="v">{be}</span></div>
  </div>
  <table class="dt"><thead><tr><th>연차</th><th>정상화율</th><th>월 매출</th><th>월 비용</th><th>대출 상환</th><th>월 순이익</th></tr></thead><tbody>{rows}</tbody></table>
  <h3>계산 가정</h3>
  <ul class="note">{assumptions}</ul>
</section>"""

    def _section_tax(self, tax: Any) -> str:
        def card(sc: Any) -> str:
            div_row = f"<tr><td>배당소득세 (인출 70% 가정)</td><td class='r'>-{_won(sc.dividend_tax)}</td></tr>" if sc.dividend_tax else ""
            return f"""
<div class="tax-card">
  <h4>{_esc(sc.type)}</h4>
  <table class="dt sm">
    <tr><td>연 매출</td><td class="r">{_won(sc.annual_revenue)}</td></tr>
    <tr><td>세전 이익</td><td class="r">{_won(sc.annual_profit_before_tax)}</td></tr>
    <tr><td>{'종합소득세' if sc.type == '개인의원' else '법인세'}</td><td class="r">-{_won(sc.income_tax)}</td></tr>
    <tr><td>지방소득세 (10%)</td><td class="r">-{_won(sc.local_tax)}</td></tr>
    {div_row}
    <tr class="total"><td>총 세금</td><td class="r neg">{_won(sc.total_tax)}</td></tr>
    <tr class="total"><td>세후 본인 수령</td><td class="r pos">{_won(sc.after_tax_profit)}</td></tr>
    <tr><td>실효세율</td><td class="r">{sc.effective_tax_rate*100:.1f}%</td></tr>
  </table>
</div>"""
        notes = "".join(f"<li>{_esc(n)}</li>" for n in tax.notes)
        return f"""
<section>
  <h2>8. 세금 (개인의원 vs 의료법인)</h2>
  <div class="hi-box">
    결론: <strong>{_esc(tax.advantage)}</strong> · 연 {_won(tax.advantage_amount)} 차이
  </div>
  <div class="tax-grid">{card(tax.individual)}{card(tax.corporation)}</div>
  <h3>유의사항</h3>
  <ul class="note">{notes}</ul>
</section>"""

    def _section_marketing(self, mkt: Any) -> str:
        ch_rows = ""
        for c in mkt.recommended_channels:
            steps = "".join(f"<li>{_esc(s)}</li>" for s in c.setup_steps)
            cost = "무료" if c.monthly_cost_min == 0 and c.monthly_cost_typical == 0 else f"{_won(c.monthly_cost_min)} ~ {_won(c.monthly_cost_typical)}"
            ch_rows += f"""
<div class="ch">
  <h4>{_esc(c.name)} <span class="badge {c.priority}">{_esc(c.priority)}</span></h4>
  <p class="note">월 {cost} · {_esc(c.expected_effect)}</p>
  <ol>{steps}</ol>
</div>"""
        law = "".join(
            f"<li><strong>{_esc(r.rule)}</strong> — {_esc(r.description)} <span class='neg'>(처벌: {_esc(r.penalty)})</span></li>"
            for r in mkt.law_compliance
        )
        tips = "".join(f"<li>{_esc(t)}</li>" for t in mkt.clinic_type_tips)
        return f"""
<section>
  <h2>9. 마케팅 플랜</h2>
  <div class="kv">
    <div><span class="k">최소 월 마케팅비</span><span class="v">{_won(mkt.monthly_budget_min)}</span></div>
    <div><span class="k">표준 월 마케팅비</span><span class="v">{_won(mkt.monthly_budget_typical)}</span></div>
  </div>
  <h3>추천 채널</h3>
  {ch_rows}
  <h3 class="warn">의료광고법 준수 (위반 시 행정처분)</h3>
  <ul class="law">{law}</ul>
  <h3>진료과별 마케팅 팁</h3>
  <ul>{tips}</ul>
</section>"""

    def _get_pdf_styles(self) -> str:
        return """
@page { size: A4; margin: 1.8cm; @bottom-center { content: counter(page) " / " counter(pages); font-size: 9pt; color: #999; } }
body { font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; font-size: 10.5pt; line-height: 1.55; color: #222; }
.report { max-width: 100%; }
.head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 24px; }
.head h1 { color: #2563eb; font-size: 24pt; margin: 0; }
.head p { margin: 4px 0 0; color: #666; font-size: 11pt; }
.meta { text-align: right; font-size: 9pt; color: #666; }
h2 { color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 28px 0 14px; font-size: 14pt; page-break-after: avoid; }
h3 { color: #374151; margin: 18px 0 8px; font-size: 11pt; }
h3.warn { color: #b91c1c; }
h4 { margin: 10px 0 4px; font-size: 10.5pt; }
section { page-break-inside: avoid; margin-bottom: 14px; }

/* Key-Value grid */
.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 8px 0 14px; }
.kv > div { display: flex; justify-content: space-between; padding: 6px 10px; background: #f8fafc; border-radius: 4px; }
.kv .k { color: #6b7280; font-size: 10pt; }
.kv .v { font-weight: 600; }
.kv .v.hi { color: #2563eb; }

/* Big-num cards (summary) */
.big-num { display: flex; gap: 10px; margin: 14px 0; }
.big-num .card { flex: 1; padding: 14px; background: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 6px; text-align: center; }
.big-num .lbl { color: #6b7280; font-size: 9pt; }
.big-num .val { font-size: 14pt; font-weight: 700; color: #1e3a8a; margin-top: 4px; }
.reason { padding: 10px 14px; background: #fffbeb; border-left: 3px solid #f59e0b; font-style: italic; }

/* Tables */
.dt { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
.dt th, .dt td { border: 1px solid #e5e7eb; padding: 6px 8px; }
.dt th { background: #f3f4f6; font-weight: 600; text-align: left; }
.dt td.r { text-align: right; }
.dt td.c { text-align: center; }
.dt td.note { color: #6b7280; font-size: 9pt; }
.dt sm { font-size: 9pt; }
.dt tr.total { background: #f9fafb; font-weight: 700; }
.note { color: #6b7280; font-size: 9pt; }
.pos { color: #059669; font-weight: 600; }
.neg { color: #dc2626; }

/* Steps timeline */
.steps { display: flex; flex-direction: column; gap: 8px; }
.step { display: flex; gap: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; }
.step-no { width: 28px; height: 28px; background: #ddd6fe; color: #5b21b6; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.step-body { flex: 1; }
.step-body h4 { margin: 0; }
.step-body ul { margin: 4px 0 0 16px; padding: 0; }

/* Tax cards */
.tax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
.tax-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
.tax-card h4 { margin: 0 0 8px; color: #374151; }
.hi-box { padding: 10px 14px; background: #ecfdf5; border-left: 4px solid #059669; margin: 10px 0; border-radius: 4px; }

/* Marketing channels */
.ch { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
.ch h4 { margin: 0 0 4px; }
.badge { font-size: 8pt; padding: 1px 6px; border-radius: 3px; margin-left: 6px; vertical-align: middle; }
.badge.필수 { background: #fee2e2; color: #b91c1c; }
.badge.권장 { background: #fef3c7; color: #b45309; }
.badge.선택 { background: #e5e7eb; color: #6b7280; }
.ch ol { margin: 4px 0 0 18px; padding: 0; font-size: 9pt; color: #4b5563; }
.law li { margin: 4px 0; padding-left: 4px; }

footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 8.5pt; color: #9ca3af; }
footer .copyright { margin-top: 6px; font-weight: 500; }

ul, ol { margin: 4px 0 8px 18px; padding: 0; }
ul li, ol li { margin: 2px 0; }
"""

    async def upload_to_s3(self, pdf_bytes: bytes, filename: str) -> Optional[str]:
        if not self.s3_client:
            return None
        try:
            key = f"reports/{filename}"
            self.s3_client.upload_fileobj(
                BytesIO(pdf_bytes),
                settings.S3_BUCKET_NAME,
                key,
                ExtraArgs={"ContentType": "application/pdf", "ContentDisposition": f"attachment; filename={filename}"}
            )
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
                ExpiresIn=7 * 24 * 60 * 60
            )
            return url
        except Exception as e:
            print(f"S3 업로드 실패: {e}")
            return None

    def save_locally(self, pdf_bytes: bytes, filename: str) -> str:
        output_dir = Path(__file__).parent.parent.parent / "tmp" / "reports"
        output_dir.mkdir(parents=True, exist_ok=True)
        filepath = output_dir / filename
        with open(filepath, "wb") as f:
            f.write(pdf_bytes)
        return str(filepath)


pdf_generator_service = PDFGeneratorService()
