'use client'

import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 아이콘 */}
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-12 h-12 text-muted-foreground" />
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          오프라인 상태입니다
        </h1>

        {/* 설명 */}
        <p className="text-muted-foreground mb-8">
          인터넷에 연결되어 있지 않습니다.
          <br />
          연결 상태를 확인하고 다시 시도해주세요.
        </p>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
          >
            <Home className="w-5 h-5" />
            홈으로
          </Link>
        </div>

        {/* 팁 */}
        <div className="mt-10 p-4 bg-muted rounded-xl text-left">
          <p className="text-sm font-medium text-foreground mb-2">
            오프라인에서도 사용 가능한 기능
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 이전에 본 페이지 (캐시된 경우)</li>
            <li>• 저장된 시뮬레이션 결과 확인</li>
            <li>• 앱 기본 탐색</li>
          </ul>
        </div>

        {/* 연결 상태 표시 */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          연결 대기 중...
        </div>
      </div>
    </div>
  )
}
