'use client'

import { useState } from 'react'
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Brain,
  BarChart3,
  FileText,
  Clock,
  Lightbulb,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'

type TabKey = 'overview' | 'trend' | 'benchmark' | 'contracts' | 'ai'

const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: '비용 현황', icon: BarChart3 },
  { key: 'trend', label: '월별 추이', icon: TrendingUp },
  { key: 'benchmark', label: '벤치마크', icon: Landmark },
  { key: 'contracts', label: '계약 관리', icon: Calendar },
  { key: 'ai', label: 'AI 권고', icon: Brain },
]

const kpi = {
  totalCost: 11_400_000,
  revenueRatio: 11.9,
  expiringContracts: 3,
  savingsOpportunity: 912_000,
}

const costItems = [
  { category: '임대료', amount: 5_500_000, vendor: '강남빌딩 관리사무소', share: 48.2 },
  { category: '대출 상환', amount: 2_300_000, vendor: '국민은행', share: 20.2 },
  { category: '장비 리스', amount: 1_200_000, vendor: 'GE Healthcare', share: 10.5 },
  { category: '공과금', amount: 850_000, vendor: '한국전력/서울도시가스', share: 7.5 },
  { category: '기타', amount: 500_000, vendor: '세무법인 택스원', share: 4.4 },
  { category: '보험료', amount: 420_000, vendor: '삼성화재', share: 3.7 },
  { category: '유지보수', amount: 350_000, vendor: '의료기기정비(주)', share: 3.1 },
  { category: '통신비', amount: 280_000, vendor: 'KT', share: 2.5 },
]

const monthlyTrend = [
  { month: '3월', rent: 5_500_000, utilities: 820_000, lease: 1_200_000, other: 3_800_000, total: 11_320_000 },
  { month: '4월', rent: 5_500_000, utilities: 780_000, lease: 1_200_000, other: 3_850_000, total: 11_330_000 },
  { month: '5월', rent: 5_500_000, utilities: 850_000, lease: 1_200_000, other: 3_800_000, total: 11_350_000 },
  { month: '6월', rent: 5_500_000, utilities: 920_000, lease: 1_200_000, other: 3_780_000, total: 11_400_000 },
  { month: '7월', rent: 5_500_000, utilities: 1_050_000, lease: 1_200_000, other: 3_800_000, total: 11_550_000 },
  { month: '8월', rent: 5_500_000, utilities: 1_100_000, lease: 1_200_000, other: 3_850_000, total: 11_650_000 },
  { month: '9월', rent: 5_500_000, utilities: 920_000, lease: 1_200_000, other: 3_800_000, total: 11_420_000 },
  { month: '10월', rent: 5_500_000, utilities: 830_000, lease: 1_200_000, other: 3_820_000, total: 11_350_000 },
  { month: '11월', rent: 5_500_000, utilities: 880_000, lease: 1_200_000, other: 3_810_000, total: 11_390_000 },
  { month: '12월', rent: 5_500_000, utilities: 950_000, lease: 1_200_000, other: 3_830_000, total: 11_480_000 },
  { month: '1월', rent: 5_500_000, utilities: 980_000, lease: 1_200_000, other: 3_800_000, total: 11_480_000 },
  { month: '2월', rent: 5_500_000, utilities: 850_000, lease: 1_200_000, other: 3_850_000, total: 11_400_000 },
]

const contracts = [
  { category: '통신비', vendor: 'KT', endDate: '2026-04-14', dDay: 45, amount: 280_000, urgency: 'HIGH' },
  { category: '유지보수', vendor: '의료기기정비(주)', endDate: '2026-04-29', dDay: 60, amount: 350_000, urgency: 'HIGH' },
  { category: '보험료', vendor: '삼성화재', endDate: '2026-05-29', dDay: 90, amount: 420_000, urgency: 'MEDIUM' },
  { category: '임대료', vendor: '강남빌딩 관리사무소', endDate: '2026-08-27', dDay: 180, amount: 5_500_000, urgency: 'LOW' },
  { category: '장비 리스', vendor: 'GE Healthcare', endDate: '2027-02-27', dDay: 365, amount: 1_200_000, urgency: 'LOW' },
  { category: '기타', vendor: '세무법인 택스원', endDate: '2027-02-27', dDay: 365, amount: 500_000, urgency: 'LOW' },
]

const benchmarkData = [
  { name: '임대료', my: 5_500_000, avg: 5_000_000 },
  { name: '공과금', my: 850_000, avg: 780_000 },
  { name: '장비 리스', my: 1_200_000, avg: 1_350_000 },
  { name: '통신비', my: 280_000, avg: 220_000 },
  { name: '보험료', my: 420_000, avg: 380_000 },
]

const aiRecommendations = [
  { id: 1, title: '임대료 재협상 시점', priority: 'HIGH', savings: 550_000, desc: '임대차 계약 갱신이 6개월 이내입니다. 주변 시세 대비 10% 높은 편으로, 재협상 시 월 55만원 절감이 가능합니다.', actions: ['주변 의원 임대료 시세 조사', '계약 갱신 3개월 전 협상 시작', '리노베이션 투자 대비 임대료 할인 제안'] },
  { id: 2, title: '장비 리스 vs 구매 분석', priority: 'MEDIUM', savings: 300_000, desc: 'CT 장비 리스 만기가 1년 남았습니다. 잔여 리스료 대비 중고 매입이 유리한 구간입니다.', actions: ['리스 잔여 비용 총액 확인', '중고 장비 시세 조회', '의료기기 감가상각 세금 효과 계산'] },
  { id: 3, title: '통신비 절감', priority: 'LOW', savings: 80_000, desc: '현재 통신 요금제가 사용량 대비 과다합니다. 요금제 변경으로 월 8만원 절감이 가능합니다.', actions: ['현재 통신 사용량 분석', '경쟁사 요금제 비교', '번들 할인 적용 가능 여부 확인'] },
]

