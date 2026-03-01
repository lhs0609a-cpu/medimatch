export interface PermitDocument {
  id: string
  name: string
  description: string
  required: boolean
  templateUrl?: string  // placeholder '#'
}

export interface PermitRequirement {
  id: string
  category: string
  title: string
  icon: string  // Lucide icon name
  agency: string
  agencyAddress?: string
  agencyPhone?: string
  agencyWebsite?: string
  estimatedDays: number
  estimatedCost: number  // 만원
  documents: PermitDocument[]
  steps: string[]
  tips: string[]
  linkedSubtaskId: string  // from phases.ts (e.g., '3-1')
  conditionalOn?: string  // e.g., 'X-ray 장비 보유 시'
}

export interface PermitCategory {
  id: string
  name: string
  icon: string
  color: string
  permits: PermitRequirement[]
}

export const permitCategories: PermitCategory[] = [
  // 1. 의료기관 개설 신고 (보건소)
  {
    id: 'clinic-registration',
    name: '의료기관 개설 신고',
    icon: 'Building2',
    color: '#3B82F6',
    permits: [{
      id: 'clinic-reg-1',
      category: 'clinic-registration',
      title: '의료기관 개설 신고서 제출',
      icon: 'FileText',
      agency: '관할 보건소',
      agencyPhone: '지역 보건소 대표번호',
      agencyWebsite: 'https://www.gov.kr',
      estimatedDays: 14,
      estimatedCost: 0,
      documents: [
        { id: 'doc-1-1', name: '의료기관 개설 신고서', description: '보건소 양식 (온라인 다운로드 가능)', required: true },
        { id: 'doc-1-2', name: '의사 면허증 사본', description: '원본 대조필', required: true },
        { id: 'doc-1-3', name: '건물 임대차 계약서', description: '소유 시 등기부등본', required: true },
        { id: 'doc-1-4', name: '시설 평면도', description: '진료실, 대기실 등 배치도', required: true },
        { id: 'doc-1-5', name: '진료과목 신고서', description: '표방 진료과목 기재', required: true },
        { id: 'doc-1-6', name: '사진 (외부/내부)', description: '간판, 진료실 등 촬영', required: true },
      ],
      steps: [
        '보건소 방문 또는 정부24 온라인 접수',
        '개설 신고서 + 첨부서류 제출',
        '보건소 현장 실사 (3~7일 이내)',
        '적합 판정 시 개설 허가증 발급',
      ],
      tips: [
        '인테리어 완료 후 신고해야 현장 실사 통과 가능',
        '진료과목 변경 시 변경 신고 필요',
        '복수 진료과 표방 시 각각 신고',
      ],
      linkedSubtaskId: '3-1',
    }],
  },

  // 2. 사업자등록 (세무서)
  {
    id: 'business-registration',
    name: '사업자등록',
    icon: 'Receipt',
    color: '#10B981',
    permits: [{
      id: 'biz-reg-1',
      category: 'business-registration',
      title: '면세사업자 등록',
      icon: 'FileCheck',
      agency: '관할 세무서',
      agencyWebsite: 'https://www.hometax.go.kr',
      estimatedDays: 3,
      estimatedCost: 0,
      documents: [
        { id: 'doc-2-1', name: '사업자등록 신청서', description: '홈택스 또는 세무서 양식', required: true },
        { id: 'doc-2-2', name: '의료기관 개설 신고 확인증', description: '보건소 발급', required: true },
        { id: 'doc-2-3', name: '임대차 계약서 사본', description: '사업장 소재지 확인용', required: true },
        { id: 'doc-2-4', name: '신분증', description: '대표자 신분증', required: true },
      ],
      steps: [
        '홈택스 온라인 또는 세무서 방문 신청',
        '면세사업자로 등록 (의료업은 부가세 면세)',
        '사업자등록증 발급 (즉일~3일)',
      ],
      tips: [
        '의료기관 개설 신고 완료 후 진행',
        '개원 전 미리 등록하면 장비 구매 시 세금계산서 수령 가능',
        '홈택스에서 온라인 발급 가능',
      ],
      linkedSubtaskId: '3-2',
    }],
  },

  // 3. 요양기관 지정 (심평원)
  {
    id: 'insurance-designation',
    name: '요양기관 지정 신청',
    icon: 'Shield',
    color: '#F59E0B',
    permits: [{
      id: 'ins-reg-1',
      category: 'insurance-designation',
      title: '건강보험 요양기관 지정 신청',
      icon: 'ShieldCheck',
      agency: '건강보험심사평가원',
      agencyPhone: '1644-2000',
      agencyWebsite: 'https://www.hira.or.kr',
      estimatedDays: 21,
      estimatedCost: 0,
      documents: [
        { id: 'doc-3-1', name: '요양기관 지정 신청서', description: '심평원 양식', required: true },
        { id: 'doc-3-2', name: '의료기관 개설 신고 확인증', description: '보건소 발급본', required: true },
        { id: 'doc-3-3', name: '사업자등록증 사본', description: '면세사업자', required: true },
        { id: 'doc-3-4', name: '통장 사본', description: '보험급여 입금용 계좌', required: true },
        { id: 'doc-3-5', name: '의사 면허증 사본', description: '원본 대조필', required: true },
        { id: 'doc-3-6', name: '요양기관 현황 신고서', description: '인력, 시설, 장비 현황', required: true },
      ],
      steps: [
        '심평원 홈페이지에서 신청서 다운로드',
        '첨부서류 준비 후 관할 심사평가원 지원에 접수',
        '서류 심사 + 현장 확인 (2~3주)',
        '요양기관 기호 부여 → 건강보험 청구 가능',
      ],
      tips: [
        '개원 예정일 최소 3주 전에 신청 필요',
        '요양기관 기호가 있어야 건강보험 청구 가능',
        'EMR 시스템에 요양기관 기호 등록 필수',
      ],
      linkedSubtaskId: '3-3',
    }],
  },

  // 4. 방사선 발생장치 신고 (조건부)
  {
    id: 'radiation',
    name: '방사선 발생장치 신고',
    icon: 'RadioTower',
    color: '#EC4899',
    permits: [{
      id: 'rad-1',
      category: 'radiation',
      title: '진단용 방사선 발생장치 설치 신고',
      icon: 'Radiation',
      agency: '관할 시/도청 보건과',
      estimatedDays: 14,
      estimatedCost: 50,
      documents: [
        { id: 'doc-4-1', name: '방사선 발생장치 설치 신고서', description: '시/도청 양식', required: true },
        { id: 'doc-4-2', name: '장비 사양서', description: '제조사 제공', required: true },
        { id: 'doc-4-3', name: '방사선 안전관리 책임자 선임서', description: '의사 또는 방사선사', required: true },
        { id: 'doc-4-4', name: '방사선 차폐 시공 확인서', description: '납차폐 시공업체 발급', required: true },
        { id: 'doc-4-5', name: '방사선량 측정 결과서', description: '공인기관 측정', required: true },
      ],
      steps: [
        '방사선 차폐 설계 및 시공',
        '차폐 시공 후 방사선량 측정 (공인기관)',
        '관할 시/도청에 설치 신고서 제출',
        '현장 확인 후 신고 수리',
      ],
      tips: [
        'X-ray, CT, 파노라마 등 방사선 장비 보유 시 필수',
        '차폐 공사는 인테리어 단계에서 함께 진행',
        '방사선사 채용 또는 의사가 직접 촬영 가능',
      ],
      linkedSubtaskId: '3-5',
      conditionalOn: 'X-ray, CT 등 방사선 장비 보유 시',
    }],
  },

  // 5. 의료폐기물 위탁 계약
  {
    id: 'medical-waste',
    name: '의료폐기물 위탁 계약',
    icon: 'Trash2',
    color: '#8B5CF6',
    permits: [{
      id: 'waste-1',
      category: 'medical-waste',
      title: '의료폐기물 처리업체 위탁 계약',
      icon: 'FileWarning',
      agency: '허가받은 의료폐기물 처리업체',
      estimatedDays: 7,
      estimatedCost: 30,
      documents: [
        { id: 'doc-5-1', name: '위탁 계약서', description: '처리업체와 계약', required: true },
        { id: 'doc-5-2', name: '의료폐기물 관리 대장', description: '자체 비치용', required: true },
        { id: 'doc-5-3', name: '폐기물 관리 책임자 지정서', description: '원장 또는 지정인', required: true },
      ],
      steps: [
        '지역 의료폐기물 처리업체 2~3곳 비교',
        '위탁 계약 체결 (월 수거 횟수, 비용 협의)',
        '폐기물 전용 보관함 설치',
        '관리 대장 비치 및 기록 시작',
      ],
      tips: [
        '월 비용은 배출량에 따라 20~50만원 수준',
        '전용 보관함은 업체에서 제공하는 경우도 있음',
        '보건소 실사 시 계약서 확인',
      ],
      linkedSubtaskId: '3-4',
    }],
  },

  // 6. 소방/안전 점검
  {
    id: 'fire-safety',
    name: '소방/안전 점검',
    icon: 'Flame',
    color: '#EF4444',
    permits: [{
      id: 'fire-1',
      category: 'fire-safety',
      title: '소방시설 점검 및 안전 확인',
      icon: 'ShieldAlert',
      agency: '관할 소방서',
      estimatedDays: 3,
      estimatedCost: 0,
      documents: [
        { id: 'doc-6-1', name: '소방시설 완공 검사 신청서', description: '소방서 양식', required: true },
        { id: 'doc-6-2', name: '소방시설 설계도', description: '소화기, 비상구, 스프링클러 배치', required: true },
        { id: 'doc-6-3', name: '소방안전관리자 선임서', description: '해당 시 (300㎡ 이상)', required: false },
      ],
      steps: [
        '인테리어 시 소방시설 설치 (소화기, 비상등, 유도등)',
        '소방서에 완공 검사 신청',
        '소방서 현장 점검',
        '적합 판정 시 검사 필증 발급',
      ],
      tips: [
        '인테리어 업체가 소방 시공도 함께 진행하는 경우 많음',
        '소화기 위치, 비상구 표시, 피난 안내도 필수',
        '개원 전 소방 점검 완료 필수',
      ],
      linkedSubtaskId: '8-2',
    }],
  },

  // 7. 세무사/노무사 계약
  {
    id: 'professional-services',
    name: '세무사/노무사 계약',
    icon: 'Briefcase',
    color: '#06B6D4',
    permits: [
      {
        id: 'tax-1',
        category: 'professional-services',
        title: '세무사 기장 대행 계약',
        icon: 'Calculator',
        agency: '세무법인 또는 개인 세무사',
        estimatedDays: 7,
        estimatedCost: 30,
        documents: [
          { id: 'doc-7-1', name: '기장 대행 계약서', description: '월 기장료, 결산 수수료 포함', required: true },
          { id: 'doc-7-2', name: '사업자등록증 사본', description: '세무사 제공용', required: true },
        ],
        steps: [
          '의료전문 세무사 2~3곳 상담',
          '월 기장료, 결산, 세무신고 범위 확인',
          '계약 체결',
        ],
        tips: [
          '의료업 전문 세무사 추천 (면세/과세 구분 중요)',
          '월 기장료 보통 15~30만원',
          '결산/종합소득세 신고 별도 비용 확인',
        ],
        linkedSubtaskId: '3-6',
      },
      {
        id: 'labor-1',
        category: 'professional-services',
        title: '노무사 자문 계약',
        icon: 'Users',
        agency: '노무법인 또는 개인 노무사',
        estimatedDays: 7,
        estimatedCost: 20,
        documents: [
          { id: 'doc-7-3', name: '자문 계약서', description: '월 자문료, 서비스 범위', required: true },
        ],
        steps: [
          '의료기관 전문 노무사 상담',
          '4대보험, 근로계약서, 취업규칙 자문 범위 확인',
          '계약 체결',
        ],
        tips: [
          '직원 5인 이상이면 취업규칙 작성 의무',
          '근로계약서 양식 제공받을 수 있음',
          '월 자문료 보통 10~20만원',
        ],
        linkedSubtaskId: '3-6',
      },
    ],
  },
]

// Helper: get all permits as flat list
export const getAllPermits = (): PermitRequirement[] =>
  permitCategories.flatMap(c => c.permits)

// Helper: get permit by linked subtask
export const getPermitBySubtask = (subtaskId: string): PermitRequirement | undefined =>
  getAllPermits().find(p => p.linkedSubtaskId === subtaskId)
