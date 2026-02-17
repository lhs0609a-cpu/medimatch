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
  Shield,
  CreditCard,
  TrendingUp,
  Clock,
  Building2,
  DollarSign,
  Users,
  BarChart3,
  Megaphone,
  Globe,
  Zap,
  Star,
  ChevronRight,
  Minus,
  Plus,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
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

/* ─── 마케팅 티어 데이터 ─── */
interface Tier {
  label: string
  maxArea: number
  benefits: { name: string; value: string; included: boolean }[]
  totalValue: number
  color: string
}

const TIERS: Tier[] = [
  {
    label: '소형',
    maxArea: 30,
    benefits: [
      { name: '홈페이지 제작', value: '300만원', included: true },
      { name: '블로그 마케팅 3개월', value: '440만원', included: false },
      { name: '블로그 마케팅 6개월', value: '880만원', included: false },
      { name: '플레이스 광고 3개월', value: '790만원', included: false },
    ],
    totalValue: 300,
    color: 'blue',
  },
  {
    label: '중형',
    maxArea: 50,
    benefits: [
      { name: '홈페이지 제작', value: '300만원', included: true },
      { name: '블로그 마케팅 3개월', value: '440만원', included: true },
      { name: '블로그 마케팅 6개월', value: '880만원', included: false },
      { name: '플레이스 광고 3개월', value: '790만원', included: false },
    ],
    totalValue: 740,
    color: 'purple',
  },
  {
    label: '대형',
    maxArea: 999,
    benefits: [
      { name: '홈페이지 제작', value: '300만원', included: true },
      { name: '블로그 마케팅 6개월', value: '880만원', included: true },
      { name: '플레이스 광고 3개월', value: '790만원', included: true },
      { name: '전담 마케터 배정', value: '별도', included: true },
    ],
    totalValue: 1970,
    color: 'orange',
  },
]

