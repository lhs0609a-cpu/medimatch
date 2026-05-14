/**
 * 약국 픽업 클라이언트 (Public — 코드 또는 토큰 인증)
 */
import axios from 'axios'

const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const ax = axios.create({ baseURL: PUBLIC_BASE })

export interface PickupItem {
  drug_name: string
  ingredient?: string
  dose_per_time: number
  dose_unit: string
  frequency_per_day: number
  duration_days: number
  total_quantity: number
  usage_note?: string
  warning?: string
}

export interface PickupOut {
  id: string
  prescription_no: string
  prescribed_date: string
  doctor_name?: string
  duration_days?: number
  status: 'DRAFT' | 'ISSUED' | 'DISPENSED' | 'CANCELLED'
  patient_name_masked?: string
  patient_phone_last4?: string
  dur_warnings: any[]
  items: PickupItem[]
  expires_at?: string
  dispensed_at?: string
  pharmacy_name?: string
}

export const pickupService = {
  lookupByCode: async (code: string, phoneLast4?: string): Promise<PickupOut> => {
    const r = await ax.post('/pharmacy-pickup/lookup', {
      code, phone_last4: phoneLast4,
    })
    return r.data
  },
  lookupByToken: async (token: string): Promise<PickupOut> => {
    const r = await ax.get(`/pharmacy-pickup/token/${token}`)
    return r.data
  },
  dispense: async (data: {
    code?: string
    token?: string
    phone_last4?: string
    pharmacy_name: string
    dispensed_by?: string
    note?: string
  }): Promise<PickupOut> => {
    const r = await ax.post('/pharmacy-pickup/dispense', data)
    return r.data
  },
}
