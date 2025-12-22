'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles,
  Mail, Lock, User, Phone, Building2, FileCheck,
  Stethoscope, Pill, Briefcase, Check, Shield
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  full_name: z.string().min(2, '이름을 입력해주세요'),
  phone: z.string().optional(),
  role: z.enum(['DOCTOR', 'PHARMACIST', 'SALES_REP']),
  company: z.string().optional(),
  license_number: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

type RegisterForm = z.infer<typeof registerSchema>

const roles = [
  {
    value: 'DOCTOR',
    label: '의사',
    icon: Stethoscope,
    description: '개원 시뮬레이션, 매물 탐색',
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50',
  },
  {
    value: 'PHARMACIST',
    label: '약사',
    icon: Pill,
    description: '약국 자리 입찰, 처방전 예측',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
  },
  {
    value: 'SALES_REP',
    label: '영업사원',
    icon: Briefcase,
    description: '개원지 탐색, 알림 설정',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'DOCTOR',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    clearError()
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        company: data.company,
        license_number: data.license_number,
      })
      toast.success('회원가입이 완료되었습니다!')
      router.push('/')
    } catch (e) {
      // Error handled by store
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-12 overflow-y-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 w-fit"
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
            <span className="text-xl font-bold text-gray-900">MediMatch</span>
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step >= 1 ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                회원 유형
              </span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-violet-600' : 'bg-gray-200'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step >= 2 ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                정보 입력
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? '어떤 서비스가 필요하세요?' : '거의 다 왔어요!'}
            </h1>
            <p className="text-gray-500">
              {step === 1 ? '맞춤형 서비스를 위해 회원 유형을 선택해주세요.' : '기본 정보를 입력하면 바로 시작할 수 있어요.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 ? (
              /* Step 1: Role Selection */
              <div className="space-y-4">
                {roles.map((role) => {
                  const Icon = role.icon
                  const isSelected = selectedRole === role.value
                  return (
                    <label
                      key={role.value}
                      className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/50 shadow-lg shadow-violet-500/10'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <input
                        {...register('role')}
                        type="radio"
                        value={role.value}
                        className="hidden"
                      />
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? `bg-gradient-to-br ${role.gradient} text-white shadow-lg`
                            : `${role.bgLight} text-gray-600`
                        }`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{role.label}</span>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                        </div>
                      </div>
                    </label>
                  )
                })}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-3.5 text-base mt-6 group"
                >
                  다음으로
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              /* Step 2: Information */
              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 <span className="text-violet-600">*</span>
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

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-violet-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('full_name')}
                      type="text"
                      placeholder="홍길동"
                      className="input pl-12"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-2 text-sm text-rose-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-rose-500 rounded-full" />
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="010-1234-5678"
                      className="input pl-12"
                    />
                  </div>
                </div>

                {/* Role-specific fields */}
                {selectedRole === 'SALES_REP' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      소속 회사
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('company')}
                        type="text"
                        placeholder="회사명"
                        className="input pl-12"
                      />
                    </div>
                  </div>
                )}

                {(selectedRole === 'DOCTOR' || selectedRole === 'PHARMACIST') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      면허번호
                    </label>
                    <div className="relative">
                      <FileCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('license_number')}
                        type="text"
                        placeholder="면허번호 입력"
                        className="input pl-12"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 <span className="text-violet-600">*</span>
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

                {/* Password Confirm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인 <span className="text-violet-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('passwordConfirm')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="비밀번호 재입력"
                      className="input pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.passwordConfirm && (
                    <p className="mt-2 text-sm text-rose-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-rose-500 rounded-full" />
                      {errors.passwordConfirm.message}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1 py-3.5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    이전
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex-[2] py-3.5"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        가입 중...
                      </>
                    ) : (
                      <>
                        가입하기
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FEE500">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.045 5.899l-.987 3.645c-.067.245.21.432.42.283l4.168-2.891c.774.117 1.567.177 2.354.177 5.523 0 10-3.477 10-7.613C22 6.477 17.523 3 12 3z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Kakao</span>
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-500 mt-8">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-violet-600 font-semibold hover:text-violet-700">
              로그인
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center p-16 text-white">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              전문가를 위한<br />
              맞춤 서비스
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              의료 전문가를 위해 설계된<br />
              데이터 기반 의사결정 플랫폼
            </p>

            {/* Features */}
            <div className="mt-12 space-y-4">
              {[
                { icon: Stethoscope, text: '의사 - 최적의 개원 입지 분석' },
                { icon: Pill, text: '약사 - 처방전 예측 및 입찰 지원' },
                { icon: Briefcase, text: '영업사원 - 신규 개원지 실시간 알림' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
