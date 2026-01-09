import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// API Types
export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'ADMIN' | 'PHARMACIST' | 'SALES_REP' | 'DOCTOR'
  company?: string
  license_number?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login?: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface SimulationRequest {
  address: string
  clinic_type: string
  size_pyeong?: number
  budget_million?: number
}

export interface SimulationResponse {
  simulation_id: string
  address: string
  clinic_type: string
  size_pyeong?: number
  budget_million?: number
  estimated_monthly_revenue: {
    min: number
    avg: number
    max: number
  }
  estimated_monthly_cost: {
    rent: number
    labor: number
    utilities: number
    supplies: number
    other: number
    total: number
  }
  profitability: {
    monthly_profit_avg: number
    breakeven_months: number
    annual_roi_percent: number
  }
  competition: {
    radius_m: number
    same_dept_count: number
    total_clinic_count: number
  }
  competitors: Array<{
    name: string
    distance_m: number
    est_monthly_revenue?: number
    years_open?: number
    clinic_type: string
    address?: string
  }>
  demographics: {
    population_1km: number
    age_40_plus_ratio: number
    floating_population_daily: number
  }
  confidence_score: number
  recommendation: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE'
  recommendation_reason: string
  ai_analysis?: string
  region_stats?: {
    vs_national_percent: number
    national_avg_revenue: number
    region_rank: number | null
    total_regions: number
    rank_percentile: number | null
  }
  created_at: string
}

export interface PharmacySlot {
  id: string
  address: string
  latitude: number
  longitude: number
  clinic_type: string
  clinic_name?: string
  est_daily_rx?: number
  est_monthly_revenue?: number
  min_bid_amount: number
  floor_info?: string
  area_pyeong?: number
  description?: string
  status: 'OPEN' | 'BIDDING' | 'MATCHED' | 'CLOSED'
  bid_deadline?: string
  created_at: string
  bid_count?: number
  highest_bid?: number
}

export interface ProspectLocation {
  id: string
  building_id?: string
  address: string
  latitude: number
  longitude: number
  type: 'NEW_BUILD' | 'VACANCY' | 'RELOCATION'
  zoning?: string
  floor_area?: number
  floor_info?: string
  clinic_fit_score?: number
  recommended_dept?: string[]
  previous_clinic?: string
  rent_estimate?: number
  description?: string
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED'
  detected_at: string
  created_at: string
}

// Map Types
export interface MapMarkerInfo {
  address?: string
  score?: number
  specialty?: string
  previous_clinic?: string
  floor_area?: number
  est_revenue?: number
}

export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  type: 'hospital' | 'prospect' | 'pharmacy'
  info?: MapMarkerInfo
}

export interface MapMarkersResponse {
  markers: MapMarker[]
  total: number
  bounds: {
    min_lat: number
    max_lat: number
    min_lng: number
    max_lng: number
  }
}

export interface MapMarkerDetail {
  id: string
  type: string
  name?: string
  address: string
  latitude: number
  longitude: number
  clinic_type?: string
  doctor_count?: number
  phone?: string
  established?: string
  floor_info?: string
  area_pyeong?: number
  parking_available?: boolean
  prospect_type?: string
  zoning?: string
  floor_area?: number
  clinic_fit_score?: number
  recommended_dept?: string[]
  previous_clinic?: string
  rent_estimate?: number
  description?: string
  detected_at?: string
  clinic_name?: string
  est_daily_rx?: number
  est_monthly_revenue?: number
  min_bid_amount?: number
  status?: string
  bid_deadline?: string
}

// PharmMatch v2 - Anonymous Matching Types
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'MATCHED' | 'EXPIRED' | 'WITHDRAWN'
export type PharmacyType = 'GENERAL' | 'DISPENSING' | 'ORIENTAL' | 'HOSPITAL'
export type TransferReason = 'RETIREMENT' | 'RELOCATION' | 'HEALTH' | 'CAREER_CHANGE' | 'FAMILY' | 'OTHER'
export type InterestType = 'L2P' | 'P2L'
export type MatchStatus = 'PENDING' | 'MUTUAL' | 'CHATTING' | 'MEETING' | 'CONTRACTED' | 'CANCELLED'

export interface AnonymousListing {
  id: string
  anonymous_id: string
  region_code: string
  region_name: string
  pharmacy_type: PharmacyType
  nearby_hospital_types: string[]
  monthly_revenue_min?: number
  monthly_revenue_max?: number
  monthly_rx_count?: number
  area_pyeong_min?: number
  area_pyeong_max?: number
  premium_min?: number
  premium_max?: number
  monthly_rent?: number
  deposit?: number
  transfer_reason?: TransferReason
  operation_years?: number
  employee_count: number
  has_auto_dispenser: boolean
  has_parking: boolean
  floor_info?: string
  description?: string
  status: ListingStatus
  view_count: number
  interest_count: number
  created_at: string
  // Private fields (only for owner or matched)
  exact_address?: string
  pharmacy_name?: string
  owner_phone?: string
  latitude?: number
  longitude?: number
  expires_at?: string
  updated_at?: string
}

export interface PharmacistProfile {
  id: string
  anonymous_id: string
  preferred_regions: string[]
  preferred_region_names: string[]
  budget_min?: number
  budget_max?: number
  preferred_area_min?: number
  preferred_area_max?: number
  preferred_revenue_min?: number
  preferred_revenue_max?: number
  experience_years: number
  license_year?: number
  has_management_experience: boolean
  specialty_areas: string[]
  preferred_pharmacy_types: string[]
  preferred_hospital_types: string[]
  introduction?: string
  is_active: boolean
  last_active_at: string
  // Private fields
  full_name?: string
  phone?: string
  email?: string
  license_number?: string
  created_at?: string
  updated_at?: string
}

