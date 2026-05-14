/**
 * 직원 ID 과금 클라이언트.
 */
import { apiClient } from './client'

export type StaffRole = 'OWNER' | 'DOCTOR' | 'NURSE' | 'COORDINATOR' | 'RECEPTION' | 'ASSISTANT' | 'PHARMACIST' | 'OTHER'
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'

export interface StaffSeat {
  id: string
  name: string
  role: StaffRole
  role_label: string
  status: StaffStatus
  email?: string
  phone?: string
  license_no?: string
  memo?: string
  billable: boolean
  added_at?: string
  deactivated_at?: string
}

export interface BillingBreakdownItem {
  label: string
  count: number
  unit_price: number
  amount: number
}

export interface BillingPreview {
  billable_seats: number
  free_seats: number
  chargeable_seats: number
  monthly_total: number
  breakdown: BillingBreakdownItem[]
  next_tier_at?: number | null
  next_tier_price?: number | null
}

export interface SeatListResponse {
  seats: StaffSeat[]
  billing: BillingPreview
}

export const staffSeatService = {
  list: async (): Promise<SeatListResponse> => {
    const r = await apiClient.get('/staff-seats')
    return r.data
  },
  create: async (data: {
    name: string
    role?: StaffRole
    email?: string
    phone?: string
    license_no?: string
    memo?: string
    billable?: boolean
  }): Promise<StaffSeat> => {
    const r = await apiClient.post('/staff-seats', data)
    return r.data
  },
  update: async (id: string, data: Partial<{
    name: string
    role: StaffRole
    email: string
    phone: string
    license_no: string
    memo: string
    billable: boolean
    status: StaffStatus
  }>): Promise<StaffSeat> => {
    const r = await apiClient.patch(`/staff-seats/${id}`, data)
    return r.data
  },
  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff-seats/${id}`)
  },
  preview: async (addCount: number = 0): Promise<{ current: BillingPreview; after_add?: BillingPreview }> => {
    const r = await apiClient.get('/staff-seats/billing-preview', { params: { add_count: addCount } })
    return r.data
  },
}

export const ROLE_OPTIONS: { value: StaffRole; label: string; icon: string }[] = [
  { value: 'OWNER', label: '원장', icon: '👨‍⚕️' },
  { value: 'DOCTOR', label: '의사', icon: '🩺' },
  { value: 'NURSE', label: '간호사', icon: '👩‍⚕️' },
  { value: 'COORDINATOR', label: '상담실장', icon: '💬' },
  { value: 'RECEPTION', label: '데스크', icon: '🪑' },
  { value: 'ASSISTANT', label: '보조', icon: '🤝' },
  { value: 'PHARMACIST', label: '약사', icon: '💊' },
  { value: 'OTHER', label: '기타', icon: '📋' },
]

export function roleIcon(role: StaffRole): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.icon || '👤'
}
