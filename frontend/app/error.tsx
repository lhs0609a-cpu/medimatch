'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅 서비스에 전송 (예: Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 아이콘 */}
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          문제가 발생했습니다
        </h1>

        {/* 설명 */}
        <p className="text-muted-foreground mb-6">
          페이지를 표시하는 중 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>

        {/* 에러 다이제스트 (디버깅용) */}
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono bg-secondary px-3 py-2 rounded-lg inline-block">
            Error ID: {error.digest}
          </p>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="btn-primary w-full py-3"
          >
            <RefreshCw className="w-5 h-5" />
            다시 시도
          </button>

          <Link
            href="/"
            className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </Link>
        </div>

        {/* 도움말 */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-left">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
            문제가 계속되나요?
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• 브라우저를 새로고침 해보세요</li>
            <li>• 캐시를 삭제하고 다시 시도해보세요</li>
            <li>• 다른 브라우저에서 시도해보세요</li>
          </ul>
        </div>

        {/* 문의 링크 */}
        <p className="mt-6 text-sm text-muted-foreground">
          문제가 지속되면{' '}
          <Link href="/help" className="text-primary hover:underline inline-flex items-center gap-1">
            <HelpCircle className="w-4 h-4" />
            고객센터
          </Link>
          로 문의해주세요.
        </p>
      </div>
    </div>
  )
}
