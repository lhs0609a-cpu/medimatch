'use client'

import { useEffect } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 치명적 에러 로깅
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* 아이콘 */}
            <div className="w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon className="w-12 h-12 text-red-400" />
            </div>

            {/* 제목 */}
            <h1 className="text-2xl font-bold text-white mb-2">
              치명적인 오류가 발생했습니다
            </h1>

            {/* 설명 */}
            <p className="text-gray-400 mb-8">
              애플리케이션에 심각한 문제가 발생했습니다.
              <br />
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>

            {/* 에러 다이제스트 */}
            {error.digest && (
              <p className="text-xs text-gray-600 mb-6 font-mono">
                Error ID: {error.digest}
              </p>
            )}

            {/* 새로고침 버튼 */}
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              새로고침
            </button>

            {/* 연락처 */}
            <p className="mt-8 text-sm text-gray-500">
              문제가 지속되면 support@mediplatone.kr로 문의해주세요.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
