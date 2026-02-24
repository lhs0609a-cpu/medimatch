'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Phone,
  CreditCard,
  Building2,
  DollarSign,
  Zap,
  Star,
  ChevronRight,
  Minus,
  Plus,
  CheckCircle2,
  Lock,
  MapPin,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Search,
  Layers,
} from 'lucide-react'

/* ─── 숫자 카운터 애니메이션 훅 ─── */
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          animate()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasStarted])

  return { count, ref }
}

/* ─── 폼 스키마 ─── */
const inquirySchema = z.object({
  name: z.string().min(2, '이름을 입력해주세요'),
  phone: z.string().regex(/^01[016789]-?\d{3,4}-?\d{4}$/, '올바른 연락처를 입력해주세요'),
  specialty: z.string().min(1, '진료과를 선택해주세요'),
  area: z.number().min(1, '개원 평수를 입력해주세요').max(500, '올바른 평수를 입력해주세요'),
  region: z.string().min(1, '희망 지역을 입력해주세요'),
  needLoan: z.enum(['yes', 'no', 'undecided']),
  interests: z.array(z.string()).min(1, '관심 분야를 1개 이상 선택해주세요'),
  message: z.string().optional(),
  agree: z.literal(true, { errorMap: () => ({ message: '약관에 동의해주세요' }) }),
})

type InquiryForm = z.infer<typeof inquirySchema>

/* ─── 서비스 기반 마케팅 혜택 시스템 ─── */
interface MarketingItem {
  name: string
  value: string
  numericValue: number
  desc: string
  condition: 'pg' | 'loan' | 'brokerage' | 'loan_area80'
  conditionLabel: string
}

/** 개원의 마케팅 혜택 */
const DOCTOR_MARKETING: MarketingItem[] = [
  { name: '블로그 마케팅 3개월', value: '440만원', numericValue: 440, desc: '키워드 최적화 + 콘텐츠 발행', condition: 'pg', conditionLabel: 'PG 설치' },
  { name: '플레이스 광고 3개월', value: '790만원', numericValue: 790, desc: '네이버 플레이스 상위노출', condition: 'pg', conditionLabel: 'PG 설치' },
  { name: '카페 바이럴 3개월', value: '450만원', numericValue: 450, desc: '맘카페·지역카페 바이럴 마케팅', condition: 'loan', conditionLabel: '+ 대출' },
  { name: '전담 마케터 배정', value: '별도', numericValue: 0, desc: '1:1 전담 마케터가 전 채널 관리', condition: 'loan', conditionLabel: '+ 대출' },
  { name: '홈페이지 제작', value: '300만원', numericValue: 300, desc: '맞춤형 반응형 의료 홈페이지', condition: 'loan_area80', conditionLabel: '+ 대출 & 80평+' },
  { name: 'SNS 마케팅 3개월', value: '600만원', numericValue: 600, desc: '인스타그램·유튜브 숏츠 운영', condition: 'brokerage', conditionLabel: '+ 중개' },
]

function isItemUnlocked(
  condition: MarketingItem['condition'],
  pg: boolean,
  loan: boolean,
  brokerage: boolean,
  area: number
): boolean {
  switch (condition) {
    case 'pg':
      return pg
    case 'loan':
      return pg && loan
    case 'brokerage':
      return pg && brokerage
    case 'loan_area80':
      return pg && loan && area >= 80
    default:
      return false
  }
}

