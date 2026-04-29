/**
 * EMR 핵심 모듈 API 클라이언트
 * - Visits (전자차트)
 * - Appointments (예약)
 * - Prescriptions (처방전)
 * - Bills (수납)
 */
import { apiClient } from './client'

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────
export interface Diagnosis {
  id?: number
  code: string
  name: string
  is_primary?: boolean
  note?: string
}

export interface Procedure {
  id?: number
  code: string
  name: string
  category?: string
  quantity: number
  unit_price: number
  total_price?: number
  insurance_covered?: boolean
  note?: string
}

export interface Visit {
  id: string
  patient_id?: string
  chart_no?: string
  visit_no: string
  visit_date: string
  visit_type: string
  chief_complaint?: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  vital_systolic?: number
  vital_diastolic?: number
  vital_hr?: number
  vital_temp?: number
  vital_spo2?: number
  vital_weight?: number
  vital_height?: number
  vital_bmi?: number
  doctor_name?: string
  status: string
  duration_min?: number
  next_visit_date?: string
  visit_notes?: string
  voice_transcript?: string
  ai_suggestions?: any[]
  diagnoses: Diagnosis[]
  procedures: Procedure[]
  created_at: string
  updated_at: string
}

export interface VisitListItem {
  id: string
  patient_id?: string
  chart_no?: string
  visit_no: string
  visit_date: string
  visit_type: string
  chief_complaint?: string
  primary_diagnosis?: string
  doctor_name?: string
  status: string
  procedure_count: number
  total_amount: number
}

export interface VisitCreateInput {
  patient_id?: string
  chart_no?: string
  visit_date: string
  visit_type?: string
  chief_complaint?: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  vital_systolic?: number
  vital_diastolic?: number
  vital_hr?: number
  vital_temp?: number
  vital_spo2?: number
  vital_weight?: number
  vital_height?: number
  doctor_name?: string
  next_visit_date?: string
  visit_notes?: string
  voice_transcript?: string
  diagnoses: Diagnosis[]
  procedures: Procedure[]
}

export interface PrescriptionItem {
  id?: number
  drug_code?: string
  drug_name: string
  ingredient?: string
  dose_per_time: number
  dose_unit: string
  frequency_per_day: number
  duration_days: number
  total_quantity?: number
  unit_price: number
  total_price?: number
  usage_note?: string
  warning?: string
}

export interface Prescription {
  id: string
  visit_id?: string
  patient_id?: string
  prescription_no: string
  prescribed_date: string
  doctor_name?: string
  pharmacy_name?: string
  status: string
  duration_days?: number
  total_amount: number
  dur_warnings: any[]
  patient_note?: string
  items: PrescriptionItem[]
  created_at: string
}

export interface Appointment {
  id: string
  patient_id?: string
  patient_name: string
  patient_phone?: string
  patient_birth?: string
  doctor_name?: string
  start_time: string
  end_time: string
  duration_min: number
  status: string
  appointment_type: string
  chief_complaint?: string
  memo?: string
  channel?: string
  arrived_at?: string
  created_at: string
}

export interface BillItem {
  id?: number
  item_type: string
  code?: string
  name: string
  quantity: number
  unit_price: number
  total_price?: number
  insurance_covered: boolean
  copay_rate: number
}

export interface Payment {
  id: number
  amount: number
  method: string
  transaction_id?: string
  card_last4?: string
  card_company?: string
  received_by?: string
  received_at: string
  is_refund: boolean
  note?: string
}

export interface Bill {
  id: string
  visit_id?: string
  patient_id?: string
  bill_no: string
  bill_date: string
  subtotal: number
  insurance_amount: number
  patient_amount: number
  non_covered_amount: number
  discount_amount: number
  final_amount: number
  paid_amount: number
  balance: number
  status: string
  issued_at?: string
  completed_at?: string
  memo?: string
  items: BillItem[]
  payments: Payment[]
  created_at: string
}

