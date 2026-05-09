/**
 * 외부 예약 채널 통합 인박스 클라이언트.
 */
import { apiClient } from './client'

export type ExtChannel = 'DDOCDOC' | 'GOODOC' | 'NAVER' | 'KAKAO' | 'MANUAL' | 'OTHER'
export type ExtStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CONFLICT' | 'EXPIRED' | 'CANCELLED_BY_CHANNEL'

export interface ExternalAppointment {
  id: string
  channel: ExtChannel
  external_id?: string
  patient_name: string
  patient_phone?: string
  patient_birth?: string
  doctor_name?: string
  requested_start: string
  duration_min: number
  chief_complaint?: string
  memo?: string
  status: ExtStatus
  conflict_with?: string
  linked_appointment_id?: string
  received_at?: string
  decided_at?: string
  rejection_reason?: string
  created_at: string
}

export interface ExtStats {
  total_pending: number
  by_channel: Record<string, Record<string, number>>
}

export const extApptService = {
  list: async (params?: {
    status?: ExtStatus
    channel?: ExtChannel
    date_from?: string
    date_to?: string
    page?: number
    page_size?: number
  }): Promise<ExternalAppointment[]> => {
    const r = await apiClient.get('/external-appointments', { params })
    return r.data
  },
  stats: async (): Promise<ExtStats> => {
    const r = await apiClient.get('/external-appointments/stats')
    return r.data
  },
  confirm: async (id: string): Promise<ExternalAppointment> => {
    const r = await apiClient.post(`/external-appointments/${id}/confirm`)
    return r.data
  },
  reject: async (id: string, reason?: string): Promise<ExternalAppointment> => {
    const r = await apiClient.post(`/external-appointments/${id}/reject`, null, {
      params: reason ? { reason } : {},
    })
    return r.data
  },
}

export const channelLabel: Record<ExtChannel, string> = {
  DDOCDOC: '똑닥',
  GOODOC: '굿닥',
  NAVER: '네이버',
  KAKAO: '카카오',
  MANUAL: '수동',
  OTHER: '기타',
}

export const channelBadgeClass: Record<ExtChannel, string> = {
  DDOCDOC: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  GOODOC: 'bg-blue-100 text-blue-800 border-blue-300',
  NAVER: 'bg-green-100 text-green-800 border-green-300',
  KAKAO: 'bg-amber-100 text-amber-800 border-amber-300',
  MANUAL: 'bg-slate-100 text-slate-700 border-slate-300',
  OTHER: 'bg-slate-100 text-slate-600 border-slate-300',
}
