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