// ────────────────────────────────────────
// Visit Service
// ────────────────────────────────────────
export const visitService = {
  list: async (params?: {
    patient_id?: string
    date_from?: string
    date_to?: string
    status?: string
    page?: number
    page_size?: number
  }): Promise<VisitListItem[]> => {
    const r = await apiClient.get('/emr/visits', { params })
    return r.data
  },
  get: async (id: string): Promise<Visit> => {
    const r = await apiClient.get(`/emr/visits/${id}`)
    return r.data
  },
  create: async (data: VisitCreateInput): Promise<Visit> => {
    const r = await apiClient.post('/emr/visits', data)
    return r.data
  },
  update: async (id: string, data: Partial<VisitCreateInput> & { status?: string }): Promise<Visit> => {
    const r = await apiClient.patch(`/emr/visits/${id}`, data)
    return r.data
  },
  complete: async (id: string): Promise<Visit> => {
    const r = await apiClient.post(`/emr/visits/${id}/complete`)
    return r.data
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/emr/visits/${id}`)
  },
  stats: async (): Promise<{ today_visits: number; month_visits: number }> => {
    const r = await apiClient.get('/emr/visits/stats/summary')
    return r.data
  },
}

// ────────────────────────────────────────
// Appointment Service
// ────────────────────────────────────────
export const appointmentService = {
  list: async (params?: {
    date_from?: string
    date_to?: string
    status?: string
    patient_id?: string
  }): Promise<Appointment[]> => {
    const r = await apiClient.get('/emr/appointments', { params })
    return r.data
  },
  get: async (id: string): Promise<Appointment> => {
    const r = await apiClient.get(`/emr/appointments/${id}`)
    return r.data
  },
  create: async (data: {
    patient_id?: string
    patient_name: string
    patient_phone?: string
    patient_birth?: string
    doctor_name?: string
    start_time: string
    duration_min?: number
    appointment_type?: string
    chief_complaint?: string
    memo?: string
    channel?: string
  }): Promise<Appointment> => {
    const r = await apiClient.post('/emr/appointments', data)
    return r.data
  },
  update: async (id: string, data: Partial<{
    start_time: string
    duration_min: number
    status: string
    chief_complaint: string
    memo: string
    cancelled_reason: string
  }>): Promise<Appointment> => {
    const r = await apiClient.patch(`/emr/appointments/${id}`, data)
    return r.data
  },
  checkIn: async (id: string): Promise<Appointment> => {
    const r = await apiClient.post(`/emr/appointments/${id}/check-in`)
    return r.data
  },
  cancel: async (id: string, reason?: string): Promise<void> => {
    await apiClient.delete(`/emr/appointments/${id}`, {
      params: reason ? { reason } : {},
    })
  },
  todayStats: async (): Promise<{
    total: number
    by_status: Record<string, number>
    scheduled: number
    arrived: number
    completed: number
    no_show: number
  }> => {
    const r = await apiClient.get('/emr/appointments/stats/today')
    return r.data
  },
}

// ────────────────────────────────────────
// Prescription Service
// ────────────────────────────────────────
export const prescriptionService = {
  list: async (params?: {
    patient_id?: string
    visit_id?: string
    date_from?: string
    date_to?: string
  }): Promise<Prescription[]> => {
    const r = await apiClient.get('/emr/prescriptions', { params })
    return r.data
  },
  get: async (id: string): Promise<Prescription> => {
    const r = await apiClient.get(`/emr/prescriptions/${id}`)
    return r.data
  },
  durCheck: async (data: {
    visit_id?: string
    patient_id?: string
    prescribed_date: string
    items: Omit<PrescriptionItem, 'id' | 'warning'>[]
  }): Promise<{ ok: boolean; warnings: any[]; item_warnings: Record<number, string> }> => {
    const r = await apiClient.post('/emr/prescriptions/dur-check', data)
    return r.data
  },
  create: async (data: {
    visit_id?: string
    patient_id?: string
    prescribed_date: string
    doctor_name?: string
    pharmacy_name?: string
    duration_days?: number
    patient_note?: string
    items: Omit<PrescriptionItem, 'id' | 'warning'>[]
  }): Promise<Prescription> => {
    const r = await apiClient.post('/emr/prescriptions', data)
    return r.data
  },
  cancel: async (id: string): Promise<Prescription> => {
    const r = await apiClient.post(`/emr/prescriptions/${id}/cancel`)
    return r.data
  },
}

// ────────────────────────────────────────
// Bill Service
// ────────────────────────────────────────
export const billService = {
  list: async (params?: {
    patient_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }): Promise<Bill[]> => {
    const r = await apiClient.get('/emr/bills', { params })
    return r.data
  },
  get: async (id: string): Promise<Bill> => {
    const r = await apiClient.get(`/emr/bills/${id}`)
    return r.data
  },
  create: async (data: {
    visit_id?: string
    patient_id?: string
    bill_date: string
    discount_amount?: number
    memo?: string
    items: Omit<BillItem, 'id' | 'total_price'>[]
  }): Promise<Bill> => {
    const r = await apiClient.post('/emr/bills', data)
    return r.data
  },
  pay: async (id: string, payment: {
    amount: number
    method?: string
    transaction_id?: string
    card_last4?: string
    card_company?: string
    received_by?: string
    note?: string
  }): Promise<Bill> => {
    const r = await apiClient.post(`/emr/bills/${id}/payments`, payment)
    return r.data
  },
  refund: async (id: string, amount: number, reason?: string): Promise<Bill> => {
    const r = await apiClient.post(`/emr/bills/${id}/refund`, null, {
      params: { amount, reason },
    })
    return r.data
  },
  cancel: async (id: string): Promise<Bill> => {
    const r = await apiClient.post(`/emr/bills/${id}/cancel`)
    return r.data
  },
  stats: async (): Promise<{ today_revenue: number; month_revenue: number; outstanding: number }> => {
    const r = await apiClient.get('/emr/bills/stats/summary')
    return r.data
  },
}
