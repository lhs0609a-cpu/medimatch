'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.medimatch.kr/api/v1'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.detail || '비밀번호 변경에 실패했습니다')
      }
    } catch {
      setError('서버에 연결할 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">잘못된 접근입니다</h2>
          <p className="text-gray-500 mb-6">유효한 비밀번호 재설정 링크를 사용해주세요.</p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            비밀번호 찾기로 이동
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <TossIcon icon={CheckCircle} color="from-green-500 to-emerald-500" size="lg" shadow="shadow-green-500/25" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 변경 완료</h2>
          <p className="text-gray-500 mb-6">새 비밀번호로 로그인해주세요.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <TossIcon icon={Sparkles} color="from-amber-500 to-orange-500" size="sm" shadow="shadow-amber-500/25" />
            <span className="text-xl font-bold text-gray-900">메디플라톤</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">새 비밀번호 설정</h1>
          <p className="text-gray-500 mb-6">새로운 비밀번호를 입력해주세요.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상 입력"
                  className="input pl-12"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="input pl-12"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6">
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
