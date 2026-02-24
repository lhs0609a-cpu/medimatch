'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import OnboardingModal, { useOnboarding } from '@/components/onboarding/OnboardingModal'
import { platformStats, generateActivityFeed, recentSuccessStories, generateBuildingListings, generatePharmacyListings } from '@/lib/data/seedListings'
import {
  ArrowRight,
  BarChart3,
  MapPin,
  Pill,
  Building2,
  Users,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Globe,
  LayoutDashboard,
  CheckCircle2,
  Activity,
  Eye,
  DollarSign,
  TrendingUp,
  Shield,
  Trophy,
  ClipboardList,
  PenTool,
  Monitor,
  Microscope,
  Paintbrush,
  Receipt,
  Megaphone,
  HeartPulse,
  Star,
  Calculator,
  LineChart,
  Stethoscope,
  Wallet,
  Search,
  FileText,
  Scale,
  CreditCard,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

// 카카오맵 동적 로드
const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary animate-pulse" />,
})

// 숫자 카운터 애니메이션 훅
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOnView) {
      animateCount()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
          animateCount()
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, hasStarted, startOnView])

  const animateCount = () => {
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  return { count, ref }
}

// 실시간 피드 아이템 타입
interface ActivityItem {
  id: string
  type: 'simulation' | 'listing' | 'inquiry' | 'match' | 'signup'
  message: string
  location: string
  time: string
  icon: typeof Building2
  color: string
}

// 실시간 활동 피드 생성
function generateLiveFeed(): ActivityItem[] {
  const activities: ActivityItem[] = [
    { id: '1', type: 'simulation', message: '내과 개원 시뮬레이션 완료', location: '서울 역삼동', time: '방금 전', icon: BarChart3, color: 'text-blue-500' },
    { id: '2', type: 'listing', message: '신규 매물 등록', location: '경기 분당구', time: '2분 전', icon: Building2, color: 'text-green-500' },
    { id: '3', type: 'inquiry', message: '약국 매물 문의', location: '서울 송파구', time: '5분 전', icon: Pill, color: 'text-purple-500' },
    { id: '4', type: 'match', message: '매칭 성사', location: '서울 강남구', time: '8분 전', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: '5', type: 'signup', message: '의사 회원 가입', location: '부산 해운대구', time: '12분 전', icon: Users, color: 'text-orange-500' },
    { id: '6', type: 'simulation', message: '피부과 시뮬레이션 완료', location: '서울 신사동', time: '15분 전', icon: BarChart3, color: 'text-blue-500' },
    { id: '7', type: 'listing', message: '약국 양도 등록', location: '인천 송도동', time: '18분 전', icon: Pill, color: 'text-purple-500' },
    { id: '8', type: 'inquiry', message: '메디컬빌딩 문의', location: '대구 수성구', time: '22분 전', icon: Building2, color: 'text-green-500' },
  ]
  return activities
}

/* ─── 개원/개국 도구 25종 데이터 ─── */
const TOOL_CATS = ['전체', '재무/분석', '개원 준비', '운영/마케팅', '약국 전용', '법률/계약'] as const

