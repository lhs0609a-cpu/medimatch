"""
콜드 스타트 해결을 위한 시드 데이터 생성 스크립트

사용법:
    python -m scripts.seed_data --all
    python -m scripts.seed_data --hospitals
    python -m scripts.seed_data --listings
    python -m scripts.seed_data --pharmacy
    python -m scripts.seed_data --community
"""
import asyncio
import argparse
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# 시드 데이터 상수
# ============================================================

# 서울 주요 지역 (의료 상권)
SEOUL_MEDICAL_DISTRICTS = [
    {"gu": "강남구", "dong": "역삼동", "lat": 37.5000, "lng": 127.0365, "rent_base": 50000, "premium": 1.5},
    {"gu": "강남구", "dong": "삼성동", "lat": 37.5088, "lng": 127.0632, "rent_base": 55000, "premium": 1.6},
    {"gu": "강남구", "dong": "대치동", "lat": 37.4937, "lng": 127.0564, "rent_base": 45000, "premium": 1.4},
    {"gu": "강남구", "dong": "청담동", "lat": 37.5200, "lng": 127.0470, "rent_base": 60000, "premium": 1.7},
    {"gu": "서초구", "dong": "서초동", "lat": 37.4837, "lng": 127.0068, "rent_base": 45000, "premium": 1.3},
    {"gu": "서초구", "dong": "반포동", "lat": 37.5056, "lng": 126.9875, "rent_base": 48000, "premium": 1.4},
    {"gu": "송파구", "dong": "잠실동", "lat": 37.5133, "lng": 127.1000, "rent_base": 42000, "premium": 1.3},
    {"gu": "송파구", "dong": "문정동", "lat": 37.4857, "lng": 127.1230, "rent_base": 38000, "premium": 1.2},
    {"gu": "마포구", "dong": "서교동", "lat": 37.5509, "lng": 126.9191, "rent_base": 35000, "premium": 1.1},
    {"gu": "마포구", "dong": "합정동", "lat": 37.5495, "lng": 126.9137, "rent_base": 33000, "premium": 1.0},
    {"gu": "영등포구", "dong": "여의도동", "lat": 37.5219, "lng": 126.9245, "rent_base": 50000, "premium": 1.4},
    {"gu": "용산구", "dong": "이태원동", "lat": 37.5340, "lng": 126.9948, "rent_base": 38000, "premium": 1.2},
    {"gu": "종로구", "dong": "종로1가", "lat": 37.5700, "lng": 126.9830, "rent_base": 55000, "premium": 1.5},
    {"gu": "중구", "dong": "명동", "lat": 37.5636, "lng": 126.9850, "rent_base": 65000, "premium": 1.8},
    {"gu": "성동구", "dong": "성수동", "lat": 37.5445, "lng": 127.0550, "rent_base": 35000, "premium": 1.2},
]

# 경기 주요 지역
GYEONGGI_MEDICAL_DISTRICTS = [
    {"city": "성남시", "gu": "분당구", "dong": "서현동", "lat": 37.3850, "lng": 127.1236, "rent_base": 35000, "premium": 1.2},
    {"city": "성남시", "gu": "분당구", "dong": "정자동", "lat": 37.3650, "lng": 127.1100, "rent_base": 38000, "premium": 1.3},
    {"city": "수원시", "gu": "영통구", "dong": "광교동", "lat": 37.2850, "lng": 127.0450, "rent_base": 30000, "premium": 1.1},
    {"city": "용인시", "gu": "수지구", "dong": "죽전동", "lat": 37.3200, "lng": 127.1050, "rent_base": 28000, "premium": 1.0},
    {"city": "고양시", "gu": "일산서구", "dong": "일산동", "lat": 37.6760, "lng": 126.7600, "rent_base": 25000, "premium": 0.9},
    {"city": "하남시", "gu": "", "dong": "미사동", "lat": 37.5600, "lng": 127.1950, "rent_base": 32000, "premium": 1.1},
]

