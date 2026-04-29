"""EMR 자주 쓰는 진단·수가·약품 코드 시드 - 026"""
import asyncio
import asyncpg
import os
import json


# ────────────────────────────────────────────
# 1. 진단 코드 (KCD-8) — 외래에서 가장 흔한 60개
# ────────────────────────────────────────────
DISEASE_CODES = [
    # 호흡기
    ("J00", "급성 비인두염 (감기)", "호흡기", False),
    ("J01.9", "급성 부비동염, 상세불명", "호흡기", False),
    ("J02.9", "급성 인두염, 상세불명", "호흡기", False),
    ("J03.9", "급성 편도염", "호흡기", False),
    ("J04.0", "급성 후두염", "호흡기", False),
    ("J06.9", "상기도 감염, 상세불명", "호흡기", False),
    ("J20.9", "급성 기관지염, 상세불명", "호흡기", False),
    ("J30.4", "알레르기성 비염", "호흡기", True),
    ("J32.9", "만성 부비동염", "호흡기", True),
    ("J45.9", "천식, 상세불명", "호흡기", True),
    ("J11.1", "독감 (인플루엔자)", "호흡기", False),
    # 소화기
    ("K29.7", "위염, 상세불명", "소화기", False),
    ("K21.9", "위식도역류병", "소화기", True),
    ("K30", "기능성 소화불량", "소화기", False),
    ("A09", "감염성 위장관염 (장염)", "소화기", False),
    ("K58.9", "과민성 대장 증후군", "소화기", True),
    ("K59.0", "변비", "소화기", False),
    ("K52.9", "비감염성 위장관염", "소화기", False),
    ("K92.2", "위장관 출혈, 상세불명", "소화기", False),
    # 심혈관
    ("I10", "본태성 고혈압", "순환기", True),
    ("I25.10", "관상동맥경화증", "순환기", True),
    ("I49.9", "심부정맥, 상세불명", "순환기", False),
    ("I63.9", "뇌경색, 상세불명", "순환기", False),
    ("I82.4", "하지 심부정맥 혈전증", "순환기", False),
    # 내분비/대사
    ("E11.9", "제2형 당뇨병, 합병증 없음", "내분비", True),
    ("E10.9", "제1형 당뇨병", "내분비", True),
    ("E78.0", "순수 고콜레스테롤혈증", "내분비", True),
    ("E78.5", "고지혈증, 상세불명", "내분비", True),
    ("E03.9", "갑상선저하증", "내분비", True),
    ("E04.9", "갑상선결절", "내분비", False),
    ("E66.9", "비만, 상세불명", "내분비", False),
    # 근골격
    ("M54.5", "요통", "근골격", False),
    ("M54.2", "경부통", "근골격", False),
    ("M75.0", "어깨 유착성 관절낭염 (오십견)", "근골격", False),
    ("M77.9", "장각통, 상세불명", "근골격", False),
    ("M25.5", "관절통", "근골격", False),
    ("M79.7", "섬유근육통", "근골격", True),
    ("S93.4", "발목 염좌", "근골격", False),
    ("M51.9", "추간판 변성", "근골격", True),
    # 비뇨/생식
    ("N39.0", "요로감염", "비뇨", False),
    ("N18.9", "만성 신질환", "비뇨", True),
    # 피부
    ("L20.9", "아토피피부염", "피부", True),
    ("L30.9", "피부염, 상세불명", "피부", False),
    ("L70.0", "심상 여드름", "피부", False),
    ("L50.9", "두드러기", "피부", False),
    ("B35.4", "체부백선 (몸 무좀)", "피부", False),
    # 안과/이비인후
    ("H10.9", "결막염, 상세불명", "안과", False),
    ("H66.9", "중이염, 상세불명", "이비인후", False),
    ("H81.10", "양성 발작성 두위현훈", "이비인후", False),
    # 정신
    ("F32.9", "우울증, 상세불명", "정신", True),
    ("F41.1", "범불안장애", "정신", True),
    ("F33.9", "재발성 우울장애", "정신", True),
    ("G47.0", "수면장애, 불면증", "정신", False),
    # 두통/신경
    ("G43.9", "편두통, 상세불명", "신경", True),
    ("G44.2", "긴장성 두통", "신경", False),
    ("R51", "두통", "신경", False),
    # 일반/예방
    ("Z00.0", "일반 의학적 검사", "기타", False),
    ("R50.9", "발열, 상세불명", "기타", False),
    ("R10.4", "복통, 상세불명", "기타", False),
    ("R11", "오심 및 구토", "기타", False),
    ("Z23", "예방접종", "기타", False),
]

