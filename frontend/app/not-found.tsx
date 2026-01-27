import Link from 'next/link'
import { Home, Search, ArrowLeft, MapPin, Building2, Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 아이콘 */}
        <div className="relative mb-8">
          <div className="text-[150px] font-bold text-primary/10 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* 메시지 */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-muted-foreground mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          주소를 다시 확인해주세요.
        </p>

        {/* 메인 액션 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 페이지
          </button>
        </div>

        {/* 추천 링크 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">
            이런 페이지는 어떠세요?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/simulate"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">개원 시뮬레이션</p>
                <p className="text-xs text-muted-foreground">AI 분석</p>
              </div>
            </Link>
            <Link
              href="/buildings"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">매물 찾기</p>
                <p className="text-xs text-muted-foreground">입점 건물</p>
              </div>
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">지도 보기</p>
                <p className="text-xs text-muted-foreground">전국 데이터</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 문의 */}
        <p className="mt-8 text-sm text-muted-foreground">
          문제가 계속되면{' '}
          <Link href="/contact" className="text-primary hover:underline">
            고객센터
          </Link>
          로 문의해주세요.
        </p>
      </div>
    </div>
  )
}
