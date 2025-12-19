'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowLeft, Building2, Pill, Briefcase, Stethoscope } from 'lucide-react'
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
  { value: 'DOCTOR', label: '의사', icon: Stethoscope, description: '개원 시뮬레이션, 매물 탐색' },
  { value: 'PHARMACIST', label: '약사', icon: Pill, description: '약국 자리 입찰, 처방전 예측' },
  { value: 'SALES_REP', label: '영업사원', icon: Briefcase, description: '개원지 탐색, 알림 설정' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
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
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200'}`} />
              <div className={`w-12 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {step === 1 ? '회원 유형 선택' : '정보 입력'}
            </h1>
            <p className="text-gray-600 text-center mb-8">
              {step === 1 ? '어떤 서비스를 이용하시겠어요?' : '회원 정보를 입력해주세요'}
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 ? (
                /* Step 1: Role Selection */
                <div className="space-y-4">
                  {roles.map((role) => {
                    const Icon = role.icon
                    return (
                      <label
                        key={role.value}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition ${
                          selectedRole === role.value
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          {...register('role')}
                          type="radio"
                          value={role.value}
                          className="hidden"
                        />
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedRole === role.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{role.label}</div>
                            <div className="text-sm text-gray-500">{role.description}</div>
                          </div>
                        </div>
                      </label>
                    )
                  })}

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition mt-6"
                  >
                    다음
                  </button>
                </div>
              ) : (
                /* Step 2: Information */
                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 *
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

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      {...register('full_name')}
                      type="text"
                      placeholder="홍길동"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Role-specific fields */}
                  {selectedRole === 'SALES_REP' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        소속 회사
                      </label>
                      <input
                        {...register('company')}
                        type="text"
                        placeholder="회사명"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {(selectedRole === 'DOCTOR' || selectedRole === 'PHARMACIST') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        면허번호
                      </label>
                      <input
                        {...register('license_number')}
                        type="text"
                        placeholder="면허번호 입력"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호 *
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Password Confirm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호 확인 *
                    </label>
                    <input
                      {...register('passwordConfirm')}
                      type="password"
                      placeholder="비밀번호 재입력"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.passwordConfirm && (
                      <p className="mt-1 text-sm text-red-500">{errors.passwordConfirm.message}</p>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                    >
                      이전
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50"
                    >
                      {isLoading ? '가입 중...' : '가입하기'}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Login Link */}
            <p className="text-center text-gray-600 mt-6">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
