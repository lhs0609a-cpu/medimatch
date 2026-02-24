'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  Phone,
  MessageSquare,
  Calendar,
  Search,
  Filter,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Bell,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Brain,
  Heart,
  Plus,
  RefreshCw,
  Mail,
  Smartphone,
  BarChart3,
  Eye,
  X,
  Check,
  Megaphone,
  UserPlus,
  Activity,
} from 'lucide-react'

/* ─── 더미 데이터 ─── */
const recallStats = {
  totalTarget: 87,
  sent: 52,
  responded: 38,
  booked: 24,
  responseRate: 73.1,
  bookingRate: 46.2,
}

const recallTargets = [
  { id: 1, name: '최은지', age: 52, gender: '여', phone: '010-4567-8901', lastVisit: '2023-12-21', daysAgo: 31, reason: '당뇨 정기검진 (HbA1c)', status: 'pending' as const, priority: 'high' as const },
  { id: 2, name: '정대현', age: 67, gender: '남', phone: '010-5678-9012', lastVisit: '2024-01-07', daysAgo: 14, reason: '관절염 추적관찰', status: 'sent' as const, priority: 'medium' as const },
  { id: 3, name: '강지원', age: 72, gender: '여', phone: '010-8901-2345', lastVisit: '2023-11-15', daysAgo: 67, reason: '고혈압 정기검진', status: 'pending' as const, priority: 'high' as const },
  { id: 4, name: '이미경', age: 33, gender: '여', phone: '010-2345-6789', lastVisit: '2024-01-14', daysAgo: 7, reason: '감기 경과 확인', status: 'booked' as const, priority: 'low' as const },
  { id: 5, name: '한소영', age: 41, gender: '여', phone: '010-6789-0123', lastVisit: '2024-01-07', daysAgo: 14, reason: '혈압약 리필', status: 'sent' as const, priority: 'medium' as const },
  { id: 6, name: '김태훈', age: 58, gender: '남', phone: '010-1122-3344', lastVisit: '2023-10-20', daysAgo: 93, reason: '당뇨 + 고지혈증 정기검진', status: 'no_response' as const, priority: 'high' as const },
  { id: 7, name: '박미선', age: 45, gender: '여', phone: '010-5566-7788', lastVisit: '2023-12-05', daysAgo: 47, reason: '갑상선 추적 검사', status: 'pending' as const, priority: 'medium' as const },
  { id: 8, name: '오세진', age: 62, gender: '남', phone: '010-9900-1122', lastVisit: '2024-01-10', daysAgo: 11, reason: '혈압 약 조절 확인', status: 'booked' as const, priority: 'low' as const },
]

const campaigns = [
  { id: 'C001', name: '만성질환 정기검진 리콜', target: 45, sent: 45, opened: 38, booked: 18, status: 'completed' as const, date: '2024-01-15' },
  { id: 'C002', name: '독감 예방접종 안내', target: 120, sent: 120, opened: 95, booked: 42, status: 'completed' as const, date: '2024-01-10' },
  { id: 'C003', name: '건강검진 시즌 안내', target: 80, sent: 52, opened: 0, booked: 0, status: 'active' as const, date: '2024-01-20' },
  { id: 'C004', name: '설 연휴 진료시간 변경', target: 200, sent: 0, opened: 0, booked: 0, status: 'scheduled' as const, date: '2024-02-01' },
]

