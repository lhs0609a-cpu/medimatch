'use client'

import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  Pill,
  Users,
  Calendar,
  Building2,
  ArrowRight,
  ChevronRight,
  Download,
  RefreshCw,
  Filter,
  Brain,
  Sparkles,
  Zap,
  Activity,
  Target,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingCart,
} from 'lucide-react'

/* ─── 더미 데이터 ─── */
const overviewStats = {
  monthlyRevenue: 28450000,
  monthlyRevenueChange: 12.5,
  monthlyPrescriptions: 842,
  monthlyPrescriptionsChange: 8.3,
  avgDispensingTime: 4.2,
  avgDispensingTimeChange: -15.0,
  returnRate: 2.1,
  returnRateChange: -0.3,
}

const dailyRevenue = [
  { day: '월', revenue: 1450000, count: 45 },
  { day: '화', revenue: 1280000, count: 38 },
  { day: '수', revenue: 1620000, count: 52 },
  { day: '목', revenue: 1380000, count: 41 },
  { day: '금', revenue: 1550000, count: 48 },
  { day: '토', revenue: 980000, count: 32 },
  { day: '일', revenue: 0, count: 0 },
]

const monthlyTrend = [
  { month: '8월', revenue: 24100000, count: 720 },
  { month: '9월', revenue: 24800000, count: 745 },
  { month: '10월', revenue: 25300000, count: 762 },
  { month: '11월', revenue: 26100000, count: 790 },
  { month: '12월', revenue: 25800000, count: 780 },
  { month: '1월', revenue: 28450000, count: 842 },
]

const clinicStats = [
  { name: '메디매치내과', prescriptions: 456, revenue: 15240000, share: 53.5, change: 5.2 },
  { name: '하나이비인후과', prescriptions: 234, revenue: 8120000, share: 28.5, change: 12.8 },
  { name: '강남정형외과', prescriptions: 152, revenue: 5090000, share: 17.9, change: -2.1 },
]

const topDrugs = [
  { name: '메트포르민정 500mg', count: 2400, revenue: 228000, trend: 5.2 },
  { name: '암로디핀정 5mg', count: 1800, revenue: 360000, trend: 3.1 },
  { name: '아목시실린캡슐 500mg', count: 1560, revenue: 436800, trend: 8.5 },
  { name: '이부프로펜정 200mg', count: 1350, revenue: 162000, trend: -2.3 },
  { name: '아토르바스타틴정 20mg', count: 1200, revenue: 240000, trend: 1.8 },
  { name: '레보세티리진정 5mg', count: 980, revenue: 127400, trend: 15.2 },
  { name: '타이레놀정 500mg', count: 850, revenue: 59500, trend: -5.1 },
  { name: '오메프라졸캡슐 20mg', count: 720, revenue: 158400, trend: 4.3 },
]

const hourlyData = [
  { hour: '09', count: 8 },
  { hour: '10', count: 15 },
  { hour: '11', count: 22 },
  { hour: '12', count: 12 },
  { hour: '13', count: 18 },
  { hour: '14', count: 25 },
  { hour: '15', count: 20 },
  { hour: '16', count: 16 },
  { hour: '17', count: 10 },
  { hour: '18', count: 5 },
]

const aiInsights = [
  { title: '오전 피크타임 분석', description: '11시~12시 처방 집중도가 35% 높음. 이 시간대 조제 인력 보강 권고', impact: '조제 대기시간 2분 단축 가능', type: 'optimization' as const },
  { title: '하나이비인후과 성장세', description: '전월 대비 처방 12.8% 증가. 알레르기 시즌 효과로 3월까지 지속 전망', impact: '월 매출 ₩100만 추가 예상', type: 'growth' as const },
  { title: '이부프로펜 재고 최적화', description: '월 사용량 대비 과다 발주 패턴 감지. 발주량 20% 감소 가능', impact: '월 ₩32,000 절감', type: 'cost' as const },
]

