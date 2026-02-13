export interface MonthlyRecord {
  month: string // "2024-01"
  revenue: number // 만원
  patients: number
  newPatients: number
  insuranceRevenue: number // 만원
  nonInsuranceRevenue: number // 만원
  expenses: number // 만원
}

export interface ForecastData {
  month: string
  predictedRevenue: number
  predictedPatients: number
}

export const demoRecords: MonthlyRecord[] = [
  { month: '2024-07', revenue: 3200, patients: 680, newPatients: 210, insuranceRevenue: 2100, nonInsuranceRevenue: 1100, expenses: 2400 },
  { month: '2024-08', revenue: 3800, patients: 790, newPatients: 180, insuranceRevenue: 2500, nonInsuranceRevenue: 1300, expenses: 2500 },
  { month: '2024-09', revenue: 4200, patients: 880, newPatients: 160, insuranceRevenue: 2800, nonInsuranceRevenue: 1400, expenses: 2550 },
  { month: '2024-10', revenue: 4600, patients: 950, newPatients: 140, insuranceRevenue: 3000, nonInsuranceRevenue: 1600, expenses: 2600 },
  { month: '2024-11', revenue: 4900, patients: 1020, newPatients: 130, insuranceRevenue: 3200, nonInsuranceRevenue: 1700, expenses: 2650 },
  { month: '2024-12', revenue: 5100, patients: 1050, newPatients: 120, insuranceRevenue: 3300, nonInsuranceRevenue: 1800, expenses: 2700 },
]

export const demoForecasts: ForecastData[] = [
  { month: '2024-07', predictedRevenue: 3500, predictedPatients: 720 },
  { month: '2024-08', predictedRevenue: 4000, predictedPatients: 830 },
  { month: '2024-09', predictedRevenue: 4500, predictedPatients: 920 },
  { month: '2024-10', predictedRevenue: 5000, predictedPatients: 1000 },
  { month: '2024-11', predictedRevenue: 5300, predictedPatients: 1060 },
  { month: '2024-12', predictedRevenue: 5500, predictedPatients: 1100 },
]

export const STORAGE_KEY = 'medimatch_operations_records'
