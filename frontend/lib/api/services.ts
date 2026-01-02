import {
  apiClient, SimulationRequest, SimulationResponse, Token, User,
  PharmacySlot, ProspectLocation, MapMarkersResponse, MapMarkerDetail,
  AnonymousListing, PharmacistProfile, Interest, Match, MatchMessage, Recommendation,
  PharmacyType, ListingStatus, MatchStatus,
  EscrowContract, EscrowTransaction, EscrowMilestone, EscrowMessage, EscrowDispute,
  EscrowStatus, ContractStatus,
  // HIRA Types
  HospitalInfo, HospitalWithRevenue, HospitalBillingStats,
  PharmacyInfoHira, PharmacyWithStats, ClinicTypeStats,
  NearbyHospitalsResponse, NearbyPharmaciesResponse, RegionStatsResponse,
  ClinicTypeCode, RegionCode
} from './client'

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

  // 심평원 실시간 병원 데이터
  getHiraHospitals: async (params: {
    latitude: number
    longitude: number
    radius_m?: number
    clinic_type?: string
  }) => {
    const response = await apiClient.get('/map/hira/hospitals', { params })
    return response.data
  },

  // 심평원 실시간 약국 데이터
  getHiraPharmacies: async (params: {
    latitude: number
    longitude: number
    radius_m?: number
  }) => {
    const response = await apiClient.get('/map/hira/pharmacies', { params })
    return response.data
  },

  // 심평원 병원 상세 (청구 통계)
  getHiraHospitalDetail: async (ykiho: string) => {
    const response = await apiClient.get(`/map/hira/hospital/${ykiho}/detail`)
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

  // 상세 조회 (포트폴리오 포함)
  getPartnerFull: async (id: number) => {
    const response = await apiClient.get(`/partners/${id}/full`)
    return response.data
  },

  // 포트폴리오
  getPortfolios: async (partnerId: number) => {
    const response = await apiClient.get(`/partners/${partnerId}/portfolios`)
    return response.data
  },

  createPortfolio: async (partnerId: number, data: {
    title: string
    project_type?: string
    project_size?: number
    project_cost?: number
    project_duration?: number
    location?: string
    client_type?: string
    description?: string
    images?: string[]
    is_featured?: boolean
  }) => {
    const response = await apiClient.post(`/partners/${partnerId}/portfolios`, data)
    return response.data
  },

  deletePortfolio: async (partnerId: number, portfolioId: number) => {
    const response = await apiClient.delete(`/partners/${partnerId}/portfolios/${portfolioId}`)
    return response.data
  },

  // 구독 플랜
  getSubscriptionPlans: async () => {
    const response = await apiClient.get('/partners/subscription-plans')
    return response.data
  },

  // 카테고리 (DB 기반, 수수료 정보 포함)
  getCategoriesFromDB: async () => {
    const response = await apiClient.get('/partners/categories/db')
    return response.data
  },
}

