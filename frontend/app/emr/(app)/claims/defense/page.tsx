'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  Brain,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Filter,
  Calendar,
  DollarSign,
  BarChart3,
  Target,
  Zap,
  Eye,
  Edit3,
  Download,
  RefreshCw,
  Info,
  XCircle,
  Clock,
  Lightbulb,
  Scale,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Printer,
} from 'lucide-react'

/* ─── 더미 데이터 ─── */
const overallScore = {
  score: 87,
  trend: 5.2,
  totalClaims: 342,
  riskClaims: 28,
  rejectionRate: 2.3,
  rejectionRatePrev: 5.8,
  savedAmount: 4280000,
}

const riskCategories = [
  { category: '병명-처치 불일치', count: 8, severity: 'high' as const, example: 'J06.9 급성 상기도감염 + 근전도검사' },
  { category: '과잉투여 의심', count: 6, severity: 'medium' as const, example: '동일 성분 이중 처방 (아세트아미노펜)' },
  { category: '산정특례 기준 미달', count: 5, severity: 'high' as const, example: '본인부담 산정특례 적용 기준 미충족' },
  { category: '검사 횟수 초과', count: 4, severity: 'medium' as const, example: '혈액검사 월 2회 초과 (3회 시행)' },
  { category: '투약 기간 초과', count: 3, severity: 'low' as const, example: '항생제 14일 초과 처방' },
  { category: '비급여 전환 권고', count: 2, severity: 'low' as const, example: '미용 목적 시술 보험 청구' },
]

const recentDefenses = [
  {
    id: 'CLM-2024-0891',
    date: '2024-01-21',
    patient: '김○수',
    diagnosis: 'M54.5 요통',
    procedure: '도수치료 + 물리치료',
    amount: 85000,
    riskLevel: 'high' as const,
    riskScore: 35,
    reasons: ['도수치료 급여기준 미충족 가능', '물리치료 중복 산정 의심'],
    aiSuggestion: '도수치료 시행 사유(보존적 치료 6주 이상 무효) 소견서 첨부 권고. 물리치료는 도수치료 비시행일에 대해서만 청구하세요.',
    status: 'defended',
  },
  {
    id: 'CLM-2024-0890',
    date: '2024-01-21',
    patient: '이○경',
    diagnosis: 'J06.9 급성 상기도감염',
    procedure: '진찰료 + 처방료 + 혈액검사',
    amount: 42000,
    riskLevel: 'medium' as const,
    riskScore: 55,
    reasons: ['급성 상기도감염에 혈액검사 필요성 심사 가능'],
    aiSuggestion: '증상 지속기간(7일 이상) 또는 합병증 의심 소견을 기록에 명시하세요. CBC + CRP 검사의 의학적 필요성 근거를 추가하세요.',
    status: 'pending',
  },
  {
    id: 'CLM-2024-0889',
    date: '2024-01-20',
    patient: '박○호',
    diagnosis: 'K21.0 위식도역류병',
    procedure: '진찰료 + 처방료 + 위내시경',
    amount: 128000,
    riskLevel: 'low' as const,
    riskScore: 82,
    reasons: [],
    aiSuggestion: '청구 적정. 위내시경 시행 기준 충족.',
    status: 'safe',
  },
  {
    id: 'CLM-2024-0888',
    date: '2024-01-20',
    patient: '최○지',
    diagnosis: 'E11.9 제2형 당뇨병',
    procedure: '진찰료 + 처방료 + HbA1c + 혈액검사',
    amount: 56000,
    riskLevel: 'low' as const,
    riskScore: 91,
    reasons: [],
    aiSuggestion: '만성질환 정기 검사 청구 적정.',
    status: 'safe',
  },
  {
    id: 'CLM-2024-0887',
    date: '2024-01-19',
    patient: '정○현',
    diagnosis: 'M17.1 원발성 무릎관절증',
    procedure: '진찰료 + 주사치료 + X-ray',
    amount: 95000,
    riskLevel: 'high' as const,
    riskScore: 28,
    reasons: ['관절강 내 주사 횟수 초과 가능 (이번 달 3회째)', 'X-ray 월 2회 이상 촬영'],
    aiSuggestion: '관절강 내 주사는 월 3회까지 급여 인정되나, 동일 부위 반복은 심사 대상. 이전 치료 경과와 호전 부족 사유를 상세히 기록하세요. X-ray는 추적관찰 필요성을 명시하세요.',
    status: 'revised',
  },
]

