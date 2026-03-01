/**
 * Phase별 EMR 기능 노출 설정
 *
 * 개원 준비 과정에서 점진적으로 EMR 기능에 노출시켜
 * 개원 완료 시 이미 EMR을 능숙하게 사용하는 상태로 만드는 퍼널 설정
 */

export type EmrExposureLevel = 'minimal' | 'low' | 'medium' | 'high' | 'full'

export interface EmrFunnelTool {
  id: string
  name: string
  description: string
  href: string
  icon: string        // Lucide icon name
  highlight: boolean
  ctaText: string
}

export interface EmrFunnelBanner {
  title: string
  description: string
  ctaText: string
  ctaHref: string
  style: 'subtle' | 'standard' | 'prominent' | 'celebration'
}

export interface EmrFunnelPhaseConfig {
  phase: number
  phaseName: string
  exposureLevel: EmrExposureLevel
  strategy: string
  tools: EmrFunnelTool[]
  banner: EmrFunnelBanner | null
  kpiLabels: [string, string, string, string]
}

export const emrFunnelConfig: EmrFunnelPhaseConfig[] = [
  {
    phase: 1,
    phaseName: '사업계획 수립',
    exposureLevel: 'minimal',
    strategy: 'MediMatch 분석 도구만 노출 (EMR이라 안 함)',
    tools: [
      {
        id: 'sim-mini',
        name: '수익성 시뮬레이션',
        description: '예상 매출·비용·손익분기 분석으로 사업 타당성을 검증하세요',
        href: '/opening-package#simulation',
        icon: 'Calculator',
        highlight: false,
        ctaText: '시뮬레이션 시작',
      },
      {
        id: 'loan-calc',
        name: '대출 계산기',
        description: '개원 자금 대출 시 월 상환금을 미리 계산해보세요',
        href: '/emr/opening/budget?tab=loan',
        icon: 'Landmark',
        highlight: false,
        ctaText: '대출 계산',
      },
    ],
    banner: null,
    kpiLabels: ['예상 월매출', 'BEP 개월', '총 투자비', '자기자본비율'],
  },
  {
    phase: 2,
    phaseName: '입지 선정',
    exposureLevel: 'low',
    strategy: '위치 분석 도구 → "이 데이터, EMR에서도 볼 수 있어요"',
    tools: [
      {
        id: 'location-analysis',
        name: '경쟁의원 분석',
        description: '심평원 데이터 기반 경쟁 의원 현황과 지역 통계를 확인하세요',
        href: '/opening-package#location',
        icon: 'MapPin',
        highlight: false,
        ctaText: '지역 분석',
      },
      {
        id: 'building-search',
        name: '매물 검색',
        description: '개원 적합 매물을 검색하고 임대 조건을 비교하세요',
        href: '/opening-package#location',
        icon: 'Building2',
        highlight: false,
        ctaText: '매물 보기',
      },
    ],
    banner: {
      title: '지역 분석 데이터를 저장하세요',
      description: '분석한 지역 데이터는 개원 후에도 경쟁 모니터링에 활용됩니다',
      ctaText: '데이터 저장하기',
      ctaHref: '/opening-package#location',
      style: 'subtle',
    },
    kpiLabels: ['후보지 수', '경쟁의원 수', '평균 임대료', '유동인구'],
  },
  {
    phase: 3,
    phaseName: '인허가 / 행정',
    exposureLevel: 'medium',
    strategy: '"서류를 체계적으로 관리하세요" → 문서 개념 도입',
    tools: [
      {
        id: 'permit-guide',
        name: '인허가 가이드',
        description: '개설 신고부터 요양기관 지정까지, 필요 서류와 절차를 안내합니다',
        href: '/emr/opening/permits',
        icon: 'FileCheck',
        highlight: false,
        ctaText: '가이드 보기',
      },
      {
        id: 'doc-management',
        name: '서류 관리',
        description: '개원 관련 서류를 체계적으로 관리하고 진행 상황을 추적하세요',
        href: '/emr/opening/permits',
        icon: 'FolderOpen',
        highlight: false,
        ctaText: '서류 관리',
      },
    ],
    banner: {
      title: '서류를 체계적으로 관리하세요',
      description: 'MediMatch에서 인허가 서류 진행 상황을 한눈에 확인할 수 있습니다',
      ctaText: '서류 관리 시작',
      ctaHref: '/emr/opening/permits',
      style: 'standard',
    },
    kpiLabels: ['남은 허가 건', '예상 소요일', '완료 서류', '누적 비용'],
  },
  {
    phase: 4,
    phaseName: '인테리어 / 설계',
    exposureLevel: 'medium',
    strategy: '"공동구매로 비용 절감" → MediMatch 거래 시스템 체험',
    tools: [
      {
        id: 'partner-match',
        name: '인테리어 파트너',
        description: '검증된 의료 전문 인테리어 업체를 비교하고 견적을 받으세요',
        href: '/emr/opening/vendors?tab=interior',
        icon: 'Paintbrush',
        highlight: false,
        ctaText: '업체 비교',
      },
      {
        id: 'group-buying',
        name: '공동구매',
        description: '다른 개원의와 함께 구매하면 최대 30% 비용을 절감할 수 있습니다',
        href: '/emr/group-buying',
        icon: 'ShoppingCart',
        highlight: true,
        ctaText: '공동구매 참여',
      },
      {
        id: 'interior-cost',
        name: '인테리어 비용 계산',
        description: '평수별, 진료과별 인테리어 예상 비용을 계산하세요',
        href: '/emr/opening/budget?tab=phase',
        icon: 'Calculator',
        highlight: false,
        ctaText: '비용 계산',
      },
    ],
    banner: {
      title: '공동구매로 비용을 절감하세요',
      description: 'MediMatch 공동구매에 참여하면 인테리어 자재를 최대 30% 할인받을 수 있습니다',
      ctaText: '공동구매 보기',
      ctaHref: '/emr/group-buying',
      style: 'standard',
    },
    kpiLabels: ['총 공사비', '계약 업체', '남은 공사일', '절감액'],
  },
  {
    phase: 5,
    phaseName: '의료장비 / 기자재',
    exposureLevel: 'high',
    strategy: '"EMR 시스템을 지금 세팅하세요" → ★ 핵심 전환점 ★',
    tools: [
      {
        id: 'equipment-checklist',
        name: '장비 체크리스트',
        description: '진료과별 필수/권장/선택 장비 목록과 예상 비용을 확인하세요',
        href: '/emr/opening/phase/5?tab=checklist',
        icon: 'ListChecks',
        highlight: false,
        ctaText: '장비 확인',
      },
      {
        id: 'equipment-group-buy',
        name: '장비 공동구매',
        description: '의료장비를 공동구매로 구매하면 최대 40% 절감 가능합니다',
        href: '/emr/group-buying',
        icon: 'ShoppingCart',
        highlight: true,
        ctaText: '공동구매 참여',
      },
      {
        id: 'emr-onboarding',
        name: 'EMR 시스템 세팅',
        description: '장비 세팅과 함께 EMR도 같이 세팅하세요. 무료로 시작할 수 있습니다',
        href: '/emr/dashboard',
        icon: 'Monitor',
        highlight: true,
        ctaText: 'EMR 무료 시작',
      },
    ],
    banner: {
      title: '지금이 EMR을 세팅할 최적의 시점입니다',
      description: '장비 설치와 함께 EMR을 세팅하면 개원 시 바로 진료를 시작할 수 있습니다. MediMatch EMR은 무료로 시작할 수 있습니다.',
      ctaText: 'EMR 무료 시작하기',
      ctaHref: '/emr/dashboard',
      style: 'prominent',
    },
    kpiLabels: ['총 장비비', '구매 항목 수', '리스 비율', 'EMR 준비도'],
  },
  {
    phase: 6,
    phaseName: '인력 채용',
    exposureLevel: 'high',
    strategy: '"인건비 최적화" → EMR 비용분석 기능 직접 사용',
    tools: [
      {
        id: 'staff-cost',
        name: '인건비 시뮬레이터',
        description: '직종별 인건비와 4대보험료를 계산하고 최적의 인력 구성을 설계하세요',
        href: '/emr/cost/staff',
        icon: 'Users',
        highlight: true,
        ctaText: '인건비 계산',
      },
      {
        id: 'hiring-template',
        name: '채용공고 템플릿',
        description: '의료기관 채용공고 양식을 제공합니다',
        href: '/emr/opening/phase/6?tab=documents',
        icon: 'FileText',
        highlight: false,
        ctaText: '템플릿 보기',
      },
    ],
    banner: {
      title: 'EMR으로 인건비를 최적화하세요',
      description: 'MediMatch의 비용 분석 기능으로 인건비 구조를 설계하고 최적화할 수 있습니다',
      ctaText: '인건비 분석 시작',
      ctaHref: '/emr/cost/staff',
      style: 'prominent',
    },
    kpiLabels: ['총 인건비', '채용 완료', '필요 인원', '4대보험'],
  },
  {
    phase: 7,
    phaseName: '마케팅 준비',
    exposureLevel: 'high',
    strategy: '"마케팅 ROI 분석" → EMR 마케팅 기능 직접 사용',
    tools: [
      {
        id: 'marketing-cost',
        name: '마케팅 비용 분석',
        description: '채널별 마케팅 예산을 설정하고 예상 ROI를 분석하세요',
        href: '/emr/cost/marketing',
        icon: 'TrendingUp',
        highlight: true,
        ctaText: 'ROI 분석',
      },
      {
        id: 'naver-guide',
        name: '네이버 플레이스 가이드',
        description: '네이버 스마트플레이스 등록부터 최적화까지 단계별 가이드',
        href: '/emr/opening/phase/7?tab=documents',
        icon: 'MapPinned',
        highlight: false,
        ctaText: '가이드 보기',
      },
      {
        id: 'marketing-channels',
        name: '마케팅 채널 체크리스트',
        description: '개원 시 활용 가능한 마케팅 채널을 확인하고 준비하세요',
        href: '/emr/opening/phase/7?tab=checklist',
        icon: 'Megaphone',
        highlight: false,
        ctaText: '체크리스트 보기',
      },
    ],
    banner: {
      title: 'EMR으로 마케팅 ROI를 측정하세요',
      description: '개원 후 환자 유입 채널별 효과를 측정하고 마케팅 비용을 최적화할 수 있습니다',
      ctaText: '마케팅 분석 시작',
      ctaHref: '/emr/cost/marketing',
      style: 'prominent',
    },
    kpiLabels: ['마케팅 예산', '채널 수', '예상 신환자', 'ROI 예측'],
  },
  {
    phase: 8,
    phaseName: '개원 / 오픈',
    exposureLevel: 'full',
    strategy: '"보험청구 테스트" → EMR 핵심 기능 완전 사용',
    tools: [
      {
        id: 'claims-test',
        name: '보험청구 테스트',
        description: '심평원 EDI 청구 프로세스를 미리 연습하고 오류를 방지하세요',
        href: '/emr/claims',
        icon: 'Receipt',
        highlight: true,
        ctaText: '청구 테스트',
      },
      {
        id: 'patient-mgmt',
        name: '환자관리 미리보기',
        description: '환자 등록부터 진료 기록까지 EMR 환자관리 기능을 체험하세요',
        href: '/emr/patients',
        icon: 'UserPlus',
        highlight: true,
        ctaText: '환자관리 체험',
      },
      {
        id: 'emr-dashboard',
        name: 'EMR 대시보드',
        description: '개원 후 사용할 EMR 대시보드를 미리 확인하세요',
        href: '/emr/dashboard',
        icon: 'LayoutDashboard',
        highlight: false,
        ctaText: '대시보드 보기',
      },
    ],
    banner: {
      title: '축하합니다! 개원 준비가 거의 완료되었습니다',
      description: '보험청구 테스트를 완료하면 개원 즉시 원활한 진료가 가능합니다. MediMatch EMR과 함께 성공적인 개원을 시작하세요!',
      ctaText: 'EMR 대시보드로 이동',
      ctaHref: '/emr/dashboard',
      style: 'celebration',
    },
    kpiLabels: ['남은 점검', '첫달 예상환자', '청구 준비도', 'D-Day'],
  },
]

// Helper: get config by phase
export const getPhaseFunnelConfig = (phaseId: number): EmrFunnelPhaseConfig | undefined =>
  emrFunnelConfig.find(c => c.phase === phaseId)

// Helper: get exposure level color
export const getExposureLevelColor = (level: EmrExposureLevel): string => {
  switch (level) {
    case 'minimal': return '#94A3B8'
    case 'low': return '#60A5FA'
    case 'medium': return '#F59E0B'
    case 'high': return '#F97316'
    case 'full': return '#EF4444'
  }
}

// Helper: get banner style classes
export const getBannerStyleClasses = (style: EmrFunnelBanner['style']): string => {
  switch (style) {
    case 'subtle':
      return 'bg-secondary/30 border-border'
    case 'standard':
      return 'bg-primary/5 border-primary/20'
    case 'prominent':
      return 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30'
    case 'celebration':
      return 'bg-gradient-to-r from-green-500/10 via-primary/5 to-amber-500/10 border-green-500/30'
  }
}