const urgencyColors: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  LOW: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
}
const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}

function fmt(n: number) { return n.toLocaleString() + '원' }
function fmtMan(n: number) { return (n / 10000).toFixed(0) + '만' }

export default function FixedCostPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const maxAmount = Math.max(...costItems.map(c => c.amount))
  const maxTrend = Math.max(...monthlyTrend.map(m => m.total))

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">고정비 절감 분석</h1>
        <p className="text-sm text-muted-foreground mt-1">임대료/공과금/보험/리스 등 고정비를 분석하고 계약 갱신 시점을 관리합니다</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">총 고정비</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.totalCost)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">매출 대비</span></div>
          <div className="text-2xl font-bold">{kpi.revenueRatio}%</div>
          <div className="text-xs mt-1 text-muted-foreground">권장: 10~15%</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">계약 갱신 임박</span></div>
          <div className="text-2xl font-bold">{kpi.expiringContracts}건</div>
          <div className="text-xs mt-1 text-muted-foreground">90일 이내</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">절감 기회</span></div>
          <div className="text-2xl font-bold text-emerald-600">{fmtMan(kpi.savingsOpportunity)}</div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar border-b border-border">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* 비용 현황 */}
      {activeTab === 'overview' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold">항목별 고정비</h3>
          <div className="space-y-3">
            {costItems.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-sm font-medium w-20">{item.category}</span>
                <div className="flex-1 h-8 bg-secondary/30 rounded-lg overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-lg flex items-center px-2" style={{ width: `${(item.amount / maxAmount) * 100}%` }}>
                    <span className="text-2xs text-white font-medium truncate">{item.vendor}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold w-20 text-right">{fmtMan(item.amount)}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{item.share}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 월별 추이 */}
      {activeTab === 'trend' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold">12개월 고정비 추이</h3>
          <div className="space-y-3">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10 text-right">{m.month}</span>
                <div className="flex-1 flex h-7 rounded-lg overflow-hidden bg-secondary/30">
                  <div className="bg-primary/70 h-full" style={{ width: `${(m.rent / maxTrend) * 100}%` }} />
                  <div className="bg-amber-400 h-full" style={{ width: `${(m.utilities / maxTrend) * 100}%` }} />
                  <div className="bg-purple-400 h-full" style={{ width: `${(m.lease / maxTrend) * 100}%` }} />
                  <div className="bg-gray-400 h-full" style={{ width: `${(m.other / maxTrend) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold w-16 text-right">{fmtMan(m.total)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary/70" /> 임대료</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400" /> 공과금</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-400" /> 장비리스</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-400" /> 기타</div>
          </div>
        </div>
      )}

      {/* 벤치마크 */}
      {activeTab === 'benchmark' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">내 의원 vs 지역 평균 (내과 · 강남구)</h3>
            <span className="text-xs bg-amber-50 text-amber-600 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-semibold">상위 42%</span>
          </div>
          <div className="space-y-4">
            {benchmarkData.map((item) => {
              const maxVal = Math.max(item.my, item.avg)
              const diff = item.my - item.avg
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className={`text-xs font-semibold ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {diff > 0 ? '+' : ''}{fmtMan(diff)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground w-8">내 의원</span>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${diff > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${(item.my / maxVal) * 100}%` }} />
                      </div>
                      <span className="text-2xs w-12 text-right">{fmtMan(item.my)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground w-8">평균</span>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground/40 rounded-full" style={{ width: `${(item.avg / maxVal) * 100}%` }} />
                      </div>
                      <span className="text-2xs w-12 text-right">{fmtMan(item.avg)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 계약 관리 */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {contracts.map((c) => (
            <div key={c.vendor} className={`card p-5 border ${urgencyColors[c.urgency]}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">{c.category}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${c.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : c.urgency === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      D-{c.dDay}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{c.vendor}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{fmt(c.amount)}/월</div>
                  <div className="text-xs text-muted-foreground">만료: {c.endDate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI 권고 */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="card p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-bold">AI 분석 총 절감 가능액</span>
            </div>
            <div className="text-2xl font-bold text-primary">월 {fmt(aiRecommendations.reduce((s, r) => s + r.savings, 0))}</div>
          </div>
          {aiRecommendations.map((rec) => (
            <div key={rec.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <h4 className="font-bold flex-1">{rec.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${priorityColors[rec.priority]}`}>
                  {rec.priority === 'HIGH' ? '높음' : rec.priority === 'MEDIUM' ? '보통' : '낮음'}
                </span>
                <span className="text-sm font-bold text-emerald-600">월 {fmt(rec.savings)}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rec.desc}</p>
              <div className="space-y-1.5">
                {rec.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>데모 데이터로 표시 중입니다. 실제 고정비 데이터를 입력하면 정확한 분석이 가능합니다.</span>
        </div>
      </div>
    </div>
  )
}
