"""
청구 데이터 헤더 별칭 사전.

대상 EMR export: 의사랑 / 닥터팔레트 / 굿닥 / SmartDoctor / 비트 / 위즈메디.
모두 소문자·공백/특수문자 제거 후 비교.
"""

HEADER_ALIASES: dict[str, list[str]] = {
    # 청구 식별
    "claim_number": [
        "청구번호", "청구코드", "청구id", "접수번호", "전송번호",
        "claimnumber", "claimid", "receiptno", "submissionno",
    ],
    "claim_date": [
        "청구일", "청구일자", "접수일", "접수일자", "전송일",
        "claimdate", "submissiondate", "receiptdate",
    ],
    "service_date": [
        "진료일", "진료일자", "내원일", "처방일", "수진일",
        "방문일", "방문일자", "치료일",
        "servicedate", "visitdate", "treatmentdate", "consultationdate",
    ],

    # 환자
    "patient_chart_no": [
        "차트번호", "차트no", "환자번호", "환자코드", "환자id",
        "수진자번호", "수진자코드", "chartno", "patientid", "patientno",
    ],
    "patient_name": [
        "환자명", "환자이름", "성명", "이름", "수진자명",
        "patientname", "name",
    ],
    "patient_rrn": [
        "주민번호", "주민등록번호", "rrn", "ssn",
    ],
    "patient_age": [
        "나이", "연령", "age",
    ],
    "patient_gender": [
        "성별", "sex", "gender",
    ],

    # 진단
    "dx_code": [
        "상병코드", "주상병코드", "진단코드", "주진단코드", "icd", "kcd",
        "icdcode", "kcdcode", "diagnosiscode", "dxcode", "primarydx",
    ],
    "dx_name": [
        "상병명", "주상병명", "진단명", "주진단명", "병명",
        "diagnosisname", "dxname", "disease",
    ],
    "secondary_dx_codes": [
        "부상병코드", "부진단코드", "보조상병코드",
        "secondarydx", "additionaldx", "subdxcode",
    ],

    # 항목 (수기료/약제/처치)
    "item_code": [
        "수가코드", "처치코드", "행위코드", "약품코드", "코드",
        "수가번호", "약가코드", "edicode", "feecode", "code", "drugcode",
    ],
    "item_name": [
        "수가명", "처치명", "행위명", "약품명", "항목명", "약제명",
        "feename", "treatmentname", "drugname", "itemname",
    ],
    "item_type": [
        "분류", "구분", "유형", "항목구분", "분류코드",
        "category", "type", "itemtype",
    ],
    "quantity": [
        "수량", "횟수", "qty", "quantity", "count", "amount",
        "일수", "투여일수", "days",
    ],
    "unit_price": [
        "단가", "단위가격", "1회단가", "약가", "수가",
        "unitprice", "price", "tariff",
    ],
    "total_price": [
        "금액", "총액", "합계", "총금액", "청구금액", "산정금액",
        "totalprice", "total", "amount", "sum",
    ],

    # 보험 구분
    "insurance_amount": [
        "보험자부담", "보험부담금", "공단부담", "급여금액",
        "insurancepay", "insureramount", "coveredamount",
    ],
    "copay_amount": [
        "본인부담", "본인부담금", "환자부담", "비급여금액",
        "copay", "patientpay", "outofpocket",
    ],

    # 결과
    "approved_amount": [
        "심사결정금액", "승인금액", "지급금액", "심사금액",
        "approvedamount", "settledamount",
    ],
    "rejected_amount": [
        "삭감액", "조정액", "차감액", "감액",
        "rejectedamount", "adjustedamount", "deductedamount",
    ],
    "rejection_reason": [
        "삭감사유", "조정사유", "심사사유", "결정사유",
        "rejectionreason", "adjustmentreason",
    ],

    # 기타
    "ykiho": [
        "요양기관번호", "요양기관기호", "ykiho",
    ],
    "specialty_code": [
        "진료과", "진료과목", "전문과목", "specialty", "department",
    ],
}


# 항목 유형 별칭 → ClaimItemType enum
ITEM_TYPE_ALIASES: dict[str, str] = {
    # DIAGNOSIS
    "진단": "DIAGNOSIS", "상병": "DIAGNOSIS", "진단명": "DIAGNOSIS",
    "diagnosis": "DIAGNOSIS", "dx": "DIAGNOSIS",
    # TREATMENT
    "처치": "TREATMENT", "수기료": "TREATMENT", "행위": "TREATMENT", "진료": "TREATMENT",
    "treatment": "TREATMENT", "procedure": "TREATMENT", "tx": "TREATMENT",
    # MEDICATION
    "약제": "MEDICATION", "약품": "MEDICATION", "약": "MEDICATION", "투약": "MEDICATION",
    "처방": "MEDICATION", "medication": "MEDICATION", "drug": "MEDICATION", "rx": "MEDICATION",
    # INJECTION
    "주사": "INJECTION", "injection": "INJECTION", "inj": "INJECTION",
    # TEST
    "검사": "TEST", "검사료": "TEST", "랩": "TEST",
    "test": "TEST", "lab": "TEST", "exam": "TEST",
    # IMAGING
    "영상": "IMAGING", "엑스레이": "IMAGING", "x-ray": "IMAGING", "ct": "IMAGING",
    "mri": "IMAGING", "초음파": "IMAGING", "imaging": "IMAGING", "radiology": "IMAGING",
    # MATERIAL
    "재료": "MATERIAL", "재료대": "MATERIAL", "치료재료": "MATERIAL",
    "material": "MATERIAL", "supply": "MATERIAL",
}


def normalize_header(h: str) -> str:
    if not h:
        return ""
    s = str(h).strip().lower()
    for ch in (" ", "\t", "\n", "-", "_", "(", ")", "[", "]", ".", "/", "*", "#", ":", ",", "·"):
        s = s.replace(ch, "")
    return s


_HEADER_INDEX: dict[str, str] | None = None


def header_to_field(header: str) -> str | None:
    global _HEADER_INDEX
    if _HEADER_INDEX is None:
        idx: dict[str, str] = {}
        for canonical, aliases in HEADER_ALIASES.items():
            for a in aliases:
                idx[normalize_header(a)] = canonical
            idx[normalize_header(canonical)] = canonical
        _HEADER_INDEX = idx
    return _HEADER_INDEX.get(normalize_header(header))


def normalize_item_type(v: str | None) -> str | None:
    if not v:
        return None
    s = normalize_header(v)
    return ITEM_TYPE_ALIASES.get(s)
