/**
 * 사전문진(Questionnaire) 클라이언트
 *
 * - 의사용: send / list / prefill / consume / templates  (인증)
 * - 환자용: getPublic / submitPublic (Public, 토큰)
 */
import axios from 'axios'
import { apiClient } from './client'

const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const publicAxios = axios.create({
  baseURL: PUBLIC_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export interface QuestionnaireQuestion {
  key: string
  label: string
  type: 'text' | 'textarea' | 'choice' | 'scale'
  placeholder?: string
  required?: boolean
  options?: string[]
  min?: number
  max?: number
}

export interface QuestionnaireTemplate {
  template_code: string
  title: string
  subtitle: string
  questions: QuestionnaireQuestion[]
  patient_name?: string
  clinic_name?: string
  status: string
  submitted_at?: string
}

export interface QuestionnaireOut {
  id: string
  appointment_id?: string
  patient_id?: string
  patient_name?: string
  patient_phone?: string
  template_code: string
  status: 'SENT' | 'OPENED' | 'SUBMITTED' | 'CONSUMED' | 'EXPIRED'
  sent_at?: string
  opened_at?: string
  submitted_at?: string
  consumed_at?: string
  delivery_provider?: string
  delivery_status?: string
  chief_complaint?: string
  onset?: string
  severity?: number
  accompanying?: string
  past_history?: string
  allergies?: string
  current_meds?: string
  smoking?: string
  alcohol?: string
  family_history?: string
  note?: string
  created_at: string
}

export interface QuestionnairePrefill {
  found: boolean
  questionnaire_id?: string
  submitted_at?: string
  chief_complaint?: string
  subjective?: string
  patient_patch?: Record<string, any>
}

// ─── 의사용 ────────────────────────────────────────────────────
export const questionnaireService = {
  send: async (data: {
    appointment_id?: string
    patient_id?: string
    patient_phone?: string
    patient_name?: string
    template_code?: string
    expires_in_days?: number
  }): Promise<QuestionnaireOut> => {
    const r = await apiClient.post('/questionnaires/send', data)
    return r.data
  },
  list: async (params?: {
    patient_id?: string
    appointment_id?: string
    status?: string
  }): Promise<QuestionnaireOut[]> => {
    const r = await apiClient.get('/questionnaires', { params })
    return r.data
  },
  prefill: async (params: { patient_id?: string; patient_phone?: string }): Promise<QuestionnairePrefill> => {
    const r = await apiClient.get('/questionnaires/prefill', { params })
    return r.data
  },
  consume: async (id: string): Promise<QuestionnaireOut> => {
    const r = await apiClient.post(`/questionnaires/${id}/consume`)
    return r.data
  },
  template: async (code: string): Promise<{ title: string; subtitle: string; questions: QuestionnaireQuestion[] }> => {
    const r = await apiClient.get(`/questionnaires/templates/${code}`)
    return r.data
  },
}

// ─── 환자용 (Public) ────────────────────────────────────────────
export const publicQuestionnaireService = {
  get: async (token: string): Promise<QuestionnaireTemplate> => {
    const r = await publicAxios.get(`/q/${token}`)
    return r.data
  },
  submit: async (token: string, answers: Record<string, any>): Promise<QuestionnaireTemplate> => {
    const r = await publicAxios.post(`/q/${token}/submit`, { answers })
    return r.data
  },
}
