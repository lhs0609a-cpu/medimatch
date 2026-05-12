/**
 * 환자 리콜 / EMR CRM 클라이언트.
 *
 * 백엔드: /emr/crm/*
 * - DB 비어있으면 is_demo=true 와 함께 데모 데이터 반환
 * - 알림톡 미설정이면 send/bulk 가 ok=false + reason='alimtalk_not_configured'
 * - 야간(21~08 KST) 발송 시 400 night_send_forbidden
 * - 데모 ID는 send/bulk에서 거부됨
 */
import { apiClient } from './client'

export type RecallUIStatus = 'pending' | 'sent' | 'no_response' | 'booked'
export type RecallPriority = 'high' | 'medium' | 'low'

export interface RecallTarget {
  id: string
  patient_id?: string | null
  name: string
  age: number | null
  gender: string
  phone: string
  lastVisit: string | null
  daysAgo: number
  reason: string
  status: RecallUIStatus
  priority: RecallPriority
}

export interface TargetsResponse {
  items: RecallTarget[]
  total: number
  page: number
  size: number
  is_demo: boolean
}

export interface RecallStats {
  totalTarget: number
  sent: number
  responded: number
  booked: number
  responseRate: number
  bookingRate: number
  is_demo: boolean
}

export interface RecallCampaign {
  id: string
  name: string
  target: number
  sent: number
  opened: number
  booked: number
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  date: string | null
}

export interface RecallTemplate {
  code: string
  label: string
  preview: string
  vars: string[]
}

export interface AlimtalkStatus {
  provider: string
  configured: boolean
  missing: string[]
  user_action_needed?: boolean
  support_message?: string | null
}

export type BulkReason =
  | 'alimtalk_not_configured'
  | 'demo_targets_cannot_send'
  | 'no_eligible_targets'

export interface BulkSendResult {
  ok: boolean
  reason?: BulkReason
  missing?: string[]
  would_send?: number
  results?: { sent: number; failed: number; skipped: number }
}

export const patientRecallService = {
  alimtalkStatus: async (): Promise<AlimtalkStatus> => {
    const r = await apiClient.get('/emr/crm/alimtalk/status')
    return r.data
  },

  templates: async (): Promise<{ items: RecallTemplate[] }> => {
    const r = await apiClient.get('/emr/crm/templates')
    return r.data
  },

  stats: async (): Promise<RecallStats> => {
    const r = await apiClient.get('/emr/crm/stats')
    return r.data
  },

  targets: async (opts?: { status?: RecallUIStatus | 'all'; page?: number; size?: number }): Promise<TargetsResponse> => {
    const params: Record<string, string | number> = {}
    if (opts?.status && opts.status !== 'all') params.status = opts.status
    if (opts?.page) params.page = opts.page
    if (opts?.size) params.size = opts.size
    const r = await apiClient.get('/emr/crm/targets', { params })
    return r.data
  },

  campaigns: async (): Promise<{ items: RecallCampaign[]; is_demo: boolean }> => {
    const r = await apiClient.get('/emr/crm/campaigns')
    return r.data
  },

  createCampaign: async (data: {
    name: string
    target_group?: string
    channel?: 'KAKAO' | 'SMS' | 'BOTH'
    template_code?: string
    scheduled_at?: string
  }): Promise<{ id: string; status: string; target_count: number }> => {
    const r = await apiClient.post('/emr/crm/campaigns', data)
    return r.data
  },

  sendBulk: async (data: {
    target_ids: string[]
    template_code?: string
    button_url?: string
    campaign_id?: string
    enable_sms_fallback?: boolean
  }): Promise<BulkSendResult> => {
    const r = await apiClient.post('/emr/crm/send/bulk', data)
    return r.data
  },

  sendOne: async (data: {
    patient_id: string
    template_code?: string
    button_url?: string
    campaign_id?: string
    enable_sms_fallback?: boolean
  }): Promise<{ ok: boolean; provider?: string; alimtalk_status?: string; send_id: string }> => {
    const r = await apiClient.post('/emr/crm/send', data)
    return r.data
  },
}