// Chat Services
export const chatService = {
  // 채팅방 목록
  getRooms: async (params?: { status?: string; page?: number; page_size?: number }) => {
    const response = await apiClient.get('/chat/rooms', { params })
    return response.data
  },

  // 채팅방 상세 (메시지 포함)
  getRoom: async (roomId: number, params?: { before?: string; limit?: number }) => {
    const response = await apiClient.get(`/chat/rooms/${roomId}`, { params })
    return response.data
  },

  // 채팅방 생성
  createRoom: async (data: {
    partner_id: number
    inquiry_id?: number
    initial_message?: string
  }) => {
    const response = await apiClient.post('/chat/rooms', data)
    return response.data
  },

  // 메시지 전송
  sendMessage: async (roomId: number, data: {
    message_type?: string
    content: string
    attachments?: any[]
    metadata?: any
  }) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, data)
    return response.data
  },

  // 읽음 처리
  markAsRead: async (roomId: number) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/read`)
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

// PharmMatch v2 - Anonymous Matching Services
export const pharmacyMatchService = {
  // Listings
  createListing: async (data: {
    region_code: string
    region_name: string
    pharmacy_type?: PharmacyType
    nearby_hospital_types?: string[]
    monthly_revenue_min?: number
    monthly_revenue_max?: number
    monthly_rx_count?: number
    area_pyeong_min?: number
    area_pyeong_max?: number
    premium_min?: number
    premium_max?: number
    monthly_rent?: number
    deposit?: number
    transfer_reason?: string
    operation_years?: number
    employee_count?: number
    has_auto_dispenser?: boolean
    has_parking?: boolean
    floor_info?: string
    description?: string
    exact_address: string
    pharmacy_name?: string
    owner_phone?: string
    latitude?: number
    longitude?: number
  }): Promise<AnonymousListing> => {
    const response = await apiClient.post('/pharmacy-match/listings', data)
    return response.data
  },

  getListings: async (params?: {
    region_codes?: string[]
    pharmacy_types?: PharmacyType[]
    premium_min?: number
    premium_max?: number
    monthly_revenue_min?: number
    area_min?: number
    area_max?: number
    has_auto_dispenser?: boolean
    has_parking?: boolean
    page?: number
    page_size?: number
  }): Promise<{ items: AnonymousListing[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get('/pharmacy-match/listings', { params })
    return response.data
  },

  getMyListings: async (): Promise<AnonymousListing[]> => {
    const response = await apiClient.get('/pharmacy-match/listings/my')
    return response.data
  },

  getListing: async (id: string): Promise<AnonymousListing> => {
    const response = await apiClient.get(`/pharmacy-match/listings/${id}`)
    return response.data
  },

  updateListing: async (id: string, data: Partial<AnonymousListing>): Promise<AnonymousListing> => {
    const response = await apiClient.patch(`/pharmacy-match/listings/${id}`, data)
    return response.data
  },

  deleteListing: async (id: string): Promise<void> => {
    await apiClient.delete(`/pharmacy-match/listings/${id}`)
  },

  // Profiles
  createProfile: async (data: {
    preferred_regions?: string[]
    preferred_region_names?: string[]
    budget_min?: number
    budget_max?: number
    preferred_area_min?: number
    preferred_area_max?: number
    preferred_revenue_min?: number
    preferred_revenue_max?: number
    experience_years?: number
    license_year?: number
    has_management_experience?: boolean
    specialty_areas?: string[]
    preferred_pharmacy_types?: string[]
    preferred_hospital_types?: string[]
    introduction?: string
    full_name?: string
    phone?: string
    email?: string
    license_number?: string
  }): Promise<PharmacistProfile> => {
    const response = await apiClient.post('/pharmacy-match/profiles', data)
    return response.data
  },

  getProfiles: async (params?: {
    region_codes?: string[]
    budget_min?: number
    budget_max?: number
    experience_years_min?: number
    has_management_experience?: boolean
    page?: number
    page_size?: number
  }): Promise<{ items: PharmacistProfile[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get('/pharmacy-match/profiles', { params })
    return response.data
  },

  getMyProfile: async (): Promise<PharmacistProfile> => {
    const response = await apiClient.get('/pharmacy-match/profiles/my')
    return response.data
  },

  getProfile: async (id: string): Promise<PharmacistProfile> => {
    const response = await apiClient.get(`/pharmacy-match/profiles/${id}`)
    return response.data
  },

  updateProfile: async (data: Partial<PharmacistProfile>): Promise<PharmacistProfile> => {
    const response = await apiClient.patch('/pharmacy-match/profiles/my', data)
    return response.data
  },

  // Interests
  expressInterest: async (data: {
    listing_id?: string
    pharmacist_profile_id?: string
    message?: string
  }): Promise<Interest> => {
    const response = await apiClient.post('/pharmacy-match/interests', data)
    return response.data
  },

  getInterests: async (): Promise<{
    sent: Interest[]
    received: Interest[]
    total_sent: number
    total_received: number
  }> => {
    const response = await apiClient.get('/pharmacy-match/interests')
    return response.data
  },

  cancelInterest: async (id: string): Promise<void> => {
    await apiClient.delete(`/pharmacy-match/interests/${id}`)
  },

  // Matches
  getMatches: async (): Promise<{ items: Match[]; total: number }> => {
    const response = await apiClient.get('/pharmacy-match/matches')
    return response.data
  },

  getMatch: async (id: string): Promise<Match> => {
    const response = await apiClient.get(`/pharmacy-match/matches/${id}`)
    return response.data
  },

  updateMatchStatus: async (id: string, data: {
    status: MatchStatus
    cancel_reason?: string
    meeting_scheduled_at?: string
  }): Promise<Match> => {
    const response = await apiClient.patch(`/pharmacy-match/matches/${id}/status`, data)
    return response.data
  },

  // Messages
  sendMessage: async (matchId: string, content: string): Promise<MatchMessage> => {
    const response = await apiClient.post(`/pharmacy-match/matches/${matchId}/messages`, { content })
    return response.data
  },

  getMessages: async (matchId: string, page = 1, pageSize = 50): Promise<{
    items: MatchMessage[]
    total: number
    unread_count: number
  }> => {
    const response = await apiClient.get(`/pharmacy-match/matches/${matchId}/messages`, {
      params: { page, page_size: pageSize }
    })
    return response.data
  },

  // Recommendations
  getRecommendations: async (limit = 10): Promise<{ recommendations: Recommendation[]; total: number }> => {
    const response = await apiClient.get('/pharmacy-match/recommendations', { params: { limit } })
    return response.data
  },
}

// Escrow Services
export const escrowService = {
  // Contracts
  createContract: async (data: {
    partner_id: number
    inquiry_id?: number
    title: string
    description?: string
    contract_content: string
    terms_and_conditions?: string
    total_amount: number
    deposit_amount?: number
    service_start_date?: string
    service_end_date?: string
  }): Promise<EscrowContract> => {
    const response = await apiClient.post('/escrow/contracts', data)
    return response.data
  },

  getContract: async (id: number): Promise<EscrowContract> => {
    const response = await apiClient.get(`/escrow/contracts/${id}`)
    return response.data
  },

  signContract: async (id: number, signature: string): Promise<EscrowContract> => {
    const response = await apiClient.post(`/escrow/contracts/${id}/sign`, { signature })
    return response.data
  },

  // Transactions
  createTransaction: async (contractId: number): Promise<EscrowTransaction> => {
    const response = await apiClient.post('/escrow/transactions', { contract_id: contractId })
    return response.data
  },

  getTransactions: async (): Promise<{ items: EscrowTransaction[]; total: number }> => {
    const response = await apiClient.get('/escrow/transactions')
    return response.data
  },

  getTransaction: async (id: string): Promise<EscrowTransaction> => {
    const response = await apiClient.get(`/escrow/transactions/${id}`)
    return response.data
  },

  fundTransaction: async (id: string, data: {
    success_url: string
    fail_url: string
  }): Promise<{
    escrow_id: string
    order_id: string
    amount: number
    order_name: string
    success_url: string
    fail_url: string
  }> => {
    const response = await apiClient.post(`/escrow/transactions/${id}/fund`, data)
    return response.data
  },

  confirmTransaction: async (id: string, data: {
    payment_key: string
    order_id: string
    amount: number
  }): Promise<EscrowTransaction> => {
    const response = await apiClient.post(`/escrow/transactions/${id}/confirm`, data)
    return response.data
  },

  releaseTransaction: async (id: string): Promise<EscrowTransaction> => {
    const response = await apiClient.post(`/escrow/transactions/${id}/release`)
    return response.data
  },

  // Milestones
  getMilestones: async (escrowId: string): Promise<EscrowMilestone[]> => {
    const response = await apiClient.get(`/escrow/transactions/${escrowId}/milestones`)
    return response.data
  },

  submitMilestone: async (milestoneId: string, data: {
    proof_description?: string
    proof_files?: string[]
  }): Promise<EscrowMilestone> => {
    const response = await apiClient.post(`/escrow/milestones/${milestoneId}/submit`, data)
    return response.data
  },

  approveMilestone: async (milestoneId: string): Promise<EscrowMilestone> => {
    const response = await apiClient.post(`/escrow/milestones/${milestoneId}/approve`)
    return response.data
  },

  rejectMilestone: async (milestoneId: string, reason: string): Promise<void> => {
    await apiClient.post(`/escrow/milestones/${milestoneId}/reject`, { reason })
  },

  // Messages
  getMessages: async (escrowId: string, page = 1, pageSize = 50): Promise<{
    items: EscrowMessage[]
    total: number
    unread_count: number
  }> => {
    const response = await apiClient.get(`/escrow/transactions/${escrowId}/messages`, {
      params: { page, page_size: pageSize }
    })
    return response.data
  },

  sendMessage: async (escrowId: string, data: {
    content: string
    message_type?: string
    attachments?: string[]
  }): Promise<EscrowMessage> => {
    const response = await apiClient.post(`/escrow/transactions/${escrowId}/messages`, data)
    return response.data
  },

  // Disputes
  createDispute: async (escrowId: string, data: {
    reason: string
    description: string
    evidence_files?: string[]
  }): Promise<EscrowDispute> => {
    const response = await apiClient.post(`/escrow/transactions/${escrowId}/dispute`, data)
    return response.data
  },
}

// HIRA (심평원) Services
export const hiraService = {
  // 주변 병원 검색
  getNearbyHospitals: async (params: {
    latitude: number
    longitude: number
    radius_m?: number
    clinic_type?: string
    include_revenue?: boolean
  }): Promise<NearbyHospitalsResponse> => {
    const response = await apiClient.get('/hira/hospitals/nearby', { params })
    return response.data
  },

  // 지역별 병원 검색
  searchHospitals: async (params: {
    sido_code: string
    sggu_code?: string
    clinic_type?: string
    page?: number
    page_size?: number
  }): Promise<{ items: HospitalInfo[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get('/hira/hospitals/search', { params })
    return response.data
  },

  // 병원별 청구 통계
  getHospitalBilling: async (ykiho: string): Promise<HospitalBillingStats> => {
    const response = await apiClient.get(`/hira/hospitals/${ykiho}/billing`)
    return response.data
  },

  // 지역/진료과별 통계
  getRegionStats: async (params: {
    region_code: string
    clinic_type: string
  }): Promise<RegionStatsResponse> => {
    const response = await apiClient.get('/hira/stats/region', { params })
    return response.data
  },

  // 주변 약국 검색
  getNearbyPharmacies: async (params: {
    latitude: number
    longitude: number
    radius_m?: number
    include_stats?: boolean
  }): Promise<NearbyPharmaciesResponse> => {
    const response = await apiClient.get('/hira/pharmacies/nearby', { params })
    return response.data
  },

  // 진료과목 코드 목록
  getClinicTypes: async (): Promise<ClinicTypeCode[]> => {
    const response = await apiClient.get('/hira/clinic-types')
    return response.data
  },

  // 지역 코드 목록
  getRegionCodes: async (): Promise<RegionCode[]> => {
    const response = await apiClient.get('/hira/region-codes')
    return response.data
  },
}
