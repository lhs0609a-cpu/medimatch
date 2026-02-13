export interface FeeItem {
  code: string
  name: string
  category: '초진' | '재진' | '처치' | '검사' | '비보험'
  insuranceFee: number // 보험 수가 (원)
  selfPayRate: number // 본인부담률 (%)
  nonInsuranceFee?: number // 비보험 시 가격 (원)
  frequency: number // 월 평균 시행 횟수 (환자 100명 기준)
}

export interface SpecialtyFees {
  id: string
  name: string
  icon: string
  color: string
  avgDailyPatients: number // 평균 일 환자수
  avgNonInsuranceRatio: number // 평균 비보험 비율 (%)
  fees: FeeItem[]
}

export const specialties: SpecialtyFees[] = [
  {
    id: 'internal',
    name: '내과',
    icon: 'Heart',
    color: '#EF4444',
    avgDailyPatients: 45,
    avgNonInsuranceRatio: 15,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 30 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 70 },
      { code: 'E6541', name: '일반혈액검사 (CBC)', category: '검사', insuranceFee: 3690, selfPayRate: 30, frequency: 40 },
      { code: 'C3705', name: '간기능검사 (LFT)', category: '검사', insuranceFee: 8520, selfPayRate: 30, frequency: 25 },
      { code: 'E6591', name: '소변검사', category: '검사', insuranceFee: 1920, selfPayRate: 30, frequency: 20 },
      { code: 'EB014', name: '심전도 (ECG)', category: '검사', insuranceFee: 12100, selfPayRate: 30, frequency: 15 },
      { code: 'NI001', name: '영양주사 (비타민)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 30000, frequency: 20 },
      { code: 'NI002', name: '독감 예방접종', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 35000, frequency: 10 },
    ],
  },
  {
    id: 'ortho',
    name: '정형외과',
    icon: 'Bone',
    color: '#3B82F6',
    avgDailyPatients: 50,
    avgNonInsuranceRatio: 25,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 25 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 75 },
      { code: 'E7011', name: 'X-ray (단순촬영)', category: '검사', insuranceFee: 10550, selfPayRate: 30, frequency: 50 },
      { code: 'HZ271', name: '물리치료 (도수)', category: '처치', insuranceFee: 9800, selfPayRate: 30, frequency: 40 },
      { code: 'NI003', name: '도수치료 (비보험)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 80000, frequency: 25 },
      { code: 'NI004', name: '체외충격파 (ESWT)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 15 },
      { code: 'NI005', name: '프롤로 주사', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 100000, frequency: 10 },
    ],
  },
  {
    id: 'derma',
    name: '피부과',
    icon: 'Sparkles',
    color: '#EC4899',
    avgDailyPatients: 35,
    avgNonInsuranceRatio: 60,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 20 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 40 },
      { code: 'M0111', name: '피부 병변 절제', category: '처치', insuranceFee: 35420, selfPayRate: 30, frequency: 10 },
      { code: 'NI006', name: '레이저 토닝', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 150000, frequency: 30 },
      { code: 'NI007', name: '보톡스 (이마)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 100000, frequency: 15 },
      { code: 'NI008', name: '필러 시술', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 300000, frequency: 10 },
      { code: 'NI009', name: '스킨보톡스', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 200000, frequency: 8 },
    ],
  },
  {
    id: 'ent',
    name: '이비인후과',
    icon: 'Ear',
    color: '#F59E0B',
    avgDailyPatients: 55,
    avgNonInsuranceRatio: 10,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 30 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 70 },
      { code: 'E7101', name: '청력검사', category: '검사', insuranceFee: 8900, selfPayRate: 30, frequency: 20 },
      { code: 'R4461', name: '네뷸라이저', category: '처치', insuranceFee: 4200, selfPayRate: 30, frequency: 60 },
      { code: 'R4510', name: '비강 흡인', category: '처치', insuranceFee: 3150, selfPayRate: 30, frequency: 40 },
      { code: 'NI010', name: '코골이 수술 상담', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 5 },
    ],
  },
  {
    id: 'ophth',
    name: '안과',
    icon: 'Eye',
    color: '#06B6D4',
    avgDailyPatients: 40,
    avgNonInsuranceRatio: 35,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 25 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 50 },
      { code: 'E7201', name: '시력검사', category: '검사', insuranceFee: 5600, selfPayRate: 30, frequency: 60 },
      { code: 'E7202', name: '안압검사', category: '검사', insuranceFee: 4300, selfPayRate: 30, frequency: 40 },
      { code: 'E7210', name: 'OCT (망막검사)', category: '검사', insuranceFee: 25000, selfPayRate: 30, frequency: 15 },
      { code: 'NI011', name: '드림렌즈 피팅', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 400000, frequency: 5 },
      { code: 'NI012', name: 'IPL (안구건조)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 150000, frequency: 8 },
    ],
  },
  {
    id: 'pediatric',
    name: '소아청소년과',
    icon: 'Baby',
    color: '#10B981',
    avgDailyPatients: 50,
    avgNonInsuranceRatio: 8,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 35 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 65 },
      { code: 'E6541', name: '일반혈액검사', category: '검사', insuranceFee: 3690, selfPayRate: 30, frequency: 20 },
      { code: 'R4461', name: '네뷸라이저', category: '처치', insuranceFee: 4200, selfPayRate: 30, frequency: 50 },
      { code: 'NI013', name: '영유아 건강검진', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 40000, frequency: 10 },
      { code: 'NI014', name: '예방접종 (선택)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 80000, frequency: 8 },
    ],
  },
  {
    id: 'psychiatry',
    name: '정신건강의학과',
    icon: 'Brain',
    color: '#8B5CF6',
    avgDailyPatients: 25,
    avgNonInsuranceRatio: 30,
    fees: [
      { code: 'AA157', name: '초진 진찰료 (심층)', category: '초진', insuranceFee: 45620, selfPayRate: 30, frequency: 20 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 22840, selfPayRate: 30, frequency: 60 },
      { code: 'IA010', name: '심리검사 (종합)', category: '검사', insuranceFee: 85000, selfPayRate: 30, frequency: 10 },
      { code: 'IA011', name: '개인 정신치료', category: '처치', insuranceFee: 52750, selfPayRate: 30, frequency: 20 },
      { code: 'NI015', name: '상담 (비보험, 50분)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 150000, frequency: 15 },
    ],
  },
  {
    id: 'obgyn',
    name: '산부인과',
    icon: 'HeartPulse',
    color: '#F472B6',
    avgDailyPatients: 30,
    avgNonInsuranceRatio: 40,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 25 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 50 },
      { code: 'EB201', name: '초음파 (복부)', category: '검사', insuranceFee: 18500, selfPayRate: 30, frequency: 30 },
      { code: 'NI016', name: '자궁경부암 검진', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 15 },
      { code: 'NI017', name: 'HPV 검사', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 80000, frequency: 10 },
      { code: 'NI018', name: '호르몬 검사', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 60000, frequency: 10 },
    ],
  },
  {
    id: 'urology',
    name: '비뇨의학과',
    icon: 'Pill',
    color: '#0EA5E9',
    avgDailyPatients: 30,
    avgNonInsuranceRatio: 25,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 25 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 60 },
      { code: 'E6591', name: '소변검사', category: '검사', insuranceFee: 1920, selfPayRate: 30, frequency: 50 },
      { code: 'EB201', name: '초음파 (복부)', category: '검사', insuranceFee: 18500, selfPayRate: 30, frequency: 20 },
      { code: 'NI019', name: 'PSA 검사', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 30000, frequency: 15 },
      { code: 'NI020', name: '남성 기능 상담', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 10 },
    ],
  },
  {
    id: 'rehab',
    name: '재활의학과',
    icon: 'Activity',
    color: '#14B8A6',
    avgDailyPatients: 40,
    avgNonInsuranceRatio: 20,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 20 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 80 },
      { code: 'HZ271', name: '물리치료 (도수)', category: '처치', insuranceFee: 9800, selfPayRate: 30, frequency: 60 },
      { code: 'MX121', name: '운동치료', category: '처치', insuranceFee: 12000, selfPayRate: 30, frequency: 30 },
      { code: 'NI021', name: '도수치료 (비보험)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 80000, frequency: 20 },
      { code: 'NI022', name: '체외충격파', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 10 },
    ],
  },
  {
    id: 'dental',
    name: '치과',
    icon: 'Smile',
    color: '#A855F7',
    avgDailyPatients: 20,
    avgNonInsuranceRatio: 65,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 14830, selfPayRate: 30, frequency: 25 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 9960, selfPayRate: 30, frequency: 50 },
      { code: 'U2211', name: '스케일링', category: '처치', insuranceFee: 18000, selfPayRate: 30, frequency: 15 },
      { code: 'NI023', name: '임플란트 (1개)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 1200000, frequency: 3 },
      { code: 'NI024', name: '치아 미백', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 300000, frequency: 5 },
      { code: 'NI025', name: '교정 상담/진단', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 5 },
      { code: 'NI026', name: '레진 충전', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 150000, frequency: 10 },
    ],
  },
  {
    id: 'plastic',
    name: '성형외과',
    icon: 'Gem',
    color: '#D946EF',
    avgDailyPatients: 15,
    avgNonInsuranceRatio: 85,
    fees: [
      { code: 'AA157', name: '초진 진찰료 (상담)', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 30 },
      { code: 'NI027', name: '보톡스 (사각턱)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 150000, frequency: 20 },
      { code: 'NI028', name: '필러 (코/입술)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 400000, frequency: 15 },
      { code: 'NI029', name: '쌍꺼풀 수술', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 1500000, frequency: 3 },
      { code: 'NI030', name: '리프팅 시술', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 500000, frequency: 8 },
      { code: 'NI031', name: '지방흡입 (소)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 2000000, frequency: 2 },
    ],
  },
  {
    id: 'family',
    name: '가정의학과',
    icon: 'Home',
    color: '#65A30D',
    avgDailyPatients: 40,
    avgNonInsuranceRatio: 20,
    fees: [
      { code: 'AA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 30 },
      { code: 'AA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 60 },
      { code: 'E6541', name: '일반혈액검사', category: '검사', insuranceFee: 3690, selfPayRate: 30, frequency: 30 },
      { code: 'NI032', name: '종합건강검진', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 200000, frequency: 8 },
      { code: 'NI033', name: '비만 상담/처방', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 10 },
      { code: 'NI034', name: '영양주사 (비타민)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 30000, frequency: 15 },
    ],
  },
  {
    id: 'km',
    name: '한의원',
    icon: 'Leaf',
    color: '#059669',
    avgDailyPatients: 25,
    avgNonInsuranceRatio: 45,
    fees: [
      { code: 'KA157', name: '초진 진찰료', category: '초진', insuranceFee: 19170, selfPayRate: 30, frequency: 25 },
      { code: 'KA257', name: '재진 진찰료', category: '재진', insuranceFee: 12430, selfPayRate: 30, frequency: 55 },
      { code: 'KH251', name: '침술 치료', category: '처치', insuranceFee: 9700, selfPayRate: 30, frequency: 70 },
      { code: 'KH351', name: '부항 치료', category: '처치', insuranceFee: 6800, selfPayRate: 30, frequency: 30 },
      { code: 'NI035', name: '추나 요법', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 80000, frequency: 20 },
      { code: 'NI036', name: '한약 처방 (1달)', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 300000, frequency: 10 },
      { code: 'NI037', name: '약침 치료', category: '비보험', insuranceFee: 0, selfPayRate: 100, nonInsuranceFee: 50000, frequency: 15 },
    ],
  },
]

export const calculateMonthlyRevenue = (
  specialty: SpecialtyFees,
  dailyPatients: number,
  nonInsuranceRatio: number,
  workingDays: number = 22
): { insuranceRevenue: number; nonInsuranceRevenue: number; totalRevenue: number } => {
  const patientRatio = dailyPatients / 100
  const insurancePatientRatio = (100 - nonInsuranceRatio) / 100
  const nonInsurancePatientRatio = nonInsuranceRatio / 100

  let insuranceRevenue = 0
  let nonInsuranceRevenue = 0

  specialty.fees.forEach((fee) => {
    const monthlyFreq = fee.frequency * patientRatio * workingDays
    if (fee.category === '비보험') {
      nonInsuranceRevenue += (fee.nonInsuranceFee || 0) * monthlyFreq * nonInsurancePatientRatio
    } else {
      insuranceRevenue += fee.insuranceFee * monthlyFreq * insurancePatientRatio
    }
  })

  return {
    insuranceRevenue: Math.round(insuranceRevenue),
    nonInsuranceRevenue: Math.round(nonInsuranceRevenue),
    totalRevenue: Math.round(insuranceRevenue + nonInsuranceRevenue),
  }
}
