"""
PDF 생성 서비스 - WeasyPrint를 사용한 상권분석 리포트 PDF 생성
"""
import os
import uuid
from io import BytesIO
from datetime import datetime
from pathlib import Path
from typing import Optional

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


class PDFGeneratorService:
    """WeasyPrint 기반 PDF 생성 서비스"""

    def __init__(self):
        # 템플릿 디렉토리 설정
        template_dir = Path(__file__).parent.parent / "templates" / "pdf"
        template_dir.mkdir(parents=True, exist_ok=True)

        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=True
        )

        # S3 클라이언트
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
        ai_analysis: dict
    ) -> bytes:
        """시뮬레이션 리포트 PDF 생성"""
        if not WEASYPRINT_AVAILABLE:
            raise RuntimeError(
                "WeasyPrint is not available. Please install GTK+ dependencies. "
                "See: https://doc.courtbouillon.org/weasyprint/stable/first_steps.html"
            )

        # 템플릿 데이터 준비
        context = self._prepare_context(simulation, ai_analysis)

        # HTML 렌더링
        try:
            template = self.jinja_env.get_template("report_template.html")
            html_content = template.render(**context)
        except Exception:
            # 템플릿 파일이 없으면 내장 HTML 사용
            html_content = self._generate_inline_html(context)

        # PDF 생성
        pdf_bytes = HTML(string=html_content, base_url=".").write_pdf(
            stylesheets=[CSS(string=self._get_pdf_styles())]
        )

        return pdf_bytes

    def _prepare_context(self, sim: Simulation, ai_analysis: dict) -> dict:
        """템플릿 컨텍스트 준비"""
        # 경쟁 병원 목록
        competitors = []
        if sim.competitors_data:
            for comp in sim.competitors_data[:10]:
                competitors.append({
                    "name": comp.get("name", "미상"),
                    "distance": comp.get("distance", "N/A"),
                    "address": comp.get("address", ""),
                })

        # 추천 등급 한글화
        recommendation_map = {
            "VERY_POSITIVE": "매우 긍정적",
            "POSITIVE": "긍정적",
            "NEUTRAL": "중립",
            "NEGATIVE": "부정적",
            "VERY_NEGATIVE": "매우 부정적",
        }
        recommendation_kr = recommendation_map.get(
            sim.recommendation.value if sim.recommendation else "",
            "분석 중"
        )

        return {
            "generated_at": datetime.now().strftime("%Y년 %m월 %d일 %H:%M"),
            "report_id": str(sim.id)[:8].upper(),

            # 기본 정보
            "address": sim.address,
            "clinic_type": sim.clinic_type,
            "size_pyeong": sim.size_pyeong or "미정",
            "budget_million": sim.budget_million or "미정",

            # 좌표
            "latitude": sim.latitude,
            "longitude": sim.longitude,

            # 예상 매출
            "revenue_min": f"{sim.est_revenue_min:,}" if sim.est_revenue_min else "N/A",
            "revenue_avg": f"{sim.est_revenue_avg:,}" if sim.est_revenue_avg else "N/A",
            "revenue_max": f"{sim.est_revenue_max:,}" if sim.est_revenue_max else "N/A",

            # 예상 비용
            "cost_rent": f"{sim.est_cost_rent:,}" if sim.est_cost_rent else "N/A",
            "cost_labor": f"{sim.est_cost_labor:,}" if sim.est_cost_labor else "N/A",
            "cost_utilities": f"{sim.est_cost_utilities:,}" if sim.est_cost_utilities else "N/A",
            "cost_supplies": f"{sim.est_cost_supplies:,}" if sim.est_cost_supplies else "N/A",
            "cost_other": f"{sim.est_cost_other:,}" if sim.est_cost_other else "N/A",
            "cost_total": f"{sim.est_cost_total:,}" if sim.est_cost_total else "N/A",

            # 수익성
            "monthly_profit": f"{sim.monthly_profit_avg:,}" if sim.monthly_profit_avg else "N/A",
            "breakeven_months": sim.breakeven_months or "N/A",
            "annual_roi": f"{sim.annual_roi_percent:.1f}" if sim.annual_roi_percent else "N/A",

            # 경쟁 현황
            "same_dept_count": sim.same_dept_count or 0,
            "total_clinic_count": sim.total_clinic_count or 0,
            "competitors": competitors,

            # 인구통계
            "population_1km": f"{sim.population_1km:,}" if sim.population_1km else "N/A",
            "age_40_plus_ratio": f"{(sim.age_40_plus_ratio or 0) * 100:.1f}",
            "floating_population": f"{sim.floating_population_daily:,}" if sim.floating_population_daily else "N/A",

            # 분석 결과
            "confidence_score": sim.confidence_score or 0,
            "recommendation": recommendation_kr,
            "recommendation_reason": sim.recommendation_reason or "",

            # AI 분석
            "ai": ai_analysis,
        }

    def _generate_inline_html(self, ctx: dict) -> str:
        """내장 HTML 템플릿 생성"""
        # SWOT 분석 HTML
        swot = ctx.get("ai", {}).get("swot", {})
        swot_html = ""
        if swot:
            strengths = "".join([f"<li>{s}</li>" for s in swot.get("strengths", [])])
            weaknesses = "".join([f"<li>{w}</li>" for w in swot.get("weaknesses", [])])
            opportunities = "".join([f"<li>{o}</li>" for o in swot.get("opportunities", [])])
            threats = "".join([f"<li>{t}</li>" for t in swot.get("threats", [])])

            swot_html = f"""
            <div class="swot-grid">
                <div class="swot-box strength">
                    <h4>강점 (Strengths)</h4>
                    <ul>{strengths}</ul>
                </div>
                <div class="swot-box weakness">
                    <h4>약점 (Weaknesses)</h4>
                    <ul>{weaknesses}</ul>
                </div>
                <div class="swot-box opportunity">
                    <h4>기회 (Opportunities)</h4>
                    <ul>{opportunities}</ul>
                </div>
                <div class="swot-box threat">
                    <h4>위협 (Threats)</h4>
                    <ul>{threats}</ul>
                </div>
            </div>
            """

        # 리스크 요인 HTML
        risks = ctx.get("ai", {}).get("risk_factors", [])
        risks_html = ""
        for risk in risks:
            impact_class = risk.get("impact", "MEDIUM").lower()
            risks_html += f"""
            <tr>
                <td>{risk.get("risk", "")}</td>
                <td class="impact-{impact_class}">{risk.get("impact", "")}</td>
                <td>{risk.get("mitigation", "")}</td>
            </tr>
            """

        # 성공 전략 HTML
        strategies = ctx.get("ai", {}).get("success_strategies", [])
        strategies_html = ""
        for strat in strategies:
            priority_class = strat.get("priority", "MEDIUM").lower()
            strategies_html += f"""
            <tr>
                <td>{strat.get("strategy", "")}</td>
                <td class="priority-{priority_class}">{strat.get("priority", "")}</td>
                <td>{strat.get("description", "")}</td>
            </tr>
            """

        # 경쟁 병원 HTML
        competitors_html = ""
        for comp in ctx.get("competitors", [])[:5]:
            competitors_html += f"""
            <tr>
                <td>{comp.get("name", "")}</td>
                <td>{comp.get("distance", "")}m</td>
                <td>{comp.get("address", "")}</td>
            </tr>
            """

        # 액션 플랜 HTML
        action_plan = ctx.get("ai", {}).get("action_plan", [])
        action_html = ""
        for phase in action_plan:
            actions = "".join([f"<li>{a}</li>" for a in phase.get("actions", [])])
            action_html += f"""
            <div class="action-phase">
                <h4>{phase.get("phase", "")}</h4>
                <ul>{actions}</ul>
            </div>
            """

        return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>메디플라톤 상권분석 리포트</title>
