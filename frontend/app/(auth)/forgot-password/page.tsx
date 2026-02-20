'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const forgotPasswordSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error('API URL이 설정되지 않았습니다.')
      }

      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (!res.ok) {
        throw new Error('요청 처리에 실패했습니다.')
      }

      setIsSubmitted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '요청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-center mx-auto mb-6">
            <span className="text-4xl">&#x2709;&#xFE0F;</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일을 확인해주세요</h2>
          <p className="text-gray-500 mb-6">
            등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다.
            <br />
            메일이 보이지 않으면 스팸함을 확인해주세요.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            로그인으로 돌아가기
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">메디플라톤</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 찾기</h1>
          <p className="text-gray-500 mb-6">
            가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-base"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  전송 중...
                </>
              ) : (
                '재설정 링크 보내기'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6">
            <Link href="/login" className="text-violet-600 font-medium hover:text-violet-700">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
