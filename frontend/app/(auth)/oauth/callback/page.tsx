'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/lib/hooks/useAuth'
import { Suspense } from 'react'

function OAuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('로그인 처리 중...')

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const error = searchParams.get('error')
      const oauthSuccess = searchParams.get('oauth_success')
      const returnedState = searchParams.get('state')
      const provider = searchParams.get('provider')

      // URL에서 토큰/민감정보 즉시 제거
      window.history.replaceState({}, '', window.location.pathname)

      if (error) {
        setStatus('error')
        setMessage(decodeURIComponent(error))
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      // OAuth state 검증 (CSRF 방지)
      if (provider && returnedState) {
        const storedState = localStorage.getItem(`oauth_state_${provider}`)
        localStorage.removeItem(`oauth_state_${provider}`)
        if (!storedState || storedState !== returnedState) {
          setStatus('error')
          setMessage('인증 상태 검증에 실패했습니다. 다시 로그인해주세요.')
          setTimeout(() => router.push('/login'), 3000)
          return
        }
      }

      if (oauthSuccess === 'true' && accessToken && refreshToken) {
        try {
          // 토큰 저장
          localStorage.setItem('access_token', accessToken)
          localStorage.setItem('refresh_token', refreshToken)

          // 사용자 정보 가져오기
          await fetchUser()

          // fetchUser가 내부에서 에러를 잡으므로 실제 인증 상태 확인
          const { isAuthenticated } = useAuth.getState()
          if (!isAuthenticated) {
            setStatus('error')
            setMessage('사용자 인증에 실패했습니다. 다시 로그인해주세요.')
            setTimeout(() => router.push('/login'), 3000)
            return
          }

          setStatus('success')
          setMessage('로그인 성공! 대시보드로 이동합니다...')

          setTimeout(() => router.push('/dashboard'), 1500)
        } catch (err) {
          setStatus('error')
          setMessage('로그인 처리 중 오류가 발생했습니다.')
          setTimeout(() => router.push('/login'), 3000)
        }
      } else {
        setStatus('error')
        setMessage('인증 정보가 올바르지 않습니다.')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router, fetchUser])

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-soft">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6 text-center">
          {status === 'loading' && (
            <span className="text-5xl">&#x23F3;</span>
          )}
          {status === 'success' && (
            <span className="text-5xl">&#x2705;</span>
          )}
          {status === 'error' && (
            <span className="text-5xl">&#x26A0;&#xFE0F;</span>
          )}
        </div>

        <h1 className={`text-xl font-bold mb-2 ${
          status === 'loading' ? 'text-gray-900' :
          status === 'success' ? 'text-emerald-700' : 'text-rose-700'
        }`}>
          {status === 'loading' ? '로그인 처리 중' :
           status === 'success' ? '로그인 성공!' : '로그인 실패'}
        </h1>

        <p className="text-gray-500">{message}</p>

        {status === 'loading' && (
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center gradient-bg-soft">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-center mb-6">
            <span className="text-5xl">&#x23F3;</span>
          </div>
          <h1 className="text-xl font-bold mb-2 text-gray-900">로그인 처리 중</h1>
          <p className="text-gray-500">잠시만 기다려주세요...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  )
}
