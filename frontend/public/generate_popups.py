"""
Generate 10 promotional popup banner images for MediPlaton
Each popup is rendered from HTML/CSS and captured as high-res JPG using Playwright
"""

import os
from pathlib import Path
from playwright.sync_api import sync_playwright

# Base directory for outputs
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR

# HTML Templates
TEMPLATES = {
    'popup-dsr-loan.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DSR-Free 대출</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            color: white;
            padding: 50px 40px;
        }
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.25);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 20px;
            border: 1px solid rgba(255,255,255,0.3);
        }
        h1 {
            font-size: 42px;
            font-weight: 900;
            margin-bottom: 12px;
            line-height: 1.2;
        }
        .subtitle {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 40px;
            opacity: 0.95;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.85;
            margin-bottom: 8px;
        }
        .stat-value {
            font-size: 26px;
            font-weight: 900;
            color: #fbbf24;
        }
        .highlight-box {
            background: rgba(251, 191, 36, 0.2);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .highlight-box p {
            font-size: 16px;
            font-weight: 700;
            text-align: center;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: white;
            color: #1e3a8a;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: transform 0.2s;
            margin-bottom: 12px;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .domain {
            text-align: center;
            font-size: 13px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="popup">
        <div class="badge">✅ 신협중앙회 정식 제휴</div>
        <h1>DSR 규제?<br>걱정 마세요</h1>
        <p class="subtitle">기존 대출과 별개, 카드매출 담보 대출</p>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">금리</div>
                <div class="stat-value">5.3~6.9%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">한도</div>
                <div class="stat-value">최대 3억</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">중도상환수수료</div>
                <div class="stat-value">0원</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">심사기간</div>
                <div class="stat-value">3영업일</div>
            </div>
        </div>

        <div class="highlight-box">
            <p>💳 기존 대출 영향 없음<br>DSR 산정에서 제외됩니다</p>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            💰 한도 조회하기
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-marketing-savings.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>마케팅비 절약</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #dc2626 0%, #f97316 50%, #fb923c 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            color: white;
            padding: 50px 40px;
        }
        h1 {
            font-size: 38px;
            font-weight: 900;
            margin-bottom: 16px;
            line-height: 1.3;
        }
        .subtitle {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 40px;
            opacity: 0.95;
        }
        .price-list {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .price-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .price-item:last-child {
            border-bottom: none;
        }
        .price-name {
            font-size: 16px;
            font-weight: 500;
        }
        .price-value {
            font-size: 18px;
            font-weight: 700;
            text-decoration: line-through;
            opacity: 0.8;
        }
        .free-tag {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 700;
            margin-left: 8px;
        }
        .total-savings {
            background: white;
            color: #dc2626;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        .total-savings .label {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        .total-savings .amount {
            font-size: 48px;
            font-weight: 900;
            margin-bottom: 8px;
        }
        .total-savings .condition {
            font-size: 14px;
            color: #666;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: white;
            color: #dc2626;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="popup">
        <h1>개원 마케팅비만<br>수천만원?</h1>
        <p class="subtitle">PG 단말기 설치하면 전부 무료로 제공됩니다</p>

        <div class="price-list">
            <div class="price-item">
                <span class="price-name">📝 블로그 마케팅</span>
                <span>
                    <span class="price-value">440만원</span>
                    <span class="free-tag">무료</span>
                </span>
            </div>
            <div class="price-item">
                <span class="price-name">📍 플레이스 최적화</span>
                <span>
                    <span class="price-value">790만원</span>
                    <span class="free-tag">무료</span>
                </span>
            </div>
            <div class="price-item">
                <span class="price-name">🎯 SNS 광고</span>
                <span>
                    <span class="price-value">680만원</span>
                    <span class="free-tag">무료</span>
                </span>
            </div>
            <div class="price-item">
                <span class="price-name">🌐 홈페이지 제작</span>
                <span>
                    <span class="price-value">350만원</span>
                    <span class="free-tag">무료</span>
                </span>
            </div>
            <div class="price-item">
                <span class="price-name">📊 SEO 최적화</span>
                <span>
                    <span class="price-value">320만원</span>
                    <span class="free-tag">무료</span>
                </span>
            </div>
        </div>

        <div class="total-savings">
            <div class="label">총 절약 금액</div>
            <div class="amount">2,580만원</div>
            <div class="condition">PG 단말기 설치 조건</div>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            🎁 무료 혜택 확인
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-comparison.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Before/After 비교</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 50px 0;
        }
        h1 {
            font-size: 36px;
            font-weight: 900;
            text-align: center;
            margin-bottom: 40px;
            color: #1f2937;
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
        }
        .column {
            padding: 30px;
        }
        .column.before {
            background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
            color: white;
        }
        .column.after {
            background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%);
            color: white;
        }
        .column-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 24px;
            text-align: center;
            padding-bottom: 12px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
        }
        .feature {
            margin-bottom: 24px;
        }
        .feature-label {
            font-size: 13px;
            opacity: 0.8;
            margin-bottom: 6px;
        }
        .feature-value {
            font-size: 17px;
            font-weight: 700;
        }
        .column.before .feature-value {
            color: #fca5a5;
        }
        .column.after .feature-value {
            color: #fde047;
        }
        .cta-section {
            padding: 30px 40px 0 40px;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%);
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="popup">
        <h1>기존 vs 메디플라톤</h1>

        <div class="comparison-grid">
            <div class="column before">
                <div class="column-title">❌ 기존 방식</div>
                <div class="feature">
                    <div class="feature-label">마케팅</div>
                    <div class="feature-value">자비 2,580만원</div>
                </div>
                <div class="feature">
                    <div class="feature-label">대출</div>
                    <div class="feature-value">DSR 규제 적용</div>
                </div>
                <div class="feature">
                    <div class="feature-label">업체 관리</div>
                    <div class="feature-value">4~5개 업체 개별 관리</div>
                </div>
                <div class="feature">
                    <div class="feature-label">PG 월 관리비</div>
                    <div class="feature-value">11,000원</div>
                </div>
                <div class="feature">
                    <div class="feature-label">총 비용</div>
                    <div class="feature-value">3,000만원+</div>
                </div>
            </div>

            <div class="column after">
                <div class="column-title">✅ 메디플라톤</div>
                <div class="feature">
                    <div class="feature-label">마케팅</div>
                    <div class="feature-value">전액 무료 제공</div>
                </div>
                <div class="feature">
                    <div class="feature-label">대출</div>
                    <div class="feature-value">DSR-Free (5.3%~)</div>
                </div>
                <div class="feature">
                    <div class="feature-label">업체 관리</div>
                    <div class="feature-value">원스톱 통합 관리</div>
                </div>
                <div class="feature">
                    <div class="feature-label">PG 월 관리비</div>
                    <div class="feature-value">0원 (무약정)</div>
                </div>
                <div class="feature">
                    <div class="feature-label">총 비용</div>
                    <div class="feature-value">0원</div>
                </div>
            </div>
        </div>

        <div class="cta-section">
            <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
                🚀 원스톱으로 전환하기
            </a>
            <p class="domain">medi.brandplaton.com</p>
        </div>
    </div>
</body>
</html>
""",

    'popup-testimonial.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>원장님 후기</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 50px 40px;
        }
        h1 {
            font-size: 38px;
            font-weight: 900;
            color: #92400e;
            text-align: center;
            margin-bottom: 12px;
        }
        .subtitle {
            font-size: 16px;
            color: #78350f;
            text-align: center;
            margin-bottom: 40px;
        }
        .testimonials {
            margin-bottom: 30px;
        }
        .testimonial-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .testimonial-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .doctor-name {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
        }
        .stars {
            color: #f59e0b;
            font-size: 14px;
        }
        .testimonial-text {
            font-size: 15px;
            color: #4b5563;
            line-height: 1.6;
        }
        .stats-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 30px;
        }
        .stat-box {
            background: rgba(255,255,255,0.6);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 2px solid #fbbf24;
        }
        .stat-value {
            font-size: 32px;
            font-weight: 900;
            color: #0369a1;
            margin-bottom: 4px;
        }
        .stat-label {
            font-size: 14px;
            color: #78350f;
            font-weight: 500;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            color: #78350f;
        }
    </style>
</head>
<body>
    <div class="popup">
        <h1>원장님들의 후기</h1>
        <p class="subtitle">실제로 메디플라톤을 이용하신 분들의 이야기</p>

        <div class="testimonials">
            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="doctor-name">김○○ 원장 (내과)</div>
                    <div class="stars">⭐⭐⭐⭐⭐</div>
                </div>
                <div class="testimonial-text">
                    "PG만 바꿨을 뿐인데 마케팅까지 무료로 받게 되어 정말 만족합니다. 개원 비용이 확 줄었어요."
                </div>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="doctor-name">박○○ 원장 (피부과)</div>
                    <div class="stars">⭐⭐⭐⭐⭐</div>
                </div>
                <div class="testimonial-text">
                    "DSR-Free 대출 덕분에 기존 대출 영향 없이 2억 대출받았습니다. 금리도 시중은행보다 낮아요."
                </div>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="doctor-name">최○○ 원장 (치과)</div>
                    <div class="stars">⭐⭐⭐⭐⭐</div>
                </div>
                <div class="testimonial-text">
                    "입지 분석부터 개원까지 한 곳에서 해결. 여러 업체 관리하는 스트레스가 없어서 좋습니다."
                </div>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-box">
                <div class="stat-value">2,400+</div>
                <div class="stat-label">누적 상담</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">87%</div>
                <div class="stat-label">평균 승인율</div>
            </div>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            💬 나도 상담 신청
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-location-analysis.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 입지분석</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            color: white;
            padding: 50px 40px;
        }
        h1 {
            font-size: 36px;
            font-weight: 900;
            margin-bottom: 16px;
            line-height: 1.3;
        }
        .subtitle {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 40px;
            opacity: 0.95;
        }
        .features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 30px;
        }
        .feature-card {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 24px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .feature-icon {
            font-size: 32px;
            margin-bottom: 12px;
        }
        .feature-title {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .feature-desc {
            font-size: 13px;
            opacity: 0.9;
            line-height: 1.4;
        }
        .comparison-box {
            background: white;
            color: #065f46;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .comparison-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .comparison-row:last-child {
            margin-bottom: 0;
        }
        .comparison-label {
            font-size: 16px;
            font-weight: 700;
        }
        .old-price {
            font-size: 18px;
            font-weight: 700;
            text-decoration: line-through;
            color: #dc2626;
        }
        .new-price {
            font-size: 22px;
            font-weight: 900;
            color: #059669;
        }
        .arrow {
            font-size: 24px;
            color: #059669;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: white;
            color: #059669;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="popup">
        <h1>입지가 매출의 80%를<br>결정합니다</h1>
        <p class="subtitle">AI 데이터 분석으로 실패 확률을 낮추세요</p>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🏥</div>
                <div class="feature-title">경쟁 분석</div>
                <div class="feature-desc">심평원 데이터 기반<br>주변 병의원 현황</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👥</div>
                <div class="feature-title">인구 분석</div>
                <div class="feature-desc">국토교통부 데이터<br>유동인구·연령대</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📈</div>
                <div class="feature-title">매출 예측</div>
                <div class="feature-desc">AI 알고리즘<br>월 예상 매출 산출</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💰</div>
                <div class="feature-title">손익분기점</div>
                <div class="feature-desc">임대료·인건비 반영<br>BEP 시뮬레이션</div>
            </div>
        </div>

        <div class="comparison-box">
            <div class="comparison-row">
                <span class="comparison-label">기존 컨설팅</span>
                <span class="old-price">500만원+</span>
            </div>
            <div class="comparison-row">
                <span class="arrow">↓</span>
            </div>
            <div class="comparison-row">
                <span class="comparison-label">메디플라톤</span>
                <span class="new-price">무료</span>
            </div>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            🎯 무료 입지분석 시작
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-pipeline.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>원스톱 6단계</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6b21a8 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            color: white;
            padding: 50px 40px;
        }
        h1 {
            font-size: 34px;
            font-weight: 900;
            margin-bottom: 16px;
            line-height: 1.3;
            text-align: center;
        }
        .subtitle {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 40px;
            opacity: 0.9;
            text-align: center;
        }
        .timeline {
            margin-bottom: 30px;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 24px;
            position: relative;
        }
        .step:last-child {
            margin-bottom: 0;
        }
        .step:not(:last-child)::after {
            content: '';
            position: absolute;
            left: 23px;
            top: 50px;
            width: 2px;
            height: 24px;
            background: rgba(255,255,255,0.3);
        }
        .step-number {
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.2);
            border: 2px solid #fbbf24;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 900;
            color: #fbbf24;
            flex-shrink: 0;
            margin-right: 16px;
        }
        .step-content {
            flex: 1;
            padding-top: 4px;
        }
        .step-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 6px;
        }
        .step-desc {
            font-size: 14px;
            opacity: 0.85;
            line-height: 1.4;
        }
        .highlight-box {
            background: rgba(251, 191, 36, 0.2);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .highlight-box p {
            font-size: 15px;
            font-weight: 700;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #1e1b4b;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="popup">
        <h1>입지 분석부터 마케팅까지,<br>한 번에</h1>
        <p class="subtitle">메디플라톤의 원스톱 개원 솔루션</p>

        <div class="timeline">
            <div class="step">
                <div class="step-number">①</div>
                <div class="step-content">
                    <div class="step-title">입지 AI 분석</div>
                    <div class="step-desc">경쟁·인구·매출 예측 무료 리포트</div>
                </div>
            </div>

            <div class="step">
                <div class="step-number">②</div>
                <div class="step-content">
                    <div class="step-title">매물 추천</div>
                    <div class="step-desc">전국 470+ 개원 매물 데이터베이스</div>
                </div>
            </div>

            <div class="step">
                <div class="step-number">③</div>
                <div class="step-content">
                    <div class="step-title">개원 중개</div>
                    <div class="step-desc">계약부터 입주까지 전문 컨설팅</div>
                </div>
            </div>

            <div class="step">
                <div class="step-number">④</div>
                <div class="step-content">
                    <div class="step-title">PG 설치</div>
                    <div class="step-desc">당일 설치, 무약정, 관리비 0원</div>
                </div>
            </div>

            <div class="step">
                <div class="step-number">⑤</div>
                <div class="step-content">
                    <div class="step-title">DSR-Free 대출</div>
                    <div class="step-desc">금리 5.3%~, 한도 최대 3억원</div>
                </div>
            </div>

            <div class="step">
                <div class="step-number">⑥</div>
                <div class="step-content">
                    <div class="step-title">마케팅</div>
                    <div class="step-desc">블로그·플레이스·SNS 2,580만원 무료</div>
                </div>
            </div>
        </div>

        <div class="highlight-box">
            <p>✨ 6단계 모두 메디플라톤에서 관리<br>업체별 소통 스트레스 제로</p>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            🚀 무료 상담 시작
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-pg-switch.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PG 전환 안내</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 50px 40px;
        }
        h1 {
            font-size: 42px;
            font-weight: 900;
            color: #0369a1;
            margin-bottom: 16px;
            line-height: 1.2;
        }
        .subtitle {
            font-size: 18px;
            font-weight: 500;
            color: #075985;
            margin-bottom: 40px;
        }
        .info-box {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 30px;
            border: 2px solid #0ea5e9;
        }
        .info-box p {
            font-size: 15px;
            color: #334155;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .info-box p:last-child {
            margin-bottom: 0;
        }
        .steps {
            margin-bottom: 30px;
        }
        .step-item {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .step-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 900;
            margin-right: 16px;
            flex-shrink: 0;
        }
        .step-text {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
        }
        .benefits {
            background: rgba(14, 165, 233, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .benefits-title {
            font-size: 16px;
            font-weight: 700;
            color: #0369a1;
            margin-bottom: 12px;
        }
        .benefit-item {
            font-size: 15px;
            color: #334155;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .benefit-item::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #0ea5e9;
            font-weight: 900;
        }
        .benefit-item:last-child {
            margin-bottom: 0;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="popup">
        <h1>PG만 바꿨을 뿐인데</h1>
        <p class="subtitle">기존 카드사 계약은 유지, PG사만 변경하면 됩니다</p>

        <div class="info-box">
            <p>💡 <strong>PG사 변경은 간단합니다</strong></p>
            <p>기존 카드사(국민·신한·우리 등)와의 계약은 그대로 유지되며, 결제 시스템(PG사)만 메디플라톤으로 전환됩니다.</p>
        </div>

        <div class="steps">
            <div class="step-item">
                <div class="step-icon">①</div>
                <div class="step-text">무료 상담 신청</div>
            </div>
            <div class="step-item">
                <div class="step-icon">②</div>
                <div class="step-text">PG 단말기 당일 설치</div>
            </div>
            <div class="step-item">
                <div class="step-icon">③</div>
                <div class="step-text">마케팅 자동 시작</div>
            </div>
        </div>

        <div class="benefits">
            <div class="benefits-title">핵심 혜택</div>
            <div class="benefit-item">단말기 설치비 0원</div>
            <div class="benefit-item">월 관리비 0원 (무약정)</div>
            <div class="benefit-item">마케팅 2,580만원 무료 제공</div>
            <div class="benefit-item">DSR-Free 대출 연계 가능</div>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            ⚡ 당일 설치 신청
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-trust-data.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>신뢰 데이터</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #4c1d95 0%, #6b21a8 50%, #7c3aed 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            color: white;
            padding: 50px 40px;
        }
        .quote {
            font-size: 18px;
            font-weight: 500;
            text-align: center;
            margin-bottom: 12px;
            opacity: 0.9;
        }
        h1 {
            font-size: 42px;
            font-weight: 900;
            margin-bottom: 50px;
            text-align: center;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 40px;
        }
        .stat-box {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 30px 20px;
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
        }
        .stat-value {
            font-size: 44px;
            font-weight: 900;
            color: #fbbf24;
            margin-bottom: 8px;
        }
        .stat-label {
            font-size: 15px;
            opacity: 0.9;
        }
        .partners {
            background: rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .partners-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 16px;
            text-align: center;
            opacity: 0.85;
        }
        .partners-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
        }
        .partner-badge {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .trust-box {
            background: rgba(251, 191, 36, 0.2);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .trust-box p {
            font-size: 16px;
            font-weight: 700;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: white;
            color: #6b21a8;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="popup">
        <p class="quote">"숫자가 증명하는 신뢰"</p>
        <h1>메디플라톤의 실적</h1>

        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">2,400+</div>
                <div class="stat-label">누적 상담</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">890+</div>
                <div class="stat-label">대출 실행</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">87%</div>
                <div class="stat-label">평균 승인율</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">470+</div>
                <div class="stat-label">개원 매물</div>
            </div>
        </div>

        <div class="partners">
            <div class="partners-title">🤝 공식 제휴 파트너</div>
            <div class="partners-list">
                <div class="partner-badge">신협중앙회</div>
                <div class="partner-badge">KB국민카드</div>
                <div class="partner-badge">신한카드</div>
                <div class="partner-badge">우리카드</div>
                <div class="partner-badge">하나카드</div>
            </div>
        </div>

        <div class="trust-box">
            <p>✅ 전국 의사 2,400명 이상이<br>메디플라톤을 선택했습니다</p>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            💼 무료 상담 신청
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-checklist.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>개원 준비 체크리스트</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #f59e0b 0%, #fb923c 50%, #fbbf24 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            color: white;
            padding: 50px 40px;
        }
        h1 {
            font-size: 38px;
            font-weight: 900;
            margin-bottom: 16px;
            line-height: 1.3;
        }
        .subtitle {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 40px;
            opacity: 0.95;
        }
        .checklist {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .checklist-item {
            display: flex;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .checklist-item:last-child {
            border-bottom: none;
        }
        .checkbox {
            width: 28px;
            height: 28px;
            border: 3px solid #d1d5db;
            border-radius: 6px;
            margin-right: 16px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        .checklist-item.highlight .checkbox {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
        }
        .item-text {
            font-size: 17px;
            color: #1f2937;
            font-weight: 500;
        }
        .checklist-item.highlight .item-text {
            font-weight: 700;
            color: #ea580c;
        }
        .help-badge {
            background: rgba(245, 158, 11, 0.15);
            color: #ea580c;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            margin-left: auto;
        }
        .info-box {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.3);
            text-align: center;
        }
        .info-box p {
            font-size: 15px;
            font-weight: 700;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: white;
            color: #ea580c;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="popup">
        <h1>개원 준비,<br>어디까지 하셨나요?</h1>
        <p class="subtitle">메디플라톤이 도와드릴 수 있는 항목을 확인하세요</p>

        <div class="checklist">
            <div class="checklist-item highlight">
                <div class="checkbox">✓</div>
                <div class="item-text">입지 선정</div>
                <div class="help-badge">무료 지원</div>
            </div>
            <div class="checklist-item highlight">
                <div class="checkbox">✓</div>
                <div class="item-text">매물 계약</div>
                <div class="help-badge">무료 지원</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="item-text">인테리어</div>
            </div>
            <div class="checklist-item highlight">
                <div class="checkbox">✓</div>
                <div class="item-text">PG 단말기</div>
                <div class="help-badge">무료 지원</div>
            </div>
            <div class="checklist-item highlight">
                <div class="checkbox">✓</div>
                <div class="item-text">개원 대출</div>
                <div class="help-badge">무료 지원</div>
            </div>
            <div class="checklist-item highlight">
                <div class="checkbox">✓</div>
                <div class="item-text">마케팅</div>
                <div class="help-badge">무료 지원</div>
            </div>
        </div>

        <div class="info-box">
            <p>📋 메디플라톤이 도와드릴 수 있는 항목<br>입지·매물·PG·대출·마케팅 원스톱</p>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            ✅ 무료 체크리스트 상담
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
""",

    'popup-premium-summary.html': """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>프리미엄 혜택 총정리</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .popup {
            width: 600px;
            background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            color: white;
            padding: 50px 40px;
            position: relative;
        }
        .popup::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
        }
        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #18181b;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 900;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 42px;
            font-weight: 900;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .tagline {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 40px;
            opacity: 0.85;
        }
        .pillars {
            margin-bottom: 30px;
        }
        .pillar {
            background: linear-gradient(135deg, #27272a 0%, #3f3f46 100%);
            border: 2px solid #fbbf24;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 16px;
        }
        .pillar-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        .pillar-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-right: 16px;
        }
        .pillar-title {
            font-size: 18px;
            font-weight: 700;
            color: #fbbf24;
        }
        .pillar-desc {
            font-size: 15px;
            opacity: 0.9;
            line-height: 1.5;
        }
        .trust-section {
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .trust-title {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 8px;
        }
        .trust-partners {
            font-size: 16px;
            font-weight: 700;
            color: #fbbf24;
        }
        .cta-button {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #18181b;
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.5);
            margin-bottom: 12px;
        }
        .domain {
            text-align: center;
            font-size: 13px;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="popup">
        <div class="badge">👑 PREMIUM</div>
        <h1>프리미엄 개원의<br>패키지</h1>
        <p class="tagline">모든 서비스 한 곳에서, 메디플라톤</p>

        <div class="pillars">
            <div class="pillar">
                <div class="pillar-header">
                    <div class="pillar-icon">💳</div>
                    <div class="pillar-title">PG 무상 설치</div>
                </div>
                <div class="pillar-desc">
                    단말기 0원 · 관리비 0원 · 무약정<br>
                    당일 설치 가능
                </div>
            </div>

            <div class="pillar">
                <div class="pillar-header">
                    <div class="pillar-icon">💰</div>
                    <div class="pillar-title">DSR-Free 대출</div>
                </div>
                <div class="pillar-desc">
                    금리 5.3%~ · 한도 최대 3억원<br>
                    기존 대출 영향 없음
                </div>
            </div>

            <div class="pillar">
                <div class="pillar-header">
                    <div class="pillar-icon">📢</div>
                    <div class="pillar-title">무료 마케팅</div>
                </div>
                <div class="pillar-desc">
                    블로그 · 플레이스 · SNS · SEO<br>
                    총 2,580만원 상당 무료 제공
                </div>
            </div>
        </div>

        <div class="trust-section">
            <div class="trust-title">신뢰할 수 있는 파트너</div>
            <div class="trust-partners">신협중앙회 · KB국민카드 정식 제휴</div>
        </div>

        <a href="https://medi.brandplaton.com/opening-package" class="cta-button">
            ⭐ VIP 상담 신청
        </a>
        <p class="domain">medi.brandplaton.com</p>
    </div>
</body>
</html>
"""
}

