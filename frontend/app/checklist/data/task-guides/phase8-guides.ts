import type { TaskGuide } from './types'

export const phase8Guides: Record<string, TaskGuide> = {
  '8-1': {
    steps: [
      '가족, 지인을 대상으로 모의 진료를 실시합니다',
      '접수 → 대기 → 진료 → 수납 전체 동선을 점검합니다',
      'EMR 입력, 처방, 청구 프로세스를 실습합니다',
      '발견된 문제점을 리스트업하고 개선합니다',
    ],
    tips: [
      '실제 상황처럼 진행하세요 (전화 예약부터 수납까지)',
      '직원들이 각자 역할에 익숙해질 때까지 반복하세요',
      '비상 상황(정전, 시스템 오류) 대응도 연습하세요',
    ],
    warnings: [
      '리허설 중 발견된 동선 문제는 개원 전에 반드시 수정하세요',
    ],
    resources: [
      { name: '리허설 체크리스트 템플릿', description: '모의 진료 시 확인해야 할 항목 목록', type: 'template', lastVerified: '2025-11-01' },
      { name: '동선 점검 가이드', description: '환자/직원 동선 효율성 평가 양식', type: 'template' },
    ],
    benchmarks: [
      { label: '리허설 최소 횟수', value: '3회 이상', note: '1차: 동선, 2차: 시스템, 3차: 종합' },
      { label: '발견되는 평균 문제 수', value: '10~20건', note: '사소한 것 포함' },
      { label: '리허설 1회 소요 시간', value: '2~3시간', note: '전체 프로세스 기준' },
    ],
    timeline: {
      recommendedStart: '개원 1주 전',
      duration: '3~5일',
      deadline: '개원 전일까지',
      durationRange: [3, 5],
    },
    subChecklists: [
      {
        label: '리허설 점검 항목',
        items: [
          '전화 예약 → 접수 프로세스',
          '환자 안내 및 대기 동선',
          'EMR 환자 등록 및 진료 기록',
          '처방전 출력 및 전달',
          '수납 (카드/현금/보험) 프로세스',
          '다음 예약 안내',
          '비상 상황 대응 (정전, EMR 오류)',
          '소독/멸균 절차 확인',
        ],
      },
    ],
    expertAdvice: '리허설은 "완벽"을 목표로 하지 마세요. "문제를 미리 발견하는 것"이 목표입니다. 실수가 많을수록 개원 첫날이 매끄러워집니다.',
    failureCases: [
      {
        title: '리허설 없이 바로 개원',
        description: '인테리어 완료 후 곧바로 정식 진료 시작',
        consequence: '동선 혼란, EMR 오류, 환자 대기 시간 과다 — 첫인상 실패',
        prevention: '최소 3일간 지인/가족 대상 모의 진료 실시',
      },
      {
        title: '리허설 1회만 실시',
        description: '형식적으로 1회만 리허설 후 "괜찮겠지" 판단',
        consequence: '시스템 오류, 동선 문제, 직원 역할 혼선이 개원 당일 노출',
        prevention: '최소 3회 리허설 (1차: 동선, 2차: 시스템, 3차: 종합), 매회 문제점 기록 및 개선',
      },
    ],
  },
  '8-2': {
    steps: [
      '소방서에 소방 점검을 신청합니다',
      '소화기, 비상구, 피난 유도등의 위치와 상태를 확인합니다',
      '직원 소방 안전 교육을 실시합니다',
      '소방 시설 점검 결과서를 보관합니다',
    ],
    tips: [
      '소방 점검은 개원 2주 전에 미리 신청하세요',
      '소화기 위치를 직원 모두가 알고 있어야 합니다',
    ],
    warnings: [
      '소방 점검 미통과 시 영업이 불가합니다',
      '비상구를 물건으로 막아두면 안 됩니다',
    ],
    documents: [
      '소방 시설 점검 결과서',
      '안전 교육 수료증',
    ],
    resources: [
      { name: '관할 소방서', description: '소방 시설 점검 신청 (사전 예약 필수)', type: 'government' },
      { name: '한국소방안전원', url: 'https://www.kfsi.or.kr', description: '소방안전교육 신청 (온라인/오프라인)', type: 'government', lastVerified: '2025-12-01' },
      { name: '소방시설 자체점검 체크리스트', description: '소방서 점검 전 자체 확인 양식', type: 'template', lastVerified: '2025-11-15' },
    ],
    benchmarks: [
      { label: '소방 점검 소요 시간', value: '1~2시간', note: '현장 점검 기준' },
      { label: '미통과 사유 TOP 3', value: '①소화기 미비 ②유도등 불량 ③비상구 차단', note: '사전에 확인하면 통과 가능' },
      { label: '소화기 비치 기준', value: '보행거리 20m 이내 1개', note: '소방법 기준' },
      { label: '재점검 신청', value: '보완 후 즉시 가능', note: '미통과 시' },
    ],
    timeline: {
      recommendedStart: '개원 2주 전',
      duration: '1~2일',
      deadline: '개원 전 반드시 통과',
      durationRange: [1, 2],
    },
    expertAdvice: '소방 점검은 "사전에 자체 점검"하면 100% 통과합니다. 소화기 위치, 유도등 점등, 비상구 개방 여부만 미리 확인하세요.',
    regulations: [
      '화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률',
      '소방시설 미설치/미작동 시 과태료 200만원',
      '소방안전교육 미이수 시 과태료 50만원',
    ],
    failureCases: [
      {
        title: '소방 점검 일정 미확인',
        description: '개원 직전에야 소방 점검을 신청하여 일정 확보 실패',
        consequence: '개원일 지연, 이미 예약된 환자 일정 변경 필요',
        prevention: '개원 2주 전에 소방서에 점검 예약, 미통과 시 재점검 기간 확보',
      },
      {
        title: '소화기/유도등 미비',
        description: '인테리어 완료 후 소방 시설 설치를 누락',
        consequence: '소방 점검 미통과, 개원 불가, 과태료 200만원',
        prevention: '인테리어 설계 단계에서 소방 시설(소화기, 유도등, 비상구 표시) 배치 포함',
      },
    ],
    legalRisks: [
      '소방시설 미비 시 개원 불가 (소방법)',
      '소화기 미비치 과태료 200만원',
    ],
    contacts: [
      { organization: '관할 소방서', department: '예방안전과', description: '의료기관 소방 점검 신청' },
    ],
  },
  '8-3': {
    steps: [
      'EMR에서 테스트 환자로 진료 기록을 작성합니다',
      '건강보험 청구 파일을 생성하여 심평원에 전송 테스트합니다',
      '청구 오류 여부를 확인하고 수정합니다',
      '실제 청구 프로세스를 직원과 함께 숙지합니다',
    ],
    tips: [
      '심평원 EDI 테스트는 영업일 기준 1~2일 내 결과를 확인할 수 있습니다',
      '자주 쓰는 상병코드와 처치코드를 미리 세트로 만들어두세요',
      '메디플라톤 보험청구 분석 기능으로 삭감 위험을 사전에 점검하세요',
    ],
    warnings: [
      '청구 테스트 없이 개원하면 첫 달 청구 누락/오류가 발생합니다',
      '심평원 EDI 인증서를 사전에 발급받아야 합니다',
    ],
    documents: [
      'EDI 인증서',
      '청구 테스트 결과서',
    ],
    resources: [
      { name: '심평원 EDI', url: 'https://www.hira.or.kr', description: '건강보험 청구 전송 시스템', type: 'government', lastVerified: '2025-12-01' },
      { name: '메디플라톤 보험청구 분석', description: '삭감 위험 사전 분석, 청구 최적화', type: 'tool' },
      { name: '상병코드 검색 (KCD)', description: '한국표준질병분류 코드 검색', type: 'government', lastVerified: '2025-11-20' },
      { name: '청구 코드 가이드', description: '진료과별 자주 쓰는 상병코드+처치코드 세트', type: 'template' },
    ],
    benchmarks: [
      { label: '첫 달 평균 삭감률', value: '5~15%', note: '개원 초기 높은 편, 3개월 후 안정' },
      { label: 'EDI 테스트 소요 시간', value: '1~2일', note: '영업일 기준' },
      { label: 'EDI 인증서 발급', value: '3~5일', note: '심평원 온라인 신청' },
      { label: '청구 실수 TOP 3', value: '①상병-처치 불일치 ②청구 누락 ③산정 기준 오류' },
    ],
    timeline: {
      recommendedStart: '개원 1주 전',
      duration: '2~3일',
      deadline: '개원 전 테스트 완료',
      durationRange: [2, 3],
    },
    subChecklists: [
      {
        label: '보험청구 테스트 체크리스트',
        items: [
          'EDI 인증서 발급 완료',
          'EMR에 테스트 환자 등록',
          '초진 진료 기록 작성',
          '처방전 생성 테스트',
          '청구 파일 생성 및 전송',
          '심평원 접수 확인',
          '오류 코드 수정',
          '자주 쓰는 처방 세트 등록',
        ],
      },
    ],
    expertAdvice: '보험청구 테스트는 반드시 "실제 진료 시나리오"로 하세요. 가장 자주 볼 질환 3~5가지를 정하고, 접수→진료→처방→청구 전 과정을 테스트하면 개원 첫날부터 매끄럽게 청구할 수 있습니다.',
    failureCases: [
      {
        title: '청구 테스트 미실시',
        description: 'EMR 설치 후 청구 프로세스 미검증 상태로 개원',
        consequence: '첫 달 청구 오류 다발, 삭감률 30% 이상, 자금 흐름 차질',
        prevention: '개원 전 테스트 청구 최소 5건 이상 실시, 심평원 EDI 연결 확인',
      },
      {
        title: 'EDI 인증서 미발급',
        description: 'EDI 인증서 발급 일정을 놓쳐 개원일에 청구 불가',
        consequence: '첫 주 진료분 청구 지연, 현금 흐름 악화',
        prevention: '개원 2주 전 EDI 인증서 온라인 신청 (발급 소요 3~5일 고려)',
      },
    ],
    legalRisks: [
      '허위/부당 청구 적발 시 요양기관 자격 정지',
      '비급여 항목 미고시 과태료',
    ],
    contacts: [
      { organization: '건강보험심사평가원', department: '심사관리부', phone: '1644-2000', url: 'https://www.hira.or.kr', description: '요양기관 청구 관련 문의' },
      { organization: '국민건강보험공단', phone: '1577-1000', url: 'https://www.nhis.or.kr', description: '건강보험 자격/가입 관련' },
    ],
  },
  '8-4': {
    steps: [
      '오픈 이벤트 콘셉트와 기간을 결정합니다',
      '이벤트 내용(건강검진 할인, 기념품 등)을 기획합니다',
      '홍보물(현수막, SNS 포스팅, 전단지)을 제작합니다',
      '이벤트 당일 운영 계획을 수립합니다',
    ],
    tips: [
      '무료 건강 상담, 혈압/혈당 체크 등 가벼운 이벤트가 효과적입니다',
      '개원 첫 주는 예약을 여유 있게 잡으세요 (시스템 안정화)',
      'SNS에 개원 소식을 미리 공유하면 첫 주 환자 유입에 도움됩니다',
    ],
    warnings: [
      '과도한 할인/경품은 의료법 위반 소지가 있습니다',
      '이벤트 기간 중에도 진료 품질을 유지하세요',
    ],
    resources: [
      { name: '개원 이벤트 기획 가이드', description: '효과적인 개원 이벤트 유형 및 기획 방법', type: 'template', lastVerified: '2025-10-15' },
      { name: 'SNS 홍보 템플릿', description: '인스타그램/카카오 개원 홍보 게시물 양식', type: 'template' },
    ],
    benchmarks: [
      { label: '이벤트 비용 (소규모)', value: '50~100만원', note: '무료 검진+소정의 기념품' },
      { label: '이벤트 비용 (중규모)', value: '100~300만원', note: '할인+기념품+홍보물' },
      { label: '효과적 이벤트 유형', value: '무료 건강 체크 > 할인 > 경품', note: '순서대로 효과적' },
      { label: '이벤트 기간 신환 유입', value: '일 5~15명', note: '지역/진료과에 따라 차이' },
    ],
    timeline: {
      recommendedStart: '개원 2주 전 (기획)',
      duration: '1~2주',
      deadline: '개원일에 시작',
      durationRange: [7, 14],
    },
    subChecklists: [
      {
        label: '오픈 이벤트 준비 체크리스트',
        items: [
          '이벤트 콘셉트 및 기간 결정',
          '예산 확보',
          '기념품/경품 준비',
          '홍보물 제작 (현수막, 전단지, SNS)',
          '이벤트 당일 직원 역할 분담',
          '환자 동선 및 대기 관리 계획',
          'SNS 실시간 포스팅 계획',
          '이벤트 결과 측정 방법 결정',
        ],
      },
    ],
    expertAdvice: '가장 효과적인 개원 이벤트는 "무료 건강 체크"입니다. 혈압, 혈당, 체지방 측정을 무료로 제공하면 부담 없이 방문하고, 이후 정기 환자로 이어지는 비율이 높습니다.',
    regulations: [
      '의료법 제27조: 의료인이 아닌 자의 의료행위 금지 (이벤트 시 의료행위 범위 주의)',
      '의료법 제56조: 의료광고 제한 (할인 광고 시 과장 금지)',
    ],
    failureCases: [
      {
        title: '과도한 할인 이벤트',
        description: '개원 기념으로 진료비 50% 할인, 고가 경품 제공 등 과도한 이벤트 진행',
        consequence: '의료법 위반 소지, 할인 종료 후 환자 이탈, 수익성 악화',
        prevention: '무료 건강 체크(혈압, 혈당) 등 가벼운 이벤트 위주, 할인보다 서비스 차별화에 집중',
      },
      {
        title: '이벤트 홍보 부족',
        description: '이벤트를 기획했지만 홍보 없이 개원일만 기다림',
        consequence: '이벤트 당일 방문 환자 미미, 준비 비용 대비 효과 없음',
        prevention: '개원 2주 전부터 SNS, 전단지, 엘리베이터 광고로 사전 홍보, 네이버 플레이스에 공지',
      },
    ],
  },
  '8-5': {
    steps: [
      '개원 당일 아침 전 직원이 모여 최종 점검을 합니다',
      '장비, 소모품, 약품 재고를 확인합니다',
      '첫 환자 맞이 준비를 합니다',
      '저녁에 하루를 복기하고 개선점을 정리합니다',
    ],
    tips: [
      '첫날은 환자수에 욕심내지 말고 프로세스 안정화에 집중하세요',
      '첫 환자에게 특별한 경험을 제공하면 입소문에 도움됩니다',
      '직원들에게 격려와 감사를 전하세요 (팀 사기 중요)',
    ],
    warnings: [
      '개원 첫날 시스템 오류에 대비한 수동 처리 방안을 마련하세요',
    ],
    resources: [
      { name: '개원 D-Day 체크리스트', description: '개원 당일 아침 최종 점검 목록', type: 'template', lastVerified: '2025-11-01' },
      { name: '비상 대응 매뉴얼', description: '시스템 오류, 정전 등 비상 상황 대응 절차', type: 'template' },
    ],
    benchmarks: [
      { label: '개원 첫날 평균 환자수', value: '5~15명', note: '사전 마케팅에 따라 차이' },
      { label: '첫 달 평균 일 환자수', value: '10~25명', note: '목표의 30~50% 수준' },
      { label: '안정기 도달 기간', value: '3~6개월', note: '꾸준히 증가하면 정상' },
    ],
    timeline: {
      recommendedStart: '개원 당일',
      duration: '1일',
      deadline: '개원일',
      durationRange: [1, 1],
    },
    subChecklists: [
      {
        label: '개원 당일 아침 체크리스트',
        items: [
          '전 직원 출근 및 복장 확인',
          'EMR 시스템 정상 작동 확인',
          '전화/인터넷 정상 작동 확인',
          '장비 전원 및 작동 확인',
          '소모품/약품 재고 확인',
          '대기실 청소 및 정리',
          '간판/안내판 점등 확인',
          '예약 환자 리스트 확인',
          '비상 연락망 공유',
        ],
      },
    ],
    expertAdvice: '개원 첫날의 목표는 "완벽한 진료"가 아니라 "매끄러운 프로세스"입니다. 환자 한 분 한 분에게 정성을 다하면, 자연스럽게 좋은 후기와 입소문이 시작됩니다.',
    failureCases: [
      {
        title: '비상 대응 계획 미수립',
        description: '개원 당일 정전, EMR 오류 등 비상 상황에 대한 매뉴얼 없음',
        consequence: '시스템 장애 시 진료 중단, 환자 데이터 손실, 첫날 혼란',
        prevention: '비상 상황별 대응 매뉴얼 작성 (정전: 수기 진료, EMR 오류: 업체 긴급 연락), 직원 공유',
      },
    ],
  },
  '8-6': {
    steps: [
      '일/주/월 단위로 환자수 추이를 모니터링합니다',
      '환자 만족도를 파악합니다 (구글/네이버 리뷰)',
      '직원 적응도와 업무 과부하 여부를 체크합니다',
      '매출/비용 실적을 사업계획서와 비교 분석합니다',
      '필요 시 마케팅, 운영 전략을 수정합니다',
    ],
    tips: [
      '개원 후 3개월이 가장 중요한 시기입니다',
      '네이버 리뷰 관리를 적극적으로 하세요 (답글 필수)',
      '메디플라톤 대시보드로 핵심 지표를 한눈에 모니터링하세요',
    ],
    warnings: [
      '환자수가 기대에 못 미쳐도 3~6개월은 기다리세요',
      '초기 비용 절감을 위해 서비스 품질을 낮추지 마세요',
    ],
    resources: [
      { name: '메디플라톤 대시보드', description: '환자수, 매출, 청구 현황 실시간 모니터링', type: 'tool' },
      { name: '네이버 플레이스 리뷰 관리', url: 'https://smartplace.naver.com', description: '네이버 리뷰 확인 및 답글 작성', type: 'website', lastVerified: '2025-12-01' },
      { name: '구글 비즈니스 리뷰', url: 'https://business.google.com', description: '구글 리뷰 관리', type: 'website' },
      { name: '월간 경영 리포트 양식', description: '매출, 비용, 환자수 월간 분석 양식', type: 'template', lastVerified: '2025-11-15' },
    ],
    benchmarks: [
      { label: '3개월 후 목표 환자수 달성률', value: '60~80%', note: '정상적 성장 기준' },
      { label: '리뷰 답변 효과', value: '재방문율 15~25% 증가', note: '성의 있는 답변 기준' },
      { label: '적정 리뷰 답변 시간', value: '24시간 이내', note: '빠를수록 좋음' },
      { label: '월 신환 vs 재진 비율', value: '신환 30~40%, 재진 60~70%', note: '안정기 기준' },
      { label: 'BEP 도달 시점', value: '6~18개월', note: '진료과/입지에 따라 차이' },
    ],
    timeline: {
      recommendedStart: '개원 직후',
      duration: '지속 운영',
      deadline: '개원 후 매주/매월 정기 점검',
      durationRange: [90, 180],
      seasonalImpact: ['1~2월: 독감/감기 시즌 — 내과/소아과 환자 급증', '7~8월: 휴가 시즌 환자수 감소 (정상)', '연말: 건강검진 수요 증가'],
    },
    subChecklists: [
      {
        label: '개원 후 주간 점검 항목',
        items: [
          '일평균 환자수 추이',
          '신환 vs 재진 비율',
          '네이버/구글 리뷰 확인 및 답글',
          '매출 vs 사업계획 비교',
          '직원 컨디션 및 업무 피드백',
          '소모품/약품 재고 확인',
          '마케팅 효과 분석 (광고비 대비 환자 유입)',
        ],
      },
    ],
    expertAdvice: '개원 후 3개월은 "인내의 시간"입니다. 환자수가 예상보다 적어도 당황하지 마세요. 성실한 진료, 친절한 응대, 꾸준한 리뷰 관리가 6개월 후 폭발적 성장의 기반이 됩니다.',
    failureCases: [
      {
        title: '리뷰 관리 방치',
        description: '네이버/구글 리뷰에 답글을 달지 않고 방치',
        consequence: '부정 리뷰 방치로 신뢰도 하락, 잠재 환자 이탈',
        prevention: '24시간 이내 모든 리뷰에 답글, 부정 리뷰도 정중히 대응, 주간 리뷰 점검 루틴 수립',
      },
      {
        title: '초기 환자수 저조에 조급함',
        description: '개원 후 1개월 내 환자수가 목표의 30% 미만이라 광고비 폭증 또는 무리한 할인 진행',
        consequence: '광고비 낭비, 할인 의존 환자 유입, 정가 전환 시 이탈, 수익성 악화',
        prevention: '3~6개월간 환자수 추이 관찰, 월 100~200만원 광고 예산 내에서 채널별 테스트, 서비스 품질에 집중',
      },
    ],
  },
}
