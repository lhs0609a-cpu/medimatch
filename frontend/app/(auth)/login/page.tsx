'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
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
      router.push('/')
    } catch (e) {
      // Error is handled by the store
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MediMatch</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              로그인
            </h1>
            <p className="text-gray-600 text-center mb-8">
              MediMatch에 오신 것을 환영합니다
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상 입력"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>

              {/* Forgot Password */}
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* Register Link */}
            <p className="text-center text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link href="/register" className="text-primary-600 font-medium hover:text-primary-700">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