function getTierLabel(
  pg: boolean,
  loan: boolean,
  brokerage: boolean
): { label: string; color: string; gradient: string } {
  const extras = (loan ? 1 : 0) + (brokerage ? 1 : 0)
  if (pg && extras === 2) return { label: '프리미엄', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-600' }
  if (pg && extras === 1) return { label: '플러스', color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-600' }
  if (pg) return { label: '기본', color: 'bg-[#3182f6]', gradient: 'from-blue-500 to-indigo-600' }
  return { label: '-', color: 'bg-gray-400', gradient: 'from-gray-400 to-gray-500' }
}

/* ─── 진료과 옵션 ─── */
const SPECIALTIES = [
  '내과', '정형외과', '피부과', '치과', '소아과', '안과',
  '이비인후과', '산부인과', '비뇨기과', '신경외과', '재활의학과',
  '가정의학과', '정신건강의학과', '성형외과', '기타',
]

const INTERESTS = [
  { id: 'loan', label: 'DSR-Free 대출' },
  { id: 'marketing', label: '무료 마케팅' },
  { id: 'brokerage', label: '개원 중개' },
  { id: 'pg', label: 'PG 단말기' },
  { id: 'interior', label: '인테리어 연계' },
  { id: 'consulting', label: '개원 컨설팅' },
]

/* ─── 메인 컴포넌트 ─── */
export default function OpeningPackagePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLElement>(null)

  // 계산기 상태
  const [calcPg, setCalcPg] = useState(true)
  const [calcLoan, setCalcLoan] = useState(false)
  const [calcBrokerage, setCalcBrokerage] = useState(false)
  const [calcArea, setCalcArea] = useState(35)

  // 계산
  const marketingItems = DOCTOR_MARKETING
  const tierInfo = getTierLabel(calcPg, calcLoan, calcBrokerage)
  const totalSavings = marketingItems.reduce(
    (sum, item) =>
      sum + (isItemUnlocked(item.condition, calcPg, calcLoan, calcBrokerage, calcArea) ? item.numericValue : 0),
    0
  )
  const unlockedCount = marketingItems.filter((item) =>
    isItemUnlocked(item.condition, calcPg, calcLoan, calcBrokerage, calcArea)
  ).length

  // 카운터
  const consultCount = useCountUp(2400, 2000)
  const loanCount = useCountUp(890, 2000)
  const approvalRate = useCountUp(87, 1500)

  // 폼
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      needLoan: 'undecided',
      interests: [],
      area: 35,
      agree: false as unknown as true,
    },
  })

  const watchInterests = watch('interests')

  const toggleInterest = useCallback(
    (id: string) => {
      const current = watchInterests || []
      if (current.includes(id)) {
        setValue('interests', current.filter((i) => i !== id), { shouldValidate: true })
      } else {
        setValue('interests', [...current, id], { shouldValidate: true })
      }
    },
    [watchInterests, setValue]
  )

  // Sticky CTA 표시/숨김
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom
        setShowStickyCta(heroBottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 폼 제출 → Google Sheets + 백엔드 API 이중 저장
  const onSubmit = async (data: InquiryForm) => {
    setFormLoading(true)
    try {
      // 1) Google Sheets 전송 (기존)
      const sheetUrl = process.env.NEXT_PUBLIC_SHEET_URL
      if (sheetUrl) {
        fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            interests: data.interests.join(', '),
            submittedAt: new Date().toISOString(),
          }),
        }).catch(() => {})
      }

      // 2) 백엔드 API 저장 (관리자 페이지에서 조회 가능)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (apiUrl) {
        fetch(`${apiUrl}/contact/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            type: 'consultation',
            subject: `[개원상담] ${data.specialty} / ${data.region} / ${data.area}평`,
            message: [
              `진료과: ${data.specialty}`,
              `평수: ${data.area}평`,
              `희망지역: ${data.region}`,
              `대출필요: ${data.needLoan}`,
              `관심분야: ${data.interests.join(', ')}`,
              data.message ? `추가문의: ${data.message}` : '',
            ].filter(Boolean).join('\n'),
          }),
        }).catch(() => {})
      }

      setFormSubmitted(true)
      toast.success('상담 신청이 완료되었습니다! 빠른 시일 내에 연락드리겠습니다.')
    } catch {
      setFormSubmitted(true)
      toast.success('상담 신청이 접수되었습니다! 담당자가 곧 연락드리겠습니다.')
    } finally {
      setFormLoading(false)
    }
  }

  // 다음 단계 유도 메시지
  const getNextTierHint = () => {
    if (!calcPg) return { msg: 'PG 단말기를 설치하면 마케팅 혜택이 시작됩니다!', action: 'PG 설치' }
    const hints: string[] = []
    if (!calcLoan) hints.push('대출 → 카페 바이럴 + 전담 마케터')
    if (!calcBrokerage) hints.push('중개 → SNS 마케팅')
    if (calcLoan && calcArea < 80) return { msg: `80평 이상이면 홈페이지 제작도 무료! (현재 ${calcArea}평)`, action: '80평 이상' }
    if (hints.length > 0) return { msg: `${hints.join(', ')} 무료!`, action: '서비스 추가' }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 glass" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/logo/mediplaton-horizontal.png" alt="MEDI-PLATON" className="h-8 object-contain" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onMouseEnter={() => setServicesOpen(true)}
                  className="nav-link flex items-center gap-1"
                >
                  서비스
                  <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {servicesOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] p-5 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-down"
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <div className="space-y-1">
                      <Link href="/opening-package" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 group">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">개원의 패키지</p>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">HOT</span>
                          </div>
                          <p className="text-xs text-muted-foreground">대출 + 마케팅 + PG + 중개 원스톱</p>
                        </div>
                      </Link>
                      <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                        <span className="text-2xl leading-none">📊</span>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-blue-600">OpenSim</p>
                          <p className="text-xs text-muted-foreground">AI 개원 시뮬레이터</p>
                        </div>
                      </Link>
                      <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                        <span className="text-2xl leading-none">🏥</span>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-green-600">매물 검색</p>
                          <p className="text-xs text-muted-foreground">개원 적합 공간 찾기</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/buildings" className="nav-link">매물</Link>
              <Link href="/map" className="nav-link">지도</Link>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <button onClick={scrollToForm} className="btn-primary">
                무료 상담 신청
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn-icon"
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-border bg-background animate-fade-in-down">
            <div className="px-4 py-4 space-y-2">
              <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-lg">🏠</span>
                <span>홈</span>
              </Link>
              <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-lg">🏥</span>
                <span>매물 검색</span>
              </Link>
              <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-lg">📊</span>
                <span>OpenSim</span>
              </Link>
              <div className="pt-4 border-t border-border">
                <button onClick={() => { setMobileMenuOpen(false); scrollToForm() }} className="btn-primary w-full justify-center">
                  무료 상담 신청하기
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* ===== Section 1: Hero — 다크 임팩트 ===== */}
        <section ref={heroRef} className="relative min-h-screen flex items-end overflow-hidden">
          {/* 배경: 컨설팅 현장 사진 + 다크 오버레이 */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/60 z-10" />
            <img
              src="/assets/consulting/consultation-1.jpg"
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
          </div>

          {/* 장식 그라데이션 */}
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#3182f6]/8 rounded-full blur-[120px] z-[1]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/6 rounded-full blur-[100px] z-[1]" />

          <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-32 lg:pt-40">
            {/* 경고 뱃지 */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400"></span>
                </span>
                <span className="text-sm text-red-300 font-medium">
                  올해만 이미 <span className="text-white font-bold">683곳</span> 폐업
                </span>
              </div>
            </div>

            {/* 메인 헤드라인 */}
            <div className="text-center mb-6 animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]">
                <span className="text-white">2시간마다 한 곳 폐업,</span>
                <br />
                <span className="bg-gradient-to-r from-[#3182f6] via-[#5B9CF6] to-[#3182f6] bg-clip-text text-transparent">
                  이 글을 보시는 원장님은 달라야 합니다
                </span>
              </h1>
            </div>

            <p className="text-center text-lg md:text-xl text-white/40 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100 leading-relaxed">
              연간 <span className="text-white/70 font-semibold">4,097개</span> 의료기관이 폐업합니다.
              <br className="hidden sm:block" />
              입지 분석부터 마케팅까지, 데이터로 준비한 개원은 다릅니다.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14 animate-fade-in-up delay-200">
              <button onClick={scrollToForm} className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-[#3182f6] text-white rounded-2xl font-semibold text-lg hover:bg-[#2272e6] transition-all shadow-[0_0_40px_rgba(49,130,246,0.3)] hover:shadow-[0_0_60px_rgba(49,130,246,0.4)] group">
                무료 개원 진단받기
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#calculator" className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-white/[0.06] text-white/80 border border-white/[0.1] rounded-2xl font-semibold text-lg hover:bg-white/[0.1] hover:text-white transition-all">
                <Sparkles className="w-5 h-5" />
                내 절약 금액 계산하기
              </a>
            </div>

            {/* 핵심 수치 3개 */}
            <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto animate-fade-in-up delay-300">
              {[
                { number: '4.8', unit: '억', label: '평균 개원 비용', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                { number: '4,097', unit: '개', label: '연간 폐업 의료기관', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                { number: '150', unit: '+', label: '메디플라톤 성공 사례', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              ].map((s) => (
                <div key={s.label} className={`text-center p-4 rounded-2xl border ${s.bg}`}>
                  <div className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.number}<span className="text-base">{s.unit}</span></div>
                  <p className="text-xs text-white/40 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <ChevronDown className="w-5 h-5 text-white/20" />
          </div>
        </section>

        {/* ===== 실제 성과 바 ===== */}
        <section className="py-10 bg-foreground text-background border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-black text-[#3182f6]">5<span className="text-lg">배</span></div>
                <p className="text-xs md:text-sm text-white/50 mt-1">8개월 만에 신환 증가</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-emerald-400">93.3<span className="text-lg">점</span></div>
                <p className="text-xs md:text-sm text-white/50 mt-1">콘텐츠 만족도</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-amber-400">150<span className="text-lg">+</span></div>
                <p className="text-xs md:text-sm text-white/50 mt-1">개원 컨설팅 실적</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 2: 고민 포인트 ===== */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                개원 준비, 이런 고민 있으시죠?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                { icon: MapPin, title: '어디에 개원해야 할지 막막', desc: '부동산 말만 믿고 계약했다가 환자가 안 오면? 경쟁 의원 수, 타깃 인구가 충분한지 데이터 없이는 판단할 수 없습니다.', gradient: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/25' },
                { icon: Lock, title: 'DSR 규제로 대출 한도 부족', desc: '이미 주담대·학자금이 있으면 추가 대출이 어렵고, 금리도 높아집니다.', gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/25' },
                { icon: DollarSign, title: '마케팅비 수백~수천만원', desc: '홈페이지 제작, 블로그, 플레이스, SNS, 체험단… 전부 하면 수천만원이 듭니다.', gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/25' },
                { icon: Layers, title: '여러 업체를 따로 관리', desc: '중개, 대출, 마케팅, PG를 각각 다른 업체와 상담하면 시간과 비용 모두 낭비됩니다.', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <div className={`icon-3d w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg ${item.shadow} flex items-center justify-center mb-4`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium">
                <Zap className="w-5 h-5" />
                이제 한 곳에서, 서비스 추가할수록 무료로
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 3: 개원 원스톱 파이프라인 ===== */}
        <section className="py-20 bg-foreground text-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                입지 분석부터 마케팅까지, 원스톱
              </h2>
              <p className="text-white/60">메디플라톤 하나로 개원 전 과정을 해결합니다</p>
            </div>

            {/* Desktop: horizontal flow */}
            <div className="hidden lg:flex items-start justify-between">
              {[
                { step: '1', label: '입지 AI 분석', desc: '무료', icon: MapPin, color: 'from-green-500 to-emerald-500' },
                { step: '2', label: '매물 추천', desc: '470+ 매물', icon: Search, color: 'from-cyan-500 to-blue-500' },
                { step: '3', label: '개원 중개', desc: '전담 매니저', icon: Building2, color: 'from-blue-500 to-indigo-500' },
                { step: '4', label: 'PG 설치', desc: '무상 지원', icon: CreditCard, color: 'from-indigo-500 to-purple-500' },
                { step: '5', label: 'DSR-Free 대출', desc: '5.3%~', icon: DollarSign, color: 'from-purple-500 to-pink-500' },
                { step: '6', label: '마케팅', desc: '최대 2,580만원', icon: Sparkles, color: 'from-orange-500 to-red-500' },
              ].map((item, i, arr) => (
                <div key={item.step} className="flex items-start flex-1">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className={`icon-3d w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-0.5">{item.label}</p>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-white/30 mt-4 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: vertical flow */}
            <div className="lg:hidden space-y-3">
              {[
                { step: '1', label: '입지 AI 분석', desc: '무료', icon: MapPin, color: 'from-green-500 to-emerald-500' },
                { step: '2', label: '매물 추천', desc: '470+ 매물', icon: Search, color: 'from-cyan-500 to-blue-500' },
                { step: '3', label: '개원 중개', desc: '전담 매니저', icon: Building2, color: 'from-blue-500 to-indigo-500' },
                { step: '4', label: 'PG 설치', desc: '무상 지원', icon: CreditCard, color: 'from-indigo-500 to-purple-500' },
                { step: '5', label: 'DSR-Free 대출', desc: '5.3%~', icon: DollarSign, color: 'from-purple-500 to-pink-500' },
                { step: '6', label: '마케팅', desc: '최대 2,580만원', icon: Sparkles, color: 'from-orange-500 to-red-500' },
              ].map((item, i, arr) => (
                <div key={item.step}>
                  <div className="flex items-center gap-4">
                    <div className={`icon-3d w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="text-sm text-white/50">{item.desc}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="ml-6 h-3 border-l-2 border-dashed border-white/20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Section 4: 서비스 기반 등급 설명 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                서비스를 추가할수록 마케팅이 무료
              </h2>
              <p className="text-muted-foreground">PG 설치만으로 시작, 서비스 추가 시 마케팅 혜택 확대</p>
            </div>

            <div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { tier: 'PG 단말기', condition: '기본 필수', marketing: ['블로그 마케팅 3개월', '플레이스 광고 3개월'], value: '1,230만원', icon: CreditCard, color: 'from-blue-400 to-cyan-400' },
                  { tier: 'DSR-Free 대출', condition: '자유 선택', marketing: ['카페 바이럴 3개월', '전담 마케터 배정', '홈페이지 제작 (80평+)'], value: '+750만원', icon: DollarSign, color: 'from-purple-400 to-pink-400' },
                  { tier: '개원 중개', condition: '자유 선택', marketing: ['SNS 마케팅 3개월'], value: '+600만원', icon: Building2, color: 'from-orange-400 to-red-400' },
                ].map((item, i) => (
                  <div key={item.tier} className="relative">
                    <div className="bg-card border border-border rounded-2xl p-6 h-full">
                      <div className={`icon-3d w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">{item.tier}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.condition}</p>
                      <div className="space-y-1 mb-4">
                        {item.marketing.map((m) => (
                          <div key={m} className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="text-foreground/80">{m}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`text-sm font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                        {item.value} 상당
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                        <Plus className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-muted-foreground text-sm mt-4">PG 필수 · 대출/중개는 독립 선택 가능 · 많이 선택할수록 등급 UP</p>
            </div>

          </div>
        </section>

        {/* ===== Section 5: 인터랙티브 혜택 계산기 ===== */}
        <section id="calculator" className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/10 text-orange-600 text-sm font-medium mb-4">
                <span className="text-base">🧮</span>
                인터랙티브 계산기
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                나의 무료 마케팅 혜택은?
              </h2>
              <p className="text-muted-foreground">이용할 서비스를 체크하고 혜택을 확인하세요</p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl">
                {/* 서비스 선택 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3">이용할 서비스 선택</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'pg', label: 'PG 단말기', desc: '카드결제 시작', icon: CreditCard, checked: calcPg, toggle: () => { setCalcPg(!calcPg); if (calcPg) { setCalcLoan(false); setCalcBrokerage(false) } } },
                      { id: 'loan', label: 'DSR-Free 대출', desc: '5.3%~ 카드매출 담보', icon: DollarSign, checked: calcLoan, toggle: () => { if (calcPg) setCalcLoan(!calcLoan) } },
                      { id: 'brokerage', label: '개원 중개', desc: '전담 매니저 배정', icon: Building2, checked: calcBrokerage, toggle: () => { if (calcPg) setCalcBrokerage(!calcBrokerage) } },
                    ].map((svc) => {
                      const disabled = (svc.id === 'loan' && !calcPg) || (svc.id === 'brokerage' && !calcPg)
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={svc.toggle}
                          disabled={disabled}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            svc.checked
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : disabled
                                ? 'border-border opacity-40 cursor-not-allowed'
                                : 'border-border hover:border-foreground/20 cursor-pointer'
                          }`}
                        >
                          {disabled && (
                            <Lock className="absolute top-2 right-2 w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <svc.icon className={`w-6 h-6 mb-2 ${svc.checked ? 'text-blue-600' : 'text-muted-foreground'}`} />
                          <p className={`text-sm font-semibold ${svc.checked ? 'text-blue-600' : ''}`}>{svc.label}</p>
                          <p className="text-xs text-muted-foreground">{svc.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 평수 입력 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3">개원 예정 평수</label>
                  <div className="flex items-center gap-4 mb-3">
                    <button onClick={() => setCalcArea(Math.max(5, calcArea - 5))} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                      <input type="range" min={5} max={150} value={calcArea} onChange={(e) => setCalcArea(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-blue-600" />
                    </div>
                    <button onClick={() => setCalcArea(Math.min(150, calcArea + 5))} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-bold">{calcArea}</span>
                    <span className="text-lg text-muted-foreground ml-1">평</span>
                    {calcArea >= 80 && calcPg && calcLoan && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-green-100 text-green-600 rounded-full">홈페이지 제작 조건 충족</span>
                    )}
                  </div>
                </div>

                {/* 현재 등급 */}
                <div className={`rounded-2xl p-6 mb-6 text-center ${tierInfo.label !== '-' ? `bg-gradient-to-r ${tierInfo.gradient} text-white` : 'bg-secondary text-muted-foreground'}`}>
                  {tierInfo.label !== '-' ? (
                    <>
                      <p className="text-sm opacity-80 mb-1">나의 등급</p>
                      <p className="text-3xl font-bold mb-1">{tierInfo.label}</p>
                      <p className="text-sm opacity-80">마케팅 {unlockedCount}종 무료 지원</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm mb-1">서비스를 선택하면 등급이 표시됩니다</p>
                      <p className="text-2xl font-bold">-</p>
                    </>
                  )}
                </div>

                {/* 마케팅 항목별 포함/미포함 */}
                <div className="space-y-3 mb-6">
                  {marketingItems.map((item) => {
                    const unlocked = isItemUnlocked(item.condition, calcPg, calcLoan, calcBrokerage, calcArea)
                    return (
                      <div key={item.name} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${unlocked ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30' : 'bg-secondary/50 border-border opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          {unlocked ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                          <div>
                            <span className={`font-medium ${unlocked ? '' : 'text-muted-foreground'}`}>{item.name}</span>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-semibold ${unlocked ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {unlocked ? '무료' : item.value}
                          </span>
                          {!unlocked && (
                            <p className="text-[10px] text-muted-foreground">{item.conditionLabel}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 총 절약 금액 */}
                {totalSavings > 0 && (
                  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 rounded-2xl p-6 text-white text-center mb-6">
                    <p className="text-sm opacity-80 mb-1">절약 가능 금액</p>
                    <p className="text-4xl md:text-5xl font-bold">
                      {totalSavings.toLocaleString()}<span className="text-xl">만원</span>
                    </p>
                    <p className="text-sm opacity-80 mt-1">상당의 마케팅을 무료로 지원</p>
                  </div>
                )}

                {/* 다음 단계 유도 */}
                {getNextTierHint() && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">{getNextTierHint()!.action}</span>
                      {' → '}{getNextTierHint()!.msg}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 6: 데이터 기반 입지 분석 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/10 text-green-600 text-sm font-medium mb-4">
                <MapPin className="w-4 h-4" />
                입지 분석
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                입지가 매출의 80%를 결정합니다
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                감이 아닌 데이터로 검증하세요. 심평원·국토교통부·소상공인진흥공단 데이터를 AI가 3분 만에 분석합니다.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { icon: Target, title: '경쟁 분석', source: '심평원', desc: '반경 내 동일 진료과 의원 수·매출 추정', color: 'from-red-500 to-orange-500' },
                { icon: Users, title: '인구 분석', source: '국토교통부', desc: '연령대별 인구, 세대수, 유동인구 분석', color: 'from-blue-500 to-cyan-500' },
                { icon: TrendingUp, title: '매출 예측', source: '소상공인진흥공단', desc: '진료과·지역별 예상 월 매출 산출', color: 'from-green-500 to-emerald-500' },
                { icon: BarChart3, title: '손익분기점', source: '복합 데이터', desc: '임대료·인건비 대비 BEP 도달 시점', color: 'from-purple-500 to-pink-500' },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-2xl p-6 text-center">
                  <div className={`icon-3d w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-blue-600 font-medium mb-2">{item.source}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mb-12">
              <h3 className="text-lg font-semibold text-center mb-6">입지 분석, 기존 방식과 비교하면</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-4 bg-card border border-border rounded-tl-xl text-sm font-medium text-muted-foreground">항목</th>
                      <th className="text-center p-4 bg-card border border-border text-sm font-medium">기존 방식</th>
                      <th className="text-center p-4 bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500/30 rounded-tr-xl text-sm font-medium text-white">메디플라톤</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: '입지 조사', old: '부동산 중개인 의견 의존', medi: '빅데이터 AI 분석 리포트', last: false },
                      { label: '소요 시간', old: '수개월 발품', medi: '3분 무료 시뮬레이션', last: false },
                      { label: '경쟁 파악', old: '직접 현장 답사', medi: '심평원 데이터 자동 분석', last: false },
                      { label: '매출 예측', old: '경험적 추정', medi: '실제 청구 데이터 기반', last: false },
                      { label: '비용', old: '컨설팅비 500만원+', medi: '무료', last: true },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className={`p-4 bg-card border border-border text-sm font-medium ${row.last ? 'rounded-bl-xl' : ''}`}>{row.label}</td>
                        <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">{row.old}</td>
                        <td className={`p-4 border border-green-500/20 text-sm text-center font-semibold bg-green-50 dark:bg-green-900/10 text-green-600 ${row.last ? 'rounded-br-xl' : ''}`}>{row.medi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center">
              <Link href="/simulate" className="btn-primary btn-lg">
                <BarChart3 className="w-5 h-5" />
                무료 입지 분석 해보기
              </Link>
            </div>
          </div>
        </section>

        {/* ===== Section 7: PG 단말기 조건 ===== */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                PG 단말기부터 시작하세요
              </h2>
              <p className="text-muted-foreground">기존 카드사 계약은 유지, PG사만 변경하면 됩니다 · 당일 설치 완료</p>
            </div>

            {/* 단말기 안내 */}
            <div className="max-w-md mx-auto mb-12">
              <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-2 border-blue-500/30 rounded-2xl p-6 text-center">
                <span className="text-4xl leading-none block mb-3">🩺</span>
                <h4 className="font-semibold mb-1">병의원 · 약국</h4>
                <p className="text-3xl font-bold text-blue-600 mb-1">무상 지원</p>
                <p className="text-sm text-muted-foreground">단말기 비용 0원 · 월 관리비 0원</p>
              </div>
            </div>

            {/* 시장 비교 */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-center mb-6">시장 대비 경쟁력</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-4 bg-card border border-border rounded-tl-xl text-sm font-medium text-muted-foreground">항목</th>
                      <th className="text-center p-4 bg-card border border-border text-sm font-medium">타사</th>
                      <th className="text-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-500/30 rounded-tr-xl text-sm font-medium text-white">메디플라톤</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: '단말기', other: '무상 지원', medi: '무상 지원' },
                      { label: '월 관리비', other: '없음', medi: '없음', mediGreen: true },
                      { label: 'DSR-Free 대출', other: '미제공', medi: '5.3%~ 제공' },
                      { label: '무료 마케팅', other: '미제공', medi: '최대 2,580만원', last: true },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className={`p-4 bg-card border border-border text-sm font-medium ${row.last ? 'rounded-bl-xl' : ''}`}>{row.label}</td>
                        <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">{row.other}</td>
                        <td className={`p-4 border border-blue-500/20 text-sm text-center font-semibold bg-blue-50 dark:bg-blue-900/10 ${row.mediGreen ? 'text-green-600' : 'text-blue-600'} ${row.last ? 'rounded-br-xl' : ''}`}>{row.medi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600 mb-1">0원</p>
                  <p className="text-sm text-muted-foreground">월 관리비 (전 업종)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 mb-1">당일</p>
                  <p className="text-sm text-muted-foreground">설치 완료</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 mb-1">무약정</p>
                  <p className="text-sm text-muted-foreground">별도 약정 기간 없음</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 8: DSR-Free 대출 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 text-sm font-medium mb-4">
                <span className="text-base">🏦</span>
                신협중앙회 정식 제휴
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                DSR 규제에 반영되지 않는
                <br />
                <span className="text-blue-600">카드매출 담보대출</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                기존 대출과 완전히 별개로 진행 · 대출 추가 시 플러스 등급으로 추가 마케팅 무료
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { label: '금리', value: '5.3%~6.9%', sub: '신용도별 차등', color: 'from-blue-500 to-cyan-500' },
                { label: '최대 한도', value: '3억원', sub: '최소 1,000만원', color: 'from-green-500 to-emerald-500' },
                { label: '중도상환 수수료', value: '0원', sub: '언제든 상환 가능', color: 'from-purple-500 to-pink-500' },
                { label: '대출 기간', value: '365~700일', sub: '평균 3영업일 심사', color: 'from-orange-500 to-amber-500' },
              ].map((stat) => (
                <div key={stat.label} className="relative overflow-hidden bg-card border border-border rounded-2xl p-6 text-center">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-6 md:p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: '신용점수 영향 없음', desc: '카드매출 담보이므로 개인 신용조회 불필요' },
                  { title: '기존 대출과 별개', desc: '주담대, 학자금 대출 있어도 별도 실행 가능' },
                  { title: '고객 부담 수수료 0원', desc: '제휴 금융기관 수수료로 운영, 고객 부담 없음' },
                  { title: 'PG 설치 후 바로 진행', desc: '카드결제 실적 발생 시 바로 대출 가능' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button onClick={scrollToForm} className="btn-primary btn-lg">
                지금 한도 조회하기
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ===== Section 9: 왜 메디플라톤인가 ===== */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                왜 메디플라톤 패키지인가?
              </h2>
              <p className="text-muted-foreground">개별 업체 vs 원스톱 패키지, 차이는 명확합니다</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-sm font-medium rounded-full">
                  개별 업체 각각
                </div>
                <div className="pt-8 space-y-5">
                  {[
                    { label: '중개 수수료', value: '별도 청구' },
                    { label: '대출 금리', value: '일반 금리 + DSR 반영' },
                    { label: '마케팅비', value: '블로그·플레이스·SNS 등 수천만원 자비' },
                    { label: 'PG 단말기', value: '단말기 무상이지만 월 11,000원 관리비' },
                    { label: '총 관리', value: '4~5개 업체 별도 관리' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{item.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/5 to-orange-500/5 border-2 border-blue-500/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">
                  메디플라톤 원스톱
                </div>
                <div className="pt-8 space-y-5">
                  {[
                    { label: '전담 매니저', value: '1:1 전담 배정' },
                    { label: 'DSR-Free 대출', value: '5.3%~ 업계 최저' },
                    { label: '무료 마케팅', value: '서비스 추가 시 최대 2,580만원 무료' },
                    { label: 'PG 단말기', value: '병의원 무상 + 관리비 0원' },
                    { label: '원스톱 관리', value: '모든 서비스 한 곳에서' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-base flex-shrink-0">✅</span>
                      <div>
                        <span className="font-medium">{item.label}</span>
                        <span className="text-sm text-blue-600 dark:text-blue-400 ml-2 font-semibold">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 10: 신뢰/사회적 증거 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 제휴 파트너 */}
            <div className="text-center mb-12">
              <p className="text-sm text-muted-foreground mb-6">정식 제휴 파트너</p>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                {['신협중앙회', 'KB국민카드', '신한카드', '우리카드', '하나카드'].map((partner) => (
                  <div key={partner} className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl">
                    <span className="text-base">🏦</span>
                    <span className="font-medium text-sm">{partner}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 숫자 카운터 */}
            <div className="grid grid-cols-3 gap-6 mb-16">
              <div ref={consultCount.ref} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-600">{consultCount.count.toLocaleString()}+</p>
                <p className="text-sm text-muted-foreground mt-1">누적 상담</p>
              </div>
              <div ref={loanCount.ref} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-green-600">{loanCount.count.toLocaleString()}+</p>
                <p className="text-sm text-muted-foreground mt-1">대출 실행</p>
              </div>
              <div ref={approvalRate.ref} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-purple-600">{approvalRate.count}%</p>
                <p className="text-sm text-muted-foreground mt-1">평균 승인율</p>
              </div>
            </div>

            {/* 후기 카드 — 실제 사진 포함 */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: '김○○ 원장님', specialty: '내과', photo: '/assets/consulting/doctor-meeting.jpg', quote: 'PG만 바꿨을 뿐인데 블로그·플레이스가 무료로 돌아가고, 대출까지 하니 카페 바이럴과 전담 마케터까지 배정됐어요. 개원 초기 비용이 크게 줄었습니다.', rating: 5 },
                { name: '박○○ 원장님', specialty: '피부과', photo: '/assets/consulting/interview-setup.jpg', quote: '중개까지 맡기니 프리미엄 등급이 되면서 SNS 마케팅도 무료! 전담 매니저가 한 번에 처리해줘서 정말 편했습니다.', rating: 5 },
                { name: '최○○ 원장님', specialty: '치과', photo: '/assets/consulting/clinic-lobby.jpg', quote: 'PG만 설치했을 뿐인데 블로그·플레이스가 바로 무료로 시작되고, 대출까지 추가하니 홈페이지까지 무료로 만들어줬어요. 원스톱이라 정말 편합니다.', rating: 5 },
              ].map((review) => (
                <div key={review.name} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={review.photo} alt={review.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">&ldquo;{review.quote}&rdquo;</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.specialty}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 컨설팅 현장 + 실제 사진 ===== */}
        <section className="py-20 bg-foreground text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                책상 위의 컨설팅이 <span className="text-[#3182f6]">아닙니다</span>
              </h2>
              <p className="text-white/60">직접 현장을 방문하고, 데이터를 분석하고, 카메라 앞에서 이야기합니다</p>
            </div>

            {/* 현장 사진 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
              {[
                { src: '/assets/consulting/consultation-1.jpg', label: '1:1 컨설팅' },
                { src: '/assets/consulting/doctor-interview.jpg', label: '원장 인터뷰' },
                { src: '/assets/consulting/team-filming.jpg', label: '촬영 현장' },
                { src: '/assets/consulting/consultation-2.jpg', label: '데이터 분석' },
                { src: '/assets/hospital/luxury-lobby-1.jpg', label: '프리미엄 로비' },
                { src: '/assets/hospital/treatment-room.jpg', label: '시술실' },
                { src: '/assets/hospital/waiting-room-render.jpg', label: '3D 설계' },
                { src: '/assets/hospital/treatment-beds.jpg', label: '회복실' },
              ].map((photo, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden aspect-[4/3]">
                  <img src={photo.src} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute bottom-2 left-3 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">{photo.label}</span>
                </div>
              ))}
            </div>

            {/* 함께한 병원 로고 마키 */}
            <div className="pt-12 border-t border-white/10">
              <h3 className="text-center text-lg font-semibold mb-2">메디플라톤이 함께한 병원들</h3>
              <p className="text-center text-sm text-white/40 mb-8">150곳 이상의 병원이 메디플라톤과 함께했습니다</p>

              {/* 1열 */}
              <div className="relative mb-4">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-foreground to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-foreground to-transparent z-10" />
                <div className="flex animate-marquee w-max">
                  {[...Array(2)].map((_, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-6 px-3">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <div key={`r1-${setIdx}-${n}`} className="flex-shrink-0 w-24 h-14 md:w-32 md:h-16 bg-white/[0.06] rounded-lg border border-white/[0.08] flex items-center justify-center p-2.5">
                          <img src={`/assets/clients/client-${String(n).padStart(2, '0')}.png`} alt={`파트너 병원 ${n}`} className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity invert" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2열 (역방향) */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-foreground to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-foreground to-transparent z-10" />
                <div className="flex animate-marquee-reverse w-max">
                  {[...Array(2)].map((_, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-6 px-3">
                      {Array.from({ length: 19 }, (_, i) => i + 21).map((n) => {
                        const ext = n >= 36 ? 'jpg' : 'png'
                        return (
                          <div key={`r2-${setIdx}-${n}`} className="flex-shrink-0 w-24 h-14 md:w-32 md:h-16 bg-white/[0.06] rounded-lg border border-white/[0.08] flex items-center justify-center p-2.5">
                            <img src={`/assets/clients/client-${String(n).padStart(2, '0')}.${ext}`} alt={`파트너 병원 ${n}`} className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity invert" />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 11: 상담 신청 폼 ===== */}
        <section ref={formRef} id="inquiry-form" className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12">
              <div className="lg:col-span-2">
                <div className="sticky top-24">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 text-sm font-medium mb-4">
                    <span className="text-base">📞</span>
                    무료 상담
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                    지금 바로
                    <br />
                    <span className="text-blue-600">무료 상담</span> 받으세요
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    전문 상담사가 1영업일 이내에 연락드립니다.
                    <br />
                    개원 상황에 맞는 최적의 혜택을 안내해드립니다.
                  </p>
                  <div className="space-y-4">
                    {[
                      { emoji: '⏱️', text: '평균 응답 시간 4시간' },
                      { emoji: '🔒', text: '개인정보 안전하게 보호' },
                      { emoji: '📱', text: '전화 또는 카카오톡 상담' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3">
                        <span className="text-xl leading-none">{item.emoji}</span>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                {formSubmitted ? (
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center">
                    <span className="text-6xl leading-none block mb-6">✅</span>
                    <h3 className="text-2xl font-bold mb-3">상담 신청 완료!</h3>
                    <p className="text-muted-foreground mb-6">
                      전문 상담사가 1영업일 이내에 연락드리겠습니다.
                      <br />
                      빠른 상담을 원하시면 전화 주세요.
                    </p>
                    <a href="tel:1588-0000" className="btn-primary btn-lg">
                      <Phone className="w-5 h-5" />
                      1588-0000 전화하기
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-5">
                    <div>
                      <label className="label mb-1.5 block">이름 *</label>
                      <input {...register('name')} className="input" placeholder="홍길동" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="label mb-1.5 block">연락처 *</label>
                      <input {...register('phone')} className="input" placeholder="010-1234-5678" />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="label mb-1.5 block">진료과 *</label>
                      <select {...register('specialty')} className="select">
                        <option value="">선택해주세요</option>
                        {SPECIALTIES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                      {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty.message}</p>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label mb-1.5 block">개원 평수 *</label>
                        <input type="number" {...register('area', { valueAsNumber: true })} className="input" placeholder="35" min={1} max={500} />
                        {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area.message}</p>}
                      </div>
                      <div>
                        <label className="label mb-1.5 block">희망 지역 *</label>
                        <input {...register('region')} className="input" placeholder="서울 강남구" />
                        {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="label mb-1.5 block">대출 필요 여부</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([{ value: 'yes' as const, label: '필요함' }, { value: 'no' as const, label: '불필요' }, { value: 'undecided' as const, label: '상담 후 결정' }]).map((opt) => (
                          <label key={opt.value} className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium ${watch('needLoan') === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-border hover:bg-accent'}`}>
                            <input type="radio" value={opt.value} {...register('needLoan')} className="sr-only" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label mb-1.5 block">관심 분야 (복수 선택) *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {INTERESTS.map((interest) => (
                          <button key={interest.id} type="button" onClick={() => toggleInterest(interest.id)} className={`p-3 rounded-xl border text-sm font-medium transition-all ${(watchInterests || []).includes(interest.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-border hover:bg-accent'}`}>
                            {interest.label}
                          </button>
                        ))}
                      </div>
                      {errors.interests && <p className="text-xs text-red-500 mt-1">{errors.interests.message}</p>}
                    </div>
                    <div>
                      <label className="label mb-1.5 block">문의 사항 (선택)</label>
                      <textarea {...register('message')} className="textarea" placeholder="추가 문의 사항이 있으시면 적어주세요" rows={3} />
                    </div>
                    <div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" {...register('agree')} className="mt-1 rounded border-border" />
                        <span className="text-sm text-muted-foreground">
                          <span className="text-foreground font-medium">개인정보 수집 및 이용</span>에 동의합니다. 상담 목적으로만 사용되며, 상담 완료 후 파기됩니다.
                        </span>
                      </label>
                      {errors.agree && <p className="text-xs text-red-500 mt-1">{errors.agree.message}</p>}
                    </div>
                    <button type="submit" disabled={formLoading} className="w-full btn-primary btn-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      {formLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />접수 중...</>) : (<>무료 상담 신청하기<ArrowRight className="w-5 h-5" /></>)}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Sticky CTA (모바일) ===== */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-bottom">
          <div className="bg-background/95 backdrop-blur-xl border-t border-border px-4 py-3">
            <button onClick={scrollToForm} className="w-full btn-primary btn-lg text-base">
              무료 상담 신청하기
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/assets/logo/mediplaton-horizontal.png" alt="MEDI-PLATON" className="h-7 object-contain" />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">문의하기</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} 메디플라톤. All rights reserved.</p>
            <p className="mt-1">신협중앙회·KB국민카드 정식 제휴 | 마케팅 서비스는 PG 이용 기간 동안 지속, 별도 약정 없음</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