def write_html_files():
    """Write all HTML templates to files"""
    print("Writing HTML files...")
    for filename, content in TEMPLATES.items():
        filepath = OUTPUT_DIR / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  OK {filename}")
    print()

def generate_screenshots():
    """Generate JPG screenshots using Playwright"""
    print("Generating screenshots with Playwright...")

    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)

        for html_file in TEMPLATES.keys():
            jpg_file = html_file.replace('.html', '.jpg')
            html_path = OUTPUT_DIR / html_file
            jpg_path = OUTPUT_DIR / jpg_file

            # Create page with high resolution
            page = browser.new_page(
                viewport={'width': 700, 'height': 1000},
                device_scale_factor=2
            )

            # Load HTML file
            file_url = f'file:///{html_path.as_posix()}'
            page.goto(file_url, wait_until='networkidle')

            # Wait a bit for fonts to load
            page.wait_for_timeout(500)

            # Screenshot the .popup element
            popup = page.locator('.popup')
            popup.screenshot(path=str(jpg_path), type='jpeg', quality=95)

            page.close()
            print(f"  OK {jpg_file}")

        browser.close()
    print()

def print_file_sizes():
    """Print sizes of generated JPG files"""
    print("Generated files:")
    print("-" * 60)

    total_size = 0
    for html_file in TEMPLATES.keys():
        jpg_file = html_file.replace('.html', '.jpg')
        jpg_path = OUTPUT_DIR / jpg_file

        if jpg_path.exists():
            size_bytes = jpg_path.stat().st_size
            size_kb = size_bytes / 1024
            total_size += size_bytes
            print(f"  {jpg_file:<35} {size_kb:>8.1f} KB")

    print("-" * 60)
    print(f"  Total: {len(TEMPLATES)} files, {total_size / 1024:.1f} KB")
    print()

def cleanup_html_files():
    """Remove temporary HTML files"""
    print("Cleaning up HTML files...")
    for html_file in TEMPLATES.keys():
        html_path = OUTPUT_DIR / html_file
        if html_path.exists():
            html_path.unlink()
            print(f"  OK Removed {html_file}")
    print()

if __name__ == '__main__':
    print("=" * 60)
    print("MediPlaton Popup Banner Generator")
    print("=" * 60)
    print()

    write_html_files()
    generate_screenshots()
    print_file_sizes()
    cleanup_html_files()

    print("[SUCCESS] All done! JPG files are in:")
    print(f"   {OUTPUT_DIR}")