const monthlyTrend = [
  { month: '8월', score: 72, rejectionRate: 6.2, saved: 1200000 },
  { month: '9월', score: 75, rejectionRate: 5.5, saved: 1800000 },
  { month: '10월', score: 79, rejectionRate: 4.8, saved: 2400000 },
  { month: '11월', score: 82, rejectionRate: 3.9, saved: 3100000 },
  { month: '12월', score: 84, rejectionRate: 3.1, saved: 3600000 },
  { month: '1월', score: 87, rejectionRate: 2.3, saved: 4280000 },
]

const hiraRules = [
  { code: 'N001', title: '진찰료 산정기준', updated: '2024-01-15', status: 'active' },
  { code: 'N002', title: '주사료 산정기준', updated: '2024-01-10', status: 'updated' },
  { code: 'N003', title: '처방료·조제료 기준', updated: '2023-12-20', status: 'active' },
  { code: 'N004', title: '물리치료 산정기준', updated: '2024-01-18', status: 'updated' },
  { code: 'N005', title: '검사료 산정기준', updated: '2023-11-01', status: 'active' },
]

/* ─── 유틸 ─── */
const riskConfig = {
  high: { label: '고위험', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500' },
  medium: { label: '주의', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500' },
  low: { label: '안전', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500' },
}

const statusConfig = {
  pending: { label: '검토 필요', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  defended: { label: '방어 완료', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  revised: { label: '수정 완료', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  safe: { label: '적정', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreGradient(score: number) {
  if (score >= 80) return 'from-emerald-500 to-emerald-400'
  if (score >= 60) return 'from-amber-500 to-amber-400'
  return 'from-red-500 to-red-400'
}

export default function ClaimDefensePage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAppealModal, setShowAppealModal] = useState<string | null>(null)
  const maxSaved = Math.max(...monthlyTrend.map(m => m.saved))

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 청구 방어 분석실</h1>
            <p className="text-sm text-muted-foreground">AI가 삭감 리스크를 사전 차단합니다</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Download className="w-3.5 h-3.5" /> 리포트
          </button>
          <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
            <Brain className="w-3.5 h-3.5" /> 전체 재분석
          </button>
        </div>
      </div>

      {/* 방어 점수 + 주요 KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 방어 점수 (원형) */}
        <div className="card p-6 lg:row-span-2 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground font-medium mb-3">청구 방어 점수</span>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${overallScore.score * 3.14} 314`}
                className={`${overallScore.score >= 80 ? 'text-emerald-500' : overallScore.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}
                stroke="currentColor"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getScoreColor(overallScore.score)}`}>{overallScore.score}</span>
              <span className="text-2xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-sm text-emerald-600 font-semibold">+{overallScore.trend}점</span>
            <span className="text-xs text-muted-foreground">전월비</span>
          </div>
          <div className="text-2xs text-muted-foreground mt-1">상위 15% 수준</div>
        </div>

        {/* KPI 카드들 */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">삭감율</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{overallScore.rejectionRate}%</div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowDownRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">-{(overallScore.rejectionRatePrev - overallScore.rejectionRate).toFixed(1)}%p</span>
            <span className="text-2xs text-muted-foreground">이전: {overallScore.rejectionRatePrev}%</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">리스크 건수</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{overallScore.riskClaims}</div>
          <div className="text-2xs text-muted-foreground mt-1">총 {overallScore.totalClaims}건 중</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">방어 절감액</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">₩{(overallScore.savedAmount / 10000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">만</span></div>
          <div className="text-2xs text-muted-foreground mt-1">누적 삭감 방어 금액</div>
        </div>

        {/* 월별 절감액 차트 */}
        <div className="card p-4 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">월별 방어 절감액</h3>
            <span className="text-2xs text-muted-foreground">최근 6개월</span>
          </div>
          <div className="flex items-end gap-3 h-24">
            {monthlyTrend.map((m, i) => {
              const isLatest = i === monthlyTrend.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-2xs text-muted-foreground">{(m.saved / 10000).toFixed(0)}만</span>
                  <div className="w-full relative" style={{ height: '60px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg ${isLatest ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-800/50'}`}
                      style={{ height: `${(m.saved / maxSaved) * 100}%` }}
                    />
                  </div>
                  <span className={`text-2xs ${isLatest ? 'text-blue-600 font-semibold' : 'text-muted-foreground'}`}>{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 리스크 카테고리 분석 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">AI 리스크 카테고리 분석</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {riskCategories.map((cat, i) => {
            const rc = riskConfig[cat.severity]
            return (
              <div key={i} className={`p-4 rounded-xl border ${cat.severity === 'high' ? 'border-red-200 dark:border-red-800' : cat.severity === 'medium' ? 'border-amber-200 dark:border-amber-800' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${rc.color} ${rc.bg}`}>{rc.label}</span>
                  <span className="text-lg font-bold">{cat.count}건</span>
                </div>
                <div className="text-sm font-medium mb-1">{cat.category}</div>
                <div className="text-2xs text-muted-foreground">{cat.example}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 청구 건별 AI 분석 */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">청구 건별 AI 방어 분석</h3>
          <div className="flex items-center gap-2">
            <select className="input py-1.5 text-sm">
              <option>전체</option>
              <option>고위험</option>
              <option>주의</option>
              <option>검토 필요</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {recentDefenses.map(claim => {
            const rc = riskConfig[claim.riskLevel]
            const sc = statusConfig[claim.status as keyof typeof statusConfig]
            const isExpanded = expandedId === claim.id

            return (
              <div key={claim.id}>
                <div
                  className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-secondary/30 transition-colors ${
                    claim.riskLevel === 'high' ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                >
                  {/* 리스크 점수 */}
                  <div className="flex-shrink-0 text-center w-14">
                    <div className={`text-xl font-bold ${getScoreColor(claim.riskScore)}`}>{claim.riskScore}</div>
                    <div className="text-2xs text-muted-foreground">점</div>
                  </div>

                  {/* 청구 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{claim.patient}</span>
                      <span className="text-2xs text-muted-foreground">{claim.id}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${rc.color} ${rc.bg}`}>{rc.label}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${sc.color} ${sc.bg}`}>{sc.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{claim.diagnosis} | {claim.procedure}</div>
                    {claim.reasons.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 text-2xs text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        {claim.reasons[0]}
                        {claim.reasons.length > 1 && <span className="text-muted-foreground">외 {claim.reasons.length - 1}건</span>}
                      </div>
                    )}
                  </div>

                  {/* 금액 + 날짜 */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-sm font-semibold">₩{claim.amount.toLocaleString()}</div>
                    <div className="text-2xs text-muted-foreground">{claim.date}</div>
                  </div>

                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* 확장 상세 */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-secondary/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* AI 분석 결과 */}
                      <div className="card p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-blue-600" /> AI 분석 결과
                        </h4>

                        {/* 리스크 바 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">청구 적정성 점수</span>
                            <span className={`font-bold ${getScoreColor(claim.riskScore)}`}>{claim.riskScore}/100</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(claim.riskScore)} transition-all`}
                              style={{ width: `${claim.riskScore}%` }}
                            />
                          </div>
                        </div>

                        {/* 리스크 사유 */}
                        {claim.reasons.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            <div className="text-xs font-semibold text-red-600">삭감 리스크 사유</div>
                            {claim.reasons.map((reason, ri) => (
                              <div key={ri} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-red-700 dark:text-red-400">{reason}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 mb-4">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-700 dark:text-emerald-400">삭감 리스크 없음</span>
                          </div>
                        )}

                        {/* 심사 기준 매칭 */}
                        <div className="text-xs font-semibold text-muted-foreground mb-1.5">관련 심사 기준</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Scale className="w-3 h-3" />
                            <span>건강보험요양급여비용 제1편 제2부 행위 급여목록</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BookOpen className="w-3 h-3" />
                            <span>심사지침 - {claim.diagnosis.split(' ')[0]} 관련</span>
                          </div>
                        </div>
                      </div>

                      {/* AI 방어 제안 */}
                      <div className="card p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI 방어 제안
                        </h4>

                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 mb-4">
                          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{claim.aiSuggestion}</p>
                        </div>

                        {claim.reasons.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <div className="text-xs font-semibold">권고 액션</div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xs font-bold text-blue-600">1</span>
                                </div>
                                <span>차트 기록에 의학적 필요성 근거 추가</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xs font-bold text-blue-600">2</span>
                                </div>
                                <span>소견서/의견서 자동 생성</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xs font-bold text-blue-600">3</span>
                                </div>
                                <span>수정 후 재청구</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {claim.reasons.length > 0 && (
                            <>
                              <button className="btn-sm text-2xs bg-blue-600 text-white hover:bg-blue-700">
                                <Edit3 className="w-3 h-3" /> 차트 수정
                              </button>
                              <button className="btn-sm text-2xs bg-purple-500 text-white hover:bg-purple-600">
                                <Sparkles className="w-3 h-3" /> AI 의견서 생성
                              </button>
                              <button className="btn-sm text-2xs bg-secondary text-foreground" onClick={() => setShowAppealModal(claim.id)}>
                                <FileText className="w-3 h-3" /> 이의신청 초안
                              </button>
                            </>
                          )}
                          <button className="btn-sm text-2xs bg-secondary text-foreground">
                            <Eye className="w-3 h-3" /> 차트 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 하단: 심사기준 업데이트 + 팁 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" /> 심사 기준 업데이트
            </h3>
            <button className="text-2xs text-blue-600 font-medium hover:underline">전체보기</button>
          </div>
          <div className="space-y-2">
            {hiraRules.map(rule => (
              <div key={rule.code} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{rule.title}</div>
                  <div className="text-2xs text-muted-foreground">{rule.code} · 갱신: {rule.updated}</div>
                </div>
                {rule.status === 'updated' && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-2xs font-bold text-amber-600">변경</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">AI 방어 팁</h3>
          </div>
          <div className="space-y-3">
            {[
              { tip: '진료 기록에 "~로 인해", "~를 위하여" 등 의학적 사유를 명확히 기술하면 삭감율이 40% 감소합니다.', category: '기록' },
              { tip: '동일 환자의 반복 검사는 이전 결과와의 비교 소견을 차트에 포함하세요.', category: '검사' },
              { tip: '물리치료 + 도수치료 동시 산정 시 시행일자를 구분하여 청구하세요.', category: '처치' },
              { tip: '만성질환 환자의 투약일수 90일 이상 처방은 장기처방사유를 명시하세요.', category: '투약' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10">
                <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800/50 text-2xs font-bold text-amber-700 flex-shrink-0 mt-0.5">{item.category}</span>
                <p className="text-xs text-amber-900 dark:text-amber-200">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이의신청 초안 모달 */}
      {showAppealModal && (() => {
        const claim = recentDefenses.find(c => c.id === showAppealModal)
        if (!claim) return null
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAppealModal(null)}>
            <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> AI 이의신청 초안
                </h3>
                <button onClick={() => setShowAppealModal(null)} className="btn-icon">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  AI가 심사기준과 진료기록을 분석하여 이의신청서 초안을 생성했습니다
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">청구 번호</label>
                    <div className="mt-1 font-medium">{claim.id}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">진단명</label>
                    <div className="mt-1">{claim.diagnosis}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">이의신청 사유</label>
                    <textarea
                      defaultValue={`상기 환자는 ${claim.diagnosis}으로 진료받은 환자로, ${claim.procedure} 시행의 의학적 필요성이 충분합니다.\n\n[AI 분석 근거]\n${claim.aiSuggestion}\n\n상기 사유로 재심사를 요청합니다.`}
                      className="input mt-1 min-h-[200px] text-sm"
                      rows={8}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn-sm text-xs flex-1 bg-blue-600 text-white hover:bg-blue-700">
                    <FileText className="w-3 h-3" /> 이의신청 제출
                  </button>
                  <button className="btn-sm text-xs flex-1 bg-secondary text-foreground">
                    <Printer className="w-3 h-3" /> 인쇄
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
