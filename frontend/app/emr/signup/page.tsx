'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Pill,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Shield,
  Zap,
  MessageCircle,
  Globe,
  Check,
  AlertCircle,
  User,
  Phone,
  Building2,
  FileText,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'

export default function SignupPage() {
  const [userType, setUserType] = useState<'clinic' | 'pharmacy' | null>(null)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, marketing: false })
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    facilityName: '',
    facilityNo: '',
    bizNo: '',
  })

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const allRequiredAgreed = agreed.terms && agreed.privacy
  const passwordMatch = form.password === form.passwordConfirm
  const passwordValid = form.password.length >= 8

  const handleSignup = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      window.location.href = '/emr/onboarding'
    }, 2000)
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽: 브랜딩 */}
      <div className="hidden lg:flex lg:w-[420px] bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link href="/emr" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">MediMatch EMR</span>
          </Link>

          <h2 className="text-3xl font-bold leading-tight mb-4">
            90일 무료 체험<br />시작하세요
          </h2>
          <p className="text-white/80 text-sm mb-10">
            신용카드 없이 모든 기능을 체험하세요.<br />
            언제든지 해지 가능합니다.
          </p>

          <div className="space-y-4">
            {[
              '가입 후 3분 내 EMR 사용 가능',
              '기존 데이터 무료 마이그레이션',
              '전담 컨설턴트 온보딩 지원',
              '90일 체험 후 자동 과금 없음',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽: 가입 폼 */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* 모바일 로고 */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">MediMatch EMR</span>
          </div>

          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > s ? 'bg-emerald-500 text-white' :
                  step === s ? 'bg-blue-600 text-white' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 rounded ${step > s ? 'bg-emerald-500' : 'bg-secondary'}`} />}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {step === 1 ? '유형 선택' : step === 2 ? '정보 입력' : '약관 동의'}
            </span>
          </div>

          {/* Step 1: 유형 선택 */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">어떤 기관인가요?</h2>
              <p className="text-sm text-muted-foreground mb-8">사용 목적에 맞는 유형을 선택해주세요</p>

              <div className="space-y-4">
                <button
                  onClick={() => setUserType('clinic')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    userType === 'clinic'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:border-blue-200'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    userType === 'clinic' ? 'bg-blue-500' : 'bg-secondary'
                  }`}>
                    <Stethoscope className={`w-7 h-7 ${userType === 'clinic' ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">의원 · 클리닉</div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      AI 음성 차트, 청구 방어, 환자 관리
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-2xs font-semibold text-blue-600">무료 시작</span>
                      <span className="text-2xs text-muted-foreground">Starter 0원 → Clinic 19만원/월</span>
                    </div>
                  </div>
                  {userType === 'clinic' && <CheckCircle2 className="w-6 h-6 text-blue-500 flex-shrink-0" />}
                </button>

                <button
                  onClick={() => setUserType('pharmacy')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    userType === 'pharmacy'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-border hover:border-purple-200'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    userType === 'pharmacy' ? 'bg-purple-500' : 'bg-secondary'
                  }`}>
                    <Pill className={`w-7 h-7 ${userType === 'pharmacy' ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">약국</div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      실시간 처방 수신, 재고 관리, DUR 자동점검
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-2xs font-semibold text-purple-600">무료 시작</span>
                      <span className="text-2xs text-muted-foreground">Pharmacy 9만원/월</span>
                    </div>
                  </div>
                  {userType === 'pharmacy' && <CheckCircle2 className="w-6 h-6 text-purple-500 flex-shrink-0" />}
                </button>
              </div>

              <button
                onClick={() => userType && setStep(2)}
                disabled={!userType}
                className="w-full mt-8 py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                style={{ backgroundColor: userType === 'pharmacy' ? 'rgb(168 85 247)' : 'rgb(37 99 235)' }}
              >
                다음 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: 정보 입력 */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">기본 정보 입력</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {userType === 'clinic' ? '의원' : '약국'} 가입에 필요한 정보를 입력해주세요
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">이름</label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => updateForm('name', e.target.value)}
                        placeholder={userType === 'clinic' ? '원장님 성함' : '약사 성함'}
                        className="input pl-10 py-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">연락처</label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => updateForm('phone', e.target.value)}
                        placeholder="010-0000-0000"
                        className="input pl-10 py-2.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">이메일</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => updateForm('email', e.target.value)}
                      placeholder="example@medimatch.kr"
                      className="input pl-10 py-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">비밀번호</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => updateForm('password', e.target.value)}
                        placeholder="8자 이상"
                        className="input pl-10 py-2.5"
                      />
                    </div>
                    {form.password && !passwordValid && (
                      <span className="text-2xs text-red-500 mt-1">8자 이상 입력해주세요</span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">비밀번호 확인</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.passwordConfirm}
                        onChange={e => updateForm('passwordConfirm', e.target.value)}
                        placeholder="비밀번호 재입력"
                        className="input pl-10 py-2.5"
                      />
                    </div>
                    {form.passwordConfirm && !passwordMatch && (
                      <span className="text-2xs text-red-500 mt-1">비밀번호가 다릅니다</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <h4 className="text-sm font-semibold mb-3">
                    {userType === 'clinic' ? '의원 정보' : '약국 정보'}
                  </h4>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {userType === 'clinic' ? '의원명' : '약국명'}
                  </label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.facilityName}
                      onChange={e => updateForm('facilityName', e.target.value)}
                      placeholder={userType === 'clinic' ? '메디매치내과의원' : '메디매치약국'}
                      className="input pl-10 py-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      {userType === 'clinic' ? '요양기관번호' : '약국허가번호'}
                    </label>
                    <div className="relative mt-1">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.facilityNo}
                        onChange={e => updateForm('facilityNo', e.target.value)}
                        placeholder={userType === 'clinic' ? '12345678' : '서울-약-12345'}
                        className="input pl-10 py-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">사업자등록번호</label>
                    <div className="relative mt-1">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.bizNo}
                        onChange={e => updateForm('bizNo', e.target.value)}
                        placeholder="000-00-00000"
                        className="input pl-10 py-2.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> 이전
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: userType === 'pharmacy' ? 'rgb(168 85 247)' : 'rgb(37 99 235)' }}
                >
                  다음 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 약관 동의 */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">약관 동의</h2>
              <p className="text-sm text-muted-foreground mb-6">서비스 이용을 위해 약관에 동의해주세요</p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const allChecked = agreed.terms && agreed.privacy && agreed.marketing
                    setAgreed({ terms: !allChecked, privacy: !allChecked, marketing: !allChecked })
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-border hover:border-blue-200 transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    agreed.terms && agreed.privacy && agreed.marketing ? 'bg-blue-600' : 'bg-secondary'
                  }`}>
                    <Check className={`w-4 h-4 ${agreed.terms && agreed.privacy && agreed.marketing ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="font-bold">전체 동의</span>
                </button>

                <div className="pl-2 space-y-2">
                  {[
                    { key: 'terms' as const, label: '서비스 이용약관 동의', required: true },
                    { key: 'privacy' as const, label: '개인정보 수집·이용 동의', required: true },
                    { key: 'marketing' as const, label: '마케팅 정보 수신 동의', required: false },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setAgreed(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        agreed[item.key] ? 'bg-blue-600' : 'border border-border'
                      }`}>
                        {agreed[item.key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm flex-1">{item.label}</span>
                      <span className={`text-2xs font-medium ${item.required ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {item.required ? '필수' : '선택'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600">개인정보 보호 약속</span>
                </div>
                <p className="text-xs text-blue-600/80">
                  MediMatch는 ISMS-P 인증을 받은 안전한 환경에서 데이터를 관리하며,
                  수집된 개인정보는 서비스 제공 목적으로만 사용됩니다.
                </p>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> 이전
                </button>
                <button
                  onClick={handleSignup}
                  disabled={!allRequiredAgreed || isLoading}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                  style={{ backgroundColor: userType === 'pharmacy' ? 'rgb(168 85 247)' : 'rgb(37 99 235)' }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      가입 처리 중...
                    </>
                  ) : (
                    <>
                      무료 체험 시작하기 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <span className="text-sm text-muted-foreground">이미 계정이 있으신가요? </span>
            <Link href="/emr/login" className="text-sm font-semibold text-blue-600 hover:underline">
              로그인 <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
