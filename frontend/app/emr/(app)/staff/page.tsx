'use client'

import { useState } from 'react'
import {
  Users,
  Plus,
  Search,
  Shield,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  Mail,
  Key,
  Settings,
  Activity,
  Eye,
  ChevronRight,
  X,
  Star,
  Stethoscope,
  Heart,
  ClipboardList,
} from 'lucide-react'

/* ─── 타입 ─── */
type Role = 'doctor' | 'nurse' | 'receptionist' | 'admin'
type StaffStatus = 'active' | 'inactive' | 'on_leave'

interface Staff {
  id: string
  name: string
  role: Role
  email: string
  phone: string
  status: StaffStatus
  joinDate: string
  lastLogin: string
  permissions: string[]
  schedule: { day: string; hours: string }[]
}

/* ─── 더미 데이터 ─── */
const staffList: Staff[] = [
  {
    id: 'S001',
    name: '김원장',
    role: 'doctor',
    email: 'kim@medimatch.kr',
    phone: '010-1111-2222',
    status: 'active',
    joinDate: '2023-01-01',
    lastLogin: '오늘 14:05',
    permissions: ['진료', '처방', '차트', '청구', '통계', '설정', '직원관리'],
    schedule: [
      { day: '월~금', hours: '09:00-18:00' },
      { day: '토', hours: '09:00-13:00' },
    ],
  },
  {
    id: 'S002',
    name: '박간호사',
    role: 'nurse',
    email: 'park@medimatch.kr',
    phone: '010-3333-4444',
    status: 'active',
    joinDate: '2023-03-15',
    lastLogin: '오늘 13:50',
    permissions: ['환자접수', '바이탈', '차트조회', '주사/처치', '예약관리'],
    schedule: [
      { day: '월~금', hours: '08:30-17:30' },
      { day: '토', hours: '08:30-13:00' },
    ],
  },
  {
    id: 'S003',
    name: '이접수',
    role: 'receptionist',
    email: 'lee@medimatch.kr',
    phone: '010-5555-6666',
    status: 'active',
    joinDate: '2023-06-01',
    lastLogin: '오늘 13:45',
    permissions: ['환자접수', '예약관리', '수납', '전화상담'],
    schedule: [
      { day: '월~금', hours: '08:30-17:30' },
      { day: '토', hours: '08:30-13:00' },
    ],
  },
  {
    id: 'S004',
    name: '정간호사',
    role: 'nurse',
    email: 'jung@medimatch.kr',
    phone: '010-7777-8888',
    status: 'on_leave',
    joinDate: '2023-09-01',
    lastLogin: '3일 전',
    permissions: ['환자접수', '바이탈', '차트조회', '예약관리'],
    schedule: [],
  },
  {
    id: 'S005',
    name: '최접수',
    role: 'receptionist',
    email: 'choi@medimatch.kr',
    phone: '010-9999-0000',
    status: 'inactive',
    joinDate: '2023-04-01',
    lastLogin: '2주 전',
    permissions: ['환자접수', '예약관리', '수납'],
    schedule: [],
  },
]

const roleConfig: Record<Role, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  doctor: { label: '원장', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Stethoscope },
  nurse: { label: '간호사', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: Heart },
  receptionist: { label: '접수/수납', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: ClipboardList },
  admin: { label: '관리자', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Shield },
}

