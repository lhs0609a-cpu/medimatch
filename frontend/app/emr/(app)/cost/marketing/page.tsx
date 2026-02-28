'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Brain,
  BarChart3,
  Target,
  Lightbulb,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Award,
} from 'lucide-react'

type TabKey = 'channels' | 'trend' | 'budget' | 'season' | 'ai'

const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'channels', label: '채널 성과', icon: BarChart3 },
  { key: 'trend', label: '월별 추이', icon: TrendingUp },
  { key: 'budget', label: '예산 배분', icon: Target },
  { key: 'season', label: '계절 분석', icon: Calendar },
  { key: 'ai', label: 'AI 권고', icon: Brain },
]

const kpi = {
  totalSpend: 3_800_000,
  totalPatients: 67,
  avgCpa: 56_716,
  overallRoi: 557,
  bestChannel: '네이버 블로그',
  bestRoi: 500,
}

const channels = [
  { name: '소개/추천', spend: 0, patients: 15, inquiries: 15, appointments: 15, revenue: 6_000_000, roi: 0, cpa: 0, color: 'bg-cyan-400' },
  { name: '네이버 블로그', spend: 800_000, patients: 12, inquiries: 45, appointments: 18, revenue: 4_800_000, roi: 500, cpa: 66_667, color: 'bg-emerald-400' },
  { name: '네이버 광고', spend: 1_500_000, patients: 20, inquiries: 80, appointments: 30, revenue: 7_200_000, roi: 380, cpa: 75_000, color: 'bg-blue-400' },
  { name: '인스타그램/SNS', spend: 400_000, patients: 8, inquiries: 35, appointments: 12, revenue: 3_200_000, roi: 700, cpa: 50_000, color: 'bg-purple-400' },
  { name: '구글 광고', spend: 600_000, patients: 5, inquiries: 25, appointments: 8, revenue: 2_000_000, roi: 233, cpa: 120_000, color: 'bg-red-400' },
  { name: '카카오톡', spend: 300_000, patients: 4, inquiries: 15, appointments: 6, revenue: 1_200_000, roi: 300, cpa: 75_000, color: 'bg-amber-400' },
  { name: '오프라인 전단', spend: 200_000, patients: 3, inquiries: 10, appointments: 4, revenue: 900_000, roi: 350, cpa: 66_667, color: 'bg-orange-400' },
]

const monthlyTrend = [
  { month: '3월', naver: 2_100_000, google: 550_000, sns: 380_000, other: 650_000, total: 3_680_000, patients: 62 },
  { month: '4월', naver: 2_300_000, google: 620_000, sns: 420_000, other: 700_000, total: 4_040_000, patients: 70 },
  { month: '5월', naver: 2_200_000, google: 580_000, sns: 400_000, other: 680_000, total: 3_860_000, patients: 65 },
  { month: '6월', naver: 2_000_000, google: 500_000, sns: 350_000, other: 600_000, total: 3_450_000, patients: 58 },
  { month: '7월', naver: 1_800_000, google: 480_000, sns: 320_000, other: 550_000, total: 3_150_000, patients: 52 },
  { month: '8월', naver: 1_700_000, google: 450_000, sns: 300_000, other: 520_000, total: 2_970_000, patients: 48 },
  { month: '9월', naver: 2_000_000, google: 530_000, sns: 370_000, other: 620_000, total: 3_520_000, patients: 60 },
  { month: '10월', naver: 2_100_000, google: 560_000, sns: 390_000, other: 650_000, total: 3_700_000, patients: 63 },
  { month: '11월', naver: 2_200_000, google: 600_000, sns: 410_000, other: 680_000, total: 3_890_000, patients: 66 },
  { month: '12월', naver: 2_300_000, google: 580_000, sns: 420_000, other: 700_000, total: 4_000_000, patients: 68 },
  { month: '1월', naver: 2_100_000, google: 550_000, sns: 380_000, other: 650_000, total: 3_680_000, patients: 62 },
  { month: '2월', naver: 2_300_000, google: 600_000, sns: 400_000, other: 500_000, total: 3_800_000, patients: 67 },
]

const budgetCurrent = [
  { channel: '네이버 광고', current: 39, recommended: 30 },
  { channel: '네이버 블로그', current: 21, recommended: 28 },
  { channel: '구글 광고', current: 16, recommended: 10 },
  { channel: '인스타그램/SNS', current: 11, recommended: 18 },
  { channel: '카카오톡', current: 8, recommended: 8 },
  { channel: '오프라인 전단', current: 5, recommended: 6 },
]

