export interface CostCategory {
  id: string
  name: string
  icon: string
  budgetRate: number   // 예산형 (만원/평)
  standardRate: number // 표준형 (만원/평)
  premiumRate: number  // 프리미엄형 (만원/평)
  description: string
}

export interface SpecialtyConfig {
  id: string
  name: string
  minArea: number     // 최소 권장 평수
  maxArea: number     // 최대 권장 평수
  recommendedArea: number // 권장 평수
  specialNotes: string[]
  extraCosts: { name: string; budgetCost: number; standardCost: number; premiumCost: number }[]
}

export const costCategories: CostCategory[] = [
  {
    id: 'design',
    name: '설계 / 디자인',
    icon: 'PenTool',
    budgetRate: 15,
    standardRate: 25,
    premiumRate: 40,
    description: '공간 설계, 3D 렌더링, 인허가 도면',
  },
  {
    id: 'demolition',
    name: '철거 / 기초공사',
    icon: 'Hammer',
    budgetRate: 10,
    standardRate: 15,
    premiumRate: 20,
    description: '기존 구조물 철거, 바닥 레벨링, 방수 공사',
  },
  {
    id: 'electrical',
    name: '전기 / 통신 공사',
    icon: 'Zap',
    budgetRate: 20,
    standardRate: 30,
    premiumRate: 45,
    description: '전기 배선, 콘센트, 조명, LAN, CCTV, 인터폰',
  },
  {
    id: 'hvac',
    name: '냉난방 / 공조',
    icon: 'Wind',
    budgetRate: 25,
    standardRate: 35,
    premiumRate: 50,
    description: '에어컨, 환기 시스템, 공기청정, 온수 설비',
  },
  {
    id: 'plumbing',
    name: '배관 / 급배수',
    icon: 'Droplets',
    budgetRate: 15,
    standardRate: 20,
    premiumRate: 30,
    description: '상하수도, 세면대, 싱크대, 급탕기',
  },
  {
    id: 'medgas',
    name: '의료가스 배관',
    icon: 'Cylinder',
    budgetRate: 10,
    standardRate: 18,
    premiumRate: 25,
    description: '산소, 아산화질소, 진공흡인 배관 (해당 진료과)',
  },
  {
    id: 'interior',
    name: '내장 공사',
    icon: 'Paintbrush',
    budgetRate: 35,
    standardRate: 55,
    premiumRate: 85,
    description: '바닥재, 벽지, 천장, 몰딩, 도장',
  },
  {
    id: 'furniture',
    name: '가구 / 집기',
    icon: 'Armchair',
    budgetRate: 20,
    standardRate: 35,
    premiumRate: 55,
    description: '진료 데스크, 캐비닛, 대기 의자, 수납장',
  },
  {
    id: 'signage',
    name: '간판 / 사인물',
    icon: 'SquareAsterisk',
    budgetRate: 5,
    standardRate: 10,
    premiumRate: 18,
    description: '외부 간판, LED, 실내 안내판, 층별 안내',
  },
  {
    id: 'fire',
    name: '소방 / 안전',
    icon: 'ShieldCheck',
    budgetRate: 8,
    standardRate: 12,
    premiumRate: 15,
    description: '스프링클러, 소화기, 비상 조명, 피난 안내',
  },
]

