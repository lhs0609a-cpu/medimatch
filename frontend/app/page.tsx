import Link from 'next/link'
import { ArrowRight, Building2, LineChart, Pill, MapPin, Users, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MediMatch</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/simulate" className="text-gray-600 hover:text-primary-600 transition">
              OpenSim
            </Link>
            <Link href="/prospects" className="text-gray-600 hover:text-primary-600 transition">
              SalesScanner
            </Link>
            <Link href="/pharmacy" className="text-gray-600 hover:text-primary-600 transition">
              PharmMatch
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-primary-600 transition">
              로그인
            </Link>
            <Link
              href="/register"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              무료 시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            의료 개원의 모든 것,<br />
            <span className="text-primary-600">데이터로 연결합니다</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            의사, 약사, 영업사원, 부동산까지<br />
            의료 개원 생태계의 모든 이해관계자를 연결하는 통합 플랫폼
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/simulate"
              className="bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
            >
              3분 시뮬레이션 시작
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium hover:border-primary-600 hover:text-primary-600 transition"
            >
              데모 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            MediMatch 플랫폼
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            의료 개원에 필요한 모든 데이터와 서비스를 하나의 플랫폼에서 제공합니다
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* OpenSim Card */}
            <Link href="/simulate" className="group">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 card-hover">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <LineChart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">OpenSim</h3>
                <p className="text-gray-600 mb-4">
                  주소와 진료과목만 입력하면 3분 만에 예상 매출, 비용, 손익분기점을 분석해드립니다.
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                  시뮬레이션 시작
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <span className="text-sm text-gray-500">리포트 건당 3만원</span>
                </div>
              </div>
            </Link>

            {/* SalesScanner Card */}
            <Link href="/prospects" className="group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 card-hover">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mb-6">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">SalesScanner</h3>
                <p className="text-gray-600 mb-4">
                  신축 건물, 폐업 공실 등 개원 가능 위치를 실시간으로 탐지하고 알림을 받으세요.
                </p>
                <div className="flex items-center text-green-600 font-medium group-hover:gap-2 transition-all">
                  개원지 탐색
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
                <div className="mt-4 pt-4 border-t border-green-100">
                  <span className="text-sm text-gray-500">월 구독 3~5만원/ID</span>
                </div>
              </div>
            </Link>

            {/* PharmMatch Card */}
            <Link href="/pharmacy" className="group">
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100 card-hover">
                <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <Pill className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">PharmMatch</h3>
                <p className="text-gray-600 mb-4">
                  독점 약국 자리에 입찰하고, 처방전 예측 데이터로 최적의 개국 위치를 찾으세요.
                </p>
                <div className="flex items-center text-purple-600 font-medium group-hover:gap-2 transition-all">
                  약국 자리 찾기
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
                <div className="mt-4 pt-4 border-t border-purple-100">
                  <span className="text-sm text-gray-500">매칭 수수료 권리금 3~5%</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-primary-400 mb-2">50,000+</div>
              <div className="text-gray-400">등록 의료기관</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">1,200+</div>
              <div className="text-gray-400">매칭 성사</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">85%</div>
              <div className="text-gray-400">예측 정확도</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">3분</div>
              <div className="text-gray-400">시뮬레이션 완료</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            어떻게 작동하나요?
          </h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">주소 입력</h3>
              <p className="text-gray-600 text-sm">개원 예정 주소와 진료과목을 입력합니다</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">데이터 분석</h3>
              <p className="text-gray-600 text-sm">공공데이터와 AI가 상권, 경쟁, 인구를 분석합니다</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">결과 확인</h3>
              <p className="text-gray-600 text-sm">예상 매출, 비용, ROI를 한눈에 확인합니다</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">매물 연결</h3>
              <p className="text-gray-600 text-sm">조건에 맞는 실제 매물과 바로 연결됩니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            3분이면 충분합니다. 데이터 기반의 정확한 개원 분석을 경험해보세요.
          </p>
          <Link
            href="/simulate"
            className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-100 transition gap-2"
          >
            무료 시뮬레이션 시작
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="text-xl font-bold text-white">MediMatch</span>
              </div>
              <p className="text-sm">
                의료 개원 통합 솔루션<br />
                플라톤마케팅 × 부공연 협업 프로젝트
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/simulate" className="hover:text-white transition">OpenSim</Link></li>
                <li><Link href="/prospects" className="hover:text-white transition">SalesScanner</Link></li>
                <li><Link href="/pharmacy" className="hover:text-white transition">PharmMatch</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white transition">도움말</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">자주 묻는 질문</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">문의하기</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">법적고지</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white transition">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2025 MediMatch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
