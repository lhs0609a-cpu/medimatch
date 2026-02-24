'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight,
  Mic,
  Brain,
  Shield,
  Zap,
  Clock,
  TrendingDown,
  Building2,
  Pill,
  ChevronRight,
  Check,
  Star,
  Play,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  Database,
  Download,
  Lock,
  RefreshCw,
  BarChart3,
  FileText,
  Users,
  CalendarCheck,
  Stethoscope,
  Receipt,
  Bell,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  X,
  Menu,
  ChevronDown,
  CircleDot,
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Volume2,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ────────────────────────────────────────── */
/*  숫자 카운트업 훅                          */
/* ────────────────────────────────────────── */
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          setStarted(true)
          const t0 = Date.now()
          const tick = () => {
            const p = Math.min((Date.now() - t0) / duration, 1)
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
            setCount(Math.floor(eased * end))
            if (p < 1) requestAnimationFrame(tick)
          }
          tick()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration, started])

  return { count, ref }
}

/* ────────────────────────────────────────── */
/*  타이핑 애니메이션 훅                       */
/* ────────────────────────────────────────── */
function useTypewriter(texts: string[], speed = 60, pause = 2000) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const text = texts[idx]
    if (!deleting && charIdx < text.length) {
      const t = setTimeout(() => {
        setDisplay(text.slice(0, charIdx + 1))
        setCharIdx(charIdx + 1)
      }, speed)
      return () => clearTimeout(t)
    }
    if (!deleting && charIdx === text.length) {
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => {
        setDisplay(text.slice(0, charIdx - 1))
        setCharIdx(charIdx - 1)
      }, speed / 2)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx === 0) {
      setDeleting(false)
      setIdx((idx + 1) % texts.length)
    }
  }, [charIdx, deleting, idx, texts, speed, pause])

  return display
}