const ALL_TOOLS: { name: string; href: string; cat: string; desc: string; icon: typeof BarChart3; gradient: string; shadow: string }[] = [
  // 재무/분석 (8)
  { name: '개원 비용 계산기', href: '/cost-calculator', cat: '재무/분석', desc: '진료과별 초기비용 산출', icon: DollarSign, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: 'BEP 분석기', href: '/bep-analyzer', cat: '재무/분석', desc: '손익분기점 시뮬레이션', icon: TrendingUp, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '진료과별 트렌드', href: '/trend-report', cat: '재무/분석', desc: '6년 개원 트렌드 분석', icon: BarChart3, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '상권 인구통계', href: '/demographics', cat: '재무/분석', desc: '연령·소득·인구 분석', icon: Users, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '개원 vs 인수', href: '/open-vs-acquire', cat: '재무/분석', desc: '비용/리스크 비교', icon: Scale, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '대출/금융 비교', href: '/loan-compare', cat: '재무/분석', desc: '20+ 금융상품 비교', icon: CreditCard, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '보험 비교', href: '/insurance-compare', cat: '재무/분석', desc: '의료인 보험 비교', icon: Shield, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '병원 벤치마크', href: '/benchmark', cat: '재무/분석', desc: '매출/환자수 비교', icon: Trophy, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  // 개원 준비 (7)
  { name: '개원 체크리스트', href: '/checklist', cat: '개원 준비', desc: '단계별 타임라인', icon: CheckCircle2, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '인허가 가이드', href: '/license-guide', cat: '개원 준비', desc: '의원 개설 절차 안내', icon: ClipboardList, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '동선 설계', href: '/floor-plan', cat: '개원 준비', desc: '진료과별 평면 설계', icon: PenTool, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: 'EMR 비교', href: '/emr-compare', cat: '개원 준비', desc: '전자차트 시스템 비교', icon: Monitor, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '의료기기 비교', href: '/equipment', cat: '개원 준비', desc: '장비 견적/중고 매물', icon: Microscope, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '인테리어 견적', href: '/interior', cat: '개원 준비', desc: '진료과별 비용 산출', icon: Paintbrush, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '세무/회계사 매칭', href: '/tax-advisor', cat: '개원 준비', desc: '의료 전문 세무사', icon: Receipt, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  // 운영/마케팅 (5)
  { name: '마케팅 패키지', href: '/marketing', cat: '운영/마케팅', desc: '개원 마케팅 전략', icon: Megaphone, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '보험 청구 최적화', href: '/insurance-billing', cat: '운영/마케팅', desc: '건강보험 삭감 방지', icon: HeartPulse, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '리뷰/평판 관리', href: '/reputation', cat: '운영/마케팅', desc: '온라인 평판 모니터링', icon: Star, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '수가 시뮬레이터', href: '/fee-simulator', cat: '운영/마케팅', desc: '진료과별 수가 계산', icon: Calculator, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '경영 모니터링', href: '/operations', cat: '운영/마케팅', desc: '매출/환자 갭 분석', icon: LineChart, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  // 약국 전용 (5)
  { name: '처방전 유입 예측', href: '/pharmacy-forecast', cat: '약국 전용', desc: '인근 병원 기반 추정', icon: Stethoscope, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '약국 개국 비용', href: '/pharmacy-cost', cat: '약국 전용', desc: '입지별 초기비용 산출', icon: Wallet, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '도매상 가격 비교', href: '/wholesale-compare', cat: '약국 전용', desc: '40+ 약품 가격 비교', icon: Search, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: 'OTC/건기식 전략', href: '/otc-strategy', cat: '약국 전용', desc: '비처방 매출 전략', icon: Pill, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '약국 벤치마크', href: '/pharmacy-benchmark', cat: '약국 전용', desc: '규모별 경영 비교', icon: Activity, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  // 법률/계약 (2)
  { name: '법률 Q&A', href: '/legal', cat: '법률/계약', desc: '의료법/노동법 자문', icon: Scale, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
  { name: '계약서 템플릿', href: '/contract-templates', cat: '법률/계약', desc: '임대/동업/근로 계약서', icon: FileText, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [toolTab, setToolTab] = useState<string>('전체')
  const { showOnboarding, setShowOnboarding } = useOnboarding()

  // 실시간 피드
  const [liveFeed, setLiveFeed] = useState<ActivityItem[]>([])
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0)

  // 인터랙티브 데모
  const [demoAddress, setDemoAddress] = useState('')
  const [demoSpecialty, setDemoSpecialty] = useState('내과')
  const [showDemoResult, setShowDemoResult] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  // 지도 마커 애니메이션
  const [mapMarkers, setMapMarkers] = useState<Array<{id: string, lat: number, lng: number, title: string, type: 'hospital' | 'pharmacy'}>>([])

  // 카운터
  const listingCount = useCountUp(platformStats.totalListings, 2000)
  const pharmacyCount = useCountUp(platformStats.activePharmacyListings, 2000)
  const matchCount = useCountUp(platformStats.successfulMatches, 2500)
  const memberCount = useCountUp(platformStats.totalMembers, 2000)

  // 초기화
  useEffect(() => {
    setLiveFeed(generateLiveFeed())

    // 전국 매물 마커 설정
    const buildings = generateBuildingListings()
    const pharmacies = generatePharmacyListings()

    const buildingMarkers = buildings.map((b) => ({
      id: b.id,
      lat: b.lat,
      lng: b.lng,
      title: b.title,
      type: 'hospital' as const,
    }))

    const pharmacyMarkers = pharmacies.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      title: `${p.subArea} 약국`,
      type: 'pharmacy' as const,
    }))

    setMapMarkers([...buildingMarkers, ...pharmacyMarkers])
  }, [])

  // 피드 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeedIndex((prev) => (prev + 1) % liveFeed.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [liveFeed.length])

  // 마커 애니메이션 제거 - 전국 매물 470개 모두 표시

  // 데모 실행
  const runDemo = () => {
    if (!demoAddress) return
    setDemoLoading(true)
    setShowDemoResult(false)
    setTimeout(() => {
      setDemoLoading(false)
      setShowDemoResult(true)
    }, 1500)
  }

  // 데모 결과 (가상)
  const demoResults = {
    monthlyRevenue: '1.2억 ~ 1.8억',
    breakEven: '14개월',
    competitors: 12,
    population: '32,450명',
    score: 78,
  }

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      <div className="min-h-screen bg-background">
        {/* ===== HEADER ===== */}
        <header className="fixed top-0 left-0 right-0 z-50 glass" role="banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/assets/logo/mediplaton-horizontal.png"
                  alt="MEDI-PLATON"
                  className="h-8 object-contain"
                />
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
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] p-6 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-down"
                      onMouseLeave={() => setServicesOpen(false)}
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">핵심 서비스</p>
                          <div className="space-y-1">
                            <Link href="/opening-package" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 group">
                              <TossIcon icon={Sparkles} color="from-orange-500 to-amber-500" size="sm" shadow="shadow-orange-500/25" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground group-hover:text-orange-600">개원의 패키지</p>
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">HOT</span>
                                </div>
                                <p className="text-xs text-muted-foreground">대출 + 마케팅 + PG + 중개 원스톱</p>
                              </div>
                            </Link>
                            <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                              <TossIcon icon={BarChart3} color="from-blue-500 to-indigo-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground group-hover:text-blue-600">OpenSim</p>
                                <p className="text-xs text-muted-foreground">AI 개원 시뮬레이터</p>
                              </div>
                            </Link>
                            <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                              <TossIcon icon={Building2} color="from-green-500 to-emerald-600" size="xs" shadow="shadow-green-500/25" className="flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground group-hover:text-green-600">매물 검색</p>
                                <p className="text-xs text-muted-foreground">개원 적합 공간 찾기</p>
                              </div>
                            </Link>
                            <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                              <TossIcon icon={Pill} color="from-blue-500 to-indigo-600" size="xs" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground group-hover:text-purple-600">PharmMatch</p>
                                <p className="text-xs text-muted-foreground">약국 양도양수</p>
                              </div>
                            </Link>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">개원 도구</p>
                          <div className="space-y-1">
                            <Link href="/cost-calculator" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <span className="text-lg">🧮</span>
                              <span className="text-sm">개원 비용 계산기</span>
                            </Link>
                            <Link href="/bep-analyzer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <span className="text-lg">📈</span>
                              <span className="text-sm">BEP 분석기</span>
                            </Link>
                            <Link href="/checklist" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <span className="text-lg">✅</span>
                              <span className="text-sm">개원 체크리스트</span>
                            </Link>
                            <Link href="/#tools" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <span className="text-lg">🛠️</span>
                              <span className="text-sm">전체 도구 27종 보기</span>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600/10 text-indigo-600 rounded">NEW</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/opening-package" className="nav-link flex items-center gap-1">
                  개원의 패키지
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">HOT</span>
                </Link>
                <Link href="/buildings" className="nav-link">매물</Link>
                <Link href="/group-buying" className="nav-link hidden xl:block">공동구매</Link>
                <Link href="/map" className="nav-link">지도</Link>
              </nav>

              <div className="hidden lg:flex items-center gap-3">
                <Link href="/dashboard" className="nav-link flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  대시보드
                </Link>
                <Link href="/login" className="btn-ghost">로그인</Link>
                <Link href="/register" className="btn-primary">
                  무료 시작
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden btn-icon"
                aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav id="mobile-menu" className="lg:hidden border-t border-border bg-background animate-fade-in-down" aria-label="모바일 메뉴">
              <div className="px-4 py-4 space-y-2">
                <Link href="/simulate" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">📊</span>
                  <span>OpenSim - 개원 시뮬레이터</span>
                </Link>
                <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">🏥</span>
                  <span>매물 검색</span>
                </Link>
                <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">💊</span>
                  <span>PharmMatch - 약국 매칭</span>
                </Link>
                <Link href="/map" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">🗺️</span>
                  <span>지도</span>
                </Link>
                <Link href="/cost-calculator" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">🧮</span>
                  <span>개원 비용 계산기</span>
                </Link>
                <Link href="/opening-package" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">✨</span>
                  <span>개원의 패키지</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">HOT</span>
                </Link>
                <Link href="/#tools" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">🛠️</span>
                  <span>전체 도구 27종</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600/10 text-indigo-600 rounded">NEW</span>
                </Link>
                <div className="pt-4 border-t border-border space-y-2">
                  <Link href="/login" className="block w-full text-center py-3 text-foreground hover:bg-accent rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    로그인
                  </Link>
                  <Link href="/register" className="btn-primary w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                    무료로 시작하기
                  </Link>
                </div>
              </div>
            </nav>
          )}
        </header>

        {/* ===== 모바일 실시간 피드 롤링 배너 ===== */}
        <div className="fixed top-16 left-0 right-0 z-40 lg:hidden">
          <div className="bg-card/95 backdrop-blur-xl border-b border-border">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-3 py-2.5 overflow-hidden">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">실시간</span>
                </div>
                <div className="relative flex-1 overflow-hidden h-6">
                  {liveFeed.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.id}
                        className={`absolute inset-0 flex items-center gap-2 transition-all duration-500 ${
                          index === currentFeedIndex % liveFeed.length
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                        <span className="text-sm truncate">
                          <span className="font-medium">{item.message}</span>
                          <span className="text-muted-foreground"> · {item.location}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== HERO SECTION ===== */}
        <main id="main-content" role="main">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-10 lg:pt-0" aria-label="히어로 섹션">
          {/* 배경 지도 */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background z-10" />
            <KakaoMap
              center={{ lat: 37.5172, lng: 127.0473 }}
              level={8}
              markers={mapMarkers}
              className="w-full h-full opacity-50"
            />
          </div>

          {/* 실시간 활동 피드 - 좌측 (데스크톱) */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden lg:block">
            <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-4 w-72 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">실시간 활동</span>
              </div>
              <div className="space-y-3 max-h-80 overflow-hidden">
                {liveFeed.slice(0, 6).map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-500 ${
                        index === currentFeedIndex % 6 ? 'bg-accent scale-[1.02]' : 'opacity-60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.message}</p>
                        <p className="text-xs text-muted-foreground">{item.location} · {item.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
            <div className="text-center">
              {/* 뱃지 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3182f6]/10 mb-6 animate-fade-in backdrop-blur-sm">
                <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                <span className="text-sm font-medium">
                  지금 <span className="text-blue-500 font-bold">{platformStats.onlineNow}명</span>이 매물을 탐색 중
                </span>
              </div>

              {/* 메인 헤드라인 */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
                <span className="text-foreground">매일 3곳이 문을 닫습니다</span>
                <br />
                <span className="text-[#3182f6]">당신은 다릅니다</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up delay-100">
                연간 <span className="text-foreground font-semibold">1,000개</span> 이상의 의료기관이 폐업합니다.
                <br className="hidden sm:block" />
                메디플라톤의 데이터 분석으로 성공하는 개원을 시작하세요.
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-200">
                <Link href="/simulate" className="btn-primary btn-lg group text-lg px-8">
                  무료 시뮬레이션 시작
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/buildings" className="btn-outline btn-lg text-lg px-8">
                  <Eye className="w-5 h-5" />
                  매물 {platformStats.totalListings}개 보기
                </Link>
              </div>

              {/* 실시간 알림 배너 */}
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-emerald-500/8 rounded-full animate-fade-in delay-300 backdrop-blur-sm">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm">
                  방금 <span className="font-semibold text-green-600 dark:text-green-400">서울 강남구</span>에서 새 매물이 등록되었습니다
                </span>
              </div>
            </div>
          </div>

          {/* 스크롤 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </section>

        {/* ===== 협력사 로고 마키 ===== */}
        <section className="py-10 bg-card border-y border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <p className="text-center text-sm font-medium text-muted-foreground">
              금융·공공기관과 함께하는 신뢰의 파트너십
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-card to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-card to-transparent z-10" />
            <div className="flex animate-marquee gap-12 items-center">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex gap-12 items-center flex-shrink-0">
                  {Array.from({ length: 22 }, (_, i) => i + 1).map((n) => (
                    <img
                      key={`${setIdx}-${n}`}
                      src={`/assets/partners/partner-${String(n).padStart(2, '0')}.png`}
                      alt={`협력사 ${n}`}
                      className="h-10 md:h-12 object-contain opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 grayscale hover:grayscale-0"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 숫자 카운터 섹션 ===== */}
        <section className="py-16 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div ref={listingCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-[#3182f6]">
                  {listingCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">등록 매물</div>
              </div>
              <div ref={pharmacyCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-[#3182f6]">
                  {pharmacyCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">약국 양도 매물</div>
              </div>
              <div ref={matchCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-[#3182f6]">
                  {matchCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">누적 매칭 성사</div>
              </div>
              <div ref={memberCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-[#3182f6]">
                  {memberCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">가입 회원</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 실제 성과 섹션 ===== */}
        <section className="py-20 md:py-28 bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3182f6]/10 text-[#3182f6] text-sm font-medium mb-4">
                <Trophy className="w-4 h-4" />
                실제 성과로 증명합니다
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                숫자가 말하는 메디플라톤
              </h2>
            </div>

            {/* 성과 카드 — 통일된 디자인 */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  number: '5',
                  unit: '배',
                  color: 'text-[#3182f6]',
                  bgGlow: 'bg-[#3182f6]/5',
                  borderColor: 'border-[#3182f6]/20',
                  iconBg: 'bg-[#3182f6]',
                  icon: TrendingUp,
                  title: '8개월 만에 신환 5배 증가',
                  desc: '통합 마케팅(블로그·플레이스·카페) 전략으로 실제 파트너 병원이 달성한 신규 환자 유입 성과',
                  detail: '블로그 4,275명 구독자 확보',
                },
                {
                  number: '93.3',
                  unit: '점',
                  color: 'text-[#3182f6]',
                  bgGlow: 'bg-[#3182f6]/5',
                  borderColor: 'border-[#3182f6]/20',
                  iconBg: 'bg-[#3182f6]',
                  icon: Star,
                  title: '콘텐츠 만족도 최상급',
                  desc: '500명 대상 설문에서 "글이 감동적이어서 신뢰가 갔다"는 실제 환자 후기로 검증된 품질',
                  detail: '경쟁사 대비 만족도 1위',
                },
                {
                  number: '150',
                  unit: '+',
                  color: 'text-[#3182f6]',
                  bgGlow: 'bg-[#3182f6]/5',
                  borderColor: 'border-[#3182f6]/20',
                  iconBg: 'bg-[#3182f6]',
                  icon: Building2,
                  title: '개원 컨설팅 누적 실적',
                  desc: '입지 선정부터 인테리어·마케팅·대출까지 원스톱으로 지원. 각 분야 최고 전문가 네트워크',
                  detail: '전국 30+ 전문 파트너',
                },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className={`bg-card rounded-3xl p-8 border ${item.borderColor} hover:shadow-xl transition-all duration-300`}>
                    {/* 아이콘 + 숫자 */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`px-3 py-1 rounded-full ${item.bgGlow} ${item.color} text-xs font-semibold`}>
                        검증된 성과
                      </div>
                    </div>

                    {/* 핵심 숫자 */}
                    <div className="mb-4">
                      <span className={`text-6xl font-black ${item.color}`}>{item.number}</span>
                      <span className={`text-2xl font-bold ${item.color}`}>{item.unit}</span>
                    </div>

                    {/* 설명 */}
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.desc}</p>

                    {/* 하단 디테일 */}
                    <div className={`flex items-center gap-2 pt-4 border-t ${item.borderColor}`}>
                      <CheckCircle2 className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                      <span className="text-sm font-medium">{item.detail}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== 매물 바로가기 섹션 ===== */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                매물 바로가기
              </h2>
              <p className="text-muted-foreground">원하는 매물 유형을 선택하세요</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* 병원 매물 카드 */}
              <Link
                href="/buildings"
                className="group relative bg-card rounded-2xl p-6 md:p-8 hover:shadow-lg transition-all duration-200"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)' }}
              >
                <div className="flex items-start gap-4">
                  <TossIcon icon={Building2} color="from-blue-500 to-indigo-600" size="xl" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                        병원 매물
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600/10 text-blue-600 rounded-full">
                        {platformStats.activeBuildingListings}개
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      메디컬빌딩, 상가, 의원급 개원 공간
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                      <span>매물 보러가기</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* 약국 매물 카드 */}
              <Link
                href="/pharmacy-match"
                className="group relative bg-card rounded-2xl p-6 md:p-8 hover:shadow-lg transition-all duration-200"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)' }}
              >
                <div className="flex items-start gap-4">
                  <TossIcon icon={Pill} color="from-blue-500 to-indigo-600" size="xl" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-[#3182f6] transition-colors">
                        약국 매물
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-[#3182f6]/10 text-[#3182f6] rounded-full">
                        {platformStats.activePharmacyListings}개
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      약국 양도양수, 권리금 매물 정보
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-[#3182f6]">
                      <span>매물 보러가기</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== 인터랙티브 데모 섹션 ===== */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 text-sm font-medium mb-4">
                <span className="text-base">⚡</span>
                3분 만에 결과 확인
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                지금 바로 시뮬레이션 체험
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                주소와 진료과목을 입력하면 AI가 예상 매출을 분석합니다
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-3xl p-6 md:p-10" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                {/* 입력 폼 */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">개원 예정 주소</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={demoAddress}
                        onChange={(e) => setDemoAddress(e.target.value)}
                        placeholder="예: 서울시 강남구 역삼동"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">진료 과목</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {['내과', '정형외과', '피부과', '치과', '소아과', '안과'].map((spec) => (
                        <button
                          key={spec}
                          onClick={() => setDemoSpecialty(spec)}
                          className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                            demoSpecialty === spec
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-secondary hover:bg-accent'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={runDemo}
                  disabled={!demoAddress || demoLoading}
                  className="w-full btn-primary btn-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI가 분석 중...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      무료 분석 시작
                    </>
                  )}
                </button>

                {/* 결과 미리보기 */}
                {showDemoResult && (
                  <div className="mt-8 pt-8 border-t border-border animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">분석 완료!</span>
                      <span className="text-sm text-muted-foreground">
                        {demoAddress} · {demoSpecialty}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-[#3182f6]/5 rounded-2xl">
                        <div className="text-sm text-muted-foreground mb-1">예상 월 매출</div>
                        <div className="text-2xl font-bold text-[#3182f6]">{demoResults.monthlyRevenue}</div>
                      </div>
                      <div className="p-4 bg-[#3182f6]/5 rounded-2xl">
                        <div className="text-sm text-muted-foreground mb-1">손익분기점</div>
                        <div className="text-2xl font-bold text-[#3182f6]">{demoResults.breakEven}</div>
                      </div>
                      <div className="p-4 bg-[#3182f6]/5 rounded-2xl">
                        <div className="text-sm text-muted-foreground mb-1">개원 적합도</div>
                        <div className="text-2xl font-bold text-[#3182f6]">{demoResults.score}점</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                      <span className="text-sm text-muted-foreground">상세 분석 결과를 확인하세요</span>
                      <Link href="/simulate" className="btn-primary btn-sm">
                        전체 리포트 보기
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Before/After 비교 섹션 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                왜 메디플라톤인가요?
              </h2>
              <p className="text-muted-foreground">기존 방식과 비교해보세요</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Before */}
              <div className="p-8 bg-card rounded-3xl border border-border relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-sm font-medium rounded-full">
                  기존 방식
                </div>
                <div className="pt-8 space-y-6">
                  {[
                    { icon: Activity, title: '6개월 이상 정보 수집', desc: '발품 팔아 직접 상권 분석', gradient: 'from-gray-400 to-gray-500' },
                    { icon: DollarSign, title: '중개 수수료 500만원+', desc: '부동산 중개, 컨설팅 비용', gradient: 'from-gray-400 to-gray-500' },
                    { icon: X, title: '불확실한 예측', desc: '경험과 감에 의존한 판단', gradient: 'from-gray-400 to-gray-500' },
                    { icon: LineChart, title: '정보 비대칭', desc: '매물 정보 접근 어려움', gradient: 'from-gray-400 to-gray-500' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <TossIcon icon={item.icon} color={item.gradient} size="sm" className="flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* After */}
              <div className="p-8 bg-[#3182f6]/[0.03] rounded-3xl border border-[#3182f6]/20 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-[#3182f6] text-white text-sm font-medium rounded-full">
                  메디플라톤
                </div>
                <div className="pt-8 space-y-6">
                  {[
                    { icon: Sparkles, title: '3분 AI 분석', desc: '빅데이터 기반 즉시 분석', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
                    { icon: CheckCircle2, title: '시뮬레이션 무료', desc: '기본 분석 완전 무료 제공', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
                    { icon: BarChart3, title: '데이터 기반 예측', desc: '건강보험공단 데이터 활용', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
                    { icon: Building2, title: `${platformStats.totalListings}+ 매물 접근`, desc: '실시간 매물 정보 제공', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <TossIcon icon={item.icon} color={item.gradient} size="sm" shadow={item.shadow} className="flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 함께한 병원 로고 마키 ===== */}
        <section className="py-20 md:py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3182f6]/10 text-[#3182f6] text-sm font-medium mb-4">
                <Paintbrush className="w-4 h-4" />
                실제 개원 사례
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                메디플라톤이 함께한 병원들
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                입지 선정부터 인테리어, 마케팅까지 — 150곳 이상의 병원이 메디플라톤과 함께했습니다
              </p>
            </div>
          </div>

          {/* 1열: 왼쪽으로 흐르는 로고 */}
          <div className="relative mb-6">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex animate-marquee w-max">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-8 px-4">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                    <div
                      key={`r1-${setIdx}-${n}`}
                      className="flex-shrink-0 w-28 h-16 md:w-36 md:h-20 bg-card rounded-xl border border-border/50 flex items-center justify-center p-3 hover:border-[#3182f6]/30 hover:shadow-lg transition-all duration-300"
                    >
                      <img
                        src={`/assets/clients/client-${String(n).padStart(2, '0')}.png`}
                        alt={`파트너 병원 ${n}`}
                        className="max-w-full max-h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 2열: 오른쪽으로 흐르는 로고 (역방향) */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex animate-marquee-reverse w-max">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-8 px-4">
                  {Array.from({ length: 19 }, (_, i) => i + 21).map((n) => {
                    const ext = n >= 36 ? 'jpg' : 'png'
                    return (
                      <div
                        key={`r2-${setIdx}-${n}`}
                        className="flex-shrink-0 w-28 h-16 md:w-36 md:h-20 bg-card rounded-xl border border-border/50 flex items-center justify-center p-3 hover:border-[#3182f6]/30 hover:shadow-lg transition-all duration-300"
                      >
                        <img
                          src={`/assets/clients/client-${String(n).padStart(2, '0')}.${ext}`}
                          alt={`파트너 병원 ${n}`}
                          className="max-w-full max-h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 컨설팅 현장 섹션 ===== */}
        <section className="py-20 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 텍스트 */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
                  <Stethoscope className="w-4 h-4" />
                  현장에서 직접 뜁니다
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  오직 한 분의 원장님을 위해<br />
                  <span className="text-[#3182f6]">최고들이 모였습니다</span>
                </h2>
                <p className="text-white/60 text-lg mb-8 leading-relaxed">
                  메디플라톤은 책상 위의 컨설팅이 아닙니다. 직접 현장을 방문하고, 원장님과 마주 앉아 데이터를 분석하고, 카메라 앞에서 솔직한 이야기를 나눕니다.
                </p>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="text-3xl font-bold text-[#3182f6] mb-1">150+</div>
                    <div className="text-sm text-white/50">컨설팅 누적 건수</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#3182f6] mb-1">97%</div>
                    <div className="text-sm text-white/50">고객 만족도</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#3182f6] mb-1">8년</div>
                    <div className="text-sm text-white/50">의료 컨설팅 경력</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#3182f6] mb-1">30+</div>
                    <div className="text-sm text-white/50">전문 파트너 네트워크</div>
                  </div>
                </div>
                <Link href="/opening-package" className="btn-primary btn-lg text-lg">
                  개원 컨설팅 알아보기
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* 사진 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden">
                    <img src="/assets/consulting/doctor-interview.jpg" alt="원장 인터뷰 촬영" className="w-full aspect-[3/4] object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img src="/assets/consulting/consultation-2.jpg" alt="데이터 기반 상담" className="w-full aspect-[4/3] object-cover" />
                  </div>
                </div>
                <div className="space-y-3 pt-6">
                  <div className="rounded-2xl overflow-hidden">
                    <img src="/assets/consulting/doctor-meeting.jpg" alt="원장 미팅" className="w-full aspect-[4/3] object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img src="/assets/consulting/clinic-lobby.jpg" alt="병원 로비 촬영" className="w-full aspect-[3/4] object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 비디오 섹션 ===== */}
        <section className="py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                원장님들의 생생한 이야기
              </h2>
              <p className="text-muted-foreground">메디플라톤과 함께한 원장님들의 실제 경험담</p>
            </div>

            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video group cursor-pointer shadow-2xl">
              <img
                src="/assets/consulting/consultation-1.jpg"
                alt="원장 인터뷰 썸네일"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-[#3182f6] ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold text-lg">&ldquo;마케팅이 없으면 안 되더라&rdquo; — 파트너 원장 인터뷰</p>
                <p className="text-white/60 text-sm mt-1">개원 8개월 차, 신환 5배 달성까지의 여정</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 개원/개국 전문 도구 25종 ===== */}
        <section id="tools" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 text-sm font-medium mb-4">
                <span className="text-base">🛠️</span>
                27개 전문 도구 무료 제공
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                개원부터 운영까지, 필요한 모든 도구
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                비용 계산, 상권 분석, 인허가, 마케팅까지 — 개원 준비에 필요한 전문 도구를 한 곳에서 이용하세요
              </p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 justify-center mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {TOOL_CATS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setToolTab(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    toolTab === cat
                      ? 'bg-foreground text-background shadow-lg'
                      : 'bg-secondary hover:bg-accent text-foreground'
                  }`}
                >
                  {cat}
                  {cat !== '전체' && (
                    <span className="ml-1.5 text-xs opacity-60">
                      {ALL_TOOLS.filter(t => t.cat === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tools Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(toolTab === '전체' ? ALL_TOOLS : ALL_TOOLS.filter(t => t.cat === toolTab)).map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center gap-3.5 p-4 bg-card border border-border rounded-2xl hover:border-foreground/20 hover:shadow-lg transition-all duration-200"
                >
                  <TossIcon icon={tool.icon} color={tool.gradient} size="sm" shadow={tool.shadow} className="flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              ))}
            </div>

            {/* 건물주 도구 배너 */}
            <div className="mt-8 p-6 bg-[#3182f6]/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <TossIcon icon={Building2} color="from-blue-600 to-indigo-600" size="md" shadow="shadow-blue-500/25" className="flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">건물주 전용: 병원 입점 확률 시뮬레이터</h3>
                  <p className="text-sm text-muted-foreground">내 건물에 의료기관이 입점할 가능성을 22개 항목으로 분석</p>
                </div>
              </div>
              <Link href="/landlord-simulator" className="btn-primary btn-sm whitespace-nowrap">
                무료 분석 시작
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===== 지도 기반 매물 프리뷰 ===== */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                전국 {platformStats.totalListings}개 매물을 지도에서
              </h2>
              <p className="text-muted-foreground">원하는 지역의 매물을 한눈에 확인하세요</p>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl">
              <div className="h-[500px]">
                <KakaoMap
                  center={{ lat: 36.5, lng: 127.5 }}
                  level={12}
                  markers={mapMarkers}
                  className="w-full h-full"
                />
              </div>

              {/* 오버레이 정보 */}
              <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>병원 매물</span>
                    <span className="font-bold">{platformStats.activeBuildingListings}</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#3182f6]" />
                    <span>약국 매물</span>
                    <span className="font-bold">{platformStats.activePharmacyListings}</span>
                  </div>
                </div>
              </div>

              {/* CTA 오버레이 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Link href="/map" className="btn-primary btn-lg shadow-2xl">
                  <Globe className="w-5 h-5" />
                  지도에서 매물 탐색하기
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 최근 매칭 성공 사례 ===== */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                최근 매칭 성공 사례
              </h2>
              <p className="text-muted-foreground">실제 성사된 매칭 현황입니다</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentSuccessStories.slice(0, 8).map((story, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl leading-none">{story.type === '약국' ? '💊' : '🏥'}</span>
                    <div>
                      <p className="font-medium text-sm">{story.region}</p>
                      <p className="text-xs text-muted-foreground">{story.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">매칭 소요</span>
                    <span className="font-semibold text-green-600">{story.days}일</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 고객사 로고 그리드 ===== */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                전국 <span className="text-[#3182f6]">150+</span> 의료기관이 선택한 파트너
              </h2>
              <p className="text-muted-foreground">개원부터 운영까지, 함께 성장하는 병원들</p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 md:gap-6 items-center justify-items-center">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <div key={n} className="flex items-center justify-center p-2 rounded-xl hover:bg-secondary transition-colors">
                  <img
                    src={`/assets/clients/client-${String(n).padStart(2, '0')}.png`}
                    alt={`파트너 병원 ${n}`}
                    className="h-8 md:h-10 object-contain opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-[#3182f6] p-8 md:p-16">
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              </div>

              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  성공적인 개원, 지금 시작하세요
                </h2>
                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                  첫 시뮬레이션은 완전 무료입니다. AI가 분석한 데이터로 현명한 결정을 내리세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/simulate" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg text-lg">
                    무료 시뮬레이션
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg">
                    회원가입
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="py-16 border-t border-border" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
              <div className="lg:col-span-1">
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <img
                    src="/assets/logo/mediplaton-horizontal.png"
                    alt="MEDI-PLATON"
                    className="h-8 object-contain"
                  />
                </Link>
                <p className="text-muted-foreground mb-4 text-sm">
                  의료 개원의 모든 것을 연결하는 데이터 기반 통합 플랫폼
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">서비스</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="/simulate" className="hover:text-foreground transition-colors">OpenSim</Link></li>
                  <li><Link href="/buildings" className="hover:text-foreground transition-colors">매물 검색</Link></li>
                  <li><Link href="/pharmacy-match" className="hover:text-foreground transition-colors">PharmMatch</Link></li>
                  <li><Link href="/map" className="hover:text-foreground transition-colors">지도</Link></li>
                  <li><Link href="/landlord-simulator" className="hover:text-foreground transition-colors">입점 확률 분석</Link></li>
                  <li><Link href="/opening-package" className="hover:text-foreground transition-colors">개원의 패키지</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">개원 도구</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="/cost-calculator" className="hover:text-foreground transition-colors">비용 계산기</Link></li>
                  <li><Link href="/bep-analyzer" className="hover:text-foreground transition-colors">BEP 분석기</Link></li>
                  <li><Link href="/checklist" className="hover:text-foreground transition-colors">체크리스트</Link></li>
                  <li><Link href="/emr-compare" className="hover:text-foreground transition-colors">EMR 비교</Link></li>
                  <li><Link href="/#tools" className="hover:text-foreground transition-colors">전체 도구 보기 →</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">사용자별</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="/buildings" className="hover:text-foreground transition-colors">의사</Link></li>
                  <li><Link href="/pharmacy-match" className="hover:text-foreground transition-colors">약사</Link></li>
                  <li><Link href="/landlord" className="hover:text-foreground transition-colors">건물주</Link></li>
                  <li><Link href="/partners" className="hover:text-foreground transition-colors">파트너사</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">고객지원</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="/help" className="hover:text-foreground transition-colors">도움말</Link></li>
                  <li><Link href="/contact" className="hover:text-foreground transition-colors">문의하기</Link></li>
                  <li><Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link></li>
                  <li><Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} 메디플라톤. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <p>의료 개원의 모든 것을 연결합니다</p>
                <Link href="/admin" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">관리자</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
