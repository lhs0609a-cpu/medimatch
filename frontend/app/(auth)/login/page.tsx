'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowLeft, Sparkles, Mail, Lock, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { oauthService } from '@/lib/api/services'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

  const handleSocialLogin = async (provider: 'google' | 'naver' | 'kakao') => {
    setSocialLoading(provider)
    try {
      let response
      switch (provider) {
        case 'google':
          response = await oauthService.getGoogleLoginUrl()
          break
        case 'naver':
          response = await oauthService.getNaverLoginUrl()
          break
        case 'kakao':
          response = await oauthService.getKakaoLoginUrl()
          break
      }

      if (response?.auth_url) {
        // state를 로컬 스토리지에 저장 (콜백에서 검증용)
        if (response.state) {
          localStorage.setItem(`oauth_state_${provider}`, response.state)
        }
        // OAuth 페이지로 리다이렉트
        window.location.href = response.auth_url
      }
    } catch (err) {
      toast.error(`${provider} 로그인 연동 중 오류가 발생했습니다.`)
      setSocialLoading(null)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    clearError()
    try {
      await login(data.email, data.password)
      toast.success('로그인되었습니다!')
      router.push('/dashboard')
    } catch (e) {
      // Error is handled by the store
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-12 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">홈으로</span>
        </Link>

        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">메디플라톤</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              다시 만나서 반가워요!
            </h1>
            <p className="text-gray-500">
              계정에 로그인하고 개원 분석을 시작하세요.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="example@email.com"
                  className="input pl-12"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-rose-500 rounded-full" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8자 이상 입력"
                  className="input pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-rose-500 rounded-full" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-600">로그인 상태 유지</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                비밀번호 찾기
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-base group"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  로그인
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">또는</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'google' ? (
                <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-sm font-medium">Google로 계속하기</span>
            </button>

            {/* Kakao */}
            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FEE500] text-[#191919] rounded-xl hover:bg-[#fdd800] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'kakao' ? (
                <span className="w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
              )}
              <span className="text-sm font-medium">카카오로 계속하기</span>
            </button>

            {/* Naver */}
            <button
              type="button"
              onClick={() => handleSocialLogin('naver')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#03C75A] text-white rounded-xl hover:bg-[#02b351] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'naver' ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                </svg>
              )}
              <span className="text-sm font-medium">네이버로 계속하기</span>
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-500 mt-8">
            아직 계정이 없으신가요?{' '}
            <Link href="/register" className="text-violet-600 font-semibold hover:text-violet-700">
              회원가입
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 gradient-bg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-10" />

        {/* Animated Blobs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center p-16 text-white">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              데이터로 시작하는<br />
              성공적인 개원
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              AI 기반 분석으로 3분 만에<br />
              개원 시뮬레이션을 경험해보세요.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              {[
                { value: '85%', label: '정확도' },
                { value: '3분', label: '분석 완료' },
                { value: '1,200+', label: '매칭 성사' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
