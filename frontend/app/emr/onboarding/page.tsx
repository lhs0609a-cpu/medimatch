'use client'

import { useState } from 'react'
import {
  Stethoscope,
  Pill,
  Building2,
  MapPin,
  Clock,
  Users,
  Check,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Zap,
  Link,
  Search,
  Plus,
  Brain,
  Shield,
  Sparkles,
  Mic,
  FileText,
  BarChart3,
  Package,
  Bell,
  Settings,
  PartyPopper,
  Rocket,
  BookOpen,
  HelpCircle,
  Phone,
  MessageSquare,
  Star,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'

/* ─── 더미 의원/약국 검색 결과 ─── */
const nearbyFacilities = [
  { id: 1, name: '메디매치내과', type: 'clinic', address: '테헤란로 123, 2층', distance: '50m', doctor: '김원장' },
  { id: 2, name: '하나이비인후과', type: 'clinic', address: '테헤란로 125, 3층', distance: '120m', doctor: '이원장' },
  { id: 3, name: '강남정형외과', type: 'clinic', address: '역삼로 45, 1층', distance: '300m', doctor: '박원장' },
  { id: 4, name: '온누리약국', type: 'pharmacy', address: '테헤란로 121, 1층', distance: '30m', doctor: '' },
  { id: 5, name: '건강약국', type: 'pharmacy', address: '역삼로 43, 1층', distance: '250m', doctor: '' },
]

const specialties = [
  '내과', '가정의학과', '이비인후과', '피부과', '정형외과',
  '소아청소년과', '산부인과', '안과', '비뇨의학과', '신경과',
  '정신건강의학과', '외과', '재활의학과', '영상의학과', '치과',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [userType] = useState<'clinic' | 'pharmacy'>('clinic')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [selectedFacilities, setSelectedFacilities] = useState<Set<number>>(new Set())
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set(['ai_chart', 'claims', 'bridge']))
  const [isComplete, setIsComplete] = useState(false)
  const [hours, setHours] = useState({
    weekday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '13:00' },
  })

  const totalSteps = 5

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const toggleFacility = (id: number) => {
    setSelectedFacilities(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleFeature = (key: string) => {
    setEnabledFeatures(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleComplete = () => {
    setIsComplete(true)
    setTimeout(() => {
      window.location.href = userType === 'clinic' ? '/emr/dashboard' : '/emr/pharmacy'
    }, 3000)
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <PartyPopper className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">설정 완료!</h1>
          <p className="text-muted-foreground mb-8">
            MediMatch EMR이 준비되었습니다.<br />
            잠시 후 대시보드로 이동합니다.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            대시보드로 이동 중...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">MediMatch EMR</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Step {step} / {totalSteps}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < step ? 'w-8 bg-blue-600' : 'w-4 bg-secondary'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Step 1: 진료과목 선택 */}
        {step === 1 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">진료과목을 선택해주세요</h2>
              <p className="text-sm text-muted-foreground">AI 차트 템플릿과 청구 규칙이 과목에 맞게 최적화됩니다</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {specialties.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                    selectedSpecialties.includes(s)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:border-blue-200'
                  }`}
                >
                  {selectedSpecialties.includes(s) ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${selectedSpecialties.includes(s) ? 'text-blue-600' : ''}`}>{s}</span>
                </button>
              ))}
            </div>

            {selectedSpecialties.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600">AI 최적화 예정</span>
                </div>
                <p className="text-xs text-blue-600/80">
                  {selectedSpecialties.join(', ')} 전용 AI 차트 템플릿, ICD-10 추천 모델, 청구 규칙이 설정됩니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 운영시간 설정 */}
        {step === 2 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">운영 시간을 설정해주세요</h2>
              <p className="text-sm text-muted-foreground">예약 시스템과 환자 안내에 사용됩니다</p>
            </div>

            <div className="card p-6 space-y-5">
              {[
                { label: '월~금', key: 'weekday' as const },
                { label: '토요일', key: 'saturday' as const },
              ].map(day => (
                <div key={day.key} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20">{day.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours[day.key].open}
                      onChange={e => setHours(prev => ({ ...prev, [day.key]: { ...prev[day.key], open: e.target.value } }))}
                      className="input py-2 text-sm w-36"
                    />
                    <span className="text-muted-foreground">~</span>
                    <input
                      type="time"
                      value={hours[day.key].close}
                      onChange={e => setHours(prev => ({ ...prev, [day.key]: { ...prev[day.key], close: e.target.value } }))}
                      className="input py-2 text-sm w-36"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-20">일/공휴일</span>
                <span className="text-sm text-red-500 font-medium">휴무</span>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <span className="text-sm font-medium w-20">점심시간</span>
                <div className="flex items-center gap-2">
                  <input type="time" defaultValue="12:30" className="input py-2 text-sm w-36" />
                  <span className="text-muted-foreground">~</span>
                  <input type="time" defaultValue="13:30" className="input py-2 text-sm w-36" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 기능 활성화 */}
        {step === 3 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">핵심 기능을 선택해주세요</h2>
              <p className="text-sm text-muted-foreground">나중에 설정에서 변경할 수 있습니다</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'ai_chart', label: 'AI 음성 차트', description: '진료 중 음성을 인식하여 자동으로 차트를 작성합니다', icon: Mic, recommended: true },
                { key: 'claims', label: 'AI 청구 방어', description: '보험 청구 전 삭감 리스크를 AI가 사전 점검합니다', icon: Shield, recommended: true },
                { key: 'bridge', label: '의원-약국 브릿지', description: '인근 약국과 실시간으로 처방전을 전송합니다', icon: Zap, recommended: true },
                { key: 'appointment', label: '예약/접수 관리', description: '온라인 예약과 대기 관리를 자동화합니다', icon: Clock, recommended: false },
                { key: 'analytics', label: '경영분석 대시보드', description: '매출, 환자, 청구 데이터를 실시간 분석합니다', icon: BarChart3, recommended: false },
                { key: 'notification', label: '환자 알림 (카카오톡)', description: '예약 확인, 방문 알림을 자동 전송합니다', icon: Bell, recommended: false },
              ].map(feature => (
                <button
                  key={feature.key}
                  onClick={() => toggleFeature(feature.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    enabledFeatures.has(feature.key)
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-border hover:border-blue-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    enabledFeatures.has(feature.key) ? 'bg-blue-500' : 'bg-secondary'
                  }`}>
                    <feature.icon className={`w-6 h-6 ${enabledFeatures.has(feature.key) ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{feature.label}</span>
                      {feature.recommended && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-2xs font-bold text-blue-600">추천</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${
                    enabledFeatures.has(feature.key) ? 'bg-blue-500' : 'bg-secondary'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${
                      enabledFeatures.has(feature.key) ? 'right-1' : 'left-1'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: 약국/의원 연동 */}
        {step === 4 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {userType === 'clinic' ? '인근 약국을 연동하세요' : '인근 의원을 연동하세요'}
              </h2>
              <p className="text-sm text-muted-foreground">
                실시간 처방전 전송을 위해 연동할 {userType === 'clinic' ? '약국' : '의원'}을 선택하세요. 나중에 추가할 수 있습니다.
              </p>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`${userType === 'clinic' ? '약국명' : '의원명'} 또는 주소로 검색...`}
                className="input pl-10 py-3 w-full"
              />
            </div>

            <div className="space-y-2">
              {nearbyFacilities
                .filter(f => userType === 'clinic' ? f.type === 'pharmacy' : f.type === 'clinic')
                .map(facility => (
                <button
                  key={facility.id}
                  onClick={() => toggleFacility(facility.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    selectedFacilities.has(facility.id)
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-border hover:border-blue-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedFacilities.has(facility.id) ? 'bg-blue-500' : 'bg-secondary'
                  }`}>
                    {facility.type === 'clinic'
                      ? <Stethoscope className={`w-5 h-5 ${selectedFacilities.has(facility.id) ? 'text-white' : 'text-muted-foreground'}`} />
                      : <Pill className={`w-5 h-5 ${selectedFacilities.has(facility.id) ? 'text-white' : 'text-muted-foreground'}`} />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{facility.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3" /> {facility.address}
                      <span className="text-blue-600 font-medium">{facility.distance}</span>
                    </div>
                  </div>
                  {selectedFacilities.has(facility.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {selectedFacilities.size === 0 && (
              <button className="w-full mt-4 p-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50 transition-colors">
                나중에 설정하기 →
              </button>
            )}

            {selectedFacilities.size > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-sm text-emerald-600 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <strong>{selectedFacilities.size}곳</strong> 선택됨 — 연동 요청이 발송됩니다
              </div>
            )}
          </div>
        )}

        {/* Step 5: 완료 가이드 */}
        {step === 5 && (
          <div>
            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">거의 다 됐습니다!</h2>
              <p className="text-sm text-muted-foreground">아래 내용을 확인하고 시작해주세요</p>
            </div>

            <div className="card p-5 mb-6">
              <h3 className="font-semibold mb-4">설정 요약</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">진료과목</span>
                  <span className="font-medium">{selectedSpecialties.length > 0 ? selectedSpecialties.join(', ') : '미선택'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">운영시간</span>
                  <span className="font-medium">평일 {hours.weekday.open}~{hours.weekday.close}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">활성화 기능</span>
                  <span className="font-medium">{enabledFeatures.size}개</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">연동 요청</span>
                  <span className="font-medium">{selectedFacilities.size}곳</span>
                </div>
              </div>
            </div>

            <div className="card p-5 mb-6">
              <h3 className="font-semibold mb-4">빠른 시작 가이드</h3>
              <div className="space-y-3">
                {[
                  { icon: Mic, title: 'AI 차트 체험해보기', description: '진료실에서 "차트 시작"을 말하면 AI가 자동 기록을 시작합니다', color: 'bg-blue-100 text-blue-600' },
                  { icon: Users, title: '첫 환자 등록하기', description: '환자 관리에서 기존 환자 데이터를 가져오거나 새로 등록하세요', color: 'bg-purple-100 text-purple-600' },
                  { icon: FileText, title: '모의 청구 검증', description: '과거 청구 데이터로 AI 청구 방어 정확도를 확인해보세요', color: 'bg-emerald-100 text-emerald-600' },
                ].map((guide, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${guide.color}`}>
                      <guide.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{guide.title}</div>
                      <div className="text-xs text-muted-foreground">{guide.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-purple-600">도움이 필요하신가요?</div>
                <div className="text-xs text-purple-500">전담 컨설턴트가 온보딩을 도와드립니다</div>
              </div>
              <button className="btn-sm text-xs bg-purple-500 text-white hover:bg-purple-600">
                <Phone className="w-3 h-3" /> 상담 요청
              </button>
            </div>
          </div>
        )}

        {/* 네비게이션 */}
        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> 이전
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              다음 <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> EMR 시작하기
            </button>
          )}
        </div>

        {step < totalSteps && (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full mt-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            건너뛰기
          </button>
        )}
      </main>
    </div>
  )
}