const statusLabels: Record<StaffStatus, { label: string; color: string; dot: string }> = {
  active: { label: '근무중', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  inactive: { label: '퇴사', color: 'text-gray-400', dot: 'bg-gray-400' },
  on_leave: { label: '휴가', color: 'text-amber-600', dot: 'bg-amber-500' },
}

const allPermissions = [
  { key: '진료', desc: '환자 진료 및 차트 작성' },
  { key: '처방', desc: '의약품 처방' },
  { key: '차트', desc: '차트 작성 및 수정' },
  { key: '차트조회', desc: '차트 조회만 가능' },
  { key: '청구', desc: '보험 청구 관리' },
  { key: '환자접수', desc: '환자 접수 및 등록' },
  { key: '예약관리', desc: '예약 생성/수정/삭제' },
  { key: '수납', desc: '결제 및 수납 처리' },
  { key: '바이탈', desc: '바이탈 사인 입력' },
  { key: '주사/처치', desc: '주사 및 처치 기록' },
  { key: '전화상담', desc: '전화 상담 기록' },
  { key: '통계', desc: '경영 통계 조회' },
  { key: '설정', desc: '시스템 설정 변경' },
  { key: '직원관리', desc: '직원 추가/수정/삭제' },
]

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterRole, setFilterRole] = useState<string>('all')

  const filtered = staffList.filter(s => {
    if (filterRole !== 'all' && s.role !== filterRole) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return s.name.includes(q) || s.email.includes(q) || s.phone.includes(q)
    }
    return true
  })

  const activeCount = staffList.filter(s => s.status === 'active').length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">직원/권한 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">직원 계정 및 접근 권한을 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
            현재 근무: <span className="font-semibold text-foreground">{activeCount}명</span>
          </div>
          <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5" /> 직원 추가
          </button>
        </div>
      </div>

      {/* 역할별 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['doctor', 'nurse', 'receptionist'] as Role[]).map(role => {
          const rc = roleConfig[role]
          const RoleIcon = rc.icon
          const count = staffList.filter(s => s.role === role && s.status === 'active').length
          return (
            <div key={role} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterRole(filterRole === role ? 'all' : role)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{rc.label}</span>
                <div className={`w-8 h-8 rounded-xl ${rc.bg} flex items-center justify-center`}>
                  <RoleIcon className={`w-4 h-4 ${rc.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{count}<span className="text-sm font-normal text-muted-foreground">명</span></div>
              <div className="text-2xs text-muted-foreground mt-1">활성 계정</div>
            </div>
          )
        })}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">총 직원</span>
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-2xl font-bold">{staffList.length}<span className="text-sm font-normal text-muted-foreground">명</span></div>
          <div className="text-2xs text-muted-foreground mt-1">전체 (퇴사 포함)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 직원 목록 */}
        <div className="card lg:col-span-1">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="이름, 이메일..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9 py-2 text-sm w-full"
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(staff => {
              const rc = roleConfig[staff.role]
              const RoleIcon = rc.icon
              const sl = statusLabels[staff.status]
              return (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff)}
                  className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors ${selectedStaff?.id === staff.id ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${rc.bg} flex items-center justify-center flex-shrink-0`}>
                      <RoleIcon className={`w-5 h-5 ${rc.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{staff.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${rc.color} ${rc.bg}`}>{rc.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${sl.dot}`} />
                        <span className={`text-2xs ${sl.color}`}>{sl.label}</span>
                        <span className="text-2xs text-muted-foreground">· {staff.lastLogin}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">검색 결과 없음</p>
              </div>
            )}
          </div>
        </div>

        {/* 직원 상세 */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <div className="space-y-4">
              {/* 프로필 */}
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${roleConfig[selectedStaff.role].bg} flex items-center justify-center`}>
                    {(() => { const Icon = roleConfig[selectedStaff.role].icon; return <Icon className={`w-8 h-8 ${roleConfig[selectedStaff.role].color}`} /> })()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${roleConfig[selectedStaff.role].color} ${roleConfig[selectedStaff.role].bg}`}>
                        {roleConfig[selectedStaff.role].label}
                      </span>
                      {(() => { const sl = statusLabels[selectedStaff.status]; return (
                        <span className={`flex items-center gap-1 text-xs ${sl.color}`}>
                          <div className={`w-2 h-2 rounded-full ${sl.dot}`} /> {sl.label}
                        </span>
                      ) })()}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedStaff.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedStaff.phone}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>입사: {selectedStaff.joinDate}</span>
                      <span>최근 로그인: {selectedStaff.lastLogin}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="btn-sm text-xs bg-secondary text-foreground">
                      <Edit3 className="w-3 h-3" /> 수정
                    </button>
                  </div>
                </div>
              </div>

              {/* 권한 */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" /> 접근 권한
                  </h3>
                  <button className="text-2xs text-blue-600 font-medium hover:underline">권한 수정</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allPermissions.map(perm => {
                    const hasPermission = selectedStaff.permissions.includes(perm.key)
                    return (
                      <div key={perm.key} className={`flex items-center gap-2 p-2.5 rounded-xl ${hasPermission ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-secondary/30 opacity-50'}`}>
                        {hasPermission ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-medium">{perm.key}</div>
                          <div className="text-2xs text-muted-foreground">{perm.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 근무 스케줄 */}
              <div className="card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> 근무 스케줄
                </h3>
                {selectedStaff.schedule.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStaff.schedule.map((s, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/40">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium w-16">{s.day}</span>
                        <span className="text-sm text-muted-foreground">{s.hours}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">등록된 스케줄이 없습니다</p>
                )}
              </div>

              {/* 최근 활동 */}
              <div className="card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> 최근 활동
                </h3>
                <div className="space-y-2">
                  {[
                    { time: '14:05', action: '처방전 조제 완료 (김영수)', type: 'chart' },
                    { time: '13:50', action: '환자 접수 처리 (이미경)', type: 'reception' },
                    { time: '13:20', action: 'AI 차트 작성 (박준호)', type: 'chart' },
                    { time: '12:45', action: '보험청구 제출 (12건)', type: 'claim' },
                    { time: '11:55', action: '로그인', type: 'system' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 text-sm">
                      <span className="text-xs text-muted-foreground w-12">{log.time}</span>
                      <span className="flex-1">{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">직원을 선택해주세요</p>
              <p className="text-sm">왼쪽에서 직원을 선택하면 상세 정보를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 직원 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">직원 추가</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">이름</label>
                <input type="text" className="input mt-1" placeholder="직원 이름" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">역할</label>
                <select className="input mt-1">
                  <option>간호사</option>
                  <option>접수/수납</option>
                  <option>관리자</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">이메일</label>
                  <input type="email" className="input mt-1" placeholder="email@medimatch.kr" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">연락처</label>
                  <input type="tel" className="input mt-1" placeholder="010-0000-0000" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">초기 비밀번호</label>
                <input type="text" className="input mt-1" defaultValue="medimatch2024!" />
                <p className="text-2xs text-muted-foreground mt-1">첫 로그인 시 변경을 요청합니다</p>
              </div>
              <button className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700">
                직원 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