# 진료과목
SPECIALTIES = [
    "내과", "외과", "정형외과", "피부과", "이비인후과", "안과",
    "산부인과", "비뇨의학과", "신경외과", "신경과", "정신건강의학과",
    "재활의학과", "가정의학과", "소아청소년과", "영상의학과"
]

# 인기 진료과목 (가중치)
POPULAR_SPECIALTIES = {
    "내과": 15, "정형외과": 12, "피부과": 10, "이비인후과": 10,
    "안과": 8, "가정의학과": 8, "소아청소년과": 7, "재활의학과": 6,
    "외과": 5, "산부인과": 5, "비뇨의학과": 4, "신경과": 4,
    "신경외과": 3, "정신건강의학과": 2, "영상의학과": 1
}

# 건물 유형
BUILDING_TYPES = ["빌딩", "오피스텔", "근린상가", "복합빌딩", "메디컬빌딩", "의료빌딩"]

# 약국 매물 상태
PHARMACY_STATUSES = ["영업중", "폐업예정", "권리양도", "자리매매"]


def weighted_choice(weights: Dict[str, int]) -> str:
    """가중치 기반 랜덤 선택"""
    items = list(weights.keys())
    w = list(weights.values())
    return random.choices(items, weights=w, k=1)[0]


def generate_address(district: Dict, is_gyeonggi: bool = False) -> str:
    """현실적인 주소 생성"""
    street_num = random.randint(1, 500)
    building_num = random.randint(1, 30)

    if is_gyeonggi:
        return f"경기도 {district['city']} {district['gu']} {district['dong']} {street_num}-{building_num}"
    else:
        return f"서울특별시 {district['gu']} {district['dong']} {street_num}-{building_num}"


def jitter_coords(lat: float, lng: float, radius_km: float = 1.0) -> tuple:
    """좌표에 랜덤 오차 추가"""
    # 1km ≈ 0.009도 (위도), 0.011도 (경도, 한국 기준)
    lat_offset = random.uniform(-radius_km * 0.009, radius_km * 0.009)
    lng_offset = random.uniform(-radius_km * 0.011, radius_km * 0.011)
    return (lat + lat_offset, lng + lng_offset)


# ============================================================
# 병원/의료기관 시드 데이터
# ============================================================

def generate_hospital_data(count: int = 500) -> List[Dict]:
    """병원 시드 데이터 생성"""
    hospitals = []

    # 서울 70%, 경기 30%
    seoul_count = int(count * 0.7)
    gyeonggi_count = count - seoul_count

    for i in range(seoul_count):
        district = random.choice(SEOUL_MEDICAL_DISTRICTS)
        specialty = weighted_choice(POPULAR_SPECIALTIES)
        lat, lng = jitter_coords(district["lat"], district["lng"], 0.5)

        # 개원일 (최근 5년 내)
        days_ago = random.randint(1, 365 * 5)
        established = datetime.now() - timedelta(days=days_ago)

        hospital = {
            "id": str(uuid.uuid4()),
            "ykiho": f"JDQ4MTY{random.randint(10000, 99999)}",
            "name": f"{district['dong']} {specialty}" if random.random() > 0.3 else f"{''.join(random.sample('김이박최정', 1))}{''.join(random.sample('재민준서연', 2))} {specialty}",
            "address": generate_address(district),
            "latitude": lat,
            "longitude": lng,
            "clinic_type": specialty,
            "established": established.strftime("%Y%m%d"),
            "doctor_count": random.randint(1, 5),
            "phone": f"02-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            "is_active": True,
            "area_pyeong": random.randint(15, 100),
        }
        hospitals.append(hospital)

    for i in range(gyeonggi_count):
        district = random.choice(GYEONGGI_MEDICAL_DISTRICTS)
        specialty = weighted_choice(POPULAR_SPECIALTIES)
        lat, lng = jitter_coords(district["lat"], district["lng"], 0.5)

        days_ago = random.randint(1, 365 * 5)
        established = datetime.now() - timedelta(days=days_ago)

        area_code = "031" if district["city"] in ["성남시", "수원시", "용인시"] else "032"

        hospital = {
            "id": str(uuid.uuid4()),
            "ykiho": f"JDQ4MTY{random.randint(10000, 99999)}",
            "name": f"{district['dong']} {specialty}",
            "address": generate_address(district, is_gyeonggi=True),
            "latitude": lat,
            "longitude": lng,
            "clinic_type": specialty,
            "established": established.strftime("%Y%m%d"),
            "doctor_count": random.randint(1, 3),
            "phone": f"{area_code}-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "is_active": True,
            "area_pyeong": random.randint(15, 80),
        }
        hospitals.append(hospital)

    return hospitals


