'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Brain,
  Sparkles,
  Shield,
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Printer,
  Mail,
  Share2,
  RefreshCw,
  Target,
  Activity,
  Heart,
  Pill,
  Building2,
  Star,
} from 'lucide-react'

/* ─── 더미 데이터 ─── */
const monthlyReport = {
  period: '2024년 1월',
  generatedAt: '2024-01-21 14:30',
  revenue: {
    total: 45800000,
    insurance: 32100000,
    outOfPocket: 13700000,
    change: 12.3,
  },
  patients: {
    total: 842,
    new: 156,
    returning: 686,
    change: 8.5,
    avgPerDay: 34,
  },
  claims: {
    submitted: 342,
    accepted: 328,
    rejected: 8,
    pending: 6,
    rejectionRate: 2.3,
    rejectionRateChange: -3.5,
    totalAmount: 32100000,
    rejectedAmount: 420000,
  },
  operations: {
    avgWaitTime: 12.5,
    avgConsultTime: 8.2,
    appointmentRate: 78,
    noShowRate: 4.2,
  },
}

const revenueByDepartment = [
  { name: '진찰료', amount: 15200000, share: 33.2, change: 5.1 },
  { name: '처방료', amount: 8900000, share: 19.4, change: 8.3 },
  { name: '검사료', amount: 7600000, share: 16.6, change: 12.5 },
  { name: '처치료', amount: 6400000, share: 14.0, change: -2.1 },
  { name: '주사료', amount: 4200000, share: 9.2, change: 15.8 },
  { name: '기타', amount: 3500000, share: 7.6, change: 3.2 },
]

const topDiagnoses = [
  { code: 'J06.9', name: '급성 상기도감염', count: 89, revenue: 3560000 },
  { code: 'M54.5', name: '요통', count: 67, revenue: 5360000 },
  { code: 'E11.9', name: '제2형 당뇨병', count: 52, revenue: 2860000 },
  { code: 'I10', name: '본태성 고혈압', count: 48, revenue: 2640000 },
  { code: 'K21.0', name: '위식도역류병', count: 45, revenue: 3150000 },
  { code: 'J30.4', name: '알레르기성 비염', count: 38, revenue: 1520000 },
  { code: 'M17.1', name: '원발성 무릎관절증', count: 35, revenue: 3850000 },
  { code: 'E78.5', name: '고지혈증', count: 32, revenue: 1760000 },
]

const weeklyRevenue = [
  { week: '1주차', revenue: 10200000 },
  { week: '2주차', revenue: 11500000 },
  { week: '3주차', revenue: 12800000 },
  { week: '4주차', revenue: 11300000 },
]

const patientDemographics = [
  { group: '0~9세', count: 45, percent: 5.3 },
  { group: '10~19세', count: 38, percent: 4.5 },
  { group: '20~29세', count: 78, percent: 9.3 },
  { group: '30~39세', count: 112, percent: 13.3 },
  { group: '40~49세', count: 156, percent: 18.5 },
  { group: '50~59세', count: 178, percent: 21.1 },
  { group: '60~69세', count: 134, percent: 15.9 },
  { group: '70세+', count: 101, percent: 12.0 },
]

const aiInsights = [
  { title: '매출 성장 분석', content: '1월 매출은 전월 대비 12.3% 성장하여 월간 최고치를 기록했습니다. 주요 성장 동인은 검사료(+12.5%)와 주사료(+15.8%)입니다.', type: 'positive' as const },
  { title: '삭감율 개선', content: '삭감율이 5.8%에서 2.3%로 60% 감소했습니다. AI 청구 방어 시스템 도입 효과로 월 ₩420만원의 추가 수익이 확보되었습니다.', type: 'positive' as const },
  { title: '대기시간 최적화 필요', content: '오전 11시~12시 평균 대기시간 18.5분으로 환자 만족도 하락 우려. 예약 간격 조정 또는 시간대별 접수 제한을 권고합니다.', type: 'warning' as const },
  { title: '만성질환 관리 강화', content: '당뇨·고혈압·고지혈증 환자 132명 중 정기 검진율 72%. 미검진 환자 37명에 대한 리콜 알림 발송을 권고합니다.', type: 'action' as const },
]