# ────────────────────────────────────────────
# 2. 수가 코드 — 의원급 외래에서 가장 흔한 25개
# ────────────────────────────────────────────
FEE_CODES = [
    # 진찰료 (HIRA 2024 의원)
    ("AA100", "초진 진찰료 (의원)", "진찰", 17_700),
    ("AA200", "재진 진찰료 (의원)", "진찰", 11_540),
    ("AA300", "야간/공휴 가산", "진찰", 5_310),
    # 검사
    ("B0010", "혈액일반검사 (CBC)", "검사", 4_360),
    ("B2050", "공복혈당", "검사", 1_240),
    ("B2070", "당화혈색소 (HbA1c)", "검사", 6_410),
    ("B2530", "콜레스테롤 (총)", "검사", 1_140),
    ("B2540", "HDL 콜레스테롤", "검사", 1_320),
    ("B2550", "LDL 콜레스테롤", "검사", 2_140),
    ("B2560", "중성지방", "검사", 1_280),
    ("B5470", "갑상선자극호르몬 (TSH)", "검사", 6_200),
    ("B0890", "C-반응성단백 (CRP)", "검사", 3_650),
    ("E5430", "심전도 표준 12유도", "검사", 7_150),
    ("EZ961", "흉부 X-선 일반촬영", "검사", 8_980),
    # 시술/처치
    ("M0050", "기본 처치 (창상 봉합)", "시술", 11_120),
    ("M2010", "도수치료 (1부위)", "시술", 30_000),
    ("MX070", "체외충격파 치료 (ESWT)", "시술", 80_000),
    ("KK060", "관절 강내 주사", "시술", 18_500),
    # 주사
    ("KK051", "근육주사", "주사", 2_140),
    ("KK052", "정맥주사", "주사", 2_140),
    ("KK053", "혈관주사 (수액)", "주사", 6_750),
    # 처치
    ("M0050", "단순 처치", "처치", 1_440),
    ("M0090", "비강 흡입", "처치", 2_180),
    ("M0610", "분무 요법 (네뷸라이저)", "처치", 3_420),
    ("MX020", "초음파 진단 (단순)", "검사", 14_300),
]