# ============================================================
# 부동산 매물 시드 데이터
# ============================================================

def generate_listing_data(count: int = 200) -> List[Dict]:
    """부동산 매물 시드 데이터 생성"""
    listings = []

    seoul_count = int(count * 0.6)
    gyeonggi_count = count - seoul_count

    for i in range(seoul_count):
        district = random.choice(SEOUL_MEDICAL_DISTRICTS)
        lat, lng = jitter_coords(district["lat"], district["lng"], 0.3)

        area_pyeong = random.randint(20, 150)
        floor = random.randint(1, 15)

        # 임대료 계산 (평당 기준)
        rent_per_pyeong = int(district["rent_base"] * district["premium"] * random.uniform(0.9, 1.1))
        monthly_rent = area_pyeong * rent_per_pyeong
        deposit = monthly_rent * random.randint(10, 20)  # 보증금 = 월세 10~20배

        # 권리금 (있거나 없거나)
        has_premium = random.random() > 0.4
        premium_fee = int(random.randint(3000, 15000) * 10000) if has_premium else 0

        listing = {
            "id": str(uuid.uuid4()),
            "title": f"{district['dong']} {random.choice(BUILDING_TYPES)} {area_pyeong}평 {'권리금 있음' if has_premium else '신규 입점'}",
            "address": generate_address(district),
            "latitude": lat,
            "longitude": lng,
            "area_pyeong": area_pyeong,
            "floor": floor,
            "total_floors": floor + random.randint(0, 10),
            "deposit": deposit,
            "monthly_rent": monthly_rent,
            "premium_fee": premium_fee,
            "management_fee": int(area_pyeong * random.randint(5000, 15000)),
            "building_type": random.choice(BUILDING_TYPES),
            "suitable_for": random.sample(SPECIALTIES, k=random.randint(2, 5)),
            "features": random.sample([
                "엘리베이터", "주차가능", "대로변", "역세권", "신축",
                "전용화장실", "에어컨", "난방", "인테리어포함", "권리금조정가능"
            ], k=random.randint(3, 6)),
            "status": "AVAILABLE",
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 60))).isoformat(),
            "expires_at": (datetime.now() + timedelta(days=random.randint(30, 90))).isoformat(),
            "view_count": random.randint(50, 500),
            "inquiry_count": random.randint(5, 30),
        }
        listings.append(listing)

    for i in range(gyeonggi_count):
        district = random.choice(GYEONGGI_MEDICAL_DISTRICTS)
        lat, lng = jitter_coords(district["lat"], district["lng"], 0.3)

        area_pyeong = random.randint(20, 120)
        floor = random.randint(1, 10)

        rent_per_pyeong = int(district["rent_base"] * district["premium"] * random.uniform(0.85, 1.05))
        monthly_rent = area_pyeong * rent_per_pyeong
        deposit = monthly_rent * random.randint(10, 15)

        has_premium = random.random() > 0.5
        premium_fee = int(random.randint(2000, 10000) * 10000) if has_premium else 0

        listing = {
            "id": str(uuid.uuid4()),
            "title": f"{district['dong']} {random.choice(BUILDING_TYPES)} {area_pyeong}평",
            "address": generate_address(district, is_gyeonggi=True),
            "latitude": lat,
            "longitude": lng,
            "area_pyeong": area_pyeong,
            "floor": floor,
            "total_floors": floor + random.randint(0, 5),
            "deposit": deposit,
            "monthly_rent": monthly_rent,
            "premium_fee": premium_fee,
            "management_fee": int(area_pyeong * random.randint(4000, 10000)),
            "building_type": random.choice(BUILDING_TYPES),
            "suitable_for": random.sample(SPECIALTIES, k=random.randint(2, 4)),
            "features": random.sample([
                "주차가능", "역세권", "대형마트인근", "아파트단지인접",
                "전용화장실", "에어컨", "난방"
            ], k=random.randint(2, 5)),
            "status": "AVAILABLE",
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 60))).isoformat(),
            "expires_at": (datetime.now() + timedelta(days=random.randint(30, 90))).isoformat(),
            "view_count": random.randint(30, 300),
            "inquiry_count": random.randint(3, 20),
        }
        listings.append(listing)

    return listings