export interface Interest {
  id: string
  listing_id: string
  pharmacist_profile_id: string
  interest_type: InterestType
  message?: string
  created_at: string
  target_anonymous_id: string
  target_summary: string
}

export interface MatchScoreBreakdown {
  region: number
  budget: number
  size: number
  revenue: number
  type: number
  experience: number
}

export interface Match {
  id: string
  listing_id: string
  pharmacist_profile_id: string
  status: MatchStatus
  match_score?: number
  match_score_breakdown?: MatchScoreBreakdown
  listing_info: AnonymousListing
  profile_info: PharmacistProfile
  listing_private?: AnonymousListing
  profile_private?: PharmacistProfile
  contact_revealed_at?: string
  first_message_at?: string
  meeting_scheduled_at?: string
  contracted_at?: string
  commission_rate: number
  commission_amount?: number
  created_at: string
  updated_at: string
}

export interface MatchMessage {
  id: string
  match_id: string
  sender_id: string
  sender_anonymous_id: string
  content: string
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface Recommendation {
  listing?: AnonymousListing
  profile?: PharmacistProfile
  match_score: number
  match_score_breakdown: MatchScoreBreakdown
  recommendation_reason: string
}

// Escrow Types
export type EscrowStatus = 'INITIATED' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'CANCELLED'
export type MilestoneStatus = 'PENDING' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'REJECTED'
export type ContractStatus = 'DRAFT' | 'PENDING_CUSTOMER' | 'PENDING_PARTNER' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM'
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_CUSTOMER' | 'RESOLVED_PARTNER' | 'RESOLVED_SPLIT' | 'CLOSED'

export interface EscrowContract {
  id: number
  contract_number: string
  customer_id: string
  partner_id: number
  inquiry_id?: number
  title: string
  description?: string
  contract_content: string
  terms_and_conditions?: string
  total_amount: number
  deposit_amount?: number
  commission_rate: number
  commission_amount?: number
  service_start_date?: string
  service_end_date?: string
  customer_signed: boolean
  customer_signature?: string
  customer_signed_at?: string
  partner_signed: boolean
  partner_signature?: string
  partner_signed_at?: string
  status: ContractStatus
  created_at: string
  updated_at?: string
  partner_name?: string
}

export interface EscrowMilestone {
  id: string
  escrow_id: string
  name: string
  description?: string
  sequence: number
  amount: number
  percentage: number
  status: MilestoneStatus
  due_date?: string
  submitted_at?: string
  approved_at?: string
  released_at?: string
  proof_description?: string
  proof_files: string[]
  created_at: string
}

export interface EscrowTransaction {
  id: string
  escrow_number: string
  customer_id: string
  partner_id: number
  contract_id: number
  total_amount: number
  platform_fee: number
  partner_payout: number
  status: EscrowStatus
  payment_key?: string
  order_id?: string
  payout_account_bank?: string
  payout_account_number?: string
  payout_account_holder?: string
  paid_at?: string
  created_at: string
  funded_at?: string
  completed_at?: string
  released_at?: string
  milestones?: EscrowMilestone[]
  contract?: EscrowContract
  partner_name?: string
}

export interface EscrowMessage {
  id: string
  escrow_id: string
  sender_id: string
  sender_name?: string
  message_type: MessageType
  content: string
  filtered_content?: string
  attachments: string[]
  contains_contact_info: boolean
  is_read: boolean
  read_at?: string
  created_at: string
  warning_message?: string
}

export interface EscrowDispute {
  id: number
  escrow_id: string
  raised_by: string
  reason: string
  description: string
  evidence_files: string[]
  status: DisputeStatus
  resolution_notes?: string
  refund_amount?: number
  assigned_admin_id?: string
  created_at: string
  resolved_at?: string
}

// HIRA (심평원) Types
export interface HospitalInfo {
  ykiho: string
  name: string
  address: string
  phone?: string
  clinic_type: string
  latitude: number
  longitude: number
  established?: string
  doctors: number
  beds: number
  distance_m?: number
}

export interface HospitalBillingStats {
  ykiho: string
  year_month?: string
  claim_count: number
  total_amount: number
  avg_per_claim: number
  patient_count: number
}

export interface HospitalWithRevenue extends HospitalInfo {
  billing_data?: HospitalBillingStats
  est_monthly_revenue: number
  claim_count: number
  patient_count: number
}

export interface ClinicTypeStats {
  region_code: string
  clinic_type: string
  avg_monthly_revenue: number
  avg_claim_count: number
  avg_per_claim: number
  total_clinics: number
  is_default: boolean
}

export interface PharmacyInfoHira {
  ykiho: string
  name: string
  address: string
  phone?: string
  latitude: number
  longitude: number
  established?: string
  pharmacists: number
  distance_m?: number
}

export interface PharmacyWithStats extends PharmacyInfoHira {
  billing_data?: {
    rx_count: number
    total_amount: number
    avg_per_rx: number
    year_month?: string
  }
  est_monthly_revenue: number
  nearby_hospitals: string[]
  nearby_hospital_count: number
}

export interface NearbyHospitalsResponse {
  items: HospitalWithRevenue[]
  total: number
  center: { latitude: number; longitude: number }
  radius_m: number
}

export interface NearbyPharmaciesResponse {
  items: PharmacyWithStats[]
  total: number
  center: { latitude: number; longitude: number }
  radius_m: number
}

export interface RegionStatsResponse {
  stats: ClinicTypeStats
  comparison?: {
    vs_national_percent: number
    national_avg_revenue: number
    region_rank?: number
  }
}

export interface ClinicTypeCode {
  code: string
  name: string
}

export interface RegionCode {
  sido_code: string
  name: string
}