</head>
<body>
    <div class="report-container">
        <!-- 헤더 -->
        <header class="report-header">
            <div class="logo">
                <h1>메디플라톤</h1>
                <p>AI 상권분석 리포트</p>
            </div>
            <div class="report-meta">
                <p>리포트 ID: {ctx.get("report_id", "")}</p>
                <p>생성일: {ctx.get("generated_at", "")}</p>
            </div>
        </header>

        <!-- 요약 섹션 -->
        <section class="executive-summary">
            <h2>Executive Summary</h2>
            <div class="summary-box">
                <p>{ctx.get("ai", {}).get("executive_summary", "분석 결과를 불러오는 중입니다...")}</p>
            </div>
            <div class="key-metrics">
                <div class="metric">
                    <span class="label">추천 등급</span>
                    <span class="value highlight">{ctx.get("recommendation", "")}</span>
                </div>
                <div class="metric">
                    <span class="label">신뢰도</span>
                    <span class="value">{ctx.get("confidence_score", 0)}점</span>
                </div>
                <div class="metric">
                    <span class="label">예상 월 순이익</span>
                    <span class="value">{ctx.get("monthly_profit", "N/A")}원</span>
                </div>
                <div class="metric">
                    <span class="label">손익분기점</span>
                    <span class="value">{ctx.get("breakeven_months", "N/A")}개월</span>
                </div>
            </div>
        </section>

        <!-- 기본 정보 -->
        <section class="basic-info">
            <h2>1. 분석 대상 정보</h2>
            <table class="info-table">
                <tr><th>주소</th><td>{ctx.get("address", "")}</td></tr>
                <tr><th>진료과목</th><td>{ctx.get("clinic_type", "")}</td></tr>
                <tr><th>면적</th><td>{ctx.get("size_pyeong", "")}평</td></tr>
                <tr><th>예산</th><td>{ctx.get("budget_million", "")}백만원</td></tr>
            </table>
        </section>

        <!-- 입지 분석 -->
        <section class="location-analysis">
            <h2>2. 입지 분석</h2>
            <p>{ctx.get("ai", {}).get("location_analysis", "")}</p>

            <h3>인구통계</h3>
            <table class="data-table">
                <tr>
                    <th>반경 1km 인구</th>
                    <td>{ctx.get("population_1km", "N/A")}명</td>
                </tr>
                <tr>
                    <th>40대 이상 비율</th>
                    <td>{ctx.get("age_40_plus_ratio", "0")}%</td>
                </tr>
                <tr>
                    <th>일일 유동인구</th>
                    <td>{ctx.get("floating_population", "N/A")}명</td>
                </tr>
            </table>
        </section>

        <!-- 재무 분석 -->
        <section class="financial-analysis">
            <h2>3. 재무 분석</h2>
            <p>{ctx.get("ai", {}).get("financial_outlook", "")}</p>

            <div class="financial-grid">
                <div class="fin-box revenue">
                    <h4>예상 월 매출</h4>
                    <p class="main-value">{ctx.get("revenue_avg", "N/A")}원</p>
                    <p class="sub-value">범위: {ctx.get("revenue_min", "N/A")} ~ {ctx.get("revenue_max", "N/A")}원</p>
                </div>
                <div class="fin-box cost">
                    <h4>예상 월 비용</h4>
                    <p class="main-value">{ctx.get("cost_total", "N/A")}원</p>
                    <ul class="cost-breakdown">
                        <li>임차료: {ctx.get("cost_rent", "N/A")}원</li>
                        <li>인건비: {ctx.get("cost_labor", "N/A")}원</li>
                        <li>유틸리티: {ctx.get("cost_utilities", "N/A")}원</li>
                        <li>의료용품: {ctx.get("cost_supplies", "N/A")}원</li>
                    </ul>
                </div>
                <div class="fin-box profit">
                    <h4>예상 월 순이익</h4>
                    <p class="main-value">{ctx.get("monthly_profit", "N/A")}원</p>
                    <p class="sub-value">연간 ROI: {ctx.get("annual_roi", "N/A")}%</p>
                </div>
            </div>
        </section>

        <!-- 경쟁 분석 -->
        <section class="competition-analysis">
            <h2>4. 경쟁 분석</h2>
            <p>{ctx.get("ai", {}).get("competition_analysis", "")}</p>

            <div class="competition-summary">
                <div class="comp-stat">
                    <span class="label">동일 진료과 병원</span>
                    <span class="value">{ctx.get("same_dept_count", 0)}개</span>
                </div>
                <div class="comp-stat">
                    <span class="label">전체 의료기관</span>
                    <span class="value">{ctx.get("total_clinic_count", 0)}개</span>
                </div>
            </div>

            {"<h3>주변 경쟁 병원</h3><table class='data-table'><tr><th>병원명</th><th>거리</th><th>주소</th></tr>" + competitors_html + "</table>" if competitors_html else ""}
        </section>

        <!-- SWOT 분석 -->
        <section class="swot-analysis">
            <h2>5. SWOT 분석</h2>
            {swot_html if swot_html else "<p>SWOT 분석 데이터를 불러오는 중입니다.</p>"}
        </section>

        <!-- 리스크 분석 -->
        <section class="risk-analysis">
            <h2>6. 리스크 분석</h2>
            {"<table class='data-table'><tr><th>리스크</th><th>영향도</th><th>대응 방안</th></tr>" + risks_html + "</table>" if risks_html else "<p>리스크 분석 데이터 없음</p>"}
        </section>

        <!-- 성공 전략 -->
        <section class="success-strategies">
            <h2>7. 성공 전략</h2>
            {"<table class='data-table'><tr><th>전략</th><th>우선순위</th><th>설명</th></tr>" + strategies_html + "</table>" if strategies_html else "<p>전략 데이터 없음</p>"}
        </section>

        <!-- 액션 플랜 -->
        <section class="action-plan">
            <h2>8. 액션 플랜</h2>
            {action_html if action_html else "<p>액션 플랜 데이터 없음</p>"}
        </section>

        <!-- 최종 권고 -->
        <section class="final-recommendation">
            <h2>9. 최종 권고사항</h2>
            <div class="recommendation-box">
                <p>{ctx.get("ai", {}).get("final_recommendation", "")}</p>
            </div>
            <p class="confidence-note">{ctx.get("ai", {}).get("confidence_note", "")}</p>
        </section>

        <!-- 푸터 -->
        <footer class="report-footer">
            <p>본 리포트는 공공데이터 및 AI 분석을 기반으로 생성되었습니다.</p>
            <p>실제 개원 결정 시 추가적인 현장 조사 및 전문가 상담을 권장합니다.</p>
            <p class="copyright">© {datetime.now().year} 메디플라톤. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>"""

    def _get_pdf_styles(self) -> str:
        """PDF 스타일시트"""
        return """
        @page {
            size: A4;
            margin: 2cm;
            @bottom-center {
                content: counter(page) " / " counter(pages);
                font-size: 10px;
                color: #666;
            }
        }

        body {
            font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
        }

        .report-container {
            max-width: 100%;
        }

        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .report-header h1 {
            color: #2563eb;
            font-size: 28pt;
            margin: 0;
        }

        .report-header .logo p {
            color: #666;
            margin: 5px 0 0 0;
        }

        .report-meta {
            text-align: right;
            font-size: 10pt;
            color: #666;
        }

        h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-top: 30px;
            page-break-after: avoid;
        }

        h3 {
            color: #374151;
            margin-top: 20px;
        }

        h4 {
            color: #4b5563;
            margin: 10px 0;
        }

        /* Executive Summary */
        .executive-summary {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }

        .summary-box {
            background: white;
            padding: 15px;
            border-left: 4px solid #2563eb;
            margin-bottom: 20px;
        }

        .key-metrics {
            display: flex;
            justify-content: space-between;
            gap: 15px;
        }

        .metric {
            flex: 1;
            text-align: center;
            background: white;
            padding: 15px;
            border-radius: 8px;
        }

        .metric .label {
            display: block;
            font-size: 10pt;
            color: #666;
            margin-bottom: 5px;
        }

        .metric .value {
            display: block;
            font-size: 14pt;
            font-weight: bold;
            color: #1e40af;
        }

        .metric .value.highlight {
            color: #059669;
        }

        /* Tables */
        .info-table, .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        .info-table th, .info-table td,
        .data-table th, .data-table td {
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #e5e7eb;
        }

        .info-table th, .data-table th {
            background: #f3f4f6;
            font-weight: 600;
            width: 30%;
        }

        .data-table th {
            width: auto;
        }

        /* Financial Grid */
        .financial-grid {
            display: flex;
            gap: 15px;
            margin: 20px 0;
        }

        .fin-box {
            flex: 1;
            padding: 15px;
            border-radius: 8px;
            background: #f9fafb;
        }

        .fin-box.revenue {
            border-left: 4px solid #10b981;
        }

        .fin-box.cost {
            border-left: 4px solid #ef4444;
        }

        .fin-box.profit {
            border-left: 4px solid #2563eb;
        }

        .fin-box h4 {
            margin-top: 0;
        }

        .fin-box .main-value {
            font-size: 16pt;
            font-weight: bold;
            color: #1f2937;
            margin: 10px 0 5px 0;
        }

        .fin-box .sub-value {
            font-size: 10pt;
            color: #6b7280;
        }

        .cost-breakdown {
            font-size: 10pt;
            padding-left: 20px;
            color: #6b7280;
        }

        /* SWOT Grid */
        .swot-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }

        .swot-box {
            padding: 15px;
            border-radius: 8px;
        }

        .swot-box h4 {
            margin-top: 0;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            display: inline-block;
        }

        .swot-box.strength { background: #ecfdf5; }
        .swot-box.strength h4 { background: #10b981; }

        .swot-box.weakness { background: #fef2f2; }
        .swot-box.weakness h4 { background: #ef4444; }

        .swot-box.opportunity { background: #eff6ff; }
        .swot-box.opportunity h4 { background: #2563eb; }

        .swot-box.threat { background: #fefce8; }
        .swot-box.threat h4 { background: #f59e0b; }

        .swot-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        /* Impact/Priority badges */
        .impact-high, .priority-high { color: #dc2626; font-weight: bold; }
        .impact-medium, .priority-medium { color: #f59e0b; }
        .impact-low, .priority-low { color: #10b981; }

        /* Competition */
        .competition-summary {
            display: flex;
            gap: 30px;
            margin: 15px 0;
        }

        .comp-stat {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .comp-stat .label {
            color: #6b7280;
        }

        .comp-stat .value {
            font-size: 18pt;
            font-weight: bold;
            color: #1e40af;
        }

        /* Action Plan */
        .action-phase {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }

        .action-phase h4 {
            margin-top: 0;
            color: #2563eb;
        }

        /* Final Recommendation */
        .recommendation-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }

        .recommendation-box p {
            margin: 0;
            font-size: 12pt;
        }

        .confidence-note {
            font-size: 10pt;
            color: #6b7280;
            font-style: italic;
        }

        /* Footer */
        .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 9pt;
            color: #9ca3af;
        }

        .report-footer .copyright {
            margin-top: 10px;
            font-weight: 500;
        }

        /* Page breaks */
        section {
            page-break-inside: avoid;
        }

        .swot-analysis, .risk-analysis {
            page-break-before: auto;
        }
        """

    async def upload_to_s3(self, pdf_bytes: bytes, filename: str) -> Optional[str]:
        """S3에 PDF 업로드 및 URL 반환"""
        if not self.s3_client:
            return None

        try:
            key = f"reports/{filename}"
            self.s3_client.upload_fileobj(
                BytesIO(pdf_bytes),
                settings.S3_BUCKET_NAME,
                key,
                ExtraArgs={
                    "ContentType": "application/pdf",
                    "ContentDisposition": f"attachment; filename={filename}"
                }
            )

            # Pre-signed URL 생성 (7일 유효)
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": key
                },
                ExpiresIn=7 * 24 * 60 * 60  # 7일
            )
            return url
        except Exception as e:
            print(f"S3 업로드 실패: {e}")
            return None

    def save_locally(self, pdf_bytes: bytes, filename: str) -> str:
        """로컬에 PDF 저장 (개발용)"""
        output_dir = Path(__file__).parent.parent.parent / "tmp" / "reports"
        output_dir.mkdir(parents=True, exist_ok=True)

        filepath = output_dir / filename
        with open(filepath, "wb") as f:
            f.write(pdf_bytes)

        return str(filepath)


# 서비스 인스턴스
pdf_generator_service = PDFGeneratorService()