const feeSchedule = [
  { item: '조제기본료', current: '₩6,000', updated: '₩6,200', changeDate: '2024-04-01', change: '+3.3%' },
  { item: '복약지도료(기본)', current: '₩1,200', updated: '₩1,200', changeDate: '-', change: '변동없음' },
  { item: '약학관리료', current: '₩2,800', updated: '₩3,100', changeDate: '2024-04-01', change: '+10.7%' },
  { item: '의약품관리료', current: '₩850', updated: '₩900', changeDate: '2024-04-01', change: '+5.9%' },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.revenue))
  const maxMonthlyRevenue = Math.max(...monthlyTrend.map(d => d.revenue))
  const maxHourlyCount = Math.max(...hourlyData.map(d => d.count))

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">경영분석</h1>
          <p className="text-sm text-muted-foreground mt-1">약국 매출, 처방 트렌드, AI 인사이트</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
              </button>
            ))}
          </div>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Download className="w-3.5 h-3.5" /> 리포트
          </button>
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">월 매출</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">₩{(overviewStats.monthlyRevenue / 10000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">만</span></div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">+{overviewStats.monthlyRevenueChange}%</span>
            <span className="text-2xs text-muted-foreground">전월비</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">월 처방건수</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{overviewStats.monthlyPrescriptions}</div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">+{overviewStats.monthlyPrescriptionsChange}%</span>
            <span className="text-2xs text-muted-foreground">전월비</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">평균 조제시간</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{overviewStats.avgDispensingTime}<span className="text-sm font-normal text-muted-foreground">분</span></div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowDownRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">{overviewStats.avgDispensingTimeChange}%</span>
            <span className="text-2xs text-muted-foreground">단축</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">재방문율</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{100 - overviewStats.returnRate}%</div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">+{Math.abs(overviewStats.returnRateChange)}%p</span>
            <span className="text-2xs text-muted-foreground">개선</span>
          </div>
        </div>
      </div>

      {/* AI 인사이트 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI 경영 인사이트</h3>
            <p className="text-2xs text-muted-foreground">데이터 기반 운영 최적화 제안</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiInsights.map((insight, i) => (
            <div key={i} className={`p-4 rounded-xl border ${
              insight.type === 'optimization' ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' :
              insight.type === 'growth' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10' :
              'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {insight.type === 'optimization' ? <Target className="w-4 h-4 text-blue-500" /> :
                 insight.type === 'growth' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                 <ShoppingCart className="w-4 h-4 text-amber-500" />}
                <span className="text-sm font-semibold">{insight.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
              <div className={`text-2xs font-semibold ${
                insight.type === 'optimization' ? 'text-blue-600' :
                insight.type === 'growth' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                <Sparkles className="w-3 h-3 inline mr-1" />
                {insight.impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 매출 차트 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">이번 주 매출</h3>
            <span className="text-xs text-muted-foreground">단위: 만원</span>
          </div>
          <div className="flex items-end gap-2 h-48">
            {dailyRevenue.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-2xs text-muted-foreground font-medium">
                  {day.revenue > 0 ? `${(day.revenue / 10000).toFixed(0)}` : '-'}
                </span>
                <div className="w-full relative" style={{ height: '140px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                      i === 2 ? 'bg-purple-500' : day.revenue > 0 ? 'bg-purple-200 dark:bg-purple-800/50' : 'bg-secondary'
                    }`}
                    style={{ height: `${day.revenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 5}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${i === 2 ? 'text-purple-600' : 'text-muted-foreground'}`}>{day.day}</span>
                <span className="text-2xs text-muted-foreground">{day.count}건</span>
              </div>
            ))}
          </div>
        </div>

        {/* 월별 트렌드 차트 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">월별 매출 트렌드</h3>
            <span className="text-xs text-muted-foreground">최근 6개월</span>
          </div>
          <div className="flex items-end gap-3 h-48">
            {monthlyTrend.map((month, i) => {
              const isLatest = i === monthlyTrend.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-2xs text-muted-foreground font-medium">
                    {(month.revenue / 10000).toFixed(0)}
                  </span>
                  <div className="w-full relative" style={{ height: '140px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                        isLatest ? 'bg-purple-500' : 'bg-purple-200 dark:bg-purple-800/50'
                      }`}
                      style={{ height: `${(month.revenue / maxMonthlyRevenue) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isLatest ? 'text-purple-600' : 'text-muted-foreground'}`}>{month.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 의원별 통계 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">연동 의원별 실적</h3>
            <button className="text-2xs text-purple-600 font-medium hover:underline">상세보기</button>
          </div>
          <div className="space-y-4">
            {clinicStats.map((clinic, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{clinic.name}</span>
                      <div className="text-2xs text-muted-foreground">{clinic.prescriptions}건 · ₩{(clinic.revenue / 10000).toFixed(0)}만</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{clinic.share}%</div>
                    <div className={`flex items-center gap-0.5 text-2xs ${clinic.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {clinic.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(clinic.change)}%
                    </div>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${clinic.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간대별 처방 분포 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">시간대별 처방 분포</h3>
            <span className="text-2xs text-muted-foreground">오늘 기준</span>
          </div>
          <div className="flex items-end gap-1.5 h-40">
            {hourlyData.map((h, i) => {
              const isPeak = h.count === maxHourlyCount
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-2xs text-muted-foreground">{h.count}</span>
                  <div className="w-full relative" style={{ height: '100px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t transition-all ${
                        isPeak ? 'bg-purple-500' : 'bg-purple-200 dark:bg-purple-800/50'
                      }`}
                      style={{ height: `${(h.count / maxHourlyCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-2xs text-muted-foreground">{h.hour}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-xs text-purple-600">
            <Zap className="w-3 h-3 inline mr-1" />
            피크타임: <strong>14시</strong> (25건) — 조제 인력 배치 최적화 권고
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 처방 상위 약품 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">상위 처방 약품 (이번 달)</h3>
            <button className="text-2xs text-purple-600 font-medium hover:underline">전체보기</button>
          </div>
          <div className="space-y-2">
            {topDrugs.map((drug, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-2xs font-bold ${
                  i < 3 ? 'bg-purple-500 text-white' : 'bg-secondary text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{drug.name}</div>
                  <div className="text-2xs text-muted-foreground">{drug.count.toLocaleString()}개 조제</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium">₩{(drug.revenue / 10000).toFixed(1)}만</div>
                  <div className={`text-2xs ${drug.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {drug.trend >= 0 ? '+' : ''}{drug.trend}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 수가 업데이트 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">약국 수가표 업데이트</h3>
            <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-2xs font-semibold text-amber-600">개정 예정</span>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_80px_80px_80px_70px] gap-2 px-3 py-2 text-2xs font-medium text-muted-foreground bg-secondary/30 rounded-lg">
              <div>항목</div>
              <div className="text-right">현행</div>
              <div className="text-right">개정</div>
              <div className="text-center">시행일</div>
              <div className="text-right">변동</div>
            </div>
            {feeSchedule.map((fee, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px_80px_70px] gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors items-center">
                <div className="text-sm font-medium">{fee.item}</div>
                <div className="text-sm text-right text-muted-foreground">{fee.current}</div>
                <div className="text-sm text-right font-medium">{fee.updated}</div>
                <div className="text-2xs text-center text-muted-foreground">{fee.changeDate}</div>
                <div className={`text-2xs text-right font-semibold ${fee.change.includes('+') ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {fee.change}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-xs text-emerald-700 dark:text-emerald-400">
            <Sparkles className="w-3 h-3 inline mr-1" />
            2024년 4월 수가 개정 시 예상 월 매출 증가: <strong>₩42만원 (+1.5%)</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