const statusConfig = {
  pending: { label: '발송 대기', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
  sent: { label: '발송완료', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  booked: { label: '예약완료', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  no_response: { label: '무응답', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
}

const priorityConfig = {
  high: { label: '높음', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  medium: { label: '보통', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  low: { label: '낮음', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
}

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<'recall' | 'campaigns'>('recall')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showCampaignModal, setShowCampaignModal] = useState(false)

  const filteredTargets = useMemo(() => {
    if (filterStatus === 'all') return recallTargets
    return recallTargets.filter(t => t.status === filterStatus)
  }, [filterStatus])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">환자 리콜/CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">정기검진 리콜, 알림 캠페인, 재방문 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Brain className="w-3.5 h-3.5" /> AI 대상 분석
          </button>
          <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowCampaignModal(true)}>
            <Plus className="w-3.5 h-3.5" /> 캠페인 생성
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">리콜 대상</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{recallStats.totalTarget}<span className="text-sm font-normal text-muted-foreground">명</span></div>
          <div className="text-2xs text-muted-foreground mt-1">발송 {recallStats.sent}명</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">응답률</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{recallStats.responseRate}%</div>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-2xs text-emerald-600 font-semibold">+5.2%p</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">예약 전환율</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">{recallStats.bookingRate}%</div>
          <div className="text-2xs text-muted-foreground mt-1">{recallStats.booked}명 예약 완료</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">활성 캠페인</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
          <div className="text-2xs text-muted-foreground mt-1">진행중</div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: 'recall', label: '리콜 대상', icon: Bell },
          { key: 'campaigns', label: '캠페인 관리', icon: Megaphone },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 리콜 대상 목록 */}
      {activeTab === 'recall' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
            <div className="flex items-center gap-1">
              {['all', 'pending', 'sent', 'no_response', 'booked'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === status ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {status === 'all' ? '전체' : statusConfig[status as keyof typeof statusConfig]?.label}
                </button>
              ))}
            </div>
            {selectedIds.size > 0 && (
              <div className="sm:ml-auto flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">{selectedIds.size}명 선택</span>
                <button className="btn-sm text-2xs bg-blue-600 text-white">
                  <Send className="w-3 h-3" /> 일괄 발송
                </button>
                <button className="btn-sm text-2xs bg-secondary text-foreground" onClick={() => setSelectedIds(new Set())}>
                  해제
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-border">
            {filteredTargets.map(target => {
              const sc = statusConfig[target.status]
              const pc = priorityConfig[target.priority]
              return (
                <div key={target.id} className={`flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/30 transition-colors ${target.priority === 'high' && target.status === 'pending' ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(target.id)}
                    onChange={() => toggleSelect(target.id)}
                    className="rounded flex-shrink-0"
                  />

                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">{target.name[0]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{target.name}</span>
                      <span className="text-2xs text-muted-foreground">{target.gender}/{target.age}세</span>
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${pc.color} ${pc.bg}`}>{pc.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${sc.color} ${sc.bg}`}>{sc.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {target.reason} · 마지막 방문: {target.lastVisit} ({target.daysAgo}일 전)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {target.status === 'pending' && (
                      <button className="btn-sm text-2xs bg-blue-600 text-white hover:bg-blue-700">
                        <Send className="w-3 h-3" /> 발송
                      </button>
                    )}
                    {target.status === 'no_response' && (
                      <button className="btn-sm text-2xs bg-amber-500 text-white hover:bg-amber-600">
                        <RefreshCw className="w-3 h-3" /> 재발송
                      </button>
                    )}
                    {target.status === 'sent' && (
                      <button className="btn-sm text-2xs bg-secondary text-foreground">
                        <Phone className="w-3 h-3" /> 전화
                      </button>
                    )}
                    {target.status === 'booked' && (
                      <span className="flex items-center gap-1 text-2xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> 예약됨
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 캠페인 관리 */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    campaign.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    campaign.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    <Megaphone className={`w-5 h-5 ${
                      campaign.status === 'active' ? 'text-blue-600' :
                      campaign.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${
                        campaign.status === 'active' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
                        campaign.status === 'completed' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                        'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                      }`}>
                        {campaign.status === 'active' ? '진행중' : campaign.status === 'completed' ? '완료' : '예약됨'}
                      </span>
                    </div>
                    <div className="text-2xs text-muted-foreground mt-0.5">{campaign.date} · 대상 {campaign.target}명</div>
                  </div>
                </div>
                <button className="btn-sm text-2xs bg-secondary text-foreground">
                  <Eye className="w-3 h-3" /> 상세
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <div className="text-2xs text-muted-foreground">발송</div>
                  <div className="text-lg font-bold mt-0.5">{campaign.sent}</div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <div className="text-2xs text-muted-foreground">열람</div>
                  <div className="text-lg font-bold mt-0.5">{campaign.opened}</div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <div className="text-2xs text-muted-foreground">예약</div>
                  <div className="text-lg font-bold text-blue-600 mt-0.5">{campaign.booked}</div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <div className="text-2xs text-muted-foreground">전환율</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">
                    {campaign.sent > 0 ? ((campaign.booked / campaign.sent) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {campaign.sent > 0 && (
                <div className="mt-3">
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500" style={{ width: `${(campaign.sent / campaign.target) * 100}%` }} />
                    <div className="bg-secondary" style={{ width: `${((campaign.target - campaign.sent) / campaign.target) * 100}%` }} />
                  </div>
                  <div className="text-2xs text-muted-foreground mt-1">발송 진행률: {((campaign.sent / campaign.target) * 100).toFixed(0)}%</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 캠페인 생성 모달 */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCampaignModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">새 캠페인 만들기</h3>
              <button onClick={() => setShowCampaignModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">캠페인명</label>
                <input type="text" className="input mt-1" placeholder="예: 만성질환 정기검진 안내" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">대상 그룹</label>
                <select className="input mt-1">
                  <option>만성질환 환자 (당뇨/고혈압/고지혈증)</option>
                  <option>3개월 이상 미방문 환자</option>
                  <option>정기검진 대상자</option>
                  <option>전체 환자</option>
                  <option>커스텀 조건</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">발송 채널</label>
                <div className="flex gap-2 mt-1">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-border flex-1 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <MessageSquare className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">카카오톡</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-border flex-1 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">문자</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">발송 시점</label>
                <div className="flex gap-2 mt-1">
                  <button className="flex-1 p-2.5 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-600">즉시 발송</button>
                  <button className="flex-1 p-2.5 rounded-xl border border-border text-sm text-muted-foreground">예약 발송</button>
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> 캠페인 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
