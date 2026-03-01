export interface BudgetBenchmark {
  specialty: string
  region: string
  totalBudget: number
  breakdown: {
    phase: number
    phaseName: string
    average: number
    min: number
    max: number
  }[]
}

export interface RegionMultiplier {
  region: string
  code: string
  multiplier: number // 1.0 = national average
  rentMultiplier: number
  description: string
}

export const regionMultipliers: RegionMultiplier[] = [
  { region: '서울 강남/서초', code: 'seoul-gangnam', multiplier: 1.5, rentMultiplier: 2.0, description: '최고 상권, 임대료 높음' },
  { region: '서울 기타', code: 'seoul-etc', multiplier: 1.3, rentMultiplier: 1.5, description: '서울 평균' },
  { region: '경기 분당/판교', code: 'gyeonggi-bundang', multiplier: 1.3, rentMultiplier: 1.4, description: '신도시 상권' },
  { region: '경기 기타', code: 'gyeonggi-etc', multiplier: 1.1, rentMultiplier: 1.1, description: '경기 평균' },
  { region: '6대 광역시', code: 'metro', multiplier: 1.0, rentMultiplier: 1.0, description: '광역시 평균 (기준)' },
  { region: '세종/제주', code: 'sejong-jeju', multiplier: 0.95, rentMultiplier: 0.9, description: '특별자치' },
  { region: '기타 지방', code: 'rural', multiplier: 0.8, rentMultiplier: 0.6, description: '지방 소도시' },
]

// Phase-level average costs (전체 진료과 평균, 만원)
export const nationalAverageByPhase: { phase: number; phaseName: string; average: number; min: number; max: number }[] = [
  { phase: 1, phaseName: '사업계획 수립', average: 500, min: 0, max: 1000 },
  { phase: 2, phaseName: '입지 선정', average: 5500, min: 3000, max: 10000 },
  { phase: 3, phaseName: '인허가 / 행정', average: 150, min: 50, max: 300 },
  { phase: 4, phaseName: '인테리어 / 설계', average: 11000, min: 7000, max: 20000 },
  { phase: 5, phaseName: '의료장비 / 기자재', average: 14000, min: 5000, max: 40000 },
  { phase: 6, phaseName: '인력 채용', average: 100, min: 30, max: 200 },
  { phase: 7, phaseName: '마케팅 준비', average: 1500, min: 500, max: 3000 },
  { phase: 8, phaseName: '개원 / 오픈', average: 400, min: 100, max: 1000 },
]

// Specialty-specific budget distribution (진료과별 Phase 비율 %)
export const specialtyBudgetDistribution: Record<string, Record<number, number>> = {
  '내과': { 1: 3, 2: 15, 3: 2, 4: 30, 5: 35, 6: 2, 7: 8, 8: 5 },
  '피부과': { 1: 2, 2: 12, 3: 2, 4: 28, 5: 40, 6: 3, 7: 10, 8: 3 },
  '정형외과': { 1: 3, 2: 13, 3: 3, 4: 28, 5: 38, 6: 3, 7: 7, 8: 5 },
  '안과': { 1: 2, 2: 12, 3: 2, 4: 25, 5: 45, 6: 2, 7: 8, 8: 4 },
  '이비인후과': { 1: 3, 2: 15, 3: 3, 4: 32, 5: 30, 6: 3, 7: 9, 8: 5 },
  '소아청소년과': { 1: 4, 2: 16, 3: 3, 4: 32, 5: 28, 6: 3, 7: 9, 8: 5 },
  '치과': { 1: 2, 2: 10, 3: 2, 4: 25, 5: 48, 6: 2, 7: 8, 8: 3 },
  '한의원': { 1: 4, 2: 18, 3: 3, 4: 35, 5: 22, 6: 3, 7: 10, 8: 5 },
  '성형외과': { 1: 2, 2: 10, 3: 2, 4: 22, 5: 48, 6: 3, 7: 10, 8: 3 },
  '정신건강의학과': { 1: 5, 2: 18, 3: 3, 4: 38, 5: 15, 6: 5, 7: 11, 8: 5 },
  '가정의학과': { 1: 4, 2: 16, 3: 3, 4: 32, 5: 28, 6: 3, 7: 9, 8: 5 },
  '재활의학과': { 1: 3, 2: 14, 3: 3, 4: 28, 5: 36, 6: 4, 7: 7, 8: 5 },
  '비뇨의학과': { 1: 3, 2: 14, 3: 3, 4: 28, 5: 36, 6: 3, 7: 8, 8: 5 },
  '산부인과': { 1: 3, 2: 12, 3: 2, 4: 27, 5: 40, 6: 3, 7: 8, 8: 5 },
  '신경과': { 1: 3, 2: 14, 3: 3, 4: 28, 5: 36, 6: 3, 7: 8, 8: 5 },
}

// Helper: calculate region-adjusted budget
export function getRegionAdjustedBudget(baseBudget: number, regionCode: string): number {
  const region = regionMultipliers.find(r => r.code === regionCode)
  return Math.round(baseBudget * (region?.multiplier ?? 1.0))
}

// Helper: calculate loan repayment
export function calculateLoanRepayment(
  principal: number,  // 만원
  annualRate: number,  // % (e.g., 4.5)
  months: number
): { monthlyPayment: number; totalInterest: number; totalPayment: number; schedule: { month: number; principal: number; interest: number; balance: number }[] } {
  const monthlyRate = annualRate / 100 / 12
  const monthlyPayment = monthlyRate > 0
    ? Math.round(principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1))
    : Math.round(principal / months)

  const schedule: { month: number; principal: number; interest: number; balance: number }[] = []
  let balance = principal

  for (let i = 1; i <= months; i++) {
    const interest = Math.round(balance * monthlyRate)
    const principalPart = monthlyPayment - interest
    balance = Math.max(0, balance - principalPart)
    schedule.push({ month: i, principal: principalPart, interest, balance })
  }

  const totalPayment = monthlyPayment * months
  const totalInterest = totalPayment - principal

  return { monthlyPayment, totalInterest, totalPayment, schedule }
}
