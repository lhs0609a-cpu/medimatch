'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Filter,
  ChevronRight,
  ChevronLeft,
  Phone,
  Calendar,
  Clock,
  MoreHorizontal,
  Download,
  Upload,
  Users,
  UserPlus,
  ArrowUpDown,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mic,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Shield,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 탭 정의 ─── */
type PageTab = 'list' | 'funnel' | 'consent'

/* ─── 더미 환자 데이터 (확장) ─── */
const patients = [
  { id: 1, chartNo: 'C-20230101', name: '김영수', age: 45, gender: 'M', phone: '010-1234-5678', lastVisit: '2025-02-21', nextVisit: '2025-03-21', dx: '고혈압(I10)', visits: 24, unpaid: 0, tags: ['정기검진', 'VIP'], inflowDate: '2023-01-01', inflowPath: '소개', status: 'VISITED' },
  { id: 2, chartNo: 'C-20230215', name: '이미경', age: 33, gender: 'F', phone: '010-2345-6789', lastVisit: '2025-02-20', nextVisit: null, dx: '급성상기도감염(J06.9)', visits: 3, unpaid: 15000, tags: [], inflowDate: '2023-02-15', inflowPath: '네이버 블로그', status: 'VISITED' },
  { id: 3, chartNo: 'C-20240312', name: '박준호', age: 28, gender: 'M', phone: '010-3456-7890', lastVisit: '2025-02-18', nextVisit: null, dx: '편두통(G43.9)', visits: 5, unpaid: 0, tags: ['알레르기주의'], inflowDate: '2024-03-12', inflowPath: '네이버 광고', status: 'VISITED' },
  { id: 4, chartNo: 'C-20230518', name: '최은지', age: 52, gender: 'F', phone: '010-4567-8901', lastVisit: '2025-02-15', nextVisit: '2025-03-15', dx: '제2형당뇨(E11.9)', visits: 18, unpaid: 0, tags: ['정기검진', '인슐린'], inflowDate: '2023-05-18', inflowPath: '소개', status: 'VISITED' },
  { id: 5, chartNo: 'C-20241023', name: '정대현', age: 67, gender: 'M', phone: '010-5678-9012', lastVisit: '2025-02-10', nextVisit: null, dx: '퇴행성관절염(M17.9)', visits: 8, unpaid: 30000, tags: ['고령'], inflowDate: '2024-10-23', inflowPath: '구글 광고', status: 'BOOKED' },
  { id: 6, chartNo: 'C-20250201', name: '한소영', age: 41, gender: 'F', phone: '010-6789-0123', lastVisit: '2025-02-05', nextVisit: '2025-02-25', dx: '건강검진', visits: 2, unpaid: 0, tags: ['건강검진'], inflowDate: '2025-02-01', inflowPath: '인스타그램', status: 'BOOKED' },
  { id: 7, chartNo: 'C-20240605', name: '윤태민', age: 55, gender: 'M', phone: '010-7890-1234', lastVisit: '2025-01-28', nextVisit: null, dx: '위식도역류(K21.0)', visits: 12, unpaid: 0, tags: ['내시경예정'], inflowDate: '2024-06-05', inflowPath: '카카오톡', status: 'CANCELLED' },
  { id: 8, chartNo: 'C-20230920', name: '서지원', age: 38, gender: 'F', phone: '010-8901-2345', lastVisit: '2025-01-20', nextVisit: null, dx: '갑상선기능저하(E03.9)', visits: 10, unpaid: 0, tags: ['정기검진'], inflowDate: '2023-09-20', inflowPath: '네이버 블로그', status: 'VISITED' },
  { id: 9, chartNo: 'C-20250115', name: '강민재', age: 22, gender: 'M', phone: '010-9012-3456', lastVisit: '2025-01-15', nextVisit: null, dx: '아토피피부염(L20.9)', visits: 1, unpaid: 0, tags: ['신환'], inflowDate: '2025-01-15', inflowPath: '오프라인 전단', status: 'PENDING' },
  { id: 10, chartNo: 'C-20240118', name: '오수현', age: 60, gender: 'F', phone: '010-0123-4567', lastVisit: '2025-01-10', nextVisit: '2025-02-22', dx: '골다공증(M81.0)', visits: 15, unpaid: 45000, tags: ['정기검진', '고령'], inflowDate: '2024-01-18', inflowPath: '소개', status: 'VISITED' },
]

