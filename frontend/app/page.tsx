'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import OnboardingModal, { useOnboarding } from '@/components/onboarding/OnboardingModal'
import { platformStats, generateActivityFeed, recentSuccessStories } from '@/lib/data/seedListings'
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

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
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

    // 초기 마커 설정
    const initialMarkers = [
      { id: '1', lat: 37.5007, lng: 127.0365, title: '역삼동 메디컬빌딩', type: 'hospital' as const },
      { id: '2', lat: 37.3825, lng: 127.1190, title: '분당 약국', type: 'pharmacy' as const },
      { id: '3', lat: 37.5133, lng: 127.0846, title: '잠실 상가', type: 'hospital' as const },
      { id: '4', lat: 37.5496, lng: 126.9138, title: '합정동 빌딩', type: 'hospital' as const },
      { id: '5', lat: 37.5219, lng: 126.9245, title: '여의도 약국', type: 'pharmacy' as const },
    ]
    setMapMarkers(initialMarkers)
  }, [])

  // 피드 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeedIndex((prev) => (prev + 1) % liveFeed.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [liveFeed.length])

  // 마커 애니메이션 (새 마커 추가)
  useEffect(() => {
    const interval = setInterval(() => {
      const regions = [
        { lat: 37.5172, lng: 127.0473 }, // 강남
        { lat: 37.4919, lng: 127.0076 }, // 서초
        { lat: 37.5656, lng: 126.9247 }, // 연남
        { lat: 37.5387, lng: 127.1234 }, // 천호
        { lat: 35.1587, lng: 129.1603 }, // 해운대
      ]
      const region = regions[Math.floor(Math.random() * regions.length)]
      const newMarker = {
        id: Date.now().toString(),
        lat: region.lat + (Math.random() - 0.5) * 0.02,
        lng: region.lng + (Math.random() - 0.5) * 0.02,
        title: '새 매물',
        type: Math.random() > 0.7 ? 'pharmacy' as const : 'hospital' as const,
      }
      setMapMarkers((prev) => [...prev.slice(-20), newMarker])
    }, 4000)
    return () => clearInterval(interval)
  }, [])

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
        <header className="fixed top-0 left-0 right-0 z-50 glass">
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
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">더 보기</p>
                          <div className="space-y-1">
                            <Link href="/map" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <Globe className="w-5 h-5 text-cyan-500" />
                              <span className="text-sm">지도로 매물 보기</span>
                            </Link>
                            <Link href="/prospects" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <Target className="w-5 h-5 text-orange-500" />
                              <span className="text-sm">SalesScanner</span>
                            </Link>
                            <Link href="/partners" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                              <Link2 className="w-5 h-5 text-indigo-500" />
                              <span className="text-sm">파트너사</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/buildings" className="nav-link">매물</Link>
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

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden btn-icon">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border bg-background animate-fade-in-down">
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
                <div className="pt-4 border-t border-border space-y-2">
                  <Link href="/login" className="block w-full text-center py-3 text-foreground hover:bg-accent rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    로그인
                  </Link>
                  <Link href="/register" className="btn-primary w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                    무료로 시작하기
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ===== HERO SECTION - 풀스크린 지도 배경 ===== */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

          {/* 실시간 활동 피드 - 좌측 */}
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
                  center={{ lat: 37.5172, lng: 127.0473 }}
                  level={9}
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

        {/* ===== FOOTER ===== */}
        <footer className="py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
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
              <p>의료 개원의 모든 것을 연결합니다</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
