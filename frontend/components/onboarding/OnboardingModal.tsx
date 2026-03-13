'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Check, Stethoscope, Pill, Briefcase, Building2, Users } from 'lucide-react'

type UserRole = 'doctor' | 'pharmacist' | 'sales' | 'landlord' | 'partner'

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
  action?: string
  actionLink?: string
}

const roleSteps: Record<UserRole, OnboardingStep[]> = {
  doctor: [
    {
      title: '개원 시뮬레이션',
      description: '주소와 진료과목만 입력하면 AI가 예상 매출, 비용, 경쟁 현황을 3분 안에 분석합니다.',
      icon: <div className="text-3xl">📊</div>,
      action: '시뮬레이션 시작',
      actionLink: '/simulate',
    },
    {
      title: '매물 탐색',
      description: '의료시설 적합 매물만 필터링하여 보증금, 월세, 권리금을 한눈에 비교하세요.',
      icon: <div className="text-3xl">🏢</div>,
      action: '매물 보기',
      actionLink: '/buildings',
    },
    {
      title: '파트너 찾기',
      description: '인테리어, 의료기기, 컨설팅 등 검증된 파트너에게 견적을 받아보세요.',
      icon: <div className="text-3xl">🤝</div>,
      action: '파트너 검색',
      actionLink: '/partners',
    },
  ],
  pharmacist: [
    {
      title: '약국 자리 찾기',
      description: '익명으로 약국 매물을 탐색하고, 관심 표시로 양측 매칭 시 연락처가 공개됩니다.',
      icon: <div className="text-3xl">💊</div>,
      action: '매물 탐색',
      actionLink: '/pharmacy-match',
    },
    {
      title: '매물 등록',
      description: '양도하실 약국이 있다면 익명으로 등록하세요. 매출 범위만 공개하고 안전하게 협상할 수 있습니다.',
      icon: <div className="text-3xl">📝</div>,
      action: '매물 등록',
      actionLink: '/pharmacy-match/register',
    },
    {
      title: '개국 시뮬레이션',
      description: '의사용 시뮬레이션을 약국 버전으로 활용하세요. 상권 분석과 경쟁 현황을 파악할 수 있습니다.',
      icon: <div className="text-3xl">📊</div>,
      action: '시뮬레이션',
      actionLink: '/simulate',
    },
  ],
  sales: [
    {
      title: '개원지 탐지',
      description: '신축 건물, 폐업 병원, 공실 정보를 실시간으로 탐지하고 맞춤 알림을 받아보세요.',
      icon: <div className="text-3xl">🎯</div>,
      action: '개원지 보기',
      actionLink: '/prospects',
    },
    {
      title: '의사 매칭',
      description: '개원 준비중인 의사에게 직접 영업 요청을 보내세요. 수락 시 연락처가 공개됩니다.',
      icon: <div className="text-3xl">👨‍⚕️</div>,
      action: '매칭 시작',
      actionLink: '/sales/doctors',
    },
    {
      title: '구독 플랜',
      description: 'BASIC부터 PREMIUM까지, 필요한 만큼 리드를 확보하세요. 무응답 시 자동 환불됩니다.',
      icon: <div className="text-3xl">💳</div>,
      action: '플랜 보기',
      actionLink: '/pricing',
    },
  ],
  landlord: [
    {
      title: '매물 등록',
      description: '의료시설 적합 공간을 등록하면 개원 예정 의사/약사에게 노출됩니다.',
      icon: <div className="text-3xl">🏠</div>,
      action: '매물 등록',
      actionLink: '/landlord/register',
    },
    {
      title: '문의 관리',
      description: '들어온 문의를 확인하고 직접 응대하세요. 계약 성사 시까지 수수료가 없습니다.',
      icon: <div className="text-3xl">💬</div>,
      action: '문의 확인',
      actionLink: '/landlord/inquiries',
    },
    {
      title: '매물 관리',
      description: '등록한 매물의 조회수, 문의 현황을 확인하고 정보를 업데이트하세요.',
      icon: <div className="text-3xl">📋</div>,
      action: '내 매물',
      actionLink: '/landlord/listings',
    },
  ],
  partner: [
    {
      title: '프로필 등록',
      description: '회사 정보와 서비스 영역을 등록하면 개원 예정 의사/약사에게 노출됩니다.',
      icon: <div className="text-3xl">🏢</div>,
      action: '프로필 등록',
      actionLink: '/partners/register',
    },
    {
      title: '포트폴리오',
      description: '시공 사례, 납품 실적을 등록하여 신뢰도를 높이세요.',
      icon: <div className="text-3xl">📸</div>,
      action: '포트폴리오 등록',
      actionLink: '/partners/portfolio',
    },
    {
      title: '문의 응대',
      description: '들어온 견적 요청에 빠르게 응답하여 계약 성사율을 높이세요.',
      icon: <div className="text-3xl">📨</div>,
      action: '문의 확인',
      actionLink: '/partners/inquiries',
    },
  ],
}

