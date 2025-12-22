import { apiClient, SimulationRequest, SimulationResponse, Token, User, PharmacySlot, ProspectLocation, MapMarkersResponse, MapMarkerDetail } from './client'

// Auth Services
export const authService = {
  login: async (email: string, password: string): Promise<Token> => {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  },

  register: async (data: {
    email: string
    password: string
    full_name: string
    phone?: string
    role: string
    company?: string
    license_number?: string
  }): Promise<User> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<Token> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/me', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

// Simulation Services (OpenSim)
export const simulationService = {
  create: async (data: SimulationRequest): Promise<SimulationResponse> => {
    const response = await apiClient.post('/simulate', data)
    return response.data
  },

  get: async (id: string): Promise<SimulationResponse> => {
    const response = await apiClient.get(`/simulate/${id}`)
    return response.data
  },

  getCompetitors: async (id: string) => {
    const response = await apiClient.get(`/simulate/${id}/competitors`)
    return response.data
  },

  getListings: async (id: string) => {
    const response = await apiClient.get(`/simulate/${id}/listings`)
    return response.data
  },

  purchaseReport: async (simulationId: string) => {
    const response = await apiClient.post('/simulate/reports/purchase', {
      simulation_id: simulationId,
      payment_method: 'card',
    })
    return response.data
  },

  downloadReport: async (reportId: string) => {
    const response = await apiClient.get(`/simulate/reports/${reportId}/download`)
    return response.data
  },

  getMySimulations: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/simulate/my/simulations', {
      params: { page, page_size: pageSize },
    })
    return response.data
  },
}

// Pharmacy Slots Services (PharmMatch)
export const slotsService = {
  getAll: async (params?: {
    status?: string
    clinic_type?: string
    min_revenue?: number
    page?: number
    page_size?: number
  }) => {
    const response = await apiClient.get('/slots', { params })
    return response.data
  },

  get: async (id: string): Promise<PharmacySlot> => {
    const response = await apiClient.get(`/slots/${id}`)
    return response.data
  },

  create: async (data: Partial<PharmacySlot>): Promise<PharmacySlot> => {
    const response = await apiClient.post('/slots', data)
    return response.data
  },

  update: async (id: string, data: Partial<PharmacySlot>): Promise<PharmacySlot> => {
    const response = await apiClient.patch(`/slots/${id}`, data)
    return response.data
  },

  createBid: async (slotId: string, data: {
    bid_amount: number
    message?: string
    experience_years?: number
    pharmacy_name?: string
  }) => {
    const response = await apiClient.post(`/slots/${slotId}/bids`, data)
    return response.data
  },

  getBids: async (slotId: string) => {
    const response = await apiClient.get(`/slots/${slotId}/bids`)
    return response.data
  },
}

// Bids Services (PharmMatch)
export const bidsService = {
  accept: async (bidId: string) => {
    const response = await apiClient.patch(`/bids/${bidId}/accept`)
    return response.data
  },

  reject: async (bidId: string) => {
    const response = await apiClient.patch(`/bids/${bidId}/reject`)
    return response.data
  },
}

// Prospects Services (SalesScanner)
export const prospectsService = {
  getAll: async (params?: {
    type?: string
    status?: string
    clinic_types?: string
    min_score?: number
    page?: number
    page_size?: number
  }) => {
    const response = await apiClient.get('/prospects', { params })
    return response.data
  },

  getMap: async (params: {
    min_lat: number
    max_lat: number
    min_lng: number
    max_lng: number
    type?: string
    min_score?: number
  }) => {
    const response = await apiClient.get('/prospects/map', { params })
    return response.data
  },

  get: async (id: string): Promise<ProspectLocation> => {
    const response = await apiClient.get(`/prospects/${id}`)
    return response.data
  },

  getReport: async (id: string) => {
    const response = await apiClient.get(`/prospects/${id}/report`)
    return response.data
  },
}