const pharmacyStats = [
  { name: '메디매치 온누리약국', rxCount: 456, responseTime: 3.8, satisfaction: 4.8 },
  { name: '건강약국', rxCount: 234, responseTime: 5.2, satisfaction: 4.5 },
  { name: '하나약국', rxCount: 152, responseTime: 4.1, satisfaction: 4.7 },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'monthly' | 'weekly' | 'custom'>('monthly')
  const maxWeeklyRevenue = Math.max(...weeklyRevenue.map(w => w.revenue))
  const maxDemoCount = Math.max(...patientDemographics.map(d => d.count))

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">통합 리포트</h1>
          <p className="text-sm text-muted-foreground mt-1">{monthlyReport.period} 경영 분석 보고서</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {(['monthly', 'weekly', 'custom'] as const).map(t => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  reportType === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {t === 'monthly' ? '월간' : t === 'weekly' ? '주간' : '기간선택'}
              </button>
            ))}
          </div>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Printer className="w-3.5 h-3.5" /> 인쇄
          </button>
          <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* 핵심 KPI 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">총 매출</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">₩{(monthlyReport.revenue.total / 10000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">만</span></div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">+{monthlyReport.revenue.change}%</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">총 환자</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{monthlyReport.patients.total}</div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">+{monthlyReport.patients.change}%</span>
            <span className="text-2xs text-muted-foreground">신규 {monthlyReport.patients.new}명</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">청구 수납율</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">{((monthlyReport.claims.accepted / monthlyReport.claims.submitted) * 100).toFixed(1)}%</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-2xs text-muted-foreground">삭감율 {monthlyReport.claims.rejectionRate}%</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">일 평균 환자</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{monthlyReport.patients.avgPerDay}<span className="text-sm font-normal text-muted-foreground">명</span></div>
          <div className="text-2xs text-muted-foreground mt-1">대기 {monthlyReport.operations.avgWaitTime}분</div>
        </div>
      </div>

      {/* AI 인사이트 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">AI 경영 인사이트</h3>
          <span className="text-2xs text-muted-foreground ml-auto">{monthlyReport.generatedAt} 생성</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aiInsights.map((insight, i) => (
            <div key={i} className={`p-4 rounded-xl border ${
              insight.type === 'positive' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10' :
              insight.type === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' :
              'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {insight.type === 'positive' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                 insight.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                 <Target className="w-4 h-4 text-blue-500" />}
                <span className="text-sm font-semibold">{insight.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매출 구성 */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">매출 구성</h3>
          <div className="space-y-3">
            {revenueByDepartment.map((dept, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">₩{(dept.amount / 10000).toFixed(0)}만</span>
                    <span className={`text-2xs font-medium ${dept.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {dept.change >= 0 ? '+' : ''}{dept.change}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${dept.share}%` }} />
                </div>
                <div className="text-2xs text-muted-foreground mt-0.5">{dept.share}%</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xs text-muted-foreground">보험 청구</div>
              <div className="text-lg font-bold">₩{(monthlyReport.revenue.insurance / 10000).toFixed(0)}만</div>
            </div>
            <div>
              <div className="text-2xs text-muted-foreground">본인부담</div>
              <div className="text-lg font-bold">₩{(monthlyReport.revenue.outOfPocket / 10000).toFixed(0)}만</div>
            </div>
          </div>
        </div>

        {/* 주차별 매출 차트 */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">주차별 매출</h3>
          <div className="flex items-end gap-4 h-48">
            {weeklyRevenue.map((w, i) => {
              const isMax = w.revenue === maxWeeklyRevenue
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    ₩{(w.revenue / 10000).toFixed(0)}만
                  </span>
                  <div className="w-full relative" style={{ height: '140px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-xl transition-all ${
                        isMax ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-800/50'
                      }`}
                      style={{ height: `${(w.revenue / maxWeeklyRevenue) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isMax ? 'text-blue-600' : 'text-muted-foreground'}`}>{w.week}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상위 진단명 */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">상위 진단명</h3>
          <div className="space-y-2">
            {topDiagnoses.map((dx, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-2xs font-bold ${
                  i < 3 ? 'bg-blue-500 text-white' : 'bg-secondary text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{dx.name}</span>
                    <span className="text-2xs text-muted-foreground">{dx.code}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium">{dx.count}건</div>
                  <div className="text-2xs text-muted-foreground">₩{(dx.revenue / 10000).toFixed(0)}만</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 환자 연령대 분포 */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">환자 연령대 분포</h3>
          <div className="flex items-end gap-2 h-40">
            {patientDemographics.map((d, i) => {
              const isMax = d.count === maxDemoCount
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-2xs text-muted-foreground">{d.count}</span>
                  <div className="w-full relative" style={{ height: '100px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t transition-all ${
                        isMax ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-800/50'
                      }`}
                      style={{ height: `${(d.count / maxDemoCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-2xs text-muted-foreground whitespace-nowrap">{d.group}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600">
            <Sparkles className="w-3 h-3 inline mr-1" />
            50~59세 비율이 가장 높음 (21.1%). 만성질환 관리 프로그램 강화 권고
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 보험 청구 요약 */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" /> 보험 청구 요약
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <div className="text-2xs text-muted-foreground">청구 건수</div>
              <div className="text-xl font-bold mt-1">{monthlyReport.claims.submitted}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
              <div className="text-2xs text-emerald-600">인정 건수</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{monthlyReport.claims.accepted}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
              <div className="text-2xs text-red-600">삭감 건수</div>
              <div className="text-xl font-bold text-red-600 mt-1">{monthlyReport.claims.rejected}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
              <div className="text-2xs text-amber-600">심사중</div>
              <div className="text-xl font-bold text-amber-600 mt-1">{monthlyReport.claims.pending}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400">
              AI 청구방어로 삭감율 <strong>{Math.abs(monthlyReport.claims.rejectionRateChange)}%p 감소</strong>,
              약 <strong>₩{(monthlyReport.claims.rejectedAmount / 10000).toFixed(0)}만원</strong> 추가 확보
            </span>
          </div>
        </div>

        {/* 연동 약국 실적 */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Pill className="w-4 h-4 text-purple-600" /> 연동 약국 실적
          </h3>
          <div className="space-y-3">
            {pharmacyStats.map((ph, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{ph.name}</div>
                  <div className="text-2xs text-muted-foreground">{ph.rxCount}건 조제</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{ph.responseTime}분</div>
                  <div className="flex items-center gap-0.5 justify-end">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs">{ph.satisfaction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 운영 지표 */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-4">운영 효율 지표</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-secondary/50 text-center">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-2" />
            <div className="text-2xs text-muted-foreground">평균 대기시간</div>
            <div className="text-xl font-bold mt-1">{monthlyReport.operations.avgWaitTime}<span className="text-xs font-normal text-muted-foreground">분</span></div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 text-center">
            <Stethoscope className="w-5 h-5 text-purple-600 mx-auto mb-2" />
            <div className="text-2xs text-muted-foreground">평균 진료시간</div>
            <div className="text-xl font-bold mt-1">{monthlyReport.operations.avgConsultTime}<span className="text-xs font-normal text-muted-foreground">분</span></div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 text-center">
            <Calendar className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xs text-muted-foreground">예약 이용율</div>
            <div className="text-xl font-bold mt-1">{monthlyReport.operations.appointmentRate}<span className="text-xs font-normal text-muted-foreground">%</span></div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-2" />
            <div className="text-2xs text-muted-foreground">노쇼율</div>
            <div className="text-xl font-bold mt-1">{monthlyReport.operations.noShowRate}<span className="text-xs font-normal text-muted-foreground">%</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