const roleInfo: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  doctor: { label: '의사', icon: <Stethoscope className="w-5 h-5" />, color: 'from-blue-500 to-blue-600' },
  pharmacist: { label: '약사', icon: <Pill className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
  sales: { label: '영업사원', icon: <Briefcase className="w-5 h-5" />, color: 'from-blue-500 to-blue-500' },
  landlord: { label: '건물주', icon: <Building2 className="w-5 h-5" />, color: 'from-orange-500 to-amber-500' },
  partner: { label: '파트너', icon: <Users className="w-5 h-5" />, color: 'from-red-500 to-rose-500' },
}

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  initialRole?: UserRole
}

export default function OnboardingModal({ isOpen, onClose, initialRole }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole || null)

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole)
      setStep(1)
    }
  }, [initialRole])

  if (!isOpen) return null

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep(1)
  }

  const handleNext = () => {
    if (selectedRole && step < roleSteps[selectedRole].length) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleComplete = () => {
    // 온보딩 완료 저장
    localStorage.setItem('onboarding_completed', 'true')
    localStorage.setItem('user_role_preference', selectedRole || '')
    onClose()
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding_skipped', 'true')
    onClose()
  }

  // Step 0: 역할 선택
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 px-6 py-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">M</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">메디플라톤에 오신 것을 환영합니다</h2>
              <p className="text-white/80 text-sm">
                30초만 투자하시면 맞춤 가이드를 드려요
              </p>
            </div>
          </div>

          {/* 핵심 가치 제안 */}
          <div className="px-6 py-4 bg-secondary/30 border-b border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-muted-foreground">지금 <strong className="text-foreground">127명</strong>이 이용중</span>
              </div>
              <div className="text-muted-foreground">
                <strong className="text-foreground">470+</strong> 매물
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-muted-foreground mb-4 text-center">
              어떤 역할로 이용하시나요?
            </p>

            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(roleInfo) as UserRole[]).slice(0, 3).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleInfo[role].color} flex items-center justify-center text-white shadow-lg`}>
                    {roleInfo[role].icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{roleInfo[role].label}</p>
                    <p className="text-sm text-muted-foreground">
                      {role === 'doctor' && '개원을 준비하고 계신 의사'}
                      {role === 'pharmacist' && '개국 또는 양수를 준비하는 약사'}
                      {role === 'sales' && '제약/의료기기 영업사원'}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            {/* 더보기 (건물주, 파트너) */}
            <details className="mt-4">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                건물주 또는 파트너사이신가요?
              </summary>
              <div className="mt-3 space-y-2">
                {(Object.keys(roleInfo) as UserRole[]).slice(3).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-all text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleInfo[role].color} flex items-center justify-center text-white text-sm`}>
                      {roleInfo[role].icon}
                    </div>
                    <span className="text-sm font-medium">{roleInfo[role].label}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              건너뛰기
            </button>
            <span className="text-xs text-muted-foreground">
              나중에 설정에서 변경 가능
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Step 1+: 역할별 가이드
  if (!selectedRole) return null

  const steps = roleSteps[selectedRole]
  const currentStep = steps[step - 1]
  const isLastStep = step === steps.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleInfo[selectedRole].color} flex items-center justify-center text-white`}>
              {roleInfo[selectedRole].icon}
            </div>
            <span className="font-medium">{roleInfo[selectedRole].label}를 위한 가이드</span>
          </div>
          <button onClick={handleSkip} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i < step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {step} / {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-secondary rounded-2xl flex items-center justify-center">
              {currentStep.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{currentStep.title}</h3>
            <p className="text-muted-foreground">{currentStep.description}</p>
          </div>

          {currentStep.action && currentStep.actionLink && (
            <a
              href={currentStep.actionLink}
              className="block w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl text-center font-medium hover:bg-primary/90 transition-colors"
            >
              {currentStep.action}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button
            onClick={step === 1 ? () => setStep(0) : handlePrev}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? '역할 변경' : '이전'}
          </button>

          {isLastStep ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              시작하기
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              다음
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


// 온보딩 트리거 훅
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed')
    const skipped = localStorage.getItem('onboarding_skipped')

    // 처음 방문자에게만 표시
    if (!completed && !skipped) {
      // 2초 후에 표시 (페이지 로딩 후)
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  return {
    showOnboarding,
    setShowOnboarding,
    resetOnboarding: () => {
      localStorage.removeItem('onboarding_completed')
      localStorage.removeItem('onboarding_skipped')
      setShowOnboarding(true)
    },
  }
}
