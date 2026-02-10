'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Mail, MapPin, Clock, Send,
  MessageCircle, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

const inquiryTypes = [
  { value: 'general', label: '일반 문의' },
  { value: 'simulation', label: '시뮬레이션 관련' },
  { value: 'matching', label: '매칭 서비스 관련' },
  { value: 'payment', label: '결제/환불 문의' },
  { value: 'partnership', label: '제휴/파트너십' },
  { value: 'bug', label: '오류 신고' },
  { value: 'other', label: '기타' },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'general',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error('API URL이 설정되지 않았습니다.')
      }

      const res = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || '문의 접수에 실패했습니다.')
      }

      setIsSubmitted(true)
      toast.success('문의가 성공적으로 접수되었습니다.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '문의 접수에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">문의가 접수되었습니다</h2>
          <p className="text-muted-foreground mb-6">
            빠른 시일 내에 답변 드리겠습니다.<br />
            입력하신 이메일로 답변이 발송됩니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="btn-primary">
              홈으로
            </Link>
            <button
              onClick={() => {
                setIsSubmitted(false)
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  type: 'general',
                  subject: '',
                  message: '',
                })
              }}
              className="btn-secondary"
            >
              추가 문의
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">문의하기</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                언제든 연락주세요
              </h1>
              <p className="text-muted-foreground">
                메디플라톤 팀이 도움을 드리겠습니다
              </p>
            </div>

            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">이메일</h3>
                    <a href="mailto:support@mediplaton.com" className="text-muted-foreground hover:text-foreground">
                      support@mediplaton.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">카톡 상담</h3>
                    <a href="https://open.kakao.com/o/sMLX4Zei" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      카카오톡 오픈채팅
                    </a>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">운영시간</h3>
                    <p className="text-muted-foreground">
                      평일 09:00 - 18:00<br />
                      <span className="text-sm">(공휴일 휴무)</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">주소</h3>
                    <p className="text-muted-foreground">
                      서울특별시 강남구 테헤란로 123<br />
                      메디플라톤빌딩 5층
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5 bg-secondary/50">
              <h3 className="font-medium text-foreground mb-2">빠른 답변이 필요하신가요?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                자주 묻는 질문에서 바로 답변을 찾아보세요
              </p>
              <Link href="/faq" className="btn-secondary w-full justify-center">
                FAQ 바로가기
              </Link>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">문의 양식</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-2 block">이름 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="홍길동"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label mb-2 block">이메일 *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="example@email.com"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-2 block">연락처</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="010-1234-5678"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label mb-2 block">문의 유형 *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="select"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label mb-2 block">제목 *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="문의 제목을 입력해주세요"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label mb-2 block">문의 내용 *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="문의 내용을 상세히 작성해주세요"
                    rows={6}
                    className="input resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <input type="checkbox" required className="mt-1" />
                  <span>
                    <Link href="/privacy" className="text-foreground hover:underline">개인정보처리방침</Link>에
                    동의하며, 문의 답변을 위해 개인정보가 수집/이용됨에 동의합니다.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full h-12 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      문의 보내기
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
