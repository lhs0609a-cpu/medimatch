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
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 더미 환자 데이터 ─── */
const patients = [
  { id: 1, chartNo: 'C-20230101', name: '김영수', age: 45, gender: 'M', phone: '010-1234-5678', lastVisit: '2025-02-21', nextVisit: '2025-03-21', dx: '고혈압(I10)', visits: 24, unpaid: 0, tags: ['정기검진', 'VIP'] },
  { id: 2, chartNo: 'C-20230215', name: '이미경', age: 33, gender: 'F', phone: '010-2345-6789', lastVisit: '2025-02-20', nextVisit: null, dx: '급성상기도감염(J06.9)', visits: 3, unpaid: 15000, tags: [] },
  { id: 3, chartNo: 'C-20240312', name: '박준호', age: 28, gender: 'M', phone: '010-3456-7890', lastVisit: '2025-02-18', nextVisit: null, dx: '편두통(G43.9)', visits: 5, unpaid: 0, tags: ['알레르기주의'] },
  { id: 4, chartNo: 'C-20230518', name: '최은지', age: 52, gender: 'F', phone: '010-4567-8901', lastVisit: '2025-02-15', nextVisit: '2025-03-15', dx: '제2형당뇨(E11.9)', visits: 18, unpaid: 0, tags: ['정기검진', '인슐린'] },
  { id: 5, chartNo: 'C-20241023', name: '정대현', age: 67, gender: 'M', phone: '010-5678-9012', lastVisit: '2025-02-10', nextVisit: null, dx: '퇴행성관절염(M17.9)', visits: 8, unpaid: 30000, tags: ['고령'] },
  { id: 6, chartNo: 'C-20250201', name: '한소영', age: 41, gender: 'F', phone: '010-6789-0123', lastVisit: '2025-02-05', nextVisit: '2025-02-25', dx: '건강검진', visits: 2, unpaid: 0, tags: ['건강검진'] },
  { id: 7, chartNo: 'C-20240605', name: '윤태민', age: 55, gender: 'M', phone: '010-7890-1234', lastVisit: '2025-01-28', nextVisit: null, dx: '위식도역류(K21.0)', visits: 12, unpaid: 0, tags: ['내시경예정'] },
  { id: 8, chartNo: 'C-20230920', name: '서지원', age: 38, gender: 'F', phone: '010-8901-2345', lastVisit: '2025-01-20', nextVisit: null, dx: '갑상선기능저하(E03.9)', visits: 10, unpaid: 0, tags: ['정기검진'] },
  { id: 9, chartNo: 'C-20250115', name: '강민재', age: 22, gender: 'M', phone: '010-9012-3456', lastVisit: '2025-01-15', nextVisit: null, dx: '아토피피부염(L20.9)', visits: 1, unpaid: 0, tags: ['신환'] },
  { id: 10, chartNo: 'C-20240118', name: '오수현', age: 60, gender: 'F', phone: '010-0123-4567', lastVisit: '2025-01-10', nextVisit: '2025-02-22', dx: '골다공증(M81.0)', visits: 15, unpaid: 45000, tags: ['정기검진', '고령'] },
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

export default function PatientsPage() {
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

      {/* ───── 요약 카드 ───── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`card p-4 text-left transition-all ${selectedFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-primary" />
            {selectedFilter === 'all' && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <div className="text-2xl font-bold">{patients.length}</div>
          <div className="text-xs text-muted-foreground">전체 환자</div>
        </button>

        <button
          onClick={() => setSelectedFilter('scheduled')}
          className={`card p-4 text-left transition-all ${selectedFilter === 'scheduled' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            {selectedFilter === 'scheduled' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
          </div>
          <div className="text-2xl font-bold">{patients.filter(p => p.nextVisit).length}</div>
          <div className="text-xs text-muted-foreground">예약 환자</div>
        </button>

        <button
          onClick={() => setSelectedFilter('unpaid')}
          className={`card p-4 text-left transition-all ${selectedFilter === 'unpaid' ? 'ring-2 ring-red-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {selectedFilter === 'unpaid' && <CheckCircle2 className="w-4 h-4 text-red-500" />}
          </div>
          <div className="text-2xl font-bold">{patients.filter(p => p.unpaid > 0).length}</div>
          <div className="text-xs text-muted-foreground">미수금 환자</div>
        </button>

        <button
          onClick={() => setSelectedFilter('inactive')}
          className={`card p-4 text-left transition-all ${selectedFilter === 'inactive' ? 'ring-2 ring-amber-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            {selectedFilter === 'inactive' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
          </div>
          <div className="text-2xl font-bold">
            {patients.filter(p => {
              const d = new Date(p.lastVisit)
              const ago = new Date()
              ago.setMonth(ago.getMonth() - 3)
              return d < ago
            }).length}
          </div>
          <div className="text-xs text-muted-foreground">3개월+ 미방문</div>
        </button>
      </div>

      {/* ───── 검색 & 필터 ───── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="환자 이름, 차트번호, 연락처, 진단명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'lastVisit' ? 'name' : sortBy === 'name' ? 'chartNo' : 'lastVisit')}
              className="btn-outline btn-sm"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortBy === 'lastVisit' ? '최근방문순' : sortBy === 'name' ? '이름순' : '차트번호순'}
            </button>
          </div>
        </div>
      </div>

      {/* ───── 환자 테이블 ───── */}
      <div className="card overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-1">차트번호</div>
          <div className="col-span-2">환자명</div>
          <div className="col-span-2">연락처</div>
          <div className="col-span-3">최근 진단</div>
          <div className="col-span-1">방문 횟수</div>
          <div className="col-span-1">최근 방문</div>
          <div className="col-span-1">미수금</div>
          <div className="col-span-1"></div>
        </div>

        {/* 환자 행 */}
        <div className="divide-y divide-border">
          {filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              href={`/emr/patients/${patient.id}`}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors group items-center"
            >
              {/* 모바일: 카드 레이아웃 */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm bg-primary/10 text-primary">
                      <span className="text-xs font-bold">{patient.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{patient.name}</div>
                      <div className="text-xs text-muted-foreground">{patient.age}세 {patient.gender === 'M' ? '남' : '여'} · {patient.chartNo}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{patient.dx}</span>
                  {patient.unpaid > 0 && (
                    <span className="text-red-500 font-semibold">{patient.unpaid.toLocaleString()}원</span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {patient.tags.map((tag) => (
                    <span key={tag} className={`px-1.5 py-0.5 rounded text-2xs font-medium ${tagColors[tag] || 'bg-secondary text-muted-foreground'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 데스크톱: 테이블 레이아웃 */}
              <div className="hidden md:block col-span-1 text-xs text-muted-foreground font-mono">
                {patient.chartNo}
              </div>

              <div className="hidden md:flex col-span-2 items-center gap-2">
                <div className="avatar avatar-sm bg-primary/10 text-primary flex-shrink-0">
                  <span className="text-xs font-bold">{patient.name[0]}</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{patient.name}</div>
                  <div className="text-xs text-muted-foreground">{patient.age}세 {patient.gender === 'M' ? '남' : '여'}</div>
                </div>
                {patient.tags.length > 0 && (
                  <div className="flex gap-1 ml-1">
                    {patient.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className={`px-1.5 py-0.5 rounded text-2xs font-medium ${tagColors[tag] || 'bg-secondary text-muted-foreground'}`}>
                        {tag}
                      </span>
                    ))}
                    {patient.tags.length > 2 && (
                      <span className="text-2xs text-muted-foreground">+{patient.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden md:flex col-span-2 items-center text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                {patient.phone}
              </div>

              <div className="hidden md:block col-span-3 text-sm truncate">
                {patient.dx}
              </div>

              <div className="hidden md:block col-span-1 text-sm text-center">
                {patient.visits}회
              </div>

              <div className="hidden md:block col-span-1 text-xs text-muted-foreground">
                {new Date(patient.lastVisit).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </div>

              <div className="hidden md:block col-span-1">
                {patient.unpaid > 0 ? (
                  <span className="text-sm text-red-500 font-semibold">{(patient.unpaid / 10000).toFixed(1)}만</span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              <div className="hidden md:flex col-span-1 justify-end">
                <span className="btn-primary btn-sm opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  <Mic className="w-3 h-3" />
                  진료
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">검색 결과가 없습니다</div>
            <div className="text-sm text-muted-foreground mt-1">다른 키워드로 검색해보세요</div>
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/30">
          <div className="text-xs text-muted-foreground">
            총 {filteredPatients.length}명
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost btn-sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="btn-ghost btn-sm bg-primary/10 text-primary">1</button>
            <button className="btn-ghost btn-sm">2</button>
            <button className="btn-ghost btn-sm">3</button>
            <button className="btn-ghost btn-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ───── 신규 환자 등록 모달 ───── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">신규 환자 등록</h3>
              <button onClick={() => setShowNewModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">이름 *</label>
                  <input type="text" className="input" placeholder="환자 이름" />
                </div>
                <div>
                  <label className="label mb-1.5 block">생년월일 *</label>
                  <input type="date" className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">성별 *</label>
                  <select className="select">
                    <option value="">선택</option>
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5 block">연락처 *</label>
                  <input type="tel" className="input" placeholder="010-0000-0000" />
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block">주민등록번호</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" className="input" placeholder="앞 6자리" maxLength={6} />
                  <input type="password" className="input" placeholder="뒤 7자리" maxLength={7} />
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block">주소</label>
                <input type="text" className="input" placeholder="주소를 입력하세요" />
              </div>

              <div>
                <label className="label mb-1.5 block">보험 구분</label>
                <select className="select">
                  <option value="건강보험">건강보험</option>
                  <option value="의료급여1종">의료급여 1종</option>
                  <option value="의료급여2종">의료급여 2종</option>
                  <option value="비급여">비급여(자보/산재 등)</option>
                </select>
              </div>

              <div>
                <label className="label mb-1.5 block">특이사항</label>
                <textarea className="textarea" placeholder="알레르기, 복용약물, 주의사항 등" rows={3} />
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 border-t border-border">
              <button onClick={() => setShowNewModal(false)} className="btn-secondary flex-1">
                취소
              </button>
              <button className="btn-primary flex-1">
                <UserPlus className="w-4 h-4" />
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