// Alerts Services (SalesScanner)
export const alertsService = {
  getAll: async () => {
    const response = await apiClient.get('/alerts')
    return response.data
  },

  create: async (data: {
    name?: string
    region_codes?: string[]
    region_names?: string[]
    clinic_types?: string[]
    min_score?: number
    prospect_types?: string[]
    notify_email?: boolean
    notify_push?: boolean
  }) => {
    const response = await apiClient.post('/alerts', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/alerts/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/alerts/${id}`)
  },
}

// Export Services (SalesScanner)
export const exportService = {
  excel: async (params?: {
    type?: string
    status?: string
    min_score?: number
  }) => {
    const response = await apiClient.get('/export/excel', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  csv: async (params?: {
    type?: string
    status?: string
    min_score?: number
  }) => {
    const response = await apiClient.get('/export/csv', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}

// Map Services
export const mapService = {
  getMarkers: async (params: {
    min_lat: number
    max_lat: number
    min_lng: number
    max_lng: number
    types?: string
    min_score?: number
    max_score?: number
    clinic_types?: string
  }): Promise<MapMarkersResponse> => {
    const response = await apiClient.get('/map/markers', { params })
    return response.data
  },

  getMarkerDetail: async (markerId: string, markerType: string): Promise<MapMarkerDetail> => {
    const response = await apiClient.get(`/map/markers/${markerId}`, {
      params: { marker_type: markerType }
    })
    return response.data
  },
}

// Partner Services
export const partnerService = {
  getCategories: async () => {
    const response = await apiClient.get('/partners/categories')
    return response.data
  },

  getPartners: async (params?: {
    category?: string
    region?: string
    search?: string
    is_premium?: boolean
    is_verified?: boolean
    sort_by?: string
    page?: number
    page_size?: number
  }) => {
    const response = await apiClient.get('/partners', { params })
    return response.data
  },

  getPartner: async (id: number) => {
    const response = await apiClient.get(`/partners/${id}`)
    return response.data
  },

  getPartnerReviews: async (id: number, page = 1, pageSize = 10) => {
    const response = await apiClient.get(`/partners/${id}/reviews`, {
      params: { page, page_size: pageSize }
    })
    return response.data
  },

  createInquiry: async (data: {
    partner_id: number
    inquiry_type: string
    title: string
    content: string
    project_location?: string
    project_size?: string
    budget_range?: string
    expected_start_date?: string
    contact_name?: string
    contact_phone?: string
    contact_email?: string
  }) => {
    const response = await apiClient.post('/partners/inquiries', data)
    return response.data
  },

  getMyInquiries: async (status?: string) => {
    const response = await apiClient.get('/partners/inquiries/my', {
      params: { status }
    })
    return response.data
  },

  createReview: async (data: {
    partner_id: number
    rating: number
    quality_rating?: number
    price_rating?: number
    communication_rating?: number
    timeliness_rating?: number
    title?: string
    content?: string
  }) => {
    const response = await apiClient.post('/partners/reviews', data)
    return response.data
  },

  getRecommended: async (userRole: string) => {
    const response = await apiClient.get(`/partners/recommended/${userRole}`)
    return response.data
  },
}

// Payment Services
export const paymentService = {
  getProducts: async () => {
    const response = await apiClient.get('/payments/products')
    return response.data
  },

  preparePayment: async (data: {
    product_id: string
    product_name: string
    amount: number
  }) => {
    const response = await apiClient.post('/payments/prepare', data)
    return response.data
  },

  confirmPayment: async (data: {
    payment_key: string
    order_id: string
    amount: number
  }) => {
    const response = await apiClient.post('/payments/confirm', data)
    return response.data
  },

  cancelPayment: async (orderId: string, cancelReason?: string) => {
    const response = await apiClient.post(`/payments/cancel/${orderId}`, null, {
      params: { cancel_reason: cancelReason }
    })
    return response.data
  },

  getHistory: async () => {
    const response = await apiClient.get('/payments/history')
    return response.data
  },

  getSubscription: async () => {
    const response = await apiClient.get('/payments/subscription')
    return response.data
  },

  getCredits: async () => {
    const response = await apiClient.get('/payments/credits')
    return response.data
  },
}

// OAuth Services
export const oauthService = {
  // Google
  getGoogleLoginUrl: async () => {
    const response = await apiClient.get('/oauth/google/login')
    return response.data
  },

  googleCallback: async (code: string, state?: string) => {
    const response = await apiClient.post('/oauth/google/callback', { code, state })
    return response.data
  },

  // Naver
  getNaverLoginUrl: async () => {
    const response = await apiClient.get('/oauth/naver/login')
    return response.data
  },

  naverCallback: async (code: string, state?: string) => {
    const response = await apiClient.post('/oauth/naver/callback', { code, state })
    return response.data
  },

  // Kakao
  getKakaoLoginUrl: async () => {
    const response = await apiClient.get('/oauth/kakao/login')
    return response.data
  },

  kakaoCallback: async (code: string, state?: string) => {
    const response = await apiClient.post('/oauth/kakao/callback', { code, state })
    return response.data
  },

  disconnect: async (provider: string) => {
    const response = await apiClient.post(`/oauth/disconnect/${provider}`)
    return response.data
  },
}