# ────────────────────────────────────────────
# 3. 약품 — 외래 처방 빈도 상위 80개
# ────────────────────────────────────────────
DRUGS = [
    # NSAIDs / 진통
    ("670105100", "타이레놀 500mg", "아세트아미노펜", 80, False, False),
    ("641900020", "이지엔6 200mg", "이부프로펜", 65, False, False),
    ("644602450", "낙센F 250mg", "나프록센", 95, False, False),
    ("647003920", "케토톱 25mg", "케토프로펜", 110, False, False),
    ("640000950", "디크놀 50mg", "디클로페낙", 70, False, False),
    ("671503350", "쎄레브렉스 200mg", "셀레콕시브", 320, False, False),
    ("641600070", "트리돌 50mg", "트라마돌", 230, False, False),
    # 항생제
    ("671600110", "오구멘틴 625mg", "아목시실린/클라불란산", 1_280, False, True),
    ("641901240", "키프록사신 250mg", "시프로플록사신", 480, False, True),
    ("672304120", "독시사이클린 100mg", "독시사이클린", 95, False, True),
    ("644602080", "메트로니다졸 250mg", "메트로니다졸", 105, False, True),
    ("640900150", "세파클러 250mg", "세파클러", 280, False, True),
    ("670500270", "지스로맥스 500mg", "아지스로마이신", 1_180, False, True),
    ("671100340", "박트림 정", "설파메톡사졸/트리메토프림", 145, False, True),
    # 위장
    ("671600720", "넥시움 20mg", "에소메프라졸", 580, False, False),
    ("647102610", "란스톤 30mg", "란소프라졸", 360, False, False),
    ("641800520", "오메드 20mg", "오메프라졸", 240, False, False),
    ("670500980", "파리에트 20mg", "라베프라졸", 460, False, False),
    ("640100440", "잔탁 150mg", "라니티딘", 110, False, False),
    ("644401700", "큐란 정", "라니티딘", 95, False, False),
    ("647601480", "베스타제 정", "복합소화제", 80, False, False),
    ("647002830", "훼스탈플러스", "복합소화제", 85, False, False),
    ("643301210", "포리부틴", "트리메부틴", 145, False, False),
    ("670701890", "둘코락스 5mg", "비사코딜", 65, False, False),
    # 항히스타민
    ("647500240", "지르텍 10mg", "세티리진", 220, False, False),
    ("670701030", "클라리틴 10mg", "로라타딘", 280, False, False),
    ("641200280", "알레그라 120mg", "펙소페나딘", 650, False, False),
    ("670401480", "씨잘 5mg", "레보세티리진", 180, False, False),
    ("643502490", "페니라민", "클로르페니라민", 35, False, False),
    # 호흡기
    ("670500770", "벤토린 인헬러", "살부타몰", 4_280, False, False),
    ("644000310", "풀미코트 200mcg", "부데소나이드", 12_500, False, False),
    ("671300060", "싱귤레어 10mg", "몬테루카스트", 1_080, False, False),
    ("647003480", "암브로콜 30mg", "암브록솔", 75, False, False),
    ("647500300", "뮤코펙트", "암브록솔", 95, False, False),
    ("644301200", "후스코드정", "덱스트로메토르판", 115, False, False),
    ("641000370", "아네롤정", "벤조나테이트", 85, False, False),
    # 고혈압
    ("670600320", "노바스크 5mg", "암로디핀", 380, False, False),
    ("647101010", "코자 50mg", "로사르탄", 540, False, False),
    ("671700440", "디오반 80mg", "발사르탄", 620, False, False),
    ("670901130", "트리테이스 5mg", "라미프릴", 350, False, False),
    ("647101050", "아타칸 8mg", "칸데사르탄", 580, False, False),
    ("644502000", "셀렉톨 200mg", "셀리프롤롤", 240, False, False),
    ("647700040", "콘서타 36mg", "메틸페니데이트", 2_180, False, False),
    ("670700760", "테노민 50mg", "아테놀롤", 145, False, False),
    ("670900840", "라식스 40mg", "푸로세미드", 95, False, False),
    # 당뇨
    ("670400440", "다이아벡스 500mg", "메트포르민", 95, False, False),
    ("644001390", "아마릴 2mg", "글리메피리드", 220, False, False),
    ("671201020", "자누비아 100mg", "시타글립틴", 1_280, False, False),
    ("672100130", "포시가 10mg", "다파글리플로진", 1_580, False, False),
    ("670700220", "트라젠타 5mg", "리나글립틴", 1_320, False, False),
    # 콜레스테롤
    ("670901170", "리피토 20mg", "아토르바스타틴", 580, False, False),
    ("671600440", "크레스토 10mg", "로수바스타틴", 720, False, False),
    ("644101230", "심바스트 20mg", "심바스타틴", 240, False, False),
    ("647102150", "트라이코 160mg", "페노피브레이트", 380, False, False),
    # 정신/수면
    ("641800250", "프로작 20mg", "플루옥세틴", 285, False, False),
    ("671600510", "렉사프로 10mg", "에스시탈로프람", 580, False, False),
    ("647000760", "졸로프트 50mg", "세트랄린", 480, False, False),
    ("644700340", "자낙스 0.25mg", "알프라졸람", 150, False, False),
    ("644701270", "아티반 1mg", "로라제팜", 120, False, False),
    ("670601370", "스틸녹스 10mg", "졸피뎀", 380, False, False),
    # 항바이러스/감기약 복합
    ("647102330", "타미플루 75mg", "오셀타미비르", 2_350, False, False),
    ("670500110", "조비락스 200mg", "아시클로비르", 1_280, False, False),
    # 외용/안약
    ("647600200", "히알루로닉액 점안", "히알루론산", 4_280, False, False),
    ("670400670", "리포라식 점안액", "사이클로스포린", 18_500, False, False),
    ("641100910", "베타메드 외용연고", "베타메타손", 1_280, False, False),
    ("647003780", "후시딘 외용연고", "푸시딘산", 1_180, False, False),
    # 당뇨 인슐린
    ("671700580", "란투스 솔로스타", "글라진 인슐린", 28_500, False, False),
    # 기타 자주 쓰는 약
    ("641700530", "유트로핀 정", "레보티록신", 145, False, False),
    ("670800120", "포사맥스 70mg", "알렌드로네이트", 580, False, False),
    ("671100110", "콜킨정 0.6mg", "콜히친", 230, False, False),
    ("670500290", "비아그라 50mg", "실데나필", 8_500, False, False),
    ("671200320", "시알리스 5mg", "타다라필", 4_280, False, False),
    ("644401090", "프로페시아 1mg", "피나스테리드", 1_580, False, False),
    ("670701020", "오메가3 1000mg", "오메가3 지방산", 380, False, False),
    ("647500960", "삐콤씨 정", "비타민B 복합", 85, False, False),
    ("641901130", "센트룸 정", "종합비타민", 280, False, False),
    ("670500440", "마그네슘 정", "산화마그네슘", 95, False, False),
]