# ============================================================
# 약국 매물 시드 데이터 (PharmMatch)
# ============================================================

def generate_pharmacy_listing_data(count: int = 100) -> List[Dict]:
    """약국 매물 시드 데이터 생성"""
    listings = []

    all_districts = SEOUL_MEDICAL_DISTRICTS + GYEONGGI_MEDICAL_DISTRICTS

    for i in range(count):
        district = random.choice(all_districts)
        is_gyeonggi = "city" in district
        lat, lng = jitter_coords(district["lat"], district["lng"], 0.5)

        # 약국 매출 범위 (월)
        revenue_min = random.randint(3000, 8000) * 10000
        revenue_max = revenue_min + random.randint(1000, 3000) * 10000

        # 권리금
        premium = random.randint(5000, 30000) * 10000

        # 약국 상태
        status = random.choices(
            PHARMACY_STATUSES,
            weights=[40, 20, 30, 10],
            k=1
        )[0]

        # 인근 병원 수
        nearby_hospitals = random.randint(3, 15)

        # 처방전 비율
        prescription_ratio = random.randint(50, 90)

        listing = {
            "id": str(uuid.uuid4()),
            "title": f"{district.get('dong', district.get('city', ''))} 약국 {'양도' if status in ['권리양도', '폐업예정'] else '매물'}",
            "address": generate_address(district, is_gyeonggi),
            "latitude": lat,
            "longitude": lng,
            "area_pyeong": random.randint(15, 50),
            "monthly_revenue_min": revenue_min,
            "monthly_revenue_max": revenue_max,
            "premium_fee": premium,
            "monthly_rent": random.randint(150, 500) * 10000,
            "deposit": random.randint(3000, 10000) * 10000,
            "status": status,
            "nearby_hospitals": nearby_hospitals,
            "prescription_ratio": prescription_ratio,
            "operating_years": random.randint(1, 20),
            "has_parking": random.random() > 0.4,
            "near_subway": random.random() > 0.5,
            "features": random.sample([
                "대형병원인근", "아파트단지", "역세권", "주차가능",
                "1층", "대로변", "단골고객많음", "처방전비율높음"
            ], k=random.randint(2, 5)),
            "disclosure_level": random.choice(["MINIMAL", "PARTIAL", "FULL"]),
            "interest_count": random.randint(5, 50),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
        }
        listings.append(listing)

    return listings


# ============================================================
# 커뮤니티/FAQ 시드 데이터
# ============================================================