const seasonData = [
  { month: '1월', naver: 65, google: 45, sns: 55, kakao: 40, offline: 30 },
  { month: '2월', naver: 60, google: 50, sns: 50, kakao: 35, offline: 25 },
  { month: '3월', naver: 80, google: 60, sns: 70, kakao: 55, offline: 45 },
  { month: '4월', naver: 85, google: 65, sns: 75, kakao: 60, offline: 50 },
  { month: '5월', naver: 75, google: 55, sns: 65, kakao: 50, offline: 40 },
  { month: '6월', naver: 60, google: 45, sns: 55, kakao: 40, offline: 30 },
  { month: '7월', naver: 50, google: 35, sns: 45, kakao: 30, offline: 20 },
  { month: '8월', naver: 45, google: 30, sns: 40, kakao: 25, offline: 20 },
  { month: '9월', naver: 65, google: 50, sns: 60, kakao: 45, offline: 35 },
  { month: '10월', naver: 70, google: 55, sns: 65, kakao: 50, offline: 40 },
  { month: '11월', naver: 75, google: 60, sns: 70, kakao: 55, offline: 45 },
  { month: '12월', naver: 80, google: 55, sns: 65, kakao: 50, offline: 40 },
]

const aiRecommendations = [
  { id: 1, title: '예산 재배분 제안', priority: 'HIGH', improvement: '신규 환자 +15%', desc: '구글 광고의 CPA가 네이버 블로그 대비 80% 높습니다. 구글 광고 예산 30만원을 네이버 블로그로 이전하면 월 5명 추가 확보가 예상됩니다.', actions: ['구글 광고 캠페인 성과 상세 분석', '네이버 블로그 콘텐츠 제작 빈도 증가', '전환 추적 코드 설치 확인'] },
  { id: 2, title: '시즌별 예산 조정', priority: 'MEDIUM', improvement: '비용 효율 +20%', desc: '봄철(3-5월)에 환자 유입이 15% 증가하는 패턴이 관찰됩니다. 봄철에 마케팅 예산을 집중 투자하면 ROI를 20% 개선할 수 있습니다.', actions: ['월별 유입 패턴 데이터 확인', '봄철 캠페인 사전 기획', '비수기 예산 최소화 계획'] },
  { id: 3, title: '소개 프로그램 강화', priority: 'HIGH', improvement: 'CPA 0원 채널 확대', desc: '소개/추천 채널의 CPA가 0원이며 환자 충성도가 가장 높습니다. 체계적인 환자 소개 프로그램을 도입하면 월 5-10명 추가 확보가 가능합니다.', actions: ['환자 소개 인센티브 프로그램 설계', '소개 카드/QR코드 제작', '기존 환자 만족도 조사 실시'] },
]

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}

function fmt(n: number) { return n.toLocaleString() + '원' }
function fmtMan(n: number) { return (n / 10000).toFixed(0) + '만' }

function heatColor(val: number) {
  if (val >= 75) return 'bg-emerald-500 text-white'
  if (val >= 60) return 'bg-emerald-300 text-emerald-900'
  if (val >= 45) return 'bg-amber-200 text-amber-900'
  if (val >= 30) return 'bg-orange-200 text-orange-900'
  return 'bg-red-200 text-red-900'
}