/* ────────────────────────────────────────── */
/*  EMR 랜딩 페이지                           */
/* ────────────────────────────────────────── */
export default function EMRLandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // 카운터
  const stat1 = useCountUp(50, 2000)
  const stat2 = useCountUp(30, 2000)
  const stat3 = useCountUp(70, 2000)
  const stat4 = useCountUp(99.9, 2000)

  // 타이핑
  const typed = useTypewriter(
    [
      '"환자분 어디가 불편하세요?"',
      '"3일 전부터 두통이 있었어요"',
      '"혈압은 130/85이시네요"',
      '"처방 내역 확인해볼게요"',
    ],
    50,
    1500,
  )

  // AI 차트 데모 상태
  const [demoStep, setDemoStep] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((p) => (p + 1) % 5)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const demoSteps = [
    { label: '음성 인식 중', icon: Mic, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'AI 분석 중', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: '진단코드 추천', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: '처방 자동생성', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: '차트 완성', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ]

  const faqs = [
    {
      q: '기존 EMR에서 데이터 이전이 가능한가요?',
      a: '네, 무료로 전체 데이터 마이그레이션을 지원합니다. 유비케어, 비트컴퓨터, 이지스 등 주요 EMR에서 CSV/HL7 포맷으로 자동 변환됩니다. 전담 엔지니어가 1:1로 지원합니다.',
    },
    {
      q: '인터넷이 끊기면 진료가 안 되나요?',
      a: 'PWA 오프라인 모드를 지원합니다. 인터넷이 끊겨도 진료, 차트 작성, 처방이 모두 가능하며, 연결 복구 시 자동으로 서버와 동기화됩니다.',
    },
    {
      q: '해지하면 데이터는 어떻게 되나요?',
      a: '해지 위약금은 0원입니다. 해지 후에도 30일간 데이터 접근이 가능하며, 전체 데이터를 CSV/HL7 FHIR 포맷으로 무료 Export 할 수 있습니다. 원장님의 데이터는 원장님 것입니다.',
    },
    {
      q: 'EMR 인증은 받았나요?',
      a: '보건복지부 EMR 인증 기준에 맞춘 설계로 개발되었으며, 인증 심사를 준비 중입니다. AES-256 암호화, 감사 로그, 접근 제어 등 모든 보안 요건을 충족합니다.',
    },
    {
      q: 'AI 음성차트의 정확도는 어떤가요?',
      a: '의료 전문 용어 학습 모델로 95% 이상의 인식률을 달성합니다. 원장님의 사용 패턴을 지속 학습하여 정확도가 계속 향상됩니다. 모든 차트는 저장 전 원장님 확인을 거칩니다.',
    },
    {
      q: '약국 연동은 어떻게 작동하나요?',
      a: '처방전 작성 완료 시 3초 이내에 인근 약국으로 전자전송됩니다. DUR 자동 체크, 재고 확인, 조제 완료 알림까지 실시간으로 연결됩니다. 약국도 MediMatch를 사용해야 합니다.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* ───── 네비게이션 ───── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">MediMatch <span className="text-primary">EMR</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="nav-link">핵심 기능</a>
              <a href="#ai-chart" className="nav-link">AI 차트</a>
              <a href="#pharmacy" className="nav-link">약국 연동</a>
              <a href="#pricing" className="nav-link">요금제</a>
              <a href="#faq" className="nav-link">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/emr/dashboard" className="btn-ghost text-sm">
                데모 체험
              </Link>
              <Link href="/emr/dashboard" className="btn-primary text-sm">
                무료로 시작하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button
              className="md:hidden btn-icon"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenu && (
          <div className="md:hidden bg-background border-t border-border animate-fade-in-down">
            <div className="px-5 py-4 space-y-2">
              <a href="#features" className="block nav-link" onClick={() => setMobileMenu(false)}>핵심 기능</a>
              <a href="#ai-chart" className="block nav-link" onClick={() => setMobileMenu(false)}>AI 차트</a>
              <a href="#pharmacy" className="block nav-link" onClick={() => setMobileMenu(false)}>약국 연동</a>
              <a href="#pricing" className="block nav-link" onClick={() => setMobileMenu(false)}>요금제</a>
              <a href="#faq" className="block nav-link" onClick={() => setMobileMenu(false)}>FAQ</a>
              <div className="pt-3 border-t border-border">
                <Link href="/emr/dashboard" className="btn-primary w-full text-sm">
                  무료로 시작하기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ───── 히어로 섹션 ───── */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* 왼쪽: 텍스트 */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI 음성 자동 차트 탑재</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.15] mb-6">
                진료에만 집중하세요.
                <br />
                <span className="text-gradient-blue">나머지는 AI가</span> 합니다.
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                음성으로 말하면 차트가 자동 완성됩니다.
                삭감 위험은 AI가 미리 잡아주고, 처방전은 약국으로 3초 전송.
                <strong className="text-foreground"> 진료 시간 50% 단축, 삭감률 30% 감소.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/emr/dashboard"
                  className="btn-primary btn-lg text-base"
                >
                  3개월 무료 체험 시작
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#demo"
                  className="btn-outline btn-lg text-base"
                >
                  <Play className="w-5 h-5" />
                  2분 데모 영상
                </a>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  설치비 0원
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  해지 위약금 0원
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  데이터 Export 무료
                </span>
              </div>
            </div>

            {/* 오른쪽: AI 차트 데모 인터랙션 */}
            <div className="relative">
              <div className="card p-6 border border-border/50">
                {/* 상단 바 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">MediMatch EMR - AI 차트</span>
                </div>

                {/* 음성 인식 영역 */}
                <div className="bg-secondary/50 rounded-2xl p-5 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      demoStep === 0 ? 'bg-red-500 animate-pulse-subtle' : 'bg-secondary'
                    }`}>
                      <Mic className={`w-5 h-5 ${demoStep === 0 ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">음성 인식</div>
                      <div className="text-xs text-muted-foreground">{typed}<span className="animate-pulse-subtle">|</span></div>
                    </div>
                  </div>

                  {/* 파형 애니메이션 */}
                  <div className="flex items-center gap-0.5 h-8">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary/40 rounded-full transition-all duration-300"
                        style={{
                          height: demoStep === 0
                            ? `${Math.random() * 100}%`
                            : '15%',
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI 처리 스텝 */}
                <div className="space-y-2 mb-4">
                  {demoSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                        i <= demoStep ? step.bg : 'bg-transparent'
                      } ${i === demoStep ? 'scale-[1.02]' : ''}`}
                    >
                      <step.icon className={`w-4 h-4 transition-colors duration-300 ${
                        i <= demoStep ? step.color : 'text-muted-foreground/30'
                      }`} />
                      <span className={`text-sm transition-colors duration-300 ${
                        i <= demoStep ? 'text-foreground font-medium' : 'text-muted-foreground/40'
                      }`}>
                        {step.label}
                      </span>
                      {i < demoStep && (
                        <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                      )}
                      {i === demoStep && (
                        <div className="w-4 h-4 ml-auto">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 생성된 차트 미리보기 */}
                <div className={`bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 transition-all duration-500 ${
                  demoStep === 4 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">차트 자동 완성</span>
                  </div>
                  <div className="space-y-1 text-xs text-emerald-600 dark:text-emerald-400/80">
                    <div><strong>CC:</strong> 두통 3일 지속</div>
                    <div><strong>PI:</strong> 3일 전 발생, 전두부 위주, NRS 5/10</div>
                    <div><strong>Dx:</strong> R51 - 두통 (ICD-10)</div>
                    <div><strong>Rx:</strong> 타이레놀 500mg #3 x 3일</div>
                  </div>
                </div>
              </div>

              {/* 플로팅 뱃지 */}
              <div className="absolute -top-3 -right-3 card px-3 py-2 flex items-center gap-2 animate-float">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold">진료시간 50% 단축</span>
              </div>

              <div className="absolute -bottom-3 -left-3 card px-3 py-2 flex items-center gap-2 animate-float" style={{ animationDelay: '1s' }}>
                <TrendingDown className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold">삭감률 30% 감소</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 신뢰 지표 섹션 ───── */}
      <section className="py-12 border-y border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center" ref={stat1.ref}>
              <div className="stat-value text-primary">{stat1.count}<span className="text-2xl">%</span></div>
              <div className="stat-label">진료 시간 단축</div>
            </div>
            <div className="text-center" ref={stat2.ref}>
              <div className="stat-value text-emerald-500">{stat2.count}<span className="text-2xl">%</span></div>
              <div className="stat-label">삭감률 감소</div>
            </div>
            <div className="text-center" ref={stat3.ref}>
              <div className="stat-value text-violet-500">{stat3.count}<span className="text-2xl">%</span></div>
              <div className="stat-label">환자 대기시간 감소</div>
            </div>
            <div className="text-center" ref={stat4.ref}>
              <div className="stat-value text-amber-500">{stat4.count}<span className="text-2xl">%</span></div>
              <div className="stat-label">서비스 가동률</div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 핵심 기능 ───── */}
      <section id="features" className="section">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge-primary mb-4">핵심 기능</div>
            <h2 className="mb-4">
              원장님이 진짜 원하던 EMR,
              <br className="hidden sm:block" />
              <span className="text-gradient-blue">처음부터 다시 만들었습니다</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              공급자 위주가 아닌, 원장님의 하루 워크플로우에 맞춘 설계.
              쓸수록 똑똑해지는 AI가 반복 업무를 대신합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Mic,
                color: 'from-red-500 to-rose-600',
                title: 'AI 음성 자동 차트',
                desc: '진료 대화만 하세요. CC, PI, PMH를 AI가 자동 분류하고, ICD-10 진단코드와 처방까지 추천합니다.',
                badge: '업계 최초',
              },
              {
                icon: Shield,
                color: 'from-emerald-500 to-teal-600',
                title: '삭감 방어 AI',
                desc: '과거 삭감 패턴을 학습해 위험 청구를 실시간 경고. 최적 코드 조합을 추천하여 삭감률을 30% 줄여드립니다.',
                badge: 'AI 분석',
              },
              {
                icon: Pill,
                color: 'from-purple-500 to-violet-600',
                title: '의원-약국 실시간 브릿지',
                desc: '처방전 3초 전송, DUR 자동 체크, 조제 완료 알림. 환자 대기시간을 70% 줄이는 실시간 연결.',
                badge: '업계 최초',
              },
              {
                icon: CalendarCheck,
                color: 'from-blue-500 to-indigo-600',
                title: '스마트 예약/접수',
                desc: 'QR 체크인, 태블릿 문진, 카톡 대기 알림. 환자가 집에서 미리 문진을 작성하면 도착 즉시 진료.',
              },
              {
                icon: Receipt,
                color: 'from-amber-500 to-orange-600',
                title: '1클릭 보험청구',
                desc: 'AI가 청구 코드를 자동 매핑. 삭감 위험도를 색상으로 표시하고, 1클릭으로 심평원에 전송합니다.',
              },
              {
                icon: BarChart3,
                color: 'from-cyan-500 to-blue-600',
                title: '경영 대시보드',
                desc: '매출, 환자수, 삭감률을 한눈에. AI가 공백 시간대, 미방문 환자, 재고 이슈를 자동 분석합니다.',
              },
              {
                icon: Bell,
                color: 'from-pink-500 to-rose-600',
                title: '환자 리콜 자동화',
                desc: '3개월 미방문 환자 자동 감지. 카톡/문자로 리마인드 발송. 재방문율을 25% 높여드립니다.',
              },
              {
                icon: Smartphone,
                color: 'from-indigo-500 to-violet-600',
                title: '환자 앱 연동',
                desc: '예약 확인, 복약 알림, 검사결과 조회를 환자가 직접. 문의 전화 50% 감소, 만족도 상승.',
              },
              {
                icon: Database,
                color: 'from-slate-500 to-gray-600',
                title: '데이터 주권 보장',
                desc: '원장님 데이터는 원장님 것. 언제든 전체 Export 무료, 타사 전환 시 무료 마이그레이션 지원.',
              },
            ].map((f, i) => (
              <div key={i} className="feature-card group">
                <div className="flex items-start justify-between mb-5">
                  <TossIcon icon={f.icon} color={f.color} size="lg" />
                  {f.badge && (
                    <span className="badge-primary text-2xs">{f.badge}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── AI 차트 상세 섹션 ───── */}
      <section id="ai-chart" className="section bg-secondary/30">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="badge-primary mb-4">AI 음성 차트</div>
              <h2 className="mb-6">
                말하기만 하면
                <br />
                <span className="text-gradient-blue">차트가 완성됩니다</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                진료실에서 환자와 대화하는 것만으로 의무기록이 자동 작성됩니다.
                의료 전문 AI 모델이 대화를 실시간 분석하여 구조화된 차트를 생성합니다.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Volume2, title: '의사/환자 발화 자동 구분', desc: '누가 말했는지 AI가 자동으로 분리하여 기록합니다' },
                  { icon: Brain, title: 'CC·PI·PMH 자동 분류', desc: '주호소, 현병력, 과거력을 대화에서 자동 추출합니다' },
                  { icon: Sparkles, title: 'ICD-10 진단코드 AI 추천', desc: '증상에 맞는 진단코드를 정확도순으로 추천합니다' },
                  { icon: FileText, title: '처방 패턴 학습', desc: '원장님의 처방 습관을 학습해 갈수록 정확해집니다' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-card transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-0.5">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 플로우 다이어그램 */}
            <div className="space-y-4">
              {[
                { step: '1', title: '진료 시작', desc: '마이크 버튼 1클릭으로 녹음 시작', icon: Mic, color: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' },
                { step: '2', title: 'AI 실시간 인식', desc: '대화를 텍스트로 변환하고 의미를 분석', icon: Brain, color: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20' },
                { step: '3', title: '자동 구조화', desc: 'CC, PI, PMH, ROS를 자동으로 분류', icon: FileText, color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' },
                { step: '4', title: '진단/처방 추천', desc: 'ICD-10 코드 + 과거 처방패턴 기반 추천', icon: Sparkles, color: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20' },
                { step: '5', title: '1클릭 저장', desc: '원장님 확인 후 저장 → 약국 자동 전송', icon: CheckCircle2, color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' },
              ].map((s, i) => (
                <div key={i} className="relative">
                  <div className={`flex items-center gap-4 p-5 rounded-2xl border ${s.color} transition-all hover:scale-[1.01]`}>
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center font-bold text-primary flex-shrink-0">
                      {s.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-sm text-muted-foreground">{s.desc}</div>
                    </div>
                    <s.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                  {i < 4 && (
                    <div className="flex justify-center py-1">
                      <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── 의원-약국 브릿지 섹션 ───── */}
      <section id="pharmacy" className="section">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge-primary mb-4">의원-약국 브릿지</div>
            <h2 className="mb-4">
              처방전 작성 완료,
              <br className="hidden sm:block" />
              <span className="text-gradient-blue">3초 후 약국에 도착</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              팩스도, 사진촬영도 필요 없습니다. 전자처방전이 암호화되어
              실시간으로 약국에 전송되고, 조제 완료까지 자동으로 추적됩니다.
            </p>
          </div>

          {/* 브릿지 비주얼 */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* 의원 측 */}
            <div className="card p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-5">
                <TossIcon icon={Building2} color="from-blue-500 to-indigo-600" />
                <div>
                  <div className="font-bold">의원</div>
                  <div className="text-xs text-muted-foreground">MediMatch EMR</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  '진료 완료 → 처방전 작성',
                  'AI 삭감 검사 자동 실행',
                  '전자서명 + 암호화',
                  '약국으로 자동 전송',
                  '조제 완료 알림 수신',
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold ${
                      i < 4 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {i + 1}
                    </div>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 중앙: 연결 */}
            <div className="flex flex-col items-center justify-center py-8 md:py-0 md:h-full">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary animate-pulse-subtle" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="font-bold text-primary text-lg">3초</div>
                <div className="text-xs text-muted-foreground">암호화 전송</div>
              </div>

              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="badge-success text-2xs">DUR 자동 체크</div>
                <div className="badge-info text-2xs">재고 실시간 확인</div>
                <div className="badge-warning text-2xs">위변조 방지</div>
              </div>
            </div>

            {/* 약국 측 */}
            <div className="card p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-5">
                <TossIcon icon={Pill} color="from-purple-500 to-violet-600" />
                <div>
                  <div className="font-bold">약국</div>
                  <div className="text-xs text-muted-foreground">MediMatch Pharmacy</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  '처방전 자동 수신',
                  'DUR 결과 즉시 표시',
                  '재고 자동 확인/차감',
                  '복약지도문 AI 생성',
                  '조제 완료 → 환자 알림',
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold ${
                      i < 4 ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {i + 1}
                    </div>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 환자 혜택 */}
          <div className="mt-12 card p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-emerald-500" />
              <span className="font-bold">환자 경험</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Clock, text: '대기시간 70% 감소', desc: '약 준비 완료 후 방문' },
                { icon: MessageSquare, text: '카톡 알림', desc: '"약 준비 되었습니다"' },
                { icon: Shield, text: '안전한 복약', desc: 'DUR 이중 체크 완료' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <b.icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">{b.text}</div>
                    <div className="text-xs text-muted-foreground">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── 경쟁사 비교 섹션 ───── */}
      <section className="section bg-secondary/30">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge-primary mb-4">왜 MediMatch인가</div>
            <h2 className="mb-4">
              <span className="text-gradient-blue">경쟁사가 못하는 것</span>을
              <br className="hidden sm:block" />
              우리는 합니다
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">기능</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">유비케어</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">스마트닥터</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">닥터팔레트</th>
                  <th className="text-center py-4 px-4 font-bold text-primary bg-primary/5 rounded-t-xl">MediMatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: '완전 클라우드', vals: ['triangle', 'x', 'o', 'check'] },
                  { name: 'AI 음성 차트', vals: ['x', 'x', 'x', 'check'] },
                  { name: 'AI 삭감 예측', vals: ['x', 'x', 'x', 'check'] },
                  { name: '약국 실시간 연동', vals: ['triangle', 'x', 'x', 'check'] },
                  { name: '오프라인 진료', vals: ['x', 'o', 'x', 'check'] },
                  { name: '데이터 무료 Export', vals: ['x', 'x', 'triangle', 'check'] },
                  { name: '해지 위약금 없음', vals: ['x', 'x', 'o', 'check'] },
                  { name: '환자 앱', vals: ['x', 'triangle', 'x', 'check'] },
                  { name: '가격 투명 공시', vals: ['x', 'x', 'o', 'check'] },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.name}</td>
                    {row.vals.map((v, j) => (
                      <td key={j} className={`py-3 px-4 text-center ${j === 3 ? 'bg-primary/5' : ''}`}>
                        {v === 'check' && <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />}
                        {v === 'o' && <div className="w-5 h-5 rounded-full border-2 border-emerald-400 mx-auto" />}
                        {v === 'triangle' && <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto" />}
                        {v === 'x' && <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── 기술 스택 / 보안 ───── */}
      <section className="section">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge-primary mb-4">기술 & 보안</div>
            <h2 className="mb-4">
              <span className="text-gradient-blue">세계 최고 수준</span>의
              <br className="hidden sm:block" />
              보안과 안정성
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'AES-256 암호화', desc: '모든 의료 데이터 군사급 암호화', color: 'from-blue-500 to-indigo-600' },
              { icon: Monitor, title: 'AWS 서울 리전', desc: '한국 내 데이터 저장, 해외 유출 불가', color: 'from-emerald-500 to-teal-600' },
              { icon: WifiOff, title: '오프라인 모드', desc: '인터넷 끊겨도 진료 가능, 자동 동기화', color: 'from-amber-500 to-orange-600' },
              { icon: RefreshCw, title: '자동 백업', desc: '일일 자동 백업 + 재해복구(DR) 지원', color: 'from-purple-500 to-violet-600' },
            ].map((t, i) => (
              <div key={i} className="feature-card text-center">
                <div className="flex justify-center mb-4">
                  <TossIcon icon={t.icon} color={t.color} size="lg" />
                </div>
                <h4 className="text-lg font-bold mb-2">{t.title}</h4>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 요금제 섹션 ───── */}
      <section id="pricing" className="section bg-secondary/30">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge-primary mb-4">합리적인 요금</div>
            <h2 className="mb-4">
              삭감 줄어드는 금액이
              <br className="hidden sm:block" />
              <span className="text-gradient-blue">구독료보다 큽니다</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              설치비 0원, 해지 위약금 0원. 3개월 무료 체험 후 결정하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="card p-8 border border-border">
              <div className="mb-6">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Starter</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">무료</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">3개월 체험</div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  '기본 EMR 전 기능',
                  'AI 음성 차트 (월 100건)',
                  '예약/접수 관리',
                  '보험청구 기본',
                  '이메일 지원',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/emr/dashboard" className="btn-outline w-full">
                무료로 시작
              </Link>
            </div>

            {/* Clinic - 추천 */}
            <div className="card p-8 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="badge bg-primary text-white px-4 py-1">가장 인기</div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-semibold text-primary mb-2">Clinic</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">19</span>
                  <span className="text-lg text-muted-foreground">만원/월</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">1~3인 의원</div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Starter 전체 기능 포함',
                  'AI 음성 차트 무제한',
                  '삭감 방어 AI',
                  '약국 실시간 브릿지',
                  'CRM + 환자 리콜',
                  '경영 대시보드',
                  '카카오톡 알림',
                  '전담 매니저 배정',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/emr/dashboard" className="btn-primary w-full">
                3개월 무료 체험
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Clinic Pro */}
            <div className="card p-8 border border-border">
              <div className="mb-6">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Clinic Pro</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">29</span>
                  <span className="text-lg text-muted-foreground">만원/월</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">4인+ 의원 / 네트워크</div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Clinic 전체 기능 포함',
                  '다과목 / 다의사 지원',
                  '건강검진 모듈',
                  'API 연동 (외부 시스템)',
                  '환자 앱 커스터마이징',
                  '데이터 분석 리포트',
                  '우선 기술지원 (24h)',
                  'SLA 99.9% 보장',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/emr/dashboard" className="btn-outline w-full">
                문의하기
              </Link>
            </div>
          </div>

          {/* 약국 요금 */}
          <div className="mt-8 max-w-5xl mx-auto">
            <div className="card p-6 border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TossIcon icon={Pill} color="from-purple-500 to-violet-600" />
                  <div>
                    <div className="font-bold">Pharmacy 플랜</div>
                    <div className="text-sm text-muted-foreground">조제관리 + 처방전수신 + DUR + 재고ERP</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-2xl font-bold">9</span>
                    <span className="text-sm text-muted-foreground">만원/월</span>
                  </div>
                  <Link href="/emr/dashboard" className="btn-primary btn-sm">
                    시작하기 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 사용 후기 (소셜 프루프) ───── */}
      <section className="section">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge-primary mb-4">원장님 후기</div>
            <h2 className="mb-4">
              이미 <span className="text-gradient-blue">경험한 원장님들</span>의
              <br className="hidden sm:block" />
              솔직한 이야기
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: '김OO 원장',
                specialty: '내과 / 서울 강남',
                quote: '진료하면서 말만 하면 차트가 자동으로 완성되니까 퇴근 시간이 2시간 앞당겨졌어요. 삭감도 확실히 줄었고, 직원들도 업무가 편해져서 모두 만족합니다.',
                rating: 5,
                metric: '진료시간 45% 단축',
              },
              {
                name: '이OO 원장',
                specialty: '피부과 / 경기 분당',
                quote: '기존 EMR은 관리비만 매년 올랐는데, 여기는 가격 대비 기능이 압도적이에요. 특히 환자 리콜 자동화로 재방문율이 눈에 띄게 올랐습니다.',
                rating: 5,
                metric: '재방문율 30% 증가',
              },
              {
                name: '박OO 약사',
                specialty: '약국 / 서울 송파',
                quote: '처방전이 자동으로 들어오고 DUR 체크까지 끝나있으니 조제에만 집중할 수 있어요. 재고 관리도 자동이라 마감이 30분 만에 끝납니다.',
                rating: 5,
                metric: '마감시간 60% 단축',
              },
            ].map((r, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
                  &ldquo;{r.quote}&rdquo;
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="font-semibold text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.specialty}</div>
                  </div>
                  <div className="badge-success text-2xs">{r.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="faq" className="section bg-secondary/30">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge-primary mb-4">자주 묻는 질문</div>
            <h2>궁금한 점이 있으신가요?</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-colors"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <span className="font-semibold text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    activeFaq === i ? 'rotate-180' : ''
                  }`} />
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-fade-in-down">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA 섹션 ───── */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <div className="card p-12 md:p-16 bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20">
            <h2 className="mb-4">
              진료에만 집중하는 하루,
              <br />
              <span className="text-gradient-blue">오늘부터 시작하세요</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              3개월 무료 체험. 설치비 0원. 해지 위약금 0원.
              <br />
              마음에 안 들면 데이터 가져가시면 됩니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/emr/dashboard" className="btn-primary btn-lg text-base">
                무료 체험 시작하기
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="btn-outline btn-lg text-base">
                도입 상담 요청
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                카드 등록 불필요
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                5분 내 시작 가능
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                1:1 온보딩 지원
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 푸터 ───── */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">MediMatch EMR</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI 기반 클라우드 EMR.
                <br />
                진료에만 집중하세요.
              </p>
            </div>

            <div>
              <div className="font-semibold text-sm mb-3">제품</div>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">핵심 기능</a>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">요금제</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">업데이트 노트</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">API 문서</a>
              </div>
            </div>

            <div>
              <div className="font-semibold text-sm mb-3">지원</div>
              <div className="space-y-2">
                <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">자주 묻는 질문</a>
                <Link href="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">도움말 센터</Link>
                <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">문의하기</Link>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">원격 지원</a>
              </div>
            </div>

            <div>
              <div className="font-semibold text-sm mb-3">법적 고지</div>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">개인정보처리방침</Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">이용약관</Link>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">의료정보보호정책</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">EMR 인증 현황</a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; 2025 MediMatch. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              의료기기 소프트웨어 인증 준비 중 | 보건복지부 EMR 인증 기준 준수
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