def generate_community_data() -> List[Dict]:
    """커뮤니티 초기 게시글 생성 (FAQ 및 가이드)"""
    posts = [
        # FAQ - 개원 준비
        {
            "category": "FAQ",
            "title": "개원 준비 절차는 어떻게 되나요?",
            "content": """개원 준비는 크게 다음 단계로 진행됩니다:

1. **입지 선정** (3~6개월)
   - 상권 분석 및 경쟁 현황 조사
   - 메디플라톤의 OpenSim으로 예상 매출 시뮬레이션

2. **임대차 계약** (1~2개월)
   - 적합한 매물 탐색
   - 의료시설 허가 가능 여부 확인

3. **인테리어** (2~3개월)
   - 의료법 규정에 맞는 설계
   - 파트너 업체 선정

4. **인허가** (1~2개월)
   - 의료기관 개설 신고
   - 사업자 등록

5. **장비/인력** (동시 진행)
   - 의료기기 구매/임대
   - 직원 채용

총 6~12개월 정도 소요됩니다.""",
            "author": "메디플라톤 운영팀",
            "view_count": random.randint(500, 2000),
            "like_count": random.randint(50, 200),
            "is_pinned": True,
        },
        {
            "category": "FAQ",
            "title": "개원 비용은 얼마나 드나요?",
            "content": """진료과목과 규모에 따라 다르지만, 일반적인 비용은 다음과 같습니다:

**내과/가정의학과 (30평 기준)**
- 보증금/권리금: 1~3억원
- 인테리어: 5,000만~1억원
- 의료장비: 3,000만~8,000만원
- 초기 운영자금: 5,000만원~1억원
- **총 예상: 2~5억원**

**피부과/성형외과 (50평 기준)**
- 보증금/권리금: 2~5억원
- 인테리어: 1~2억원
- 의료장비: 1~3억원
- 초기 운영자금: 1억원
- **총 예상: 5~10억원**

**정형외과 (60평 기준)**
- 보증금/권리금: 2~4억원
- 인테리어: 1~1.5억원
- 의료장비 (C-arm 등): 2~5억원
- 초기 운영자금: 1억원
- **총 예상: 6~12억원**

메디플라톤에서 파트너 견적 비교로 비용을 절감하세요.""",
            "author": "메디플라톤 운영팀",
            "view_count": random.randint(800, 3000),
            "like_count": random.randint(100, 300),
            "is_pinned": True,
        },
        {
            "category": "FAQ",
            "title": "약국 권리금은 어떻게 책정되나요?",
            "content": """약국 권리금은 주로 다음 요소로 결정됩니다:

**1. 매출 기반**
- 월 매출의 3~6개월분이 일반적
- 처방전 비율이 높을수록 프리미엄

**2. 입지 요소**
- 대형병원 인근: +50~100%
- 역세권: +20~30%
- 아파트 단지: +10~20%

**3. 시설 상태**
- 최근 리모델링: +10~20%
- 조제실 자동화: +10~15%

**권리금 예시**
- 월매출 5,000만원, 처방전 70%: 1.5~2억원
- 월매출 8,000만원, 대형병원 인근: 3~4억원

PharmMatch에서 익명으로 시세를 비교해보세요.""",
            "author": "메디플라톤 운영팀",
            "view_count": random.randint(400, 1500),
            "like_count": random.randint(30, 150),
            "is_pinned": True,
        },
        # 가이드
        {
            "category": "GUIDE",
            "title": "[가이드] OpenSim 시뮬레이션 결과 해석하기",
            "content": """OpenSim 시뮬레이션 결과를 100% 활용하는 방법입니다.

**1. 예상 매출 해석**
- 보수적/일반/낙관적 3가지 시나리오 제공
- **보수적 기준으로 손익분기점 계산** 권장

**2. 경쟁 현황 분석**
- 반경 500m/1km/2km 동일 진료과 수
- 개원 5년 미만 병원 = 공격적 경쟁자

**3. 상권 점수**
- 유동인구, 거주인구, 직장인구 종합
- 70점 이상이면 양호한 상권

**4. 추천 전략**
- AI가 제안하는 차별화 포인트
- 타겟 환자군 분석

시뮬레이션은 참고용이며, 실제 개원 전 현장 조사를 반드시 병행하세요.""",
            "author": "메디플라톤 운영팀",
            "view_count": random.randint(300, 1000),
            "like_count": random.randint(20, 100),
            "is_pinned": False,
        },
        {
            "category": "GUIDE",
            "title": "[가이드] 영업사원을 위한 SalesScanner 활용법",
            "content": """SalesScanner로 영업 효율을 극대화하는 방법입니다.

**1. 개원지 알림 설정**
- 담당 지역 + 타겟 진료과 설정
- 신축 건물, 폐업 병원 실시간 알림

**2. 리드 우선순위 판단**
- 개원 예정 시기가 빠른 순
- 예산 규모가 큰 순
- 응답률이 높은 진료과 순

**3. 매칭 요청 전략**
- 첫 메시지에 구체적인 제안 포함
- 해당 지역/진료과 레퍼런스 언급
- 48시간 내 응답이 없으면 자동 환불

**4. 컨택 후 관리**
- 성사/실패 결과 기록
- 성공 케이스는 포트폴리오로 활용

PREMIUM 플랜의 무제한 리드로 영업 범위를 확장하세요.""",
            "author": "메디플라톤 운영팀",
            "view_count": random.randint(200, 800),
            "like_count": random.randint(15, 80),
            "is_pinned": False,
        },
        # 사용자 후기 (가상)
        {
            "category": "REVIEW",
            "title": "OpenSim으로 개원 위치 결정했습니다",
            "content": """강남 vs 분당 중 고민하다가 OpenSim 돌려봤는데,
예상외로 분당 쪽이 경쟁이 덜하고 예상 매출도 비슷하더라고요.

실제로 분당에 개원했는데 시뮬레이션이랑 거의 비슷하게 나오고 있습니다.
보증금도 강남보다 훨씬 저렴해서 초기 부담이 적었어요.

개원 고민 중이시면 일단 시뮬레이션 한번 돌려보세요.""",
            "author": "정형외과 K원장",
            "view_count": random.randint(150, 500),
            "like_count": random.randint(20, 80),
            "is_pinned": False,
        },
        {
            "category": "REVIEW",
            "title": "PharmMatch로 약국 자리 찾았어요",
            "content": """기존에 부동산 통해서 약국 자리 알아보다가
가격도 제각각이고 정보도 불투명해서 힘들었는데,

PharmMatch에서 익명으로 여러 매물 비교하니까
시세 파악이 확실히 되더라고요.

권리금 협상할 때도 다른 매물 가격 참고해서
2천만원 정도 깎을 수 있었습니다.""",
            "author": "약사 P",
            "view_count": random.randint(100, 400),
            "like_count": random.randint(15, 60),
            "is_pinned": False,
        },
    ]

    # 날짜 추가
    for i, post in enumerate(posts):
        days_ago = random.randint(1, 90)
        post["created_at"] = (datetime.now() - timedelta(days=days_ago)).isoformat()
        post["id"] = str(uuid.uuid4())
        post["comment_count"] = random.randint(0, 20)

    return posts


