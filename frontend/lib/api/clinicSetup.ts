/**
 * 의원 셋업 (5분 온보딩) 클라이언트.
 */
import { apiClient } from './client'

export interface ClinicSetupData {
  clinic_name?: string
  primary_specialty?: string
  secondary_specialties?: string[]
  doctor_names?: string[]
  hours_open?: string
  hours_close?: string
  lunch_open?: string
  lunch_close?: string
  weekday_pattern?: string
  applied_template?: string
  applied_template_at?: string
  completed_steps?: string[]
  completed_at?: string
  skipped_at?: string
}

export interface SpecialtyMeta {
  code: string
  label: string
  icon: string
  summary: string
}

export interface SpecialtyTemplate {
  label: string
  icon: string
  summary: string
  diagnoses: { code: string; name: string }[]
  procedures: { code: string; name: string; category: string; unit_price: number }[]
  drugs: {
    drug_name: string
    ingredient: string
    dose_unit: string
    frequency_per_day: number
    duration_days: number
    usage_note: string
  }[]
}

export const clinicSetupService = {
  get: async (): Promise<ClinicSetupData> => {
    const r = await apiClient.get('/clinic-setup')
    return r.data
  },
  update: async (data: Partial<ClinicSetupData> & { add_completed_step?: string }): Promise<ClinicSetupData> => {
    const r = await apiClient.put('/clinic-setup', data)
    return r.data
  },
  complete: async (): Promise<{ completed_at: string }> => {
    const r = await apiClient.post('/clinic-setup/complete')
    return r.data
  },
  skip: async (): Promise<{ completed_at: string }> => {
    const r = await apiClient.post('/clinic-setup/skip')
    return r.data
  },
  templates: async (): Promise<{ specialties: SpecialtyMeta[] }> => {
    const r = await apiClient.get('/clinic-setup/templates')
    return r.data
  },
  template: async (code: string): Promise<SpecialtyTemplate> => {
    const r = await apiClient.get(`/clinic-setup/templates/${code}`)
    return r.data
  },
  applyTemplate: async (specialty: string): Promise<ClinicSetupData> => {
    const r = await apiClient.post('/clinic-setup/apply-template', { specialty })
    return r.data
  },
}
