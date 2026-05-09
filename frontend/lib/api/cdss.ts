/**
 * CDSS — 사전심사 9종 점검 클라이언트
 *
 * POST /cdss/pre-screen
 *   처방·진단·시술을 한 번에 받아 9종 점검 결과 + 삭감예방 점수 + 예상청구액 반환.
 */
import { apiClient } from './client'

export type CdssSeverity = 'HIGH' | 'MEDIUM' | 'LOW'
export type CdssGrade = 'A+' | 'A' | 'B' | 'C' | 'D'

export interface CdssDiagnosisIn {
  code: string
  name?: string
  is_primary?: boolean
}

export interface CdssDrugIn {
  drug_name: string
  ingredient?: string
  dose_per_time?: number
  dose_unit?: string
  frequency_per_day?: number
  duration_days?: number
  total_quantity?: number
}

export interface CdssProcedureIn {
  code?: string
  name: string
  category?: string
  quantity?: number
  unit_price?: number
  insurance_covered?: boolean
}

export interface CdssPatientIn {
  id?: string
  age?: number
  sex?: 'M' | 'F'
  weight_kg?: number
}

export interface CdssIssue {
  code: string
  category: string
  category_label: string
  severity: CdssSeverity
  title: string
  message: string
  fix_hint?: string
  blocking?: boolean
  item_index?: number | null
  procedure_index?: number | null
}

export interface CdssEstimate {
  consultation_fee: number
  prescription_fee: number
  procedure_total: number
  drug_total: number
  subtotal: number
  insurance_amount: number
  patient_amount: number
  copay_rate: number
}

export interface CdssPreScreenResponse {
  score: number
  estimate: CdssEstimate
  issues: CdssIssue[]
  passed: string[]
  summary: { HIGH: number; MEDIUM: number; LOW: number }
  blocking_count: number
  cross_checked_meds: number
  grade: CdssGrade
}

export interface CdssPreScreenRequest {
  patient?: CdssPatientIn
  diagnoses?: CdssDiagnosisIn[]
  procedures?: CdssProcedureIn[]
  drugs?: CdssDrugIn[]
  visit_type?: string
  copay_rate?: number
  cross_check_active_meds?: boolean
}

export const cdssService = {
  preScreen: async (req: CdssPreScreenRequest): Promise<CdssPreScreenResponse> => {
    const r = await apiClient.post('/cdss/pre-screen', req)
    return r.data
  },
  categories: async (): Promise<{ categories: { code: string; label: string }[] }> => {
    const r = await apiClient.get('/cdss/categories')
    return r.data
  },
}

export function gradeColor(grade: CdssGrade): string {
  switch (grade) {
    case 'A+': return 'bg-emerald-500 text-white'
    case 'A': return 'bg-green-500 text-white'
    case 'B': return 'bg-amber-500 text-white'
    case 'C': return 'bg-orange-500 text-white'
    case 'D': return 'bg-rose-600 text-white'
  }
}

export function severityClass(s: CdssSeverity): string {
  switch (s) {
    case 'HIGH': return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'MEDIUM': return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'LOW': return 'border-slate-300 bg-slate-50 text-slate-700'
  }
}

export function severityLabel(s: CdssSeverity): string {
  return s === 'HIGH' ? '위험' : s === 'MEDIUM' ? '주의' : '참고'
}