export default function MarketingROIPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('channels')
  const maxSpend = Math.max(...channels.filter(c => c.spend > 0).map(c => c.spend))
  const maxTrend = Math.max(...monthlyTrend.map(m => m.total))

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">마케팅 ROI 분석</h1>
        <p className="text-sm text-muted-foreground mt-1">채널별 마케팅 지출과 환자 확보 성과를 분석합니다</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">총 마케팅비</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.totalSpend)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">신규 환자</span></div>
          <div className="text-2xl font-bold">{kpi.totalPatients}명</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">평균 CPA</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.avgCpa)}</div>
          <div className="text-xs mt-1 text-muted-foreground">환자 1명 획득 비용</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Award className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">최고 ROI 채널</span></div>
          <div className="text-lg font-bold">{kpi.bestChannel}</div>
          <div className="text-xs mt-1 text-emerald-500 font-semibold">ROI {kpi.bestRoi}%</div>
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

      {/* 채널 성과 */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h3 className="font-bold">채널별 ROI 순위</h3>
            <div className="space-y-3">
              {channels.sort((a, b) => b.roi - a.roi).filter(c => c.spend > 0).map((ch, idx) => (
                <div key={ch.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">{idx + 1}</span>
                  <span className="text-sm font-medium w-28 truncate">{ch.name}</span>
                  <div className="flex-1 h-7 bg-secondary/30 rounded-lg overflow-hidden">
                    <div className={`h-full rounded-lg ${ch.color}`} style={{ width: `${Math.min((ch.roi / 800) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold w-16 text-right text-emerald-600">ROI {ch.roi}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
              <div className="col-span-2">채널</div>
              <div className="col-span-2 text-right">지출</div>
              <div className="col-span-1 text-right">환자</div>
              <div className="col-span-1 text-right">문의</div>
              <div className="col-span-2 text-right">매출 귀속</div>
              <div className="col-span-2 text-right">ROI</div>
              <div className="col-span-2 text-right">CPA</div>
            </div>
            <div className="divide-y divide-border">
              {channels.map((ch) => (
                <div key={ch.name} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center">
                  <div className="md:hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{ch.name}</span>
                      <span className="text-emerald-600 font-bold">ROI {ch.roi}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">지출 {fmtMan(ch.spend)} · 환자 {ch.patients}명 · CPA {ch.cpa > 0 ? fmtMan(ch.cpa) : '0원'}</div>
                  </div>
                  <div className="hidden md:flex col-span-2 items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${ch.color}`} />
                    <span className="text-sm font-medium">{ch.name}</span>
                  </div>
                  <div className="hidden md:block col-span-2 text-right text-sm">{ch.spend > 0 ? fmt(ch.spend) : '-'}</div>
                  <div className="hidden md:block col-span-1 text-right text-sm font-semibold">{ch.patients}명</div>
                  <div className="hidden md:block col-span-1 text-right text-sm text-muted-foreground">{ch.inquiries}</div>
                  <div className="hidden md:block col-span-2 text-right text-sm">{fmt(ch.revenue)}</div>
                  <div className="hidden md:block col-span-2 text-right text-sm font-bold text-emerald-600">{ch.spend > 0 ? `${ch.roi}%` : '무비용'}</div>
                  <div className="hidden md:block col-span-2 text-right text-sm">{ch.cpa > 0 ? fmt(ch.cpa) : '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 월별 추이 */}
      {activeTab === 'trend' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold">12개월 마케팅 지출 추이</h3>
          <div className="space-y-3">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10 text-right">{m.month}</span>
                <div className="flex-1 flex h-7 rounded-lg overflow-hidden bg-secondary/30">
                  <div className="bg-blue-400 h-full" style={{ width: `${(m.naver / maxTrend) * 100}%` }} />
                  <div className="bg-red-400 h-full" style={{ width: `${(m.google / maxTrend) * 100}%` }} />
                  <div className="bg-purple-400 h-full" style={{ width: `${(m.sns / maxTrend) * 100}%` }} />
                  <div className="bg-gray-400 h-full" style={{ width: `${(m.other / maxTrend) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold w-12 text-right">{fmtMan(m.total)}</span>
                <span className="text-xs text-blue-500 w-10 text-right">{m.patients}명</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-400" /> 네이버</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /> 구글</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-400" /> SNS</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-400" /> 기타</div>
          </div>
        </div>
      )}

      {/* 예산 배분 */}
      {activeTab === 'budget' && (
        <div className="card p-6 space-y-6">
          <h3 className="font-bold">현재 vs 추천 예산 배분</h3>
          <div className="space-y-4">
            {budgetCurrent.map((item) => {
              const diff = item.recommended - item.current
              return (
                <div key={item.channel} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.channel}</span>
                    <span className={`text-xs font-semibold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {diff > 0 ? `+${diff}%p` : diff < 0 ? `${diff}%p` : '유지'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground w-8">현재</span>
                      <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${item.current}%` }} />
                      </div>
                      <span className="text-2xs font-medium w-8 text-right">{item.current}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground w-8">추천</span>
                      <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${item.recommended}%` }} />
                      </div>
                      <span className="text-2xs font-medium w-8 text-right">{item.recommended}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 계절 분석 */}
      {activeTab === 'season' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold">월별 채널 효율 히트맵</h3>
          <p className="text-xs text-muted-foreground">숫자가 클수록 해당 월/채널의 효율이 높음 (100점 만점)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold text-muted-foreground">월</th>
                  <th className="p-2 text-center font-semibold text-muted-foreground">네이버</th>
                  <th className="p-2 text-center font-semibold text-muted-foreground">구글</th>
                  <th className="p-2 text-center font-semibold text-muted-foreground">SNS</th>
                  <th className="p-2 text-center font-semibold text-muted-foreground">카카오</th>
                  <th className="p-2 text-center font-semibold text-muted-foreground">오프라인</th>
                </tr>
              </thead>
              <tbody>
                {seasonData.map((row) => (
                  <tr key={row.month}>
                    <td className="p-2 font-medium">{row.month}</td>
                    <td className="p-1"><div className={`p-2 rounded text-center font-bold ${heatColor(row.naver)}`}>{row.naver}</div></td>
                    <td className="p-1"><div className={`p-2 rounded text-center font-bold ${heatColor(row.google)}`}>{row.google}</div></td>
                    <td className="p-1"><div className={`p-2 rounded text-center font-bold ${heatColor(row.sns)}`}>{row.sns}</div></td>
                    <td className="p-1"><div className={`p-2 rounded text-center font-bold ${heatColor(row.kakao)}`}>{row.kakao}</div></td>
                    <td className="p-1"><div className={`p-2 rounded text-center font-bold ${heatColor(row.offline)}`}>{row.offline}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI 권고 */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="card p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-bold">AI 마케팅 최적화 권고</span>
            </div>
            <p className="text-sm text-muted-foreground">데이터 기반 예산 재배분으로 신규 환자 확보를 극대화하세요</p>
          </div>
          {aiRecommendations.map((rec) => (
            <div key={rec.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <h4 className="font-bold flex-1">{rec.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${priorityColors[rec.priority]}`}>
                  {rec.priority === 'HIGH' ? '높음' : rec.priority === 'MEDIUM' ? '보통' : '낮음'}
                </span>
                <span className="text-sm font-bold text-emerald-600">{rec.improvement}</span>
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
          <span>데모 데이터로 표시 중입니다. 실제 마케팅 데이터를 입력하면 정확한 분석이 가능합니다.</span>
        </div>
      </div>
    </div>
  )
}