# ============================================================
# DB 저장 함수
# ============================================================

async def save_hospitals_to_db(hospitals: List[Dict]):
    """병원 데이터 DB 저장"""
    from app.core.database import async_session
    from app.models.hospital import Hospital

    async with async_session() as db:
        for h in hospitals:
            hospital = Hospital(
                ykiho=h["ykiho"],
                name=h["name"],
                address=h["address"],
                latitude=h["latitude"],
                longitude=h["longitude"],
                clinic_type=h["clinic_type"],
                established=h["established"],
                doctor_count=h["doctor_count"],
                phone=h["phone"],
                is_active=h["is_active"],
                area_pyeong=h["area_pyeong"],
            )
            db.add(hospital)

        await db.commit()
        logger.info(f"Saved {len(hospitals)} hospitals to database")


async def save_listings_to_db(listings: List[Dict]):
    """부동산 매물 DB 저장"""
    from app.core.database import async_session
    from app.models.listing import RealEstateListing

    async with async_session() as db:
        for l in listings:
            listing = RealEstateListing(
                title=l["title"],
                address=l["address"],
                latitude=l["latitude"],
                longitude=l["longitude"],
                area_pyeong=l["area_pyeong"],
                floor=l["floor"],
                total_floors=l["total_floors"],
                deposit=l["deposit"],
                monthly_rent=l["monthly_rent"],
                premium_fee=l["premium_fee"],
                management_fee=l["management_fee"],
                building_type=l["building_type"],
                suitable_for=l["suitable_for"],
                features=l["features"],
                status=l["status"],
                view_count=l["view_count"],
                inquiry_count=l["inquiry_count"],
            )
            db.add(listing)

        await db.commit()
        logger.info(f"Saved {len(listings)} listings to database")


