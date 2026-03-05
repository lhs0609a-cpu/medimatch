import type { TaskGuide } from './types'

export const phase5Guides: Record<string, TaskGuide> = {
  '5-1': {
    steps: [
      '진료과별 필수/권장/선택 장비 리스트를 작성합니다',
      '장비별 구매/리스/렌탈 옵션을 비교합니다',
      '최소 3곳의 업체에서 견적을 받습니다',
      '납품 일정을 인테리어 완공일에 맞춰 조율합니다',
      '발주 및 계약금을 지불합니다',
    ],
    tips: [
      '고가 장비(CT, 초음파 등)는 리스가 초기 부담을 줄여줍니다',
      '중고 장비는 30~50% 저렴하지만 AS 조건을 반드시 확인하세요',
      '메디플라톤 공동구매로 추가 할인을 받을 수 있습니다',
    ],
    warnings: [
      '장비 납품은 2~8주 소요되므로 여유 있게 발주하세요',
      '가격만 보고 결정하지 말고 AS 네트워크와 소모품 비용도 고려하세요',
    ],
    documents: [
      '진료과별 필수 장비 목록',
      '장비 견적 비교표',
      '리스/렌탈 계약서',
    ],
    resources: [
      { name: '의료기기 종합정보시스템', url: 'https://emedi.mfds.go.kr', description: '허가/인증된 의료기기 정보 검색', type: 'government', lastVerified: '2025-12-01' },
      { name: '메디플라톤 공동구매', description: '의료장비 공동구매로 10~20% 할인', type: 'tool' },
      { name: '의료기기 중고 마켓', description: '검증된 중고 의료장비 거래 플랫폼', type: 'website' },
      { name: '의료기기 리스 회사 비교', description: '주요 리스회사 조건(금리, 기간) 비교표', type: 'template', lastVerified: '2025-11-15' },
    ],
    benchmarks: [
      { label: '내과 필수장비', value: '3,000~5,000만원', note: '초음파, 심전도, X-ray 등' },
      { label: '피부과 필수장비', value: '5,000만~2억원', note: '레이저 장비 비중이 높음' },
      { label: '정형외과 필수장비', value: '3,000~8,000만원', note: 'X-ray, 물리치료 장비 등' },
      { label: '리스 금리', value: '연 5~8%', note: '36~60개월 기준' },
      { label: '중고 장비 할인율', value: '신품 대비 30~50%', note: '연식/상태에 따라 차이' },
    ],
    timeline: {
      recommendedStart: '개원 3개월 전',
      duration: '2~4주 (선정+발주)',
      deadline: '개원 1개월 전까지 납품',
      durationRange: [14, 28],
    },
    costBreakdown: [
      { label: '초음파 (내과 기본)', value: '2,000~5,000만원', note: '흑백/컬러, 프로브 수에 따라' },
      { label: 'X-ray', value: '3,000~6,000만원', note: 'CR/DR 방식에 따라 차이' },
      { label: '심전도기', value: '200~500만원' },
      { label: '혈액검사기', value: '500~2,000만원', note: 'POCT vs 외부 위탁 비교' },
      { label: '물리치료 장비 세트', value: '2,000~5,000만원', note: '정형외과/재활의학과' },
      { label: '피부 레이저', value: '3,000만~1억원/대', note: '종류별 차이 큼' },
    ],
    subChecklists: [
      {
        label: '장비 구매 시 확인 사항',
        items: [
          '식약처 허가/인증 여부',
          'AS 네트워크 (전국/수도권/지역)',
          'AS 응답 시간 (당일/익일/48시간)',
          '소모품 가격 및 교체 주기',
          '보증 기간 (통상 1~2년)',
          '설치 교육 포함 여부',
          '리스/렌탈 시 중도 해지 조건',
        ],
      },
    ],
    expertAdvice: '장비 구매의 핵심은 "총 보유 비용(TCO)"입니다. 구매가가 저렴해도 소모품이 비싸면 장기적으로 손해입니다. 5년 기준 총 비용(구매+소모품+AS)으로 비교하세요.',
    failureCases: [
      {
        title: '과잉 장비 투자',
        description: '처음부터 모든 장비를 신품으로 풀 구매',
        consequence: '초기 자금 소진, 월 리스료 과다로 BEP 지연',
        prevention: '필수 장비만 신품, 나머지는 리스/렌탈/중고 활용. 개원 6개월 후 추가 구매 계획',
      },
      {
        title: 'AS 조건 미확인 구매',
        description: '가격만 보고 장비를 구매하고 AS 조건을 확인하지 않음',
        consequence: '장비 고장 시 수리 지연(1~2주), 진료 공백 발생, 대체 장비 렌탈 비용 추가',
        prevention: '계약 전 AS 응답 시간(24시간 이내), 대체 장비 제공 여부, AS 거점 위치를 서면 확인',
      },
    ],
    specialtyOverrides: {
      'dental': {
        tips: [
          '유니트체어는 3대 이상 시 공동구매 할인 가능',
          '파노라마 X-ray는 중고 시장 활발 — 3년 이내 제품 추천',
          'CAD/CAM은 개원 1년 후 도입 검토로도 충분',
        ],
      },
      'dermatology': {
        tips: [
          '주력 레이저 1대는 신품 필수 (AS 중요)',
          'IPL/서브 장비는 리스 추천',
          '장비 데모 최소 3회 이상 테스트 후 결정',
        ],
      },
      'orthopedics': {
        tips: [
          'X-ray는 DR 방식 추천 (필름 비용 절감)',
          '체외충격파는 환자 만족도 높아 초기 도입 권장',
          '물리치료 장비는 패키지 구매 시 20~30% 절감',
        ],
      },
      'ophthalmology': {
        tips: [
          'OCT는 신품 필수 (정밀 검사 장비)',
          '자동굴절검사기는 중고 가능',
          '세극등은 중급 이상 추천',
        ],
      },
    },
  },
  '5-2': {
    steps: [
      '진료에 필요한 소모품 목록을 작성합니다',
      '의약품 도매상 2~3곳에서 가격을 비교합니다',
      '초도 물량(1~2개월분)을 발주합니다',
      '약품 보관 환경(온도, 습도)을 점검합니다',
    ],
    tips: [
      '초도 물량은 1~2개월분이면 충분합니다 (유통기한 관리)',
      '자주 쓰는 소모품은 정기 배송 계약이 편리합니다',
      '의약품 관리 소프트웨어 연동 여부를 확인하세요',
    ],
    warnings: [
      '마약류/향정신성의약품은 별도 관리 규정이 있습니다',
      '유통기한 관리를 소홀히 하면 폐기 비용이 발생합니다',
    ],
    documents: [
      '소모품 발주 목록',
      '의약품 관리 대장',
    ],
    resources: [
      { name: '지오영', url: 'https://www.geo-young.co.kr', description: '의약품 도매 1위 (전국 배송)', type: 'website', lastVerified: '2025-12-01' },
      { name: '백제약품', url: 'https://www.baekje.co.kr', description: '의약품/의료소모품 종합 도매', type: 'website' },
      { name: '의약품안전나라', url: 'https://nedrug.mfds.go.kr', description: '의약품 정보 검색, 유통기한 관리', type: 'government', lastVerified: '2025-11-20' },
    ],
    benchmarks: [
      { label: '초도 물량 비용 (내과)', value: '300~500만원', note: '1~2개월분 기준' },
      { label: '초도 물량 비용 (피부과)', value: '200~400만원', note: '시술 소모품 별도' },
      { label: '정기 배송 할인율', value: '5~15%', note: '월 정기 계약 시' },
      { label: '소모품 월 비용 (안정기)', value: '100~300만원', note: '진료량에 따라 차이' },
    ],
    timeline: {
      recommendedStart: '개원 3주 전',
      duration: '3~5일',
      deadline: '개원 1주 전까지 입고',
      durationRange: [3, 5],
    },
    subChecklists: [
      {
        label: '초도 소모품 체크리스트',
        items: [
          '주사기, 주사침 (규격별)',
          '거즈, 반창고, 소독솜',
          '일회용 장갑 (라텍스/니트릴)',
          '소독제 (알코올, 베타딘 등)',
          '처방 의약품 (진료과별)',
          '검사 시약/키트',
          '프린터 용지, 토너',
          '처방전, 영수증 용지',
        ],
      },
    ],
    expertAdvice: '초도 물량은 "최소한"으로 시작하세요. 개원 초기에는 환자 패턴을 모르므로, 2주분만 발주하고 부족한 것을 추가 주문하는 것이 유통기한 관리에 유리합니다.',
    failureCases: [
      {
        title: '초도 물량 과다 발주',
        description: '환자수 예측 없이 3개월분 이상의 소모품/의약품을 대량 발주',
        consequence: '유통기한 경과로 폐기 발생, 초기 자금 불필요한 잠김',
        prevention: '1~2주분만 초도 발주, 소모 패턴 파악 후 정기 배송 계약으로 전환',
      },
    ],
  },
  '5-3': {
    steps: [
      'EMR 업체 3곳 이상을 비교합니다 (기능, 가격, 사용성)',
      '실제 데모를 체험합니다',
      '클라우드형 vs 설치형을 결정합니다',
      '계약 후 초기 세팅(진료과, 처방 세트, 서식)을 진행합니다',
      '직원 교육 일정을 확보합니다',
    ],
    tips: [
      '클라우드형 EMR이 유지보수, 업데이트, 원격 접속에 유리합니다',
      '처방 세트를 미리 만들어두면 개원 초기 진료 속도가 빨라집니다',
      '심평원 청구 모듈 호환성을 반드시 확인하세요',
    ],
    warnings: [
      '데이터 백업 정책을 반드시 확인하세요',
      '계약 시 해지 조건과 데이터 이관 방법을 확인하세요',
    ],
    documents: [
      'EMR 기능 비교표',
      'EMR 도입 계약서',
    ],
    resources: [
      { name: '비트컴퓨터', url: 'https://www.bit.kr', description: 'EMR 시장점유율 1위, 설치형/클라우드형', type: 'website', lastVerified: '2025-12-01' },
      { name: '유비케어', url: 'https://www.ubicare.co.kr', description: '클라우드 EMR "의사랑"으로 유명', type: 'website', lastVerified: '2025-11-15' },
      { name: '메디플라톤 EMR', description: '클라우드 기반, 보험청구 분석 통합', type: 'tool' },
      { name: 'EMR 기능 비교 가이드', description: '주요 EMR 업체 기능/가격 비교표', type: 'template' },
    ],
    benchmarks: [
      { label: 'EMR 도입비 (설치형)', value: '500~1,000만원', note: '서버, 설치, 교육 포함' },
      { label: 'EMR 도입비 (클라우드)', value: '월 10~30만원', note: '초기 비용 낮음, 월 구독' },
      { label: '연간 유지보수비', value: '100~200만원', note: '설치형 기준, 클라우드는 구독에 포함' },
      { label: '클라우드 vs 설치형', value: '클라우드 추세', note: '신규 개원의 70%가 클라우드 선택 (2024)' },
    ],
    timeline: {
      recommendedStart: '개원 2개월 전',
      duration: '1~2주 (선정), 1~2주 (세팅)',
      deadline: '개원 2주 전까지 세팅 완료',
      durationRange: [14, 28],
    },
    subChecklists: [
      {
        label: 'EMR 선정 체크리스트',
        items: [
          '진료과 특화 기능 (처방 세트, 서식)',
          '심평원 청구 모듈 호환',
          'UI/UX 편의성 (데모 체험 필수)',
          '데이터 백업 방식 (자동/수동)',
          '해지 시 데이터 이관 방법',
          'AS 응답 시간 (원격/방문)',
          '모바일 접속 가능 여부',
          '타 시스템 연동 (예약, PACS 등)',
        ],
      },
    ],
    expertAdvice: 'EMR은 매일 8시간 이상 사용하는 도구입니다. "기능"보다 "사용 편의성"을 우선하세요. 데모를 받을 때 실제 진료 시나리오(초진 접수→처방→청구)를 직접 해보세요.',
    failureCases: [
      {
        title: 'EMR 도입 지연',
        description: '개원 1주 전에야 EMR 설치 시작',
        consequence: '직원 교육 부족, 청구 오류 다발, 초기 매출 손실',
        prevention: '최소 개원 1개월 전 EMR 설치, 2주간 모의 운영 필수',
      },
      {
        title: '데모 없이 EMR 선택',
        description: '가격이나 주변 추천만으로 EMR 결정, 실제 데모 미체험',
        consequence: '진료 스타일과 맞지 않아 6개월 내 EMR 교체, 데이터 이관 비용 발생',
        prevention: '최소 3곳 이상 데모 체험, 실제 진료 시나리오(초진→처방→청구)를 직접 테스트',
      },
    ],
  },
  '5-4': {
    steps: [
      '대기실, 진료실, 상담실에 필요한 가구 목록을 작성합니다',
      '의료용 가구(진료 데스크, 진료 침대)와 일반 가구를 구분합니다',
      '인테리어 콘셉트에 맞는 가구를 선정합니다',
      '납품 일정을 인테리어 완공 후로 조율합니다',
    ],
    tips: [
      '대기실 의자는 청소가 쉬운 레자/인조가죽 재질을 추천합니다',
      '키즈 코너가 필요하면 안전한 가구를 배치하세요',
      '수납장은 여유 있게 준비하세요 (서류, 소모품 증가)',
    ],
    warnings: [
      '가구 배치 후 동선이 좁아지지 않는지 확인하세요',
      '진료 침대는 내하중과 높낮이 조절 기능을 확인하세요',
    ],
    resources: [
      { name: '의료가구 전문 업체', description: '진료대, 진찰대, 처치대 등 의료 전용 가구', type: 'website' },
      { name: '오피스 가구 (한샘오피스 등)', description: '접수 데스크, 대기실 의자, 수납장', type: 'website' },
      { name: '가구 배치 가이드', description: '공간별 가구 배치 및 동선 확보 가이드', type: 'template', lastVerified: '2025-10-15' },
    ],
    benchmarks: [
      { label: '대기실 의자 (1인)', value: '10~30만원', note: '패브릭/레자에 따라 차이' },
      { label: '접수 데스크', value: '100~300만원', note: '주문 제작 시 상단' },
      { label: '진료 침대', value: '50~200만원', note: '전동식은 상단' },
      { label: '진료 데스크 + 의자', value: '50~150만원', note: '인체공학 의자 권장' },
      { label: '수납장/캐비닛', value: '20~50만원/개' },
      { label: '총 가구 비용 (30평)', value: '500~1,500만원' },
    ],
    timeline: {
      recommendedStart: '인테리어 후반기',
      duration: '1~2주',
      deadline: '인테리어 완공 후 1주 내 배치',
      durationRange: [7, 14],
    },
    expertAdvice: '가구는 "내구성"과 "청소 편의성"을 최우선으로 선택하세요. 대기실 의자는 매일 수십 명이 앉으므로 1~2년 만에 교체해야 하는 저가 제품은 오히려 비용이 더 듭니다.',
    failureCases: [
      {
        title: '동선 미고려 가구 배치',
        description: '가구 사이즈 확인 없이 온라인으로 구매 후 배치',
        consequence: '진료실/대기실 동선 막힘, 휠체어/유모차 이동 불가, 소방 점검 미통과',
        prevention: '가구 구매 전 실측 도면에 배치 시뮬레이션, 통로 최소 120cm 확보',
      },
    ],
  },
  '5-5': {
    steps: [
      '장비 도착 일정에 맞춰 설치 스케줄을 조율합니다',
      '설치 완료 후 장비별 작동 테스트를 실시합니다',
      '의료 장비는 교정/검정 성적서를 발급받습니다',
      'AS 연락처, 보증 기간, 소모품 교체 주기를 정리합니다',
    ],
    tips: [
      '장비 매뉴얼을 직원 모두가 접근 가능한 곳에 보관하세요',
      '주요 장비의 AS 응대 시간(당일/익일)을 계약 시 확인하세요',
    ],
    warnings: [
      '설치 환경(전압, 습도, 바닥 하중)이 장비 사양에 맞는지 확인하세요',
      '검수 없이 인수하면 하자 발생 시 책임 소재가 불명확합니다',
    ],
    documents: [
      '장비 검수 체크리스트',
      '교정/검정 성적서',
      'AS 보증서',
    ],
    resources: [
      { name: '장비별 제조사 AS센터', description: '장비 구매 시 AS 연락처 목록 확보', type: 'website' },
      { name: '장비 검수 체크리스트 양식', description: '장비별 검수 항목 표준 양식', type: 'template', lastVerified: '2025-11-01' },
      { name: '의료기기 교정 검사기관', description: '식약처 인정 교정 검사 기관 목록', type: 'government', lastVerified: '2025-12-01' },
    ],
    benchmarks: [
      { label: '교정 검사 비용', value: '10~50만원/대', note: '장비 종류에 따라 차이' },
      { label: 'AS 응답 시간 (표준)', value: '24~48시간', note: '계약서에 명시 권장' },
      { label: '소모품 교체 주기', value: '장비별 상이', note: '구매 시 교체 비용·주기 확인' },
      { label: '보증 기간 (표준)', value: '1~2년', note: '연장 보증 별도 구매 가능' },
    ],
    timeline: {
      recommendedStart: '인테리어 완공 직후',
      duration: '3~5일',
      deadline: '개원 1주 전까지 검수 완료',
      durationRange: [3, 5],
    },
    subChecklists: [
      {
        label: '장비 검수 체크리스트',
        items: [
          '외관 손상 여부 (운송 중 파손)',
          '전원 연결 및 작동 테스트',
          '소프트웨어 버전 확인 (최신)',
          '교정/검정 성적서 발급',
          '사용자 매뉴얼 수령',
          'AS 연락처 및 보증 기간 확인',
          '소모품 초기 제공량 확인',
          '직원 사용 교육 완료',
        ],
      },
    ],
    expertAdvice: '장비 인수 시 반드시 "작동 테스트"를 하세요. 배송 후 외관만 확인하고 인수증에 서명하면, 나중에 발견된 불량은 본인 부담이 됩니다.',
    failureCases: [
      {
        title: '검수 없이 인수증 서명',
        description: '장비 배송 시 외관만 확인하고 바로 인수증에 서명',
        consequence: '내부 불량 발견 시 제조사 책임 회피, 수리 비용 본인 부담',
        prevention: '인수 전 반드시 전원 연결 및 작동 테스트, 교정 성적서 발급 후 인수증 서명',
      },
      {
        title: '설치 환경 미확인',
        description: '전압, 바닥 하중, 환기 조건 미확인 상태에서 장비 설치',
        consequence: '장비 오작동, 잦은 고장, 보증 무효 처리 가능',
        prevention: '장비 사양서의 설치 조건(전압, 온습도, 하중)을 인테리어 설계 단계에서 반영',
      },
    ],
  },
}
