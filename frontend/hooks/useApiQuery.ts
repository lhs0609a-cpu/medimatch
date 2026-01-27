import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'

// ============================================================
// Query Keys Factory
// ============================================================

export const queryKeys = {
  // 사용자
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
  },

  // 시뮬레이션
  simulations: {
    all: ['simulations'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.simulations.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.simulations.all, 'detail', id] as const,
    report: (id: string) => [...queryKeys.simulations.all, 'report', id] as const,
  },

  // 건물/매물
  buildings: {
    all: ['buildings'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.buildings.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.buildings.all, 'detail', id] as const,
    nearby: (lat: number, lng: number) =>
      [...queryKeys.buildings.all, 'nearby', lat, lng] as const,
  },

  // 파트너
  partners: {
    all: ['partners'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.partners.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.partners.all, 'detail', id] as const,
    categories: () => [...queryKeys.partners.all, 'categories'] as const,
  },

  // 약국 매칭
  pharmacyMatch: {
    all: ['pharmacy-match'] as const,
    listings: (filters?: Record<string, unknown>) =>
      [...queryKeys.pharmacyMatch.all, 'listings', filters] as const,
    listing: (id: string) =>
      [...queryKeys.pharmacyMatch.all, 'listing', id] as const,
    matches: () => [...queryKeys.pharmacyMatch.all, 'matches'] as const,
  },

  // 프로스펙트 (영업사원용)
  prospects: {
    all: ['prospects'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.prospects.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.prospects.all, 'detail', id] as const,
  },

  // 대시보드
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    activities: () => [...queryKeys.dashboard.all, 'activities'] as const,
    publicStats: () => [...queryKeys.dashboard.all, 'public-stats'] as const,
  },

  // 알림
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
}

// ============================================================
// Stale Time Presets (데이터 종류별 최적화된 staleTime)
// ============================================================

export const staleTimes = {
  // 거의 변하지 않는 데이터 (카테고리, 옵션 등)
  static: 60 * 60 * 1000, // 1시간

  // 자주 변하지 않는 데이터 (파트너 목록, 건물 목록)
  slow: 10 * 60 * 1000, // 10분

  // 적당히 변하는 데이터 (시뮬레이션, 리포트)
  normal: 5 * 60 * 1000, // 5분

  // 자주 변하는 데이터 (알림, 매칭 상태)
  fast: 60 * 1000, // 1분

  // 실시간 데이터 (채팅, 현재 사용자)
  realtime: 30 * 1000, // 30초
}

// ============================================================
// Custom Hooks
// ============================================================

/**
 * 현재 사용자 정보 쿼리
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: async () => {
      const response = await fetch('/api/v1/users/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch user')
      return response.json()
    },
    staleTime: staleTimes.realtime,
    enabled: !!localStorage.getItem('token'),
  })
}

/**
 * 대시보드 공개 통계 쿼리
 */
export function usePublicStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.publicStats(),
    queryFn: async () => {
      const response = await fetch('/api/v1/dashboard/public/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    staleTime: staleTimes.slow,
  })
}

/**
 * 캐시 무효화 헬퍼 훅
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return {
    // 특정 쿼리 무효화
    invalidate: (queryKey: readonly unknown[]) => {
      queryClient.invalidateQueries({ queryKey })
    },

    // 모든 사용자 관련 쿼리 무효화 (로그아웃 시)
    invalidateUser: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },

    // 시뮬레이션 관련 쿼리 무효화
    invalidateSimulations: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.simulations.all })
    },

    // 건물 관련 쿼리 무효화
    invalidateBuildings: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all })
    },

    // 모든 캐시 클리어
    clearAll: () => {
      queryClient.clear()
    },
  }
}

/**
 * 낙관적 업데이트를 위한 헬퍼
 */
export function useOptimisticUpdate<T>(queryKey: readonly unknown[]) {
  const queryClient = useQueryClient()

  return {
    // 낙관적 업데이트 시작
    startOptimistic: (updater: (old: T | undefined) => T) => {
      const previousData = queryClient.getQueryData<T>(queryKey)
      queryClient.setQueryData<T>(queryKey, updater)
      return previousData
    },

    // 롤백
    rollback: (previousData: T | undefined) => {
      queryClient.setQueryData<T>(queryKey, previousData)
    },

    // 서버 데이터로 갱신
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  }
}