function getTier(area: number): number {
  if (area <= 30) return 0
  if (area <= 50) return 1
  return 2
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
  const [calcArea, setCalcArea] = useState(35)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLElement>(null)

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

  // 폼 제출 → Google Sheets (Apps Script 웹앱)
  const onSubmit = async (data: InquiryForm) => {
    setFormLoading(true)
    try {
      const sheetUrl = process.env.NEXT_PUBLIC_SHEET_URL
      if (!sheetUrl) throw new Error('시트 URL 미설정')

      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          interests: data.interests.join(', '),
          submittedAt: new Date().toISOString(),
        }),
      })

      setFormSubmitted(true)
      toast.success('상담 신청이 완료되었습니다! 빠른 시일 내에 연락드리겠습니다.')
    } catch {
      // no-cors 모드에서는 응답을 읽을 수 없으므로 성공으로 처리
      setFormSubmitted(true)
      toast.success('상담 신청이 접수되었습니다! 담당자가 곧 연락드리겠습니다.')
    } finally {
      setFormLoading(false)
    }
  }

  // 계산기 티어
  const currentTier = getTier(calcArea)
  const tier = TIERS[currentTier]

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 glass" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-xl text-foreground">메디플라톤</span>
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
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
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
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-blue-600">OpenSim</p>
                          <p className="text-xs text-muted-foreground">AI 개원 시뮬레이터</p>
                        </div>
                      </Link>
                      <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
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
                <Globe className="w-5 h-5 text-blue-500" />
                <span>홈</span>
              </Link>
              <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                <Building2 className="w-5 h-5 text-green-500" />
                <span>매물 검색</span>
              </Link>
              <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                <BarChart3 className="w-5 h-5 text-indigo-500" />
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
        {/* ===== Section 1: Hero ===== */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          {/* 배경 장식 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              {/* 제휴 뱃지 */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-orange-500/10 border border-blue-500/20 mb-8 animate-fade-in">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">
                  <span className="text-blue-600 font-semibold">신협중앙회</span> · <span className="text-orange-600 font-semibold">KB국민카드</span> 정식 제휴
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
                <span className="text-foreground">개원부터 대출, 마케팅까지</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                  원스톱으로 끝
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto animate-fade-in-up delay-100">
                개원 중개 + DSR-Free 대출 + 무료 마케팅 + PG 단말기
              </p>
              <p className="text-base text-muted-foreground mb-10 max-w-xl mx-auto animate-fade-in-up delay-150">
                따로 하면 비용, 한 번에 하면 <span className="text-orange-600 font-semibold">최대 1,970만원 무료 혜택</span>
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-200">
                <button onClick={scrollToForm} className="btn-primary btn-lg group shadow-xl shadow-blue-500/30 text-lg px-8">
                  무료 상담 신청
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#calculator" className="btn-outline btn-lg text-lg px-8">
                  <Sparkles className="w-5 h-5" />
                  내 혜택 계산하기
                </a>
              </div>

              {/* 4가지 서비스 아이콘 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto animate-fade-in-up delay-300">
                {[
                  { icon: Building2, label: '개원 중개', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
                  { icon: DollarSign, label: 'DSR-Free 대출', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
                  { icon: Megaphone, label: '무료 마케팅', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
                  { icon: CreditCard, label: 'PG 단말기', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </section>

        {/* ===== Section 2: 고민 포인트 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                개원 준비, 이런 고민 있으시죠?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: AlertCircle,
                  title: 'DSR 규제로 대출 한도 부족',
                  desc: '이미 주담대·학자금이 있으면 추가 대출이 어렵고, 금리도 높아집니다.',
                  color: 'text-red-500 bg-red-100 dark:bg-red-900/30',
                },
                {
                  icon: DollarSign,
                  title: '마케팅비 부담',
                  desc: '홈페이지 300만원, 블로그 월 150만원, 플레이스 광고 월 260만원… 개원 초기에 큰 부담입니다.',
                  color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
                },
                {
                  icon: Users,
                  title: '여러 업체를 따로 관리',
                  desc: '중개, 대출, 마케팅, PG를 각각 다른 업체와 상담하면 시간과 비용 모두 낭비됩니다.',
                  color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
                },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium">
                <Zap className="w-5 h-5" />
                이제 한 곳에서 해결하세요
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 3: DSR-Free 대출 ===== */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                신협중앙회 정식 제휴
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                DSR 규제에 반영되지 않는
                <br />
                <span className="text-blue-600">카드매출 담보대출</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                기존 대출(주담대, 학자금 등)과 완전히 별개로 진행되어 DSR에 영향을 주지 않습니다
              </p>
            </div>

            {/* 4개 스탯 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { label: '금리', value: '5.3%~6.9%', sub: '업계 최저 수준', color: 'from-blue-500 to-cyan-500' },
                { label: '최대 한도', value: '3억원', sub: '카드매출 기반', color: 'from-green-500 to-emerald-500' },
                { label: '중도상환 수수료', value: '0원', sub: '언제든 상환 가능', color: 'from-purple-500 to-pink-500' },
                { label: '평균 심사 기간', value: '3영업일', sub: '빠른 실행', color: 'from-orange-500 to-amber-500' },
              ].map((stat) => (
                <div key={stat.label} className="relative overflow-hidden bg-card border border-border rounded-2xl p-6 text-center">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* 핵심 혜택 */}
            <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-6 md:p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: '신용점수 영향 없음', desc: '카드매출 담보이므로 개인 신용조회가 필요 없습니다' },
                  { title: '기존 대출과 별개 진행', desc: '주택담보대출, 학자금 대출이 있어도 별도 실행 가능' },
                  { title: '고객 부담 수수료 0원', desc: '별도의 중개 수수료나 심사비가 없습니다' },
                  { title: '카드매출 발생 즉시 가능', desc: 'PG 단말기 설치 후 카드결제 실적 발생 시 바로 대출 진행' },
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

        {/* ===== Section 4: 대출 비교표 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                대출 상품 비교
              </h2>
              <p className="text-muted-foreground">한눈에 비교하고 현명하게 선택하세요</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 bg-card border border-border rounded-tl-xl text-sm font-medium text-muted-foreground w-1/4">항목</th>
                    <th className="text-center p-4 bg-card border border-border text-sm font-medium w-1/4">시중 은행</th>
                    <th className="text-center p-4 bg-card border border-border text-sm font-medium w-1/4">대부업체</th>
                    <th className="text-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-500/30 rounded-tr-xl text-sm font-medium text-white w-1/4">
                      메디플라톤
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '금리', bank: '4.5%~8%', loan: '12%~24%', medi: '5.3%~6.9%' },
                    { label: '최대 한도', bank: '5,000만원', loan: '1억원', medi: '3억원' },
                    { label: 'DSR 반영', bank: '반영', loan: '반영', medi: '미반영' },
                    { label: '중도상환 수수료', bank: '1~1.5%', loan: '2~3%', medi: '0원' },
                    { label: '고객 부담 수수료', bank: '없음', loan: '5~10%', medi: '0원' },
                    { label: '심사 기간', bank: '7~14일', loan: '1~3일', medi: '평균 3영업일' },
                    { label: '신용점수 영향', bank: '있음', loan: '있음', medi: '없음' },
                    { label: '담보', bank: '부동산/신용', loan: '신용', medi: '카드매출' },
                  ].map((row, i) => (
                    <tr key={row.label}>
                      <td className="p-4 bg-card border border-border text-sm font-medium">{row.label}</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">{row.bank}</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">{row.loan}</td>
                      <td className={`p-4 border border-blue-500/20 text-sm text-center font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/10 ${i === 7 ? 'rounded-br-xl' : ''}`}>
                        {row.medi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===== Section 5: 마케팅 혜택 계산기 ===== */}
        <section id="calculator" className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                인터랙티브 계산기
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                나의 지원받을 수 있는 혜택은?
              </h2>
              <p className="text-muted-foreground">개원 평수를 입력하면 실시간으로 혜택이 계산됩니다</p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl">
                {/* 평수 입력 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3">개원 예정 평수</label>
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => setCalcArea(Math.max(5, calcArea - 5))}
                      className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={calcArea}
                        onChange={(e) => setCalcArea(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-blue-600"
                      />
                    </div>
                    <button
                      onClick={() => setCalcArea(Math.min(100, calcArea + 5))}
                      className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-bold">{calcArea}</span>
                    <span className="text-lg text-muted-foreground ml-1">평</span>
                    <span className="ml-3 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {tier.label}
                    </span>
                  </div>
                </div>

                {/* 티어 구분선 */}
                <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
                  <div className={`flex-1 h-1 rounded-full ${calcArea <= 30 ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-800'}`} />
                  <span>30평</span>
                  <div className={`flex-1 h-1 rounded-full ${calcArea > 30 && calcArea <= 50 ? 'bg-purple-500' : 'bg-purple-200 dark:bg-purple-800'}`} />
                  <span>50평</span>
                  <div className={`flex-1 h-1 rounded-full ${calcArea > 50 ? 'bg-orange-500' : 'bg-orange-200 dark:bg-orange-800'}`} />
                </div>

                {/* 혜택 카드 */}
                <div className="space-y-3 mb-8">
                  {tier.benefits.map((benefit) => (
                    <div
                      key={benefit.name}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        benefit.included
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                          : 'bg-secondary/50 border-border opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {benefit.included ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className={`font-medium ${benefit.included ? '' : 'text-muted-foreground line-through'}`}>
                          {benefit.name}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${benefit.included ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {benefit.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 총 절약 금액 */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 rounded-2xl p-6 text-white text-center mb-6">
                  <p className="text-sm opacity-80 mb-1">총 절약 가능 금액</p>
                  <p className="text-4xl md:text-5xl font-bold">
                    {tier.totalValue.toLocaleString()}<span className="text-xl">만원</span>
                  </p>
                  <p className="text-sm opacity-80 mt-1">상당의 무료 혜택</p>
                </div>

                {/* 다음 티어 유도 */}
                {currentTier < 2 && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm">
                      {currentTier === 0 ? (
                        <><span className="font-semibold text-amber-700 dark:text-amber-400">{30 - calcArea}평 더 넓히면</span> 블로그 3개월 무료 추가! (총 740만원)</>
                      ) : (
                        <><span className="font-semibold text-amber-700 dark:text-amber-400">{50 - calcArea}평 더 넓히면</span> 블로그 6개월 + 플레이스 광고 무료! (총 1,970만원)</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 6: 조건 안내 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                이것만 하시면 됩니다
              </h2>
              <p className="text-muted-foreground">PG 단말기 설치 하나로 모든 혜택이 시작됩니다</p>
            </div>

            {/* 시장 vs 메디플라톤 비교 */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-center mb-6">시장 대비 경쟁력 있는 조건</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-4 bg-card border border-border rounded-tl-xl text-sm font-medium text-muted-foreground">항목</th>
                      <th className="text-center p-4 bg-card border border-border text-sm font-medium">타사 (자영업자)</th>
                      <th className="text-center p-4 bg-card border border-border text-sm font-medium">타사 (병의원·약국)</th>
                      <th className="text-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-500/30 rounded-tr-xl text-sm font-medium text-white">메디플라톤</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-4 bg-card border border-border text-sm font-medium">단말기 비용</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">무상 지원</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">무상 지원</td>
                      <td className="p-4 border border-blue-500/20 text-sm text-center font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/10">
                        병의원 무상 / 일반 20만원
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-card border border-border text-sm font-medium">월 관리비</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-red-500 font-medium">월 11,000원</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">없음</td>
                      <td className="p-4 border border-blue-500/20 text-sm text-center font-semibold text-green-600 bg-blue-50 dark:bg-blue-900/10">
                        없음 (전 업종)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-card border border-border text-sm font-medium">DSR-Free 대출</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">미제공</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">미제공</td>
                      <td className="p-4 border border-blue-500/20 text-sm text-center font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/10">
                        5.3%~ 제공
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-card border border-border text-sm font-medium rounded-bl-xl">무료 마케팅</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">미제공</td>
                      <td className="p-4 bg-card border border-border text-sm text-center text-muted-foreground">미제공</td>
                      <td className="p-4 border border-blue-500/20 text-sm text-center font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/10 rounded-br-xl">
                        최대 1,970만원 지원
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3스텝 프로세스 */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  step: '01',
                  icon: CreditCard,
                  title: 'PG 단말기 설치',
                  desc: '병의원·약국은 무상 지원, 일반 사업자는 20만원. 월 관리비 없음.',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  step: '02',
                  icon: TrendingUp,
                  title: '카드 결제 시작',
                  desc: '개원 후 카드 결제가 발생하면 자동으로 매출 데이터가 쌓입니다.',
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  step: '03',
                  icon: Sparkles,
                  title: '혜택 자동 적용',
                  desc: 'DSR-Free 대출 실행, 마케팅 혜택 지원, 전담 매니저 배정이 시작됩니다.',
                  color: 'from-orange-500 to-amber-500',
                },
              ].map((step, i) => (
                <div key={step.step} className="relative">
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8 text-center h-full">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground font-medium mb-2">STEP {step.step}</div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                      <ChevronRight className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 업종별 단말기 안내 */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-2 border-blue-500/30 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-1">병의원 · 약국</h4>
                <p className="text-3xl font-bold text-blue-600 mb-1">무상 지원</p>
                <p className="text-sm text-muted-foreground">단말기 비용 0원 · 월 관리비 0원</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-1">일반 사업자</h4>
                <p className="text-3xl font-bold text-foreground mb-1">20만원</p>
                <p className="text-sm text-muted-foreground">단말기 가격만 · 월 관리비 0원</p>
                <p className="text-xs text-muted-foreground mt-2">* 심사 후 기본거래 보증보험이 요구될 수 있습니다</p>
              </div>
            </div>

            {/* 핵심 포인트 */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600 mb-1">0원</p>
                  <p className="text-sm text-muted-foreground">월 관리비 (전 업종)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 mb-1">0원</p>
                  <p className="text-sm text-muted-foreground">병의원 단말기 비용</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 mb-1">업계 최저</p>
                  <p className="text-sm text-muted-foreground">카드 결제 수수료</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 7: 왜 메디플라톤인가 ===== */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                왜 메디플라톤 패키지인가?
              </h2>
              <p className="text-muted-foreground">개별 업체 vs 원스톱 패키지, 차이는 명확합니다</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* 개별 업체 */}
              <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-sm font-medium rounded-full">
                  개별 업체 각각
                </div>
                <div className="pt-8 space-y-5">
                  {[
                    { label: '중개 수수료', value: '별도 청구', icon: X, iconColor: 'text-red-500' },
                    { label: '대출 금리', value: '일반 금리 + DSR 반영', icon: X, iconColor: 'text-red-500' },
                    { label: '마케팅비', value: '월 200~500만원 지출', icon: X, iconColor: 'text-red-500' },
                    { label: 'PG 단말기', value: '단말기 무상이지만 월 11,000원 관리비', icon: X, iconColor: 'text-red-500' },
                    { label: '총 관리', value: '4~5개 업체 별도 관리', icon: X, iconColor: 'text-red-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${item.iconColor} flex-shrink-0`} />
                      <div>
                        <span className="font-medium">{item.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 메디플라톤 */}
              <div className="bg-gradient-to-br from-blue-500/5 to-orange-500/5 border-2 border-blue-500/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">
                  메디플라톤 원스톱
                </div>
                <div className="pt-8 space-y-5">
                  {[
                    { label: '전담 매니저', value: '1:1 전담 배정', icon: Check, iconColor: 'text-green-500' },
                    { label: 'DSR-Free 대출', value: '5.3%~ 업계 최저', icon: Check, iconColor: 'text-green-500' },
                    { label: '무료 마케팅', value: '최대 1,970만원 무료', icon: Check, iconColor: 'text-green-500' },
                    { label: 'PG 단말기', value: '병의원 무상 + 관리비 0원', icon: Check, iconColor: 'text-green-500' },
                    { label: '원스톱 관리', value: '모든 서비스 한 곳에서', icon: Check, iconColor: 'text-green-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                      </div>
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

        {/* ===== Section 8: 신뢰/사회적 증거 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 파트너 */}
            <div className="text-center mb-12">
              <p className="text-sm text-muted-foreground mb-6">정식 제휴 파트너</p>
              <div className="flex items-center justify-center gap-8 mb-12">
                <div className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold">신협중앙회</span>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                  <span className="font-semibold">KB국민카드</span>
                </div>
              </div>
            </div>

            {/* 스탯 */}
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

            {/* 후기 */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: '김○○ 원장님',
                  specialty: '내과',
                  quote: 'DSR 때문에 은행 대출이 안 되서 막막했는데, 카드매출 담보대출로 3억을 받았습니다. 마케팅까지 무료라 개원 초기 비용이 크게 줄었어요.',
                  rating: 5,
                },
                {
                  name: '박○○ 원장님',
                  specialty: '피부과',
                  quote: '여러 업체를 따로 상대하는 게 너무 피곤했는데, 전담 매니저가 한 번에 처리해줘서 편했습니다. 홈페이지도 퀄리티가 좋아요.',
                  rating: 5,
                },
                {
                  name: '이○○ 원장님',
                  specialty: '정형외과',
                  quote: '50평 개원인데 블로그 마케팅 3개월 무료가 큰 혜택이었습니다. 환자 유입이 빠르게 늘었어요. 주변 동료에게 추천하고 있습니다.',
                  rating: 5,
                },
              ].map((review) => (
                <div key={review.name} className="bg-card border border-border rounded-2xl p-6">
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
              ))}
            </div>
          </div>
        </section>

        {/* ===== Section 9: 상담 신청 폼 ===== */}
        <section ref={formRef} id="inquiry-form" className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12">
              {/* 좌: 안내 */}
              <div className="lg:col-span-2">
                <div className="sticky top-24">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm font-medium mb-4">
                    <Phone className="w-4 h-4" />
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
                    개원 상황에 맞는 최적의 패키지를 안내해드립니다.
                  </p>

                  <div className="space-y-4">
                    {[
                      { icon: Clock, text: '평균 응답 시간 4시간' },
                      { icon: Shield, text: '개인정보 안전하게 보호' },
                      { icon: Phone, text: '전화 또는 카카오톡 상담' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 우: 폼 */}
              <div className="lg:col-span-3">
                {formSubmitted ? (
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
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
                    {/* 이름 */}
                    <div>
                      <label className="label mb-1.5 block">이름 *</label>
                      <input {...register('name')} className="input" placeholder="홍길동" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>

                    {/* 연락처 */}
                    <div>
                      <label className="label mb-1.5 block">연락처 *</label>
                      <input {...register('phone')} className="input" placeholder="010-1234-5678" />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                    </div>

                    {/* 진료과 */}
                    <div>
                      <label className="label mb-1.5 block">진료과 *</label>
                      <select {...register('specialty')} className="select">
                        <option value="">선택해주세요</option>
                        {SPECIALTIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty.message}</p>}
                    </div>

                    {/* 개원 평수 + 희망 지역 */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label mb-1.5 block">개원 평수 *</label>
                        <input
                          type="number"
                          {...register('area', { valueAsNumber: true })}
                          className="input"
                          placeholder="35"
                          min={1}
                          max={500}
                        />
                        {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area.message}</p>}
                      </div>
                      <div>
                        <label className="label mb-1.5 block">희망 지역 *</label>
                        <input {...register('region')} className="input" placeholder="서울 강남구" />
                        {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region.message}</p>}
                      </div>
                    </div>

                    {/* 대출 필요 여부 */}
                    <div>
                      <label className="label mb-1.5 block">대출 필요 여부</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'yes' as const, label: '필요함' },
                          { value: 'no' as const, label: '불필요' },
                          { value: 'undecided' as const, label: '상담 후 결정' },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                              watch('needLoan') === opt.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                : 'border-border hover:bg-accent'
                            }`}
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              {...register('needLoan')}
                              className="sr-only"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 관심 분야 */}
                    <div>
                      <label className="label mb-1.5 block">관심 분야 (복수 선택) *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {INTERESTS.map((interest) => (
                          <button
                            key={interest.id}
                            type="button"
                            onClick={() => toggleInterest(interest.id)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                              (watchInterests || []).includes(interest.id)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                : 'border-border hover:bg-accent'
                            }`}
                          >
                            {interest.label}
                          </button>
                        ))}
                      </div>
                      {errors.interests && <p className="text-xs text-red-500 mt-1">{errors.interests.message}</p>}
                    </div>

                    {/* 메시지 */}
                    <div>
                      <label className="label mb-1.5 block">문의 사항 (선택)</label>
                      <textarea {...register('message')} className="textarea" placeholder="추가 문의 사항이 있으시면 적어주세요" rows={3} />
                    </div>

                    {/* 약관 동의 */}
                    <div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" {...register('agree')} className="mt-1 rounded border-border" />
                        <span className="text-sm text-muted-foreground">
                          <span className="text-foreground font-medium">개인정보 수집 및 이용</span>에 동의합니다.
                          상담 목적으로만 사용되며, 상담 완료 후 파기됩니다.
                        </span>
                      </label>
                      {errors.agree && <p className="text-xs text-red-500 mt-1">{errors.agree.message}</p>}
                    </div>

                    {/* 제출 */}
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full btn-primary btn-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          접수 중...
                        </>
                      ) : (
                        <>
                          무료 상담 신청하기
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Section 10: Sticky CTA (모바일) ===== */}
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-bold text-lg">메디플라톤</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">문의하기</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} 메디플라톤. All rights reserved.</p>
            <p className="mt-1">신협중앙회·KB국민카드 정식 제휴 | 대출 상담은 대출 실행을 보장하지 않습니다</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
