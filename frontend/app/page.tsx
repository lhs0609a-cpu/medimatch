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
  Briefcase,
  Link2,
  MessageSquare,
  Shield,
  TrendingUp,
  Zap,
  Check,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Play,
  Bell,
  Search,
  Globe,
  Stethoscope,
  Home,
  DollarSign,
  Clock,
  Target,
  Award,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Timer,
  TrendingDown,
  Wallet,
  Phone,
  Star,
  Activity,
  Eye,
  Heart,
  MousePointerClick
} from 'lucide-react'

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

const ALL_TOOLS: { name: string; href: string; cat: string; desc: string; Icon: typeof Building2; c: string }[] = [
  // 재무/분석 (8)
  { name: '개원 비용 계산기', href: '/cost-calculator', cat: '재무/분석', desc: '진료과별 초기비용 산출', Icon: DollarSign, c: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { name: 'BEP 분석기', href: '/bep-analyzer', cat: '재무/분석', desc: '손익분기점 시뮬레이션', Icon: TrendingUp, c: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { name: '진료과별 트렌드', href: '/trend-report', cat: '재무/분석', desc: '6년 개원 트렌드 분석', Icon: BarChart3, c: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  { name: '상권 인구통계', href: '/demographics', cat: '재무/분석', desc: '연령·소득·인구 분석', Icon: Users, c: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
  { name: '개원 vs 인수', href: '/open-vs-acquire', cat: '재무/분석', desc: '비용/리스크 비교', Icon: Target, c: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { name: '대출/금융 비교', href: '/loan-compare', cat: '재무/분석', desc: '20+ 금융상품 비교', Icon: Wallet, c: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  { name: '보험 비교', href: '/insurance-compare', cat: '재무/분석', desc: '의료인 보험 비교', Icon: Shield, c: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { name: '병원 벤치마크', href: '/benchmark', cat: '재무/분석', desc: '매출/환자수 비교', Icon: Star, c: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  // 개원 준비 (7)
  { name: '개원 체크리스트', href: '/checklist', cat: '개원 준비', desc: '단계별 타임라인', Icon: CheckCircle2, c: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { name: '인허가 가이드', href: '/license-guide', cat: '개원 준비', desc: '의원 개설 절차 안내', Icon: Shield, c: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { name: '동선 설계', href: '/floor-plan', cat: '개원 준비', desc: '진료과별 평면 설계', Icon: MapPin, c: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
  { name: 'EMR 비교', href: '/emr-compare', cat: '개원 준비', desc: '전자차트 시스템 비교', Icon: LayoutDashboard, c: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  { name: '의료기기 비교', href: '/equipment', cat: '개원 준비', desc: '장비 견적/중고 매물', Icon: Briefcase, c: 'text-gray-600 bg-gray-100 dark:bg-gray-800/50' },
  { name: '인테리어 견적', href: '/interior', cat: '개원 준비', desc: '진료과별 비용 산출', Icon: Home, c: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
  { name: '세무/회계사 매칭', href: '/tax-advisor', cat: '개원 준비', desc: '의료 전문 세무사', Icon: Wallet, c: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' },
  // 운영/마케팅 (5)
  { name: '마케팅 패키지', href: '/marketing', cat: '운영/마케팅', desc: '개원 마케팅 전략', Icon: Sparkles, c: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
  { name: '보험 청구 최적화', href: '/insurance-billing', cat: '운영/마케팅', desc: '건강보험 삭감 방지', Icon: Heart, c: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  { name: '리뷰/평판 관리', href: '/reputation', cat: '운영/마케팅', desc: '온라인 평판 모니터링', Icon: Award, c: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { name: '수가 시뮬레이터', href: '/fee-simulator', cat: '운영/마케팅', desc: '진료과별 수가 계산', Icon: Activity, c: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { name: '경영 모니터링', href: '/operations', cat: '운영/마케팅', desc: '매출/환자 갭 분석', Icon: BarChart3, c: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  // 약국 전용 (5)
  { name: '처방전 유입 예측', href: '/pharmacy-forecast', cat: '약국 전용', desc: '인근 병원 기반 추정', Icon: Target, c: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' },
  { name: '약국 개국 비용', href: '/pharmacy-cost', cat: '약국 전용', desc: '입지별 초기비용 산출', Icon: Pill, c: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { name: '도매상 가격 비교', href: '/wholesale-compare', cat: '약국 전용', desc: '40+ 약품 가격 비교', Icon: Search, c: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
  { name: 'OTC/건기식 전략', href: '/otc-strategy', cat: '약국 전용', desc: '비처방 매출 전략', Icon: Zap, c: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { name: '약국 벤치마크', href: '/pharmacy-benchmark', cat: '약국 전용', desc: '규모별 경영 비교', Icon: Activity, c: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  // 법률/계약 (2)
  { name: '법률 Q&A', href: '/legal', cat: '법률/계약', desc: '의료법/노동법 자문', Icon: Shield, c: 'text-slate-600 bg-slate-100 dark:bg-slate-800/50' },
  { name: '계약서 템플릿', href: '/contract-templates', cat: '법률/계약', desc: '임대/동업/근로 계약서', Icon: Eye, c: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
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
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] p-6 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in-down"
                      onMouseLeave={() => setServicesOpen(false)}
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">핵심 서비스</p>
                          <div className="space-y-1">
                            <Link href="/opening-package" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 group">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground group-hover:text-orange-600">개원의 패키지</p>
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
                            <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
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
                              <DollarSign className="w-5 h-5 text-blue-500" />
                              <span className="text-sm">개원 비용 계산기</span>
                            </Link>
                            <Link href="/bep-analyzer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <TrendingUp className="w-5 h-5 text-green-500" />
                              <span className="text-sm">BEP 분석기</span>
                            </Link>
                            <Link href="/checklist" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              <span className="text-sm">개원 체크리스트</span>
                            </Link>
                            <Link href="/#tools" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <Sparkles className="w-5 h-5 text-indigo-500" />
                              <span className="text-sm">전체 도구 27종 보기</span>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded">NEW</span>
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
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span>OpenSim - 개원 시뮬레이터</span>
                </Link>
                <Link href="/buildings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <Building2 className="w-5 h-5 text-green-500" />
                  <span>매물 검색</span>
                </Link>
                <Link href="/pharmacy-match" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <Pill className="w-5 h-5 text-purple-500" />
                  <span>PharmMatch - 약국 매칭</span>
                </Link>
                <Link href="/map" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <Globe className="w-5 h-5 text-cyan-500" />
                  <span>지도</span>
                </Link>
                <Link href="/cost-calculator" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  <span>개원 비용 계산기</span>
                </Link>
                <Link href="/opening-package" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30" onClick={() => setMobileMenuOpen(false)}>
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <span>개원의 패키지</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">HOT</span>
                </Link>
                <Link href="/#tools" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <span>전체 도구 27종</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded">NEW</span>
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

        {/* ===== HERO SECTION - 풀스크린 지도 배경 ===== */}
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6 animate-fade-in backdrop-blur-sm">
                <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                <span className="text-sm font-medium">
                  지금 <span className="text-blue-500 font-bold">{platformStats.onlineNow}명</span>이 매물을 탐색 중
                </span>
              </div>

              {/* 메인 헤드라인 */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
                <span className="text-foreground">지금 이 순간에도</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {platformStats.todayNewListings}개의 기회
                </span>
                <span className="text-foreground">가</span>
                <br />
                <span className="text-foreground">발생하고 있습니다</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up delay-100">
                AI 기반 개원 분석부터 매물 검색, 약국 매칭까지
                <br className="hidden sm:block" />
                의료 개원의 모든 것을 한 곳에서
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-200">
                <Link href="/simulate" className="btn-primary btn-lg group shadow-xl shadow-blue-500/30 text-lg px-8">
                  무료 시뮬레이션 시작
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/buildings" className="btn-outline btn-lg text-lg px-8">
                  <Eye className="w-5 h-5" />
                  매물 {platformStats.totalListings}개 보기
                </Link>
              </div>

              {/* 실시간 알림 배너 */}
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full animate-fade-in delay-300">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm">
                  방금 <span className="font-semibold text-green-600">서울 강남구</span>에서 새 매물이 등록되었습니다
                </span>
              </div>
            </div>
          </div>

          {/* 스크롤 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </section>

        {/* ===== 숫자 카운터 섹션 ===== */}
        <section className="py-16 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div ref={listingCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {listingCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">등록 매물</div>
              </div>
              <div ref={pharmacyCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {pharmacyCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">약국 양도 매물</div>
              </div>
              <div ref={matchCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {matchCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">누적 매칭 성사</div>
              </div>
              <div ref={memberCount.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  {memberCount.count.toLocaleString()}
                </div>
                <div className="text-white/60 text-sm md:text-base">가입 회원</div>
              </div>
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
                className="group relative bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                        병원 매물
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
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
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>

              {/* 약국 매물 카드 */}
              <Link
                href="/pharmacy-match"
                className="group relative bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25">
                    <Pill className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-purple-600 transition-colors">
                        약국 매물
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full">
                        {platformStats.activePharmacyListings}개
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      약국 양도양수, 권리금 매물 정보
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                      <span>매물 보러가기</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===== 인터랙티브 데모 섹션 ===== */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
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
              <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-2xl">
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
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20">
                        <div className="text-sm text-muted-foreground mb-1">예상 월 매출</div>
                        <div className="text-2xl font-bold text-blue-600">{demoResults.monthlyRevenue}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20">
                        <div className="text-sm text-muted-foreground mb-1">손익분기점</div>
                        <div className="text-2xl font-bold text-green-600">{demoResults.breakEven}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl border border-orange-500/20">
                        <div className="text-sm text-muted-foreground mb-1">개원 적합도</div>
                        <div className="text-2xl font-bold text-orange-600">{demoResults.score}점</div>
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
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">6개월 이상 정보 수집</h4>
                      <p className="text-sm text-muted-foreground">발품 팔아 직접 상권 분석</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">중개 수수료 500만원+</h4>
                      <p className="text-sm text-muted-foreground">부동산 중개, 컨설팅 비용</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">불확실한 예측</h4>
                      <p className="text-sm text-muted-foreground">경험과 감에 의존한 판단</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">정보 비대칭</h4>
                      <p className="text-sm text-muted-foreground">매물 정보 접근 어려움</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl border-2 border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">
                  메디플라톤
                </div>
                <div className="pt-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">3분 AI 분석</h4>
                      <p className="text-sm text-muted-foreground">빅데이터 기반 즉시 분석</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">시뮬레이션 무료</h4>
                      <p className="text-sm text-muted-foreground">기본 분석 완전 무료 제공</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">데이터 기반 예측</h4>
                      <p className="text-sm text-muted-foreground">건강보험공단 데이터 활용</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{platformStats.totalListings}+ 매물 접근</h4>
                      <p className="text-sm text-muted-foreground">실시간 매물 정보 제공</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 개원/개국 전문 도구 25종 ===== */}
        <section id="tools" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
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
                  className="group flex items-start gap-3 p-4 bg-card border border-border rounded-2xl hover:border-foreground/20 hover:shadow-lg transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tool.c}`}>
                    <tool.Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>

            {/* 건물주 도구 배너 */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
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
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      story.type === '약국'
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {story.type === '약국' ? (
                        <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
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

        {/* ===== CTA SECTION ===== */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-16">
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
                <Link href="/" className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <span className="font-bold text-xl">메디플라톤</span>
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
