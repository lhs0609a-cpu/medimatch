export interface SubTask {
  id: string
  title: string
  description: string
  estimatedDays: number
  estimatedCost?: number // 만원 단위
  tips?: string
}

export interface Phase {
  id: number
  title: string
  icon: string // lucide icon name
  month: number // 시작 월 (1~12)
  duration: number // 개월
  color: string
  description: string
  subtasks: SubTask[]
}

export const phases: Phase[] = [
  {
    id: 1,
    title: '사업계획 수립',
    icon: 'ClipboardList',
    month: 1,
    duration: 2,
    color: '#3B82F6',
    description: '개원 목표 설정, 진료과 선정, 사업타당성 분석',
    subtasks: [
      { id: '1-1', title: '개원 목표 및 비전 설정', description: '진료 철학, 타깃 환자군, 차별화 전략 수립', estimatedDays: 7 },
      { id: '1-2', title: '진료과 및 세부 전공 결정', description: '시장 수요, 경쟁 현황, 개인 역량 고려', estimatedDays: 7 },
      { id: '1-3', title: '사업타당성 분석', description: '예상 환자수, 매출, 손익분기점 분석', estimatedDays: 14, estimatedCost: 300, tips: '메디플라톤 시뮬레이션 활용 추천' },
      { id: '1-4', title: '자금 계획 수립', description: '총 투자비, 자기자본/대출 비율, 월 고정비 산출', estimatedDays: 7, estimatedCost: 0 },
      { id: '1-5', title: '개원 컨설팅 상담', description: '전문 컨설턴트 미팅, 벤치마킹', estimatedDays: 14, estimatedCost: 500, tips: '2~3곳 비교 상담 권장' },
    ],
  },
  {
    id: 2,
    title: '입지 선정',
    icon: 'MapPin',
    month: 2,
    duration: 2,
    color: '#10B981',
    description: '상권 분석, 후보지 방문, 임대차 계약',
    subtasks: [
      { id: '2-1', title: '상권 분석', description: '유동인구, 주거인구, 경쟁의원 현황 조사', estimatedDays: 14, tips: '메디플라톤 경쟁 모니터링 활용' },
      { id: '2-2', title: '후보지 리스트업 (3~5곳)', description: '부동산 매물 탐색, 현장 방문', estimatedDays: 14 },
      { id: '2-3', title: '건물 실사', description: '주차, 대중교통, 간판 가시성, 층수, 엘리베이터 확인', estimatedDays: 7 },
      { id: '2-4', title: '임대차 계약', description: '보증금, 월세, 관리비, 특약사항 협의', estimatedDays: 14, estimatedCost: 5000, tips: '권리금 없는 곳 우선 고려' },
      { id: '2-5', title: '법률 검토', description: '등기부등본 확인, 계약서 법률 검토', estimatedDays: 7, estimatedCost: 100 },
    ],
  },
  {
    id: 3,
    title: '인허가 / 행정',
    icon: 'FileCheck',
    month: 3,
    duration: 2,
    color: '#F59E0B',
    description: '의료기관 개설 신고, 사업자등록, 각종 인허가',
    subtasks: [
      { id: '3-1', title: '의료기관 개설 신고', description: '관할 보건소에 개설 신고서 제출', estimatedDays: 14, estimatedCost: 0 },
      { id: '3-2', title: '사업자등록', description: '세무서 사업자등록 (면세사업자)', estimatedDays: 3, estimatedCost: 0 },
      { id: '3-3', title: '요양기관 지정 신청', description: '건강보험심사평가원 요양기관 신청', estimatedDays: 21, estimatedCost: 0 },
      { id: '3-4', title: '의료폐기물 위탁 계약', description: '의료폐기물 처리업체 계약', estimatedDays: 7, estimatedCost: 30 },
      { id: '3-5', title: '진단용 방사선 발생장치 신고', description: 'X-ray 등 방사선 장비 사용 시 신고', estimatedDays: 14, estimatedCost: 50, tips: '해당 장비 없으면 생략' },
      { id: '3-6', title: '세무사 / 노무사 계약', description: '기장 대행, 4대보험, 근로계약서 자문', estimatedDays: 7, estimatedCost: 50 },
    ],
  },
  {
    id: 4,
    title: '인테리어 / 설계',
    icon: 'Ruler',
    month: 4,
    duration: 3,
    color: '#8B5CF6',
    description: '의원 설계, 인테리어 시공, 의료가스/전기 공사',
    subtasks: [
      { id: '4-1', title: '인테리어 업체 선정', description: '의료 전문 인테리어 3곳 이상 비교 견적', estimatedDays: 14, tips: '메디플라톤 인테리어 견적 활용' },
      { id: '4-2', title: '설계 도면 확정', description: '진료실, 대기실, 처치실, 상담실 배치', estimatedDays: 14, estimatedCost: 500 },
      { id: '4-3', title: '인테리어 시공', description: '바닥, 벽체, 천장, 조명 공사', estimatedDays: 45, estimatedCost: 8000 },
      { id: '4-4', title: '의료가스 공사', description: '산소, 흡인, 공기 배관 (해당 시)', estimatedDays: 14, estimatedCost: 1500 },
      { id: '4-5', title: '전기/통신 공사', description: 'EMR 네트워크, CCTV, 인터폰, 전화', estimatedDays: 14, estimatedCost: 800 },
      { id: '4-6', title: '간판 제작 / 설치', description: '외부 간판, 실내 안내판, 층별 안내', estimatedDays: 14, estimatedCost: 500 },
    ],
  },
  {
    id: 5,
    title: '의료장비 / 기자재',
    icon: 'Stethoscope',
    month: 5,
    duration: 2,
    color: '#EC4899',
    description: '의료장비 구매, 진료 소모품, 가구/집기',
    subtasks: [
      { id: '5-1', title: '필수 의료장비 구매', description: '진료과별 필수 장비 리스트 작성 및 발주', estimatedDays: 21, estimatedCost: 15000, tips: '리스/렌탈 옵션도 비교' },
      { id: '5-2', title: '진료 소모품 구매', description: '주사기, 거즈, 소독제, 약품 등 초도 물량', estimatedDays: 7, estimatedCost: 500 },
      { id: '5-3', title: 'EMR 시스템 도입', description: 'EMR 업체 선정, 설치, 초기 세팅', estimatedDays: 14, estimatedCost: 800, tips: '클라우드형 추천 (유지보수 용이)' },
      { id: '5-4', title: '가구/집기 구매', description: '대기실 의자, 진료 데스크, 수납장 등', estimatedDays: 14, estimatedCost: 1000 },
      { id: '5-5', title: '장비 설치 및 검수', description: '설치 완료 후 작동 테스트, AS 조건 확인', estimatedDays: 7 },
    ],
  },
  {
    id: 6,
    title: '인력 채용',
    icon: 'Users',
    month: 7,
    duration: 2,
    color: '#06B6D4',
    description: '간호사, 간호조무사, 원무 행정 직원 채용',
    subtasks: [
      { id: '6-1', title: '직원 채용 계획', description: '필요 인원, 직급, 급여 기준 설정', estimatedDays: 7 },
      { id: '6-2', title: '채용 공고 게시', description: '의료 전문 구인사이트, 지역 커뮤니티 활용', estimatedDays: 7, estimatedCost: 30 },
      { id: '6-3', title: '면접 및 최종 채용', description: '서류 심사, 면접, 레퍼런스 체크', estimatedDays: 21 },
      { id: '6-4', title: '근로계약서 작성', description: '급여, 근무시간, 복리후생, 수습 기간 명시', estimatedDays: 7, estimatedCost: 0, tips: '노무사 검토 필수' },
      { id: '6-5', title: '직원 교육', description: 'EMR 사용법, 진료 프로세스, 응급 대응 교육', estimatedDays: 14 },
    ],
  },
  {
    id: 7,
    title: '마케팅 준비',
    icon: 'Megaphone',
    month: 9,
    duration: 2,
    color: '#F97316',
    description: '브랜딩, 온/오프라인 마케팅, 사전 예약 시스템',
    subtasks: [
      { id: '7-1', title: 'CI/BI 디자인', description: '로고, 명함, 진료카드, 봉투 등 디자인', estimatedDays: 14, estimatedCost: 300 },
      { id: '7-2', title: '홈페이지 / 블로그 제작', description: '네이버 플레이스, 홈페이지, 블로그 세팅', estimatedDays: 14, estimatedCost: 300, tips: '네이버 스마트플레이스 필수 등록' },
      { id: '7-3', title: 'SNS 채널 개설', description: '인스타그램, 카카오톡 채널, 유튜브', estimatedDays: 7, estimatedCost: 0 },
      { id: '7-4', title: '지역 마케팅', description: '전단지, 현수막, 지역 커뮤니티 홍보', estimatedDays: 14, estimatedCost: 200 },
      { id: '7-5', title: '온라인 광고 셋업', description: '네이버 검색광고, 카카오 모먼트, SNS 광고', estimatedDays: 7, estimatedCost: 500, tips: '월 광고비 별도' },
      { id: '7-6', title: '사전 예약 시스템 구축', description: '네이버 예약, 자체 예약 시스템 연동', estimatedDays: 7, estimatedCost: 100 },
    ],
  },
  {
    id: 8,
    title: '개원 / 오픈',
    icon: 'PartyPopper',
    month: 11,
    duration: 2,
    color: '#EF4444',
    description: '시범 운영, 오픈 이벤트, 정식 개원',
    subtasks: [
      { id: '8-1', title: '리허설 운영 (1주)', description: '지인/가족 대상 모의 진료, 동선 확인', estimatedDays: 7 },
      { id: '8-2', title: '소방/안전 점검', description: '소방서 합동 점검, 소화기/비상구 확인', estimatedDays: 3, estimatedCost: 0 },
      { id: '8-3', title: '건강보험 청구 테스트', description: 'EMR → 심평원 청구 프로세스 테스트', estimatedDays: 7 },
      { id: '8-4', title: '오픈 이벤트 기획', description: '개원 기념 이벤트, 할인, 기념품 준비', estimatedDays: 7, estimatedCost: 300 },
      { id: '8-5', title: '정식 개원', description: '개원일 진료 시작, 첫 환자 맞이', estimatedDays: 1 },
      { id: '8-6', title: '개원 후 1개월 점검', description: '환자수 추이, 직원 적응도, 시스템 안정성 점검', estimatedDays: 30, tips: '메디플라톤 개원 후 대시보드 활용' },
    ],
  },
]

export const getTotalCost = (phases: Phase[]): number => {
  return phases.reduce((total, phase) => {
    return total + phase.subtasks.reduce((sub, task) => sub + (task.estimatedCost || 0), 0)
  }, 0)
}

export const getPhaseCost = (phase: Phase): number => {
  return phase.subtasks.reduce((sum, task) => sum + (task.estimatedCost || 0), 0)
}
