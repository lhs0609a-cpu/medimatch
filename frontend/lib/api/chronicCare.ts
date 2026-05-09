/**
 * 만성질환관리(만관제) 클라이언트.
 */
import { apiClient } from './client'

export type ChronicCondition = 'HYPERTENSION' | 'DIABETES' | 'DYSLIPIDEMIA' | 'OBESITY' | 'OTHER'
export type ChronicStatus = 'ACTIVE' | 'PAUSED' | 'GRADUATED' | 'DROPPED'
export type ChronicVisitKind = 'VISIT' | 'EXAM' | 'EDUCATION' | 'PHONE' | 'LAB'

export interface ChronicProgram {
  id: string
  patient_id: string
  patient_name?: string
  patient_phone?: string
  condition: ChronicCondition
  condition_label: string
  status: ChronicStatus
  enrolled_at?: string
  graduated_at?: string
  target_systolic?: number
  target_diastolic?: number
  target_hba1c?: number
  target_fbs?: number
  target_ldl?: number
  target_weight?: number
  total_visits: number
  total_education_count: number
  last_visit_at?: string
  next_visit_at?: string
  interval_days: number
  memo?: string
  is_overdue: boolean
  days_overdue: number
}

export interface ChronicVisit {
  id: string
  visit_date: string
  kind: ChronicVisitKind
  systolic?: number
  diastolic?: number
  fbs?: number
  hba1c?: number
  ldl?: number
  hdl?: number
  tg?: number
  weight?: number
  education_topic?: string
  notes?: string
  linked_visit_id?: string
  created_at: string
}

export interface ChronicProgramDetail extends ChronicProgram {
  visits: ChronicVisit[]
}

export interface ChronicStats {
  by_condition: Record<string, Record<string, number>>
  labels: Record<string, string>
  overdue_count: number
}

export const chronicCareService = {
  list: async (params?: {
    status?: ChronicStatus
    condition?: ChronicCondition
    overdue_only?: boolean
  }): Promise<ChronicProgram[]> => {
    const r = await apiClient.get('/chronic-care/programs', { params })
    return r.data
  },
  get: async (id: string): Promise<ChronicProgramDetail> => {
    const r = await apiClient.get(`/chronic-care/programs/${id}`)
    return r.data
  },
  create: async (data: {
    patient_id: string
    condition: ChronicCondition
    target_systolic?: number
    target_diastolic?: number
    target_hba1c?: number
    target_fbs?: number
    target_ldl?: number
    target_weight?: number
    interval_days?: number
    memo?: string
  }): Promise<ChronicProgram> => {
    const r = await apiClient.post('/chronic-care/programs', data)
    return r.data
  },
  update: async (id: string, data: Partial<{
    target_systolic: number; target_diastolic: number
    target_hba1c: number; target_fbs: number
    target_ldl: number; target_weight: number
    interval_days: number; memo: string
    status: ChronicStatus
  }>): Promise<ChronicProgram> => {
    const r = await apiClient.patch(`/chronic-care/programs/${id}`, data)
    return r.data
  },
  addVisit: async (id: string, data: {
    kind?: ChronicVisitKind
    visit_date?: string
    systolic?: number; diastolic?: number
    fbs?: number; hba1c?: number
    ldl?: number; hdl?: number; tg?: number
    weight?: number
    education_topic?: string
    notes?: string
    linked_visit_id?: string
  }): Promise<ChronicVisit> => {
    const r = await apiClient.post(`/chronic-care/programs/${id}/visits`, data)
    return r.data
  },
  graduate: async (id: string): Promise<ChronicProgram> => {
    const r = await apiClient.post(`/chronic-care/programs/${id}/graduate`)
    return r.data
  },
  drop: async (id: string, reason?: string): Promise<ChronicProgram> => {
    const r = await apiClient.post(`/chronic-care/programs/${id}/drop`, null, {
      params: reason ? { reason } : {},
    })
    return r.data
  },
  leaks: async (params?: { days_min?: number; days_max?: number }): Promise<ChronicProgram[]> => {
    const r = await apiClient.get('/chronic-care/leaks', { params })
    return r.data
  },
  stats: async (): Promise<ChronicStats> => {
    const r = await apiClient.get('/chronic-care/stats')
    return r.data
  },
}

export const conditionIcon: Record<ChronicCondition, string> = {
  HYPERTENSION: '💗',
  DIABETES: '🩸',
  DYSLIPIDEMIA: '🫧',
  OBESITY: '⚖️',
  OTHER: '🩺',
}

export const conditionDefaults: Record<ChronicCondition, {
  intervalDays: number
  targets: Partial<{
    systolic: number; diastolic: number
    hba1c: number; fbs: number; ldl: number; weight: number
  }>
}> = {
  HYPERTENSION: { intervalDays: 30, targets: { systolic: 130, diastolic: 80 } },
  DIABETES:    { intervalDays: 90, targets: { hba1c: 6.5, fbs: 130 } },
  DYSLIPIDEMIA:{ intervalDays: 90, targets: { ldl: 100 } },
  OBESITY:     { intervalDays: 30, targets: { weight: 0 } },
  OTHER:       { intervalDays: 60, targets: {} },
}
