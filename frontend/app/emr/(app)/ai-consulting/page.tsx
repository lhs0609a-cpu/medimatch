'use client'

import { useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  Target,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Building2,
  Shield,
  Zap,
  PieChart,
  Activity,
  Brain,
  Calculator,
  FileText,
  Star,
  Wallet,
  Receipt,
} from 'lucide-react'

/* ─── 타입 ─── */
type InsightType = 'growth' | 'warning' | 'saving' | 'optimization'
type TimeRange = '1m' | '3m' | '6m' | '1y'

interface AIInsight {
  id: string
  type: InsightType
  title: string
  description: string
  impact: string
  impactValue: string
  confidence: number
  actionLabel: string
  details: string[]
}

/* ─── 더미 데이터 ─── */
const kpis = [
  { label: '월 매출', value: '8,420만원', change: '+12.4%', positive: true, icon: DollarSign, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  { label: '월 환자 수', value: '624명', change: '+8.2%', positive: true, icon: Users, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
  { label: '객단가', value: '134,900원', change: '-2.1%', positive: false, icon: Target, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  { label: '청구 인정률', value: '97.6%', change: '+0.8%p', positive: true, icon: Shield, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
]

const revenueForecast = [
  { month: '2월(예측)', revenue: 8650, lower: 8200, upper: 9100, isForecast: true },
  { month: '3월(예측)', revenue: 9020, lower: 8400, upper: 9640, isForecast: true },
  { month: '4월(예측)', revenue: 8780, lower: 8100, upper: 9460, isForecast: true },
]

const revenueHistory = [
  { month: '8월', revenue: 7200 },
  { month: '9월', revenue: 7580 },
  { month: '10월', revenue: 7850 },
  { month: '11월', revenue: 7490 },
  { month: '12월', revenue: 8120 },
  { month: '1월', revenue: 8420 },
]

const allRevenue = [...revenueHistory, ...revenueForecast]
const maxRevenue = Math.max(...allRevenue.map(r => 'upper' in r ? (r as typeof revenueForecast[0]).upper : r.revenue))

const benchmarkData = [
  { metric: '일 평균 환자 수', myValue: '28.4명', avgValue: '24.1명', rank: 'top' as const, percentile: 78 },
  { metric: '평균 진료 시간', myValue: '12.8분', avgValue: '15.2분', rank: 'top' as const, percentile: 82 },
  { metric: '청구 인정률', myValue: '97.6%', avgValue: '94.2%', rank: 'top' as const, percentile: 91 },
  { metric: '객단가', myValue: '134,900원', avgValue: '142,500원', rank: 'below' as const, percentile: 42 },
  { metric: '재방문율', myValue: '68.4%', avgValue: '62.1%', rank: 'top' as const, percentile: 72 },
  { metric: '노쇼율', myValue: '5.2%', avgValue: '8.7%', rank: 'top' as const, percentile: 85 },
]

const specialtyRevenue = [
  { name: '일반 내과', revenue: 3250, ratio: 38.6, trend: 5.2 },
  { name: '건강검진', revenue: 2180, ratio: 25.9, trend: 18.4 },
  { name: '만성질환 관리', revenue: 1640, ratio: 19.5, trend: 2.1 },
  { name: '호흡기 질환', revenue: 890, ratio: 10.6, trend: -12.3 },
  { name: '소화기 질환', revenue: 460, ratio: 5.4, trend: 8.7 },
]

const aiInsights: AIInsight[] = [
  {
    id: 'AI001', type: 'growth', title: '건강검진 패키지 확대 권고',
    description: '건강검진 매출이 전월 대비 18.4% 증가하고 있습니다. 기업건진 유치로 추가 매출이 예상됩니다.',
    impact: '예상 매출 증가', impactValue: '+월 350만원', confidence: 87,
    actionLabel: '기업건진 제안서 작성',
    details: [
      '주변 500m 내 소기업 42개 중 건진 계약 0건',
      '경쟁 의원 평균 기업건진 비율: 15% → 우리 의원: 3%',
      '기업건진 객단가: 평균 28만원 (일반 대비 2.1배)',
      'AI 추천: 5인 이상 기업 대상 방문 제안 + 할인 패키지 구성',
    ],
  },
  {
    id: 'AI002', type: 'warning', title: '호흡기 매출 하락 추세',
    description: '호흡기 질환 매출이 12.3% 감소했습니다. 계절적 요인 + 인근 호흡기 전문 의원 개원 영향입니다.',
    impact: '예상 매출 감소', impactValue: '-월 110만원', confidence: 74,
    actionLabel: '대응 전략 보기',
    details: [
      '인근 300m에 호흡기 전문의원 1월 개원',
      '호흡기 초진 환자 수 35% 감소 (재진은 유지)',
      'AI 추천: 만성질환 관리 + 건강검진으로 포트폴리오 다변화',
      '독감/코로나 PCR 검사 도입 시 재방문 유도 가능',
    ],
  },
  {
    id: 'AI003', type: 'saving', title: '절세 포인트 3건 발견',
    description: '올해 적용 가능한 절세 항목이 발견되었습니다. 세무사 상담을 권고합니다.',
    impact: '연간 절세 예상', impactValue: '약 480만원', confidence: 91,
    actionLabel: '절세 상세 보기',
    details: [
      '의료기기 투자세액공제: 초음파 장비 리스 → 약 180만원',
      '직원 교육훈련비 세액공제: 미활용 한도 120만원',
      '연구개발비 세액공제: AI 진료 보조 시스템 → 약 180만원',
      '※ 정확한 금액은 세무사 확인 필요',
    ],
  },
  {
    id: 'AI004', type: 'optimization', title: '인력 배치 최적화 제안',
    description: '오전 10~12시 진료 밀집, 오후 3~5시 공백이 큽니다. 인력 재배치로 효율을 높일 수 있습니다.',
    impact: '대기시간 단축', impactValue: '-평균 8분', confidence: 83,
    actionLabel: '스케줄 최적화',
    details: [
      '현재: 오전/오후 동일 인력 배치(간호사 2, 접수 1)',
      '제안: 오전 간호사 3명 + 오후 간호사 1명 (시간제 파트)',
      '오전 피크 대기시간: 현재 18분 → 예상 10분',
      '월간 인건비 차이: +약 45만원 (시간제 추가 비용)',
    ],
  },
]

const insightConfig: Record<InsightType, { icon: typeof TrendingUp; color: string; bg: string; border: string }> = {
  growth: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800' },
  saving: { icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800' },
  optimization: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/10', border: 'border-purple-200 dark:border-purple-800' },
}

const feeScheduleImpact = [
  { item: '초진 진찰료', current: 18400, change: +600, newValue: 19000, effectDate: '2024.04' },
  { item: '재진 진찰료', current: 12200, change: +400, newValue: 12600, effectDate: '2024.04' },
  { item: '일반 혈액검사', current: 4800, change: 0, newValue: 4800, effectDate: '-' },
  { item: '기본 초음파', current: 25300, change: -1200, newValue: 24100, effectDate: '2024.04' },
]

export default function AIConsultingPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('3m')
  const [expandedInsight, setExpandedInsight] = useState<string | null>('AI001')
  const [activeSection, setActiveSection] = useState<'overview' | 'benchmark' | 'specialty' | 'tax'>('overview')

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 경영 컨설팅</h1>
            <p className="text-sm text-muted-foreground">데이터 기반 경영 인사이트 · 매출 예측 · 벤치마킹</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            {(['1m', '3m', '6m', '1y'] as TimeRange[]).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === '1m' ? '1개월' : t === '3m' ? '3개월' : t === '6m' ? '6개월' : '1년'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-bold ${kpi.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {kpi.change}
              </div>
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* 섹션 탭 */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-border">
        {[
          { key: 'overview', label: 'AI 인사이트', icon: Sparkles },
          { key: 'benchmark', label: '동종 벤치마킹', icon: BarChart3 },
          { key: 'specialty', label: '진료과목별 수익', icon: PieChart },
          { key: 'tax', label: '수가/절세', icon: Calculator },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as typeof activeSection)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeSection === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ AI 인사이트 섹션 ═══ */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* 매출 예측 차트 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> 매출 추이 & AI 예측
              </h2>
              <div className="flex items-center gap-2 text-2xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-500" /> 실적</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-300 border border-dashed border-blue-500" /> 예측</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-48">
              {allRevenue.map((d, i) => {
                const isForecast = 'isForecast' in d && d.isForecast
                const height = (d.revenue / maxRevenue) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-2xs font-bold text-muted-foreground">{(d.revenue / 100).toFixed(0)}</span>
                    <div className="w-full relative" style={{ height: `${height}%` }}>
                      <div className={`w-full h-full rounded-t-lg ${
                        isForecast ? 'bg-blue-200 dark:bg-blue-800/40 border-2 border-dashed border-blue-400' : 'bg-blue-500'
                      }`} />
                    </div>
                    <span className={`text-2xs ${isForecast ? 'text-blue-500 font-semibold' : 'text-muted-foreground'}`}>{d.month}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 flex items-start gap-2">
              <Brain className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-600">AI 예측 요약</p>
                <p className="text-2xs text-blue-700 dark:text-blue-300 mt-0.5">
                  3개월 내 매출 7~8% 성장 예상. 건강검진 수요 증가와 만성질환 관리 강화가 주요 성장 동력입니다.
                  4월 수가 개정 반영 시 초진/재진 수입 +3.2% 예상.
                </p>
              </div>
            </div>
          </div>

          {/* AI 인사이트 카드 */}
          <div className="space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> AI 경영 제안 ({aiInsights.length}건)
            </h2>
            {aiInsights.map(insight => {
              const config = insightConfig[insight.type]
              const isExpanded = expandedInsight === insight.id
              return (
                <div key={insight.id} className={`card border ${config.border} overflow-hidden`}>
                  <div
                    className={`flex items-start gap-4 p-4 cursor-pointer ${config.bg}`}
                    onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{insight.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${config.color} ${config.bg}`}>
                          신뢰도 {insight.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-bold ${config.color}`}>
                          {insight.impact}: {insight.impactValue}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" />}
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <div className="text-xs font-semibold mb-2">AI 분석 상세</div>
                      <ul className="space-y-1.5 mb-3">
                        {insight.details.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${config.color}`} />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <button className={`btn-sm text-xs text-white ${
                        insight.type === 'growth' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        insight.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                        insight.type === 'saving' ? 'bg-blue-600 hover:bg-blue-700' :
                        'bg-purple-600 hover:bg-purple-700'
                      }`}>
                        {insight.actionLabel} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ 벤치마킹 섹션 ═══ */}
      {activeSection === 'benchmark' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" /> 동종 의원 벤치마킹
                </h2>
                <p className="text-xs text-muted-foreground mt-1">내과 의원 기준 · 같은 지역 동급 규모 비교</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-xs font-bold text-blue-600">
                비교 대상: 내과 의원 142곳
              </div>
            </div>

            <div className="space-y-4">
              {benchmarkData.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium flex-shrink-0">{item.metric}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{item.myValue}</span>
                      <span className="text-2xs text-muted-foreground">평균 {item.avgValue}</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full ${
                          item.percentile >= 70 ? 'bg-emerald-500' : item.percentile >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.percentile}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-500"
                        style={{ left: '50%' }}
                        title="평균"
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-bold w-20 text-right ${
                    item.percentile >= 70 ? 'text-emerald-600' : item.percentile >= 50 ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    상위 {100 - item.percentile}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 flex items-start gap-2">
              <Star className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                <strong>종합 평가:</strong> 대부분의 지표에서 상위권을 유지하고 있습니다. 객단가(하위 58%)를 개선하면 매출 성장 여력이 큽니다.
                건강검진 패키지 도입 및 비급여 항목 확대를 권고합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 진료과목별 수익 섹션 ═══ */}
      {activeSection === 'specialty' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-600" /> 진료과목별 매출 구성
            </h2>

            <div className="space-y-3">
              {specialtyRevenue.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-36 text-sm font-medium flex-shrink-0">{item.name}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{(item.revenue).toLocaleString()}만원</span>
                      <span className="text-2xs text-muted-foreground">{item.ratio}%</span>
                    </div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-emerald-500' : i === 2 ? 'bg-purple-500' : i === 3 ? 'bg-amber-500' : 'bg-pink-500'
                        }`}
                        style={{ width: `${item.ratio}%` }}
                      />
                    </div>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-bold w-16 text-right ${
                    item.trend >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {item.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(item.trend)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-purple-600">AI 수익성 분석</p>
                  <ul className="mt-1 space-y-1 text-2xs text-purple-700 dark:text-purple-300">
                    <li>• <strong>건강검진</strong>이 가장 빠른 성장세 (+18.4%). 인력/장비 투자 ROI 최고</li>
                    <li>• <strong>만성질환 관리</strong>는 안정적 수입원. 재방문율 높아 객단가 보완</li>
                    <li>• <strong>호흡기</strong> 하락세 지속. 전문 의원 개원 영향. 포트폴리오 재조정 권고</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 수가/절세 섹션 ═══ */}
      {activeSection === 'tax' && (
        <div className="space-y-4">
          {/* 수가 변동 영향 */}
          <div className="card p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-blue-600" /> 수가 개정 영향 분석
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-semibold text-xs text-muted-foreground">항목</th>
                    <th className="pb-2 font-semibold text-xs text-muted-foreground text-right">현행</th>
                    <th className="pb-2 font-semibold text-xs text-muted-foreground text-right">변동</th>
                    <th className="pb-2 font-semibold text-xs text-muted-foreground text-right">개정</th>
                    <th className="pb-2 font-semibold text-xs text-muted-foreground text-right">적용일</th>
                  </tr>
                </thead>
                <tbody>
                  {feeScheduleImpact.map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2.5 font-medium text-xs">{item.item}</td>
                      <td className="py-2.5 text-xs text-right text-muted-foreground">{item.current.toLocaleString()}원</td>
                      <td className={`py-2.5 text-xs text-right font-bold ${
                        item.change > 0 ? 'text-emerald-600' : item.change < 0 ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change.toLocaleString()}원
                      </td>
                      <td className="py-2.5 text-xs text-right font-bold">{item.newValue.toLocaleString()}원</td>
                      <td className="py-2.5 text-xs text-right text-muted-foreground">{item.effectDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 flex items-start gap-2">
              <Calculator className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>수가 개정 영향:</strong> 월 기준 진찰료 수입 +약 38만원, 초음파 수입 -약 12만원.
                순 영향 +약 26만원/월 예상.
              </p>
            </div>
          </div>

          {/* 절세 포인트 */}
          <div className="card p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-emerald-600" /> AI 절세 포인트
            </h2>
            <div className="space-y-3">
              {[
                { title: '의료기기 투자세액공제', amount: '약 180만원', desc: '초음파 장비 리스 비용에 대한 투자세액공제 적용 가능', status: '미적용' },
                { title: '직원 교육훈련비 세액공제', amount: '약 120만원', desc: '올해 교육훈련비 한도 대비 60% 미활용 상태', status: '부분 적용' },
                { title: '연구개발비 세액공제', amount: '약 180만원', desc: 'AI 진료보조시스템(MediMatch EMR) 사용료를 R&D 비용으로 산정 가능성', status: '미적용' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{item.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30">{item.status}</span>
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{item.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4">
              <div>
                <span className="text-xs text-muted-foreground">연간 절세 예상 합계</span>
                <div className="text-xl font-bold text-emerald-600">약 480만원</div>
              </div>
              <button className="btn-sm text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                세무사 상담 예약 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