export const specialtyConfigs: SpecialtyConfig[] = [
  {
    id: 'internal',
    name: '내과',
    minArea: 25,
    maxArea: 50,
    recommendedArea: 35,
    specialNotes: ['내시경실 별도 구획 필요 시 +5평', '채혈/주사실 별도 공간 권장'],
    extraCosts: [
      { name: '내시경실 추가공사', budgetCost: 500, standardCost: 800, premiumCost: 1200 },
    ],
  },
  {
    id: 'ortho',
    name: '정형외과',
    minArea: 30,
    maxArea: 60,
    recommendedArea: 45,
    specialNotes: ['물리치료실 최소 10평 확보', 'X-ray실 방사선 차폐 필수'],
    extraCosts: [
      { name: 'X-ray실 납차폐 공사', budgetCost: 800, standardCost: 1200, premiumCost: 1800 },
      { name: '물리치료실 바닥강화', budgetCost: 200, standardCost: 350, premiumCost: 500 },
    ],
  },
  {
    id: 'derma',
    name: '피부과',
    minArea: 25,
    maxArea: 50,
    recommendedArea: 35,
    specialNotes: ['레이저실 방진/방음 처리', '시술실 환기 시스템 강화'],
    extraCosts: [
      { name: '레이저실 특수 시공', budgetCost: 400, standardCost: 700, premiumCost: 1000 },
    ],
  },
  {
    id: 'ent',
    name: '이비인후과',
    minArea: 25,
    maxArea: 45,
    recommendedArea: 35,
    specialNotes: ['방음 청력검사실 필수', '네뷸라이저 급배수 설비'],
    extraCosts: [
      { name: '방음 검사실', budgetCost: 500, standardCost: 800, premiumCost: 1200 },
    ],
  },
  {
    id: 'ophth',
    name: '안과',
    minArea: 30,
    maxArea: 55,
    recommendedArea: 40,
    specialNotes: ['암실 검사실 필수', '수술실 클린룸 등급 필요 시 비용 대폭 증가'],
    extraCosts: [
      { name: '암실 검사실 시공', budgetCost: 300, standardCost: 500, premiumCost: 800 },
      { name: '수술실 (클린룸)', budgetCost: 2000, standardCost: 3500, premiumCost: 5000 },
    ],
  },
  {
    id: 'pediatric',
    name: '소아청소년과',
    minArea: 25,
    maxArea: 45,
    recommendedArea: 35,
    specialNotes: ['키즈 대기공간 별도 확보', '격리 진료실 1개 이상 권장'],
    extraCosts: [
      { name: '키즈 대기공간 특수시공', budgetCost: 200, standardCost: 400, premiumCost: 600 },
    ],
  },
  {
    id: 'psychiatry',
    name: '정신건강의학과',
    minArea: 20,
    maxArea: 40,
    recommendedArea: 30,
    specialNotes: ['상담실 방음 처리 필수', '아늑한 분위기 연출 중요'],
    extraCosts: [
      { name: '방음 상담실 (2개)', budgetCost: 400, standardCost: 700, premiumCost: 1000 },
    ],
  },
  {
    id: 'obgyn',
    name: '산부인과',
    minArea: 30,
    maxArea: 55,
    recommendedArea: 40,
    specialNotes: ['초음파실 암막 처리', '임산부 동선 배려 (넓은 복도)'],
    extraCosts: [
      { name: '초음파실 특수시공', budgetCost: 300, standardCost: 500, premiumCost: 700 },
    ],
  },
  {
    id: 'dental',
    name: '치과',
    minArea: 25,
    maxArea: 50,
    recommendedArea: 35,
    specialNotes: ['유니트체어 급배수/에어 배관 필수', 'X-ray실 납차폐'],
    extraCosts: [
      { name: '유니트체어 배관 (5대 기준)', budgetCost: 800, standardCost: 1200, premiumCost: 1800 },
      { name: 'X-ray실 차폐공사', budgetCost: 600, standardCost: 900, premiumCost: 1300 },
    ],
  },
  {
    id: 'plastic',
    name: '성형외과',
    minArea: 35,
    maxArea: 70,
    recommendedArea: 50,
    specialNotes: ['수술실 클린룸 필수', '회복실 별도 구획', '고급 인테리어 선호도 높음'],
    extraCosts: [
      { name: '수술실 (클린룸)', budgetCost: 2500, standardCost: 4000, premiumCost: 6000 },
      { name: '회복실 시공', budgetCost: 400, standardCost: 700, premiumCost: 1000 },
    ],
  },
  {
    id: 'rehab',
    name: '재활의학과',
    minArea: 40,
    maxArea: 80,
    recommendedArea: 55,
    specialNotes: ['물리치료실 최소 15평', '운동치료실 바닥 강화'],
    extraCosts: [
      { name: '치료실 바닥 강화/매트', budgetCost: 300, standardCost: 500, premiumCost: 800 },
    ],
  },
  {
    id: 'family',
    name: '가정의학과',
    minArea: 25,
    maxArea: 45,
    recommendedArea: 35,
    specialNotes: ['건강검진 공간 별도 확보 시 유리', '채혈실 별도 권장'],
    extraCosts: [
      { name: '검진센터 구획', budgetCost: 400, standardCost: 700, premiumCost: 1000 },
    ],
  },
  {
    id: 'km',
    name: '한의원',
    minArea: 20,
    maxArea: 40,
    recommendedArea: 30,
    specialNotes: ['한약 조제실 환기 필수', '침상 배치 공간 확보'],
    extraCosts: [
      { name: '한약 조제실 환기시설', budgetCost: 200, standardCost: 350, premiumCost: 500 },
    ],
  },
]

export type GradeType = 'budget' | 'standard' | 'premium'

export const gradeLabels: Record<GradeType, { label: string; description: string; color: string }> = {
  budget: { label: '예산형', description: '기능 중심, 비용 절감', color: '#10B981' },
  standard: { label: '표준형', description: '가성비 균형', color: '#3B82F6' },
  premium: { label: '프리미엄', description: '고급 마감, 브랜딩 강화', color: '#8B5CF6' },
}

export const calculateCosts = (
  area: number,
  specialtyId: string,
  grade: GradeType
): { categories: { name: string; cost: number }[]; extraCosts: { name: string; cost: number }[]; total: number } => {
  const rateKey = grade === 'budget' ? 'budgetRate' : grade === 'standard' ? 'standardRate' : 'premiumRate'
  const costKey = grade === 'budget' ? 'budgetCost' : grade === 'standard' ? 'standardCost' : 'premiumCost'

  const categories = costCategories.map((cat) => ({
    name: cat.name,
    cost: Math.round(cat[rateKey] * area),
  }))

  const specialty = specialtyConfigs.find((s) => s.id === specialtyId)
  const extraCosts = (specialty?.extraCosts || []).map((ec) => ({
    name: ec.name,
    cost: ec[costKey],
  }))

  const categoryTotal = categories.reduce((sum, c) => sum + c.cost, 0)
  const extraTotal = extraCosts.reduce((sum, c) => sum + c.cost, 0)

  return { categories, extraCosts, total: categoryTotal + extraTotal }
}
