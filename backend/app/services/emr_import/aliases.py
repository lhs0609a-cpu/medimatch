"""
헤더 별칭 사전 — 한국 EMR/CRM/엑셀에서 실제로 쓰이는 표기 전부.

같은 의미의 컬럼이 EMR마다 다르게 적혀 있어도 동일 canonical 필드로 매핑.
모두 소문자·공백·특수문자 제거 후 비교한다 (normalize_header 참고).

신규 별칭 추가는 자유롭게 — 의사랑/닥터팔레트/비트/두번째뇌/굿닥/위즈메디 등
실 사용자가 올리는 헤더가 보이면 여기에 누적.
"""

# canonical field → 별칭 리스트 (소문자·공백제거 비교)
HEADER_ALIASES: dict[str, list[str]] = {
    "external_id": [
        "차트번호", "차트no", "차트번호no", "환자번호", "환자코드",
        "환자id", "고객id", "고객번호", "고객코드", "회원번호", "회원id",
        "chartno", "chartnumber", "patientid", "patientno", "patientcode",
        "customerid", "customerno", "memberid", "id", "번호",
    ],
    "name": [
        "이름", "성명", "환자명", "환자이름", "고객명", "고객이름",
        "수진자명", "수진자", "name", "patientname", "fullname", "customername",
    ],
    "phone": [
        "전화번호", "전화", "휴대폰", "휴대전화", "핸드폰", "연락처",
        "휴대폰번호", "핸드폰번호", "모바일", "hp", "tel", "phone",
        "mobile", "cellphone", "contact", "mobileno", "telno",
    ],
    "gender": [
        "성별", "남녀", "sex", "gender",
    ],
    "birth_date": [
        "생년월일", "생일", "생년", "출생일", "출생년월일", "주민생년월일",
        "birth", "birthday", "birthdate", "dob", "dateofbirth",
    ],
    "region": [
        "지역", "주소", "거주지", "거주지역", "주소지", "동",
        "region", "address", "city", "district",
    ],
    "inflow_date": [
        "유입일", "내원일", "초진일", "첫방문일", "등록일", "접수일",
        "방문일", "방문일자", "최초방문일",
        "registerdate", "registereddate", "firstvisit", "firstvisitdate",
        "inflowdate", "visitdate", "registdate",
    ],
    "inflow_path": [
        "유입경로", "내원경로", "유입", "유입채널", "방문경로", "유입매체",
        "유입소스", "광고매체", "marketingsource",
        "channel", "source", "inflow", "inflowsource", "leadsource", "referral",
    ],
    "search_keywords": [
        "검색키워드", "키워드", "검색어", "검색문구",
        "keyword", "keywords", "searchterm", "searchkeyword", "query",
    ],
    "symptoms": [
        "증상", "주증상", "주호소", "호소증상", "내원사유", "방문사유",
        "symptom", "symptoms", "chiefcomplaint", "complaint", "cc",
    ],
    "diagnosis_name": [
        "진단명", "진단", "병명", "질병명", "상병명", "주진단",
        "diagnosis", "diagnosisname", "disease", "diseasename", "dx",
    ],
    "consultation_summary": [
        "상담내용", "상담요약", "상담메모", "상담", "메모", "비고", "특이사항",
        "consultation", "consultationsummary", "memo", "note", "notes", "remark",
    ],
    "appointment_date": [
        "예약일", "예약일시", "예약시간", "예약날짜", "다음예약", "next예약",
        "appointmentdate", "appointmenttime", "appointment", "scheduleddate",
        "nextvisit", "nextappointment",
    ],
    "appointment_path": [
        "예약경로", "예약채널", "예약방법",
        "appointmentchannel", "appointmentsource", "bookingsource",
    ],
    "inbound_status": [
        "내원상태", "방문상태", "예약상태", "상태", "진행상태",
        "status", "visitstatus", "appointmentstatus", "state",
    ],
    "cancellation_reason": [
        "취소사유", "취소이유", "노쇼사유",
        "cancellationreason", "cancelreason", "noshowreason",
    ],
    "manager_name": [
        "담당자", "담당실장", "담당", "실장", "상담사", "담당상담사",
        "담당의", "주치의", "manager", "counselor", "incharge",
        "담당직원", "responsibleperson",
    ],
    "consent_examination": [
        "검사동의", "검진동의", "examconsent", "examinationconsent",
    ],
    "consent_treatment": [
        "치료동의", "시술동의", "수술동의",
        "treatmentconsent", "consenttotreatment", "txconsent",
    ],
    "consent_alimtalk": [
        "알림톡동의", "마케팅동의", "광고수신동의", "sms동의", "문자동의",
        "수신동의", "마케팅수신동의", "전송동의",
        "marketingconsent", "smsconsent", "alimtalkconsent",
    ],
    "db_quality": [
        "db등급", "db퀄리티", "환자등급", "고객등급", "등급", "퀄리티",
        "quality", "grade", "tier", "leadgrade",
    ],
    "staff_assessment": [
        "실무자판단", "직원평가", "내부평가", "내부의견",
        "assessment", "staffassessment", "evaluation",
    ],
    "seq_no": [
        "순번", "no", "번호순서", "연번", "seq", "sequenceno",
    ],
    "chart_no": [
        # 일부 EMR은 차트번호와 환자번호를 분리 — chart_no 별칭은 external_id와 별도
        "차트번호chart", "원내차트번호", "내부차트번호",
    ],
    "partial_consent_reason": [
        "부분동의사유", "부분동의이유", "partialconsentreason",
    ],
    "non_consent_reason": [
        "미동의사유", "거부사유", "비동의사유",
        "nonconsentreason", "refusalreason",
    ],
}


