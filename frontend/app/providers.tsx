'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from '@/components/theme'
import { SubscriptionProvider } from '@/lib/contexts/SubscriptionContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 데이터가 오래되었다고 판단하는 시간 (5분)
            staleTime: 5 * 60 * 1000,
            // 캐시에 유지되는 시간 (30분)
            gcTime: 30 * 60 * 1000,
            // 윈도우 포커스 시 재요청 비활성화
            refetchOnWindowFocus: false,
            // 재연결 시 재요청 비활성화
            refetchOnReconnect: false,
            // 기본 재시도 횟수
            retry: 1,
            // 재시도 간격
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // 뮤테이션 재시도 없음
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