const tagColors: Record<string, string> = {
  '정기검진': 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'VIP': 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  '알레르기주의': 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  '인슐린': 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  '고령': 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  '건강검진': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  '신환': 'bg-primary/10 text-primary',
  '내시경예정': 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
}

const inflowPathColors: Record<string, string> = {
  '소개': 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  '네이버 블로그': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  '네이버 광고': 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  '구글 광고': 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  '인스타그램': 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  '카카오톡': 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  '오프라인 전단': 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
}

const statusColors: Record<string, { label: string; class: string }> = {
  PENDING: { label: '대기', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  BOOKED: { label: '예약', class: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  HELD: { label: '보류', class: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  CANCELLED: { label: '취소', class: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  VISITED: { label: '내원', class: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

/* ─── 퍼널 데이터 ─── */
const funnelStages = [
  { label: '유입(대기)', count: 1, color: 'bg-gray-400', width: 100 },
  { label: '예약완료', count: 2, color: 'bg-blue-400', width: 80 },
  { label: '보류', count: 0, color: 'bg-amber-400', width: 60 },
  { label: '내원완료', count: 6, color: 'bg-emerald-400', width: 50 },
  { label: '취소/이탈', count: 1, color: 'bg-red-400', width: 30 },
]

const inflowPaths = [
  { path: '소개', total: 3, booked: 3, visited: 3, bookingRate: 100, visitRate: 100 },
  { path: '네이버 블로그', total: 2, booked: 2, visited: 2, bookingRate: 100, visitRate: 100 },
  { path: '네이버 광고', total: 1, booked: 1, visited: 1, bookingRate: 100, visitRate: 100 },
  { path: '구글 광고', total: 1, booked: 1, visited: 0, bookingRate: 100, visitRate: 0 },
  { path: '인스타그램', total: 1, booked: 1, visited: 0, bookingRate: 100, visitRate: 0 },
  { path: '카카오톡', total: 1, booked: 0, visited: 0, bookingRate: 0, visitRate: 0 },
  { path: '오프라인 전단', total: 1, booked: 0, visited: 0, bookingRate: 0, visitRate: 0 },
]

/* ─── 동의 현황 데이터 ─── */
const consentData = {
  totalVisited: 6,
  examConsented: 5, examPartial: 1, examRefused: 0,
  treatConsented: 4, treatPartial: 1, treatRefused: 1,
  examRate: 83.3, treatRate: 66.7,
  managers: [
    { name: '이실장', total: 3, consented: 2, rate: 66.7 },
    { name: '김실장', total: 3, consented: 2, rate: 66.7 },
  ],
  nonConsentReasons: [
    { reason: '비용 부담', count: 3 },
    { reason: '다른 병원 비교 후 결정', count: 2 },
    { reason: '시간 부족', count: 2 },
    { reason: '치료 필요성 미인식', count: 1 },
    { reason: '가족 상의 필요', count: 1 },
  ],
}

export default function PatientsPage() {
  const [pageTab, setPageTab] = useState<PageTab>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'chartNo'>('lastVisit')

  const filteredPatients = patients
    .filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.includes(q) ||
          p.chartNo.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.dx.toLowerCase().includes(q)
        )
      }
      return true
    })
    .filter((p) => {
      if (selectedFilter === 'unpaid') return p.unpaid > 0
      if (selectedFilter === 'scheduled') return p.nextVisit !== null
      if (selectedFilter === 'inactive') {
        const lastVisit = new Date(p.lastVisit)
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        return lastVisit < threeMonthsAgo
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'lastVisit') return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
      return a.chartNo.localeCompare(b.chartNo)
    })

  const totalInflow = patients.length
  const bookingRate = Math.round(patients.filter(p => ['BOOKED', 'VISITED'].includes(p.status)).length / totalInflow * 100)
  const visitRate = Math.round(patients.filter(p => p.status === 'VISITED').length / totalInflow * 100)
  const cancelRate = Math.round(patients.filter(p => p.status === 'CANCELLED').length / totalInflow * 100)

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">환자 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            전체 <strong className="text-foreground">{patients.length}명</strong>의 환자를 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm">
            <Download className="w-3.5 h-3.5" />
            내보내기
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary btn-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            신규 환자
          </button>
        </div>
      </div>

      {/* ───── 페이지 탭 ───── */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar border-b border-border">
        {([
          { key: 'list' as PageTab, label: '환자 목록', icon: Users },
          { key: 'funnel' as PageTab, label: '유입 파이프라인', icon: Target },
          { key: 'consent' as PageTab, label: '동의 현황', icon: Shield },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setPageTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              pageTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ 환자 목록 탭 ═══════ */}
      {pageTab === 'list' && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => setSelectedFilter('all')} className={`card p-4 text-left transition-all ${selectedFilter === 'all' ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-center justify-between mb-2"><Users className="w-5 h-5 text-primary" />{selectedFilter === 'all' && <CheckCircle2 className="w-4 h-4 text-primary" />}</div>
              <div className="text-2xl font-bold">{patients.length}</div>
              <div className="text-xs text-muted-foreground">전체 환자</div>
            </button>
            <button onClick={() => setSelectedFilter('scheduled')} className={`card p-4 text-left transition-all ${selectedFilter === 'scheduled' ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-2"><Calendar className="w-5 h-5 text-blue-500" />{selectedFilter === 'scheduled' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}</div>
              <div className="text-2xl font-bold">{patients.filter(p => p.nextVisit).length}</div>
              <div className="text-xs text-muted-foreground">예약 환자</div>
            </button>
            <button onClick={() => setSelectedFilter('unpaid')} className={`card p-4 text-left transition-all ${selectedFilter === 'unpaid' ? 'ring-2 ring-red-500' : ''}`}>
              <div className="flex items-center justify-between mb-2"><AlertTriangle className="w-5 h-5 text-red-500" />{selectedFilter === 'unpaid' && <CheckCircle2 className="w-4 h-4 text-red-500" />}</div>
              <div className="text-2xl font-bold">{patients.filter(p => p.unpaid > 0).length}</div>
              <div className="text-xs text-muted-foreground">미수금 환자</div>
            </button>
            <button onClick={() => setSelectedFilter('inactive')} className={`card p-4 text-left transition-all ${selectedFilter === 'inactive' ? 'ring-2 ring-amber-500' : ''}`}>
              <div className="flex items-center justify-between mb-2"><Clock className="w-5 h-5 text-amber-500" />{selectedFilter === 'inactive' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}</div>
              <div className="text-2xl font-bold">{patients.filter(p => { const d = new Date(p.lastVisit); const ago = new Date(); ago.setMonth(ago.getMonth() - 3); return d < ago }).length}</div>
              <div className="text-xs text-muted-foreground">3개월+ 미방문</div>
            </button>
          </div>

          {/* 검색 */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input type="text" placeholder="환자 이름, 차트번호, 연락처, 진단명으로 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground" />
                {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-muted-foreground" /></button>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSortBy(sortBy === 'lastVisit' ? 'name' : sortBy === 'name' ? 'chartNo' : 'lastVisit')} className="btn-outline btn-sm">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortBy === 'lastVisit' ? '최근방문순' : sortBy === 'name' ? '이름순' : '차트번호순'}
                </button>
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-14 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
              <div className="col-span-1">차트번호</div>
              <div className="col-span-2">환자명</div>
              <div className="col-span-2">연락처</div>
              <div className="col-span-2">최근 진단</div>
              <div className="col-span-1">방문</div>
              <div className="col-span-1">유입일</div>
              <div className="col-span-1">유입경로</div>
              <div className="col-span-1">상태</div>
              <div className="col-span-1">미수금</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-border">
              {filteredPatients.map((patient) => {
                const st = statusColors[patient.status]
                return (
                  <Link key={patient.id} href={`/emr/patients/${patient.id}`}
                    className="grid grid-cols-1 md:grid-cols-14 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors group items-center">
                    {/* 모바일 */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm bg-primary/10 text-primary"><span className="text-xs font-bold">{patient.name[0]}</span></div>
                          <div>
                            <div className="font-semibold text-sm">{patient.name}</div>
                            <div className="text-xs text-muted-foreground">{patient.age}세 {patient.gender === 'M' ? '남' : '여'} · {patient.chartNo}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${inflowPathColors[patient.inflowPath] || 'bg-secondary text-muted-foreground'}`}>{patient.inflowPath}</span>
                          <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${st.class}`}>{st.label}</span>
                        </div>
                      </div>
                    </div>
                    {/* 데스크톱 */}
                    <div className="hidden md:block col-span-1 text-xs text-muted-foreground font-mono">{patient.chartNo}</div>
                    <div className="hidden md:flex col-span-2 items-center gap-2">
                      <div className="avatar avatar-sm bg-primary/10 text-primary flex-shrink-0"><span className="text-xs font-bold">{patient.name[0]}</span></div>
                      <div>
                        <div className="font-semibold text-sm">{patient.name}</div>
                        <div className="text-xs text-muted-foreground">{patient.age}세 {patient.gender === 'M' ? '남' : '여'}</div>
                      </div>
                    </div>
                    <div className="hidden md:flex col-span-2 items-center text-sm text-muted-foreground"><Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{patient.phone}</div>
                    <div className="hidden md:block col-span-2 text-sm truncate">{patient.dx}</div>
                    <div className="hidden md:block col-span-1 text-sm text-center">{patient.visits}회</div>
                    <div className="hidden md:block col-span-1 text-xs text-muted-foreground">{new Date(patient.inflowDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                    <div className="hidden md:block col-span-1">
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${inflowPathColors[patient.inflowPath] || 'bg-secondary text-muted-foreground'}`}>{patient.inflowPath}</span>
                    </div>
                    <div className="hidden md:block col-span-1"><span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${st.class}`}>{st.label}</span></div>
                    <div className="hidden md:block col-span-1">
                      {patient.unpaid > 0 ? <span className="text-sm text-red-500 font-semibold">{(patient.unpaid / 10000).toFixed(1)}만</span> : <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                    <div className="hidden md:flex col-span-1 justify-end">
                      <span className="btn-primary btn-sm opacity-0 group-hover:opacity-100 transition-opacity text-xs"><Mic className="w-3 h-3" />진료</span>
                    </div>
                  </Link>
                )
              })}
            </div>
            {filteredPatients.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <div className="font-semibold text-muted-foreground">검색 결과가 없습니다</div>
                <div className="text-sm text-muted-foreground mt-1">다른 키워드로 검색해보세요</div>
              </div>
            )}
            <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/30">
              <div className="text-xs text-muted-foreground">총 {filteredPatients.length}명</div>
              <div className="flex items-center gap-1">
                <button className="btn-ghost btn-sm" disabled><ChevronLeft className="w-4 h-4" /></button>
                <button className="btn-ghost btn-sm bg-primary/10 text-primary">1</button>
                <button className="btn-ghost btn-sm">2</button>
                <button className="btn-ghost btn-sm"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════ 유입 파이프라인 탭 ═══════ */}
      {pageTab === 'funnel' && (
        <div className="space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">총 유입</span></div>
              <div className="text-2xl font-bold">{totalInflow}명</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">예약 전환율</span></div>
              <div className="text-2xl font-bold">{bookingRate}%</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">내원 완료율</span></div>
              <div className="text-2xl font-bold">{visitRate}%</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><span className="text-xs text-muted-foreground">이탈율</span></div>
              <div className="text-2xl font-bold">{cancelRate}%</div>
            </div>
          </div>

          {/* 퍼널 시각화 */}
          <div className="card p-6">
            <h3 className="font-bold mb-4">환자 파이프라인 퍼널</h3>
            <div className="space-y-3 max-w-2xl mx-auto">
              {funnelStages.map((stage, idx) => (
                <div key={stage.label} className="flex items-center gap-4">
                  <div className="w-28 text-right text-sm font-medium">{stage.label}</div>
                  <div className="flex-1">
                    <div className={`h-12 ${stage.color} rounded-lg flex items-center justify-center transition-all`} style={{ width: `${stage.width}%` }}>
                      <span className="text-white font-bold text-lg">{stage.count}</span>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-muted-foreground">
                    {Math.round(stage.count / totalInflow * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 유입경로별 전환율 */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold">유입경로별 전환율</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground">유입경로</th>
                    <th className="text-center p-3 font-semibold text-xs text-muted-foreground">총 유입</th>
                    <th className="text-center p-3 font-semibold text-xs text-muted-foreground">예약</th>
                    <th className="text-center p-3 font-semibold text-xs text-muted-foreground">내원</th>
                    <th className="text-center p-3 font-semibold text-xs text-muted-foreground">예약 전환율</th>
                    <th className="text-center p-3 font-semibold text-xs text-muted-foreground">내원 전환율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inflowPaths.map((path) => (
                    <tr key={path.path} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${inflowPathColors[path.path] || 'bg-secondary text-muted-foreground'}`}>{path.path}</span>
                      </td>
                      <td className="p-3 text-center font-semibold">{path.total}</td>
                      <td className="p-3 text-center">{path.booked}</td>
                      <td className="p-3 text-center">{path.visited}</td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${path.bookingRate >= 80 ? 'text-emerald-500' : path.bookingRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{path.bookingRate}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${path.visitRate >= 80 ? 'text-emerald-500' : path.visitRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{path.visitRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 동의 현황 탭 ═══════ */}
      {pageTab === 'consent' && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">내원 환자</span></div>
              <div className="text-2xl font-bold">{consentData.totalVisited}명</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">검사 동의율</span></div>
              <div className="text-2xl font-bold">{consentData.examRate}%</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 text-blue-500" /><span className="text-xs text-muted-foreground">치료 동의율</span></div>
              <div className="text-2xl font-bold">{consentData.treatRate}%</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><span className="text-xs text-muted-foreground">미동의/거부</span></div>
              <div className="text-2xl font-bold">{consentData.treatRefused + consentData.treatPartial}명</div>
            </div>
          </div>

          {/* 검사/치료 동의 bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h4 className="font-bold mb-4">검사 동의 현황</h4>
              <div className="space-y-3">
                {[
                  { label: '동의', count: consentData.examConsented, color: 'bg-emerald-400' },
                  { label: '부분 동의', count: consentData.examPartial, color: 'bg-amber-400' },
                  { label: '거부', count: consentData.examRefused, color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm w-16">{item.label}</span>
                    <div className="flex-1 h-6 bg-secondary/30 rounded overflow-hidden">
                      <div className={`h-full ${item.color} rounded`} style={{ width: `${(item.count / consentData.totalVisited) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h4 className="font-bold mb-4">치료 동의 현황</h4>
              <div className="space-y-3">
                {[
                  { label: '동의', count: consentData.treatConsented, color: 'bg-emerald-400' },
                  { label: '부분 동의', count: consentData.treatPartial, color: 'bg-amber-400' },
                  { label: '거부', count: consentData.treatRefused, color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm w-16">{item.label}</span>
                    <div className="flex-1 h-6 bg-secondary/30 rounded overflow-hidden">
                      <div className={`h-full ${item.color} rounded`} style={{ width: `${(item.count / consentData.totalVisited) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 미동의 사유 TOP5 */}
          <div className="card p-5">
            <h4 className="font-bold mb-4">미동의/이탈 사유 TOP 5</h4>
            <div className="space-y-3">
              {consentData.nonConsentReasons.map((item, idx) => (
                <div key={item.reason} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">{idx + 1}</span>
                  <span className="text-sm flex-1">{item.reason}</span>
                  <div className="w-32 h-4 bg-secondary/30 rounded overflow-hidden">
                    <div className="h-full bg-red-400/60 rounded" style={{ width: `${(item.count / consentData.nonConsentReasons[0].count) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">{item.count}건</span>
                </div>
              ))}
            </div>
          </div>

          {/* 담당실장별 동의율 */}
          <div className="card p-5">
            <h4 className="font-bold mb-4">담당실장별 치료 동의율</h4>
            <div className="space-y-3">
              {consentData.managers.map((mgr) => (
                <div key={mgr.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-16">{mgr.name}</span>
                  <div className="flex-1 h-6 bg-secondary/30 rounded overflow-hidden">
                    <div className={`h-full rounded ${mgr.rate >= 70 ? 'bg-emerald-400' : mgr.rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${mgr.rate}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-16 text-right">{mgr.rate}%</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{mgr.consented}/{mgr.total}명</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───── 신규 환자 등록 모달 ───── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">신규 환자 등록</h3>
              <button onClick={() => setShowNewModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label mb-1.5 block">이름 *</label><input type="text" className="input" placeholder="환자 이름" /></div>
                <div><label className="label mb-1.5 block">생년월일 *</label><input type="date" className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label mb-1.5 block">성별 *</label><select className="select"><option value="">선택</option><option value="M">남성</option><option value="F">여성</option></select></div>
                <div><label className="label mb-1.5 block">연락처 *</label><input type="tel" className="input" placeholder="010-0000-0000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label mb-1.5 block">유입경로</label><select className="select"><option value="">선택</option><option>네이버 블로그</option><option>네이버 광고</option><option>구글 광고</option><option>인스타그램</option><option>카카오톡</option><option>소개/추천</option><option>오프라인 전단</option><option>기타</option></select></div>
                <div><label className="label mb-1.5 block">담당 실장</label><input type="text" className="input" placeholder="담당자명" /></div>
              </div>
              <div><label className="label mb-1.5 block">증상/주호소</label><textarea className="textarea" placeholder="환자 증상을 입력하세요" rows={3} /></div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-border">
              <button onClick={() => setShowNewModal(false)} className="btn-secondary flex-1">취소</button>
              <button className="btn-primary flex-1"><UserPlus className="w-4 h-4" />등록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