def _disease_sql_value(code, name, chapter, is_chronic):
    name_esc = name.replace("'", "''")
    return (
        f"('{code}', '{name_esc}', '{chapter}', "
        f"{'TRUE' if is_chronic else 'FALSE'}, FALSE, "  # is_rare
        f"'{{}}', '{{}}', "  # common_procedures, common_medications
        f"TRUE, NOW(), NOW())"
    )


def _fee_sql_value(code, name, category, price):
    name_esc = name.replace("'", "''")
    return (
        f"('{code}', '{name_esc}', '{category}', {price}, "
        f"'COVERED', '{{}}', '{{}}', TRUE, NOW(), NOW())"
    )


def _drug_sql_value(code, name, ingredient, price, is_narcotic, is_antibiotic):
    name_esc = name.replace("'", "''")
    ing_esc = (ingredient or "").replace("'", "''")
    return (
        f"('{code}', '{name_esc}', '{ing_esc}', {price}, "
        f"'COVERED', '{{}}', "
        f"{'TRUE' if is_narcotic else 'FALSE'}, "
        f"{'TRUE' if is_antibiotic else 'FALSE'}, "
        f"FALSE, TRUE, NOW(), NOW())"
    )


def build_sql():
    parts = []

    # disease
    if DISEASE_CODES:
        values = ",\n".join(_disease_sql_value(*d) for d in DISEASE_CODES)
        parts.append(
            "INSERT INTO hira_disease_codes "
            "(code, name_kr, chapter, is_chronic, is_rare, "
            "common_procedures, common_medications, "
            "is_active, created_at, updated_at) "
            f"VALUES {values} "
            "ON CONFLICT (code) DO NOTHING;"
        )

    # fee
    if FEE_CODES:
        values = ",\n".join(_fee_sql_value(*c) for c in FEE_CODES)
        parts.append(
            "INSERT INTO hira_fee_codes "
            "(code, name, category, unit_price, insurance_type, "
            "specialty_codes, related_codes, is_active, created_at, updated_at) "
            f"VALUES {values} "
            "ON CONFLICT (code) DO NOTHING;"
        )

    # drug
    if DRUGS:
        values = ",\n".join(_drug_sql_value(*d) for d in DRUGS)
        parts.append(
            "INSERT INTO hira_drug_codes "
            "(code, product_name, ingredient_name, insurance_price, insurance_type, "
            "dur_ingredients, is_narcotic, is_antibiotic, requires_monitoring, "
            "is_active, created_at, updated_at) "
            f"VALUES {values} "
            "ON CONFLICT (code) DO NOTHING;"
        )

    return "\n".join(parts)


async def run():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    dsn = db_url.replace("postgresql+asyncpg://", "postgresql://")

    sql = build_sql()
    conn = await asyncpg.connect(dsn)
    try:
        async with conn.transaction():
            await conn.execute(sql)
        print(f"OK: 026_emr_seed_codes — {len(DISEASE_CODES)} 진단 + {len(FEE_CODES)} 수가 + {len(DRUGS)} 약품 시드 완료")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