# 내원/예약 상태 한국어 → enum
INBOUND_STATUS_ALIASES: dict[str, str] = {
    "대기": "PENDING", "미처리": "PENDING", "신규": "PENDING", "pending": "PENDING",
    "예약": "BOOKED", "예약완료": "BOOKED", "예약됨": "BOOKED", "booked": "BOOKED", "scheduled": "BOOKED",
    "보류": "HELD", "홀드": "HELD", "보류중": "HELD", "held": "HELD", "onhold": "HELD",
    "취소": "CANCELLED", "예약취소": "CANCELLED", "노쇼": "CANCELLED", "noshow": "CANCELLED",
    "cancelled": "CANCELLED", "canceled": "CANCELLED",
    "방문": "VISITED", "내원": "VISITED", "방문완료": "VISITED", "내원완료": "VISITED",
    "진료완료": "VISITED", "visited": "VISITED", "completed": "VISITED",
}


# 동의 표현 → enum
CONSENT_ALIASES: dict[str, str] = {
    "동의": "CONSENTED", "수신동의": "CONSENTED", "예": "CONSENTED", "y": "CONSENTED",
    "yes": "CONSENTED", "o": "CONSENTED", "ok": "CONSENTED", "1": "CONSENTED",
    "true": "CONSENTED", "consented": "CONSENTED", "동의함": "CONSENTED",
    "거부": "REFUSED", "비동의": "REFUSED", "수신거부": "REFUSED", "n": "REFUSED",
    "no": "REFUSED", "x": "REFUSED", "0": "REFUSED", "false": "REFUSED",
    "refused": "REFUSED", "거절": "REFUSED",
    "부분": "PARTIAL", "부분동의": "PARTIAL", "일부": "PARTIAL", "partial": "PARTIAL",
    "미확인": "NOT_ASKED", "미확정": "NOT_ASKED", "확인안함": "NOT_ASKED", "미상": "NOT_ASKED",
    "notasked": "NOT_ASKED", "unknown": "NOT_ASKED", "": "NOT_ASKED",
}


# DB 퀄리티
DB_QUALITY_ALIASES: dict[str, str] = {
    "상": "HIGH", "최상": "HIGH", "high": "HIGH", "h": "HIGH", "a": "HIGH",
    "중": "MEDIUM", "보통": "MEDIUM", "medium": "MEDIUM", "m": "MEDIUM", "b": "MEDIUM",
    "하": "LOW", "최하": "LOW", "low": "LOW", "l": "LOW", "c": "LOW",
}


def normalize_header(h: str) -> str:
    """헤더 비교용 정규화 — 소문자, 공백·하이픈·언더스코어·괄호 제거."""
    if not h:
        return ""
    s = str(h).strip().lower()
    for ch in (" ", "\t", "\n", "-", "_", "(", ")", "[", "]", ".", "/", "*", "#", ":", ","):
        s = s.replace(ch, "")
    return s


# 미리 정규화된 inverse index
_HEADER_INDEX: dict[str, str] | None = None


def header_to_field(header: str) -> str | None:
    """헤더 문자열 → canonical field 이름. 모르면 None."""
    global _HEADER_INDEX
    if _HEADER_INDEX is None:
        idx: dict[str, str] = {}
        for canonical, aliases in HEADER_ALIASES.items():
            for a in aliases:
                idx[normalize_header(a)] = canonical
            # canonical 자체도 별칭으로
            idx[normalize_header(canonical)] = canonical
        _HEADER_INDEX = idx
    return _HEADER_INDEX.get(normalize_header(header))