async def save_pharmacy_listings_to_db(listings: List[Dict]):
    """약국 매물 DB 저장"""
    from app.core.database import async_session
    from app.models.pharmacy_match import PharmacyListing

    async with async_session() as db:
        for l in listings:
            listing = PharmacyListing(
                title=l["title"],
                address=l["address"],
                latitude=l["latitude"],
                longitude=l["longitude"],
                area_pyeong=l["area_pyeong"],
                monthly_revenue_min=l["monthly_revenue_min"],
                monthly_revenue_max=l["monthly_revenue_max"],
                premium_fee=l["premium_fee"],
                monthly_rent=l["monthly_rent"],
                deposit=l["deposit"],
                nearby_hospitals=l["nearby_hospitals"],
                prescription_ratio=l["prescription_ratio"],
                operating_years=l["operating_years"],
                features=l["features"],
                disclosure_level=l["disclosure_level"],
                interest_count=l["interest_count"],
            )
            db.add(listing)

        await db.commit()
        logger.info(f"Saved {len(listings)} pharmacy listings to database")


async def save_community_posts_to_db(posts: List[Dict]):
    """커뮤니티 게시글 DB 저장"""
    from app.core.database import async_session
    # 커뮤니티 모델이 있다면 저장
    # 없으면 JSON 파일로 저장
    import json

    with open("seed_community_posts.json", "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    logger.info(f"Saved {len(posts)} community posts to seed_community_posts.json")


# ============================================================
# 메인 실행
# ============================================================

async def run_seed(args):
    """시드 데이터 생성 실행"""

    if args.all or args.hospitals:
        logger.info("Generating hospital seed data...")
        hospitals = generate_hospital_data(500)
        logger.info(f"Generated {len(hospitals)} hospitals")

        if args.save:
            await save_hospitals_to_db(hospitals)
        else:
            import json
            with open("seed_hospitals.json", "w", encoding="utf-8") as f:
                json.dump(hospitals, f, ensure_ascii=False, indent=2)
            logger.info("Saved to seed_hospitals.json")

    if args.all or args.listings:
        logger.info("Generating real estate listing seed data...")
        listings = generate_listing_data(200)
        logger.info(f"Generated {len(listings)} listings")

        if args.save:
            await save_listings_to_db(listings)
        else:
            import json
            with open("seed_listings.json", "w", encoding="utf-8") as f:
                json.dump(listings, f, ensure_ascii=False, indent=2)
            logger.info("Saved to seed_listings.json")

    if args.all or args.pharmacy:
        logger.info("Generating pharmacy listing seed data...")
        pharmacy_listings = generate_pharmacy_listing_data(100)
        logger.info(f"Generated {len(pharmacy_listings)} pharmacy listings")

        if args.save:
            await save_pharmacy_listings_to_db(pharmacy_listings)
        else:
            import json
            with open("seed_pharmacy_listings.json", "w", encoding="utf-8") as f:
                json.dump(pharmacy_listings, f, ensure_ascii=False, indent=2)
            logger.info("Saved to seed_pharmacy_listings.json")

    if args.all or args.community:
        logger.info("Generating community seed data...")
        posts = generate_community_data()
        logger.info(f"Generated {len(posts)} community posts")

        await save_community_posts_to_db(posts)

    logger.info("=== Seed data generation completed ===")


def main():
    parser = argparse.ArgumentParser(description="Generate seed data for cold start")
    parser.add_argument("--all", action="store_true", help="Generate all seed data")
    parser.add_argument("--hospitals", action="store_true", help="Generate hospital data")
    parser.add_argument("--listings", action="store_true", help="Generate real estate listings")
    parser.add_argument("--pharmacy", action="store_true", help="Generate pharmacy listings")
    parser.add_argument("--community", action="store_true", help="Generate community posts")
    parser.add_argument("--save", action="store_true", help="Save directly to database")

    args = parser.parse_args()

    if not any([args.all, args.hospitals, args.listings, args.pharmacy, args.community]):
        parser.print_help()
        return

    asyncio.run(run_seed(args))


if __name__ == "__main__":
    main()
